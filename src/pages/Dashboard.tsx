import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { AnimatedSection } from '../components/ui/AnimatedSection';
import { BookOpen, Clock, CheckCircle2, AlertCircle, LogOut, ExternalLink, IndianRupee, FileText, Download, CreditCard, Loader2 } from 'lucide-react';
import { SEO } from '../components/SEO';
import { loadRazorpayScript } from '../lib/razorpay';

export function Dashboard() {
  const [data, setData] = useState<{ email: string; orders: any[]; invoices: any[] } | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [refreshKey, setRefreshKey] = useState(0);
  const [payingId, setPayingId] = useState<string | null>(null);
  const [payNotice, setPayNotice] = useState<{ invoiceId: string; tone: 'success' | 'error'; text: string } | null>(null);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchDashboard = async () => {
      const token = localStorage.getItem('user_token');
      if (!token) {
        navigate('/login');
        return;
      }

      try {
        const res = await fetch('/api/user/me', {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        });

        if (res.ok) {
          const json = await res.json();
          setData(json);
        } else {
          // Token might be invalid or expired
          localStorage.removeItem('user_token');
          localStorage.removeItem('user_email');
          window.dispatchEvent(new Event('auth_change'));
          navigate('/login');
        }
      } catch (err) {
        setError('Failed to load dashboard data.');
      } finally {
        setLoading(false);
      }
    };

    fetchDashboard();
  }, [navigate, refreshKey]);

  const handleLogout = () => {
    localStorage.removeItem('user_token');
    localStorage.removeItem('user_email');
    window.dispatchEvent(new Event('auth_change'));
    navigate('/');
  };

  const handleInvoiceDownload = async (invoice: any) => {
    const token = localStorage.getItem('user_token');
    if (!token) return navigate('/login');
    const response = await fetch(`/api/invoices/${invoice.id}/pdf`, {
      headers: { Authorization: `Bearer ${token}` }
    });
    if (!response.ok) {
      alert('Unable to download invoice. Please try again.');
      return;
    }
    const blob = await response.blob();
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `${invoice.invoiceNumber || invoice.id}.pdf`;
    link.click();
    URL.revokeObjectURL(url);
  };

  const handlePay = async (invoice: any) => {
    const token = localStorage.getItem('user_token');
    if (!token) return navigate('/login');
    const notify = (tone: 'success' | 'error', text: string) => setPayNotice({ invoiceId: invoice.id, tone, text });
    setPayingId(invoice.id);
    setPayNotice(null);
    try {
      const res = await fetch(`/api/invoices/${invoice.id}/pay`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` }
      });
      const order = await res.json().catch(() => ({}));
      if (!res.ok) return notify('error', order.error || 'Could not start the payment. Please try again.');
      if (order.alreadyPaid) {
        notify('success', 'Payment for this invoice was already received. It is now marked Paid.');
        return setRefreshKey(key => key + 1);
      }
      if (!(await loadRazorpayScript())) {
        return notify('error', 'Razorpay could not load. Please check your internet connection and try again.');
      }

      const checkout = new window.Razorpay({
        key: order.keyId,
        amount: order.amount,
        currency: order.currency,
        name: 'Vyomatrix Academy',
        description: `Invoice ${order.invoiceNumber}: ${order.programTitle || 'Academy enrolment'}`,
        order_id: order.orderId,
        prefill: order.prefill,
        theme: { color: '#5B4AF0' },
        handler: async (response: any) => {
          try {
            const verifyRes = await fetch('/api/payment/verify', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                razorpay_payment_id: response.razorpay_payment_id,
                razorpay_order_id: response.razorpay_order_id,
                razorpay_signature: response.razorpay_signature
              })
            });
            const verifyData = await verifyRes.json();
            if (verifyRes.ok && verifyData.success) {
              notify('success', `Payment received. Invoice ${verifyData.invoiceNumber || order.invoiceNumber} is now Paid.`);
              setRefreshKey(key => key + 1);
            } else {
              notify('error', verifyData.message || 'Payment verification failed. Your invoice remains unpaid.');
            }
          } catch {
            notify('error', 'We could not verify the payment yet. Please refresh in a moment or contact support.');
          }
        }
      });
      checkout.on('payment.failed', (response: any) => {
        notify('error', response?.error?.description || 'Payment did not complete. You can try again.');
      });
      checkout.open();
    } catch {
      notify('error', 'Connection error. Please try again.');
    } finally {
      setPayingId(null);
    }
  };

  if (loading) {
    return (
      <div className="flex-1 min-h-[calc(100vh-80px)] flex items-center justify-center bg-silver-light">
        <div className="text-ink/60 font-medium animate-pulse">Loading your dashboard...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex-1 min-h-[calc(100vh-80px)] p-8 bg-silver-light">
        <div className="max-w-3xl mx-auto bg-red-50 text-red-600 p-6 rounded-sm border border-red-200">
          <AlertCircle className="mb-2" />
          <h2 className="font-bold">Error</h2>
          <p>{error}</p>
        </div>
      </div>
    );
  }

  const STATUS_CONFIG: Record<string, { label: string; classes: string; icon: any }> = {
    'Payment Verified': { label: 'Payment Verified', classes: 'bg-green-100 text-green-800 border-green-200', icon: CheckCircle2 },
    'Pending':          { label: 'Pending',          classes: 'bg-yellow-100 text-yellow-800 border-yellow-200', icon: Clock },
    'Simulated / Test': { label: 'Simulated / Test', classes: 'bg-orange-100 text-orange-800 border-orange-200', icon: AlertCircle },
    'Reviewed':         { label: 'Reviewed',         classes: 'bg-blue-100 text-blue-800 border-blue-200', icon: CheckCircle2 },
    'Cancelled':        { label: 'Cancelled',        classes: 'bg-red-100 text-red-800 border-red-200', icon: AlertCircle },
    'Refunded':         { label: 'Refunded',         classes: 'bg-purple-100 text-purple-800 border-purple-200', icon: CheckCircle2 },
  };

  return (
    <div className="flex-1 bg-silver-light min-h-[calc(100vh-80px)] pb-20">
      <SEO title="My Dashboard" description="Manage your Vyomatrix Academy enrollments." />
      
      {/* Dashboard Header */}
      <div className="bg-ink text-white py-12 px-6">
        <div className="max-w-5xl mx-auto flex flex-col md:flex-row items-center justify-between gap-6">
          <div>
            <h1 className="text-3xl font-bold font-heading mb-2">My Dashboard</h1>
            <p className="text-silver flex items-center gap-2">
              Signed in as <span className="text-white font-medium">{data?.email}</span>
            </p>
          </div>
          <button 
            onClick={handleLogout}
            className="px-4 py-2 border border-white/20 rounded-sm text-sm font-medium hover:bg-white/10 transition-colors flex items-center gap-2"
          >
            <LogOut size={16} /> Sign out
          </button>
        </div>
      </div>

      <div className="max-w-5xl mx-auto px-6 mt-8">
        <AnimatedSection className="mb-10">
          <div className="mb-6">
            <h2 className="text-xl font-bold font-heading text-ink flex items-center gap-2">
              <FileText className="text-primary" /> My Invoices
            </h2>
            <p className="text-sm text-ink/60 mt-1">Invoices are created when checkout starts and marked paid after Razorpay confirms payment. You can pay any unpaid invoice here.</p>
          </div>

          {(data?.invoices || []).length === 0 ? (
            <div className="bg-white border border-silver/30 rounded-sm p-6 text-sm text-silver shadow-sm">
              No invoices yet.
            </div>
          ) : (
            <div className="space-y-3">
              {data?.invoices.map((invoice: any) => {
                const isPaid = invoice.status === 'Paid';
                return (
                  <div key={invoice.id} className="bg-white border border-silver/20 rounded-sm shadow-sm p-5 flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div>
                      <div className="flex items-center gap-3 mb-1">
                        <span className="font-mono font-bold text-primary">{invoice.invoiceNumber || invoice.id}</span>
                        <span className={`px-2.5 py-1 rounded-full border text-xs font-bold ${isPaid ? 'bg-green-100 text-green-800 border-green-200' : 'bg-yellow-100 text-yellow-800 border-yellow-200'}`}>
                          {isPaid ? 'Paid' : 'Unpaid'}
                        </span>
                      </div>
                      <div className="font-bold text-ink">{invoice.programTitle || 'Academy enrolment'}</div>
                      {invoice.customer?.session && <div className="text-sm text-ink/70 mt-0.5">Session: {invoice.customer.session}</div>}
                      <div className="text-xs text-silver mt-1">Order: {invoice.orderId || '—'}</div>
                    </div>
                      <div className="text-left md:text-right">
                      <div className="text-lg font-bold text-ink">₹{Number(invoice.amountINR || 0).toLocaleString('en-IN')}</div>
                      <div className="text-xs text-silver">{invoice.createdAt ? new Date(invoice.createdAt).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' }) : '—'}</div>
                      {isPaid && invoice.paymentId && <div className="text-xs text-green-700 mt-1">Payment ID: {invoice.paymentId}</div>}
                      <div className="mt-3 flex flex-col items-start md:items-end gap-2">
                        {!isPaid && invoice.sessionEnded && (
                          <span className="text-xs font-bold text-ink/50">Session ended · enrol in an upcoming session</span>
                        )}
                        {!isPaid && !invoice.sessionEnded && (
                          <button
                            onClick={() => handlePay(invoice)}
                            disabled={payingId !== null}
                            className="inline-flex items-center gap-2 px-4 py-2 bg-primary text-white text-sm font-bold rounded-sm hover:bg-primary-dark transition-colors shadow-sm disabled:opacity-60"
                          >
                            {payingId === invoice.id ? <Loader2 size={14} className="animate-spin" /> : <CreditCard size={14} />}
                            {payingId === invoice.id ? 'Opening Razorpay...' : 'Pay now'}
                          </button>
                        )}
                        <button onClick={() => handleInvoiceDownload(invoice)} className="inline-flex items-center gap-2 text-xs font-bold text-primary hover:text-primary-dark">
                          <Download size={14} /> Download PDF
                        </button>
                      </div>
                      {payNotice?.invoiceId === invoice.id && (
                        <p role={payNotice.tone === 'error' ? 'alert' : 'status'} className={`mt-2 text-xs font-medium max-w-xs md:ml-auto ${payNotice.tone === 'error' ? 'text-red-600' : 'text-green-700'}`}>
                          {payNotice.text}
                        </p>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </AnimatedSection>

        <AnimatedSection>
          <div className="mb-6">
            <h2 className="text-xl font-bold font-heading text-ink flex items-center gap-2">
              <BookOpen className="text-primary" /> My Courses & Enrollments
            </h2>
          </div>

          {data?.orders.length === 0 ? (
            <div className="bg-white border border-silver/30 rounded-sm p-16 text-center shadow-sm">
              <div className="w-16 h-16 bg-silver-light rounded-full flex items-center justify-center mx-auto mb-4 text-silver">
                <BookOpen size={24} />
              </div>
              <h3 className="text-lg font-bold text-ink mb-2">No enrollments yet</h3>
              <p className="text-silver mb-6">You haven't enrolled in any Academy courses yet.</p>
              <button 
                onClick={() => navigate('/academy')}
                className="px-6 py-2.5 bg-primary text-white font-bold rounded-sm hover:bg-primary-dark transition-colors inline-flex items-center gap-2"
              >
                Browse Academy <ExternalLink size={16} />
              </button>
            </div>
          ) : (
            <div className="space-y-4">
              {data?.orders.map((order, i) => {
                const d = order.details || {};
                const isRealPayment = order.paymentId && order.paymentId !== 'simulated';
                const defaultStatus = isRealPayment ? 'Payment Verified' : 'Simulated / Test';
                const currentStatus = order.adminStatus || defaultStatus;
                
                const statusCfg = STATUS_CONFIG[currentStatus] || STATUS_CONFIG['Pending'];
                const StatusIcon = statusCfg.icon;

                // Resolve amount
                let displayAmount = '—';
                if (d.price) displayAmount = d.price;
                else if (d.amountINR) displayAmount = `₹${Number(d.amountINR).toLocaleString('en-IN')}`;
                else if (d.amount && d.amount > 1000) displayAmount = `₹${(d.amount / 100).toLocaleString('en-IN')}`;
                
                return (
                  <div key={order.id || i} className="bg-white border border-silver/20 rounded-sm shadow-sm overflow-hidden flex flex-col md:flex-row">
                    {/* Status Strip */}
                    <div className={`w-2 md:w-3 flex-shrink-0 ${statusCfg.classes.split(' ')[0]}`}></div>
                    
                    <div className="p-6 flex-1 flex flex-col justify-between">
                      <div>
                        <div className="flex items-start justify-between gap-4 mb-4">
                          <div>
                            <h3 className="text-lg font-bold text-ink">{d.programTitle || d.programId || 'Academy Course'}</h3>
                            {d.track && (
                              <span className="inline-block mt-2 px-2.5 py-1 bg-primary/10 text-primary text-xs font-bold rounded-full">
                                {d.track} Track
                              </span>
                            )}
                            {d.session && <div className="mt-2 text-sm text-ink/70">Session: <span className="font-medium text-ink">{d.session}</span></div>}
                          </div>
                          <div className={`px-3 py-1.5 border rounded-full text-xs font-bold flex items-center gap-1.5 whitespace-nowrap ${statusCfg.classes}`}>
                            <StatusIcon size={14} /> {statusCfg.label}
                          </div>
                        </div>
                        
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-6">
                          <div>
                            <div className="text-[10px] uppercase font-bold text-silver mb-1">Order ID</div>
                            <div className="font-mono text-xs text-ink/80 truncate">{order.orderId !== 'simulated' ? order.orderId : 'Simulated'}</div>
                          </div>
                          <div>
                            <div className="text-[10px] uppercase font-bold text-silver mb-1">Payment ID</div>
                            <div className="font-mono text-xs text-ink/80 truncate">{isRealPayment ? order.paymentId : 'Simulated'}</div>
                          </div>
                          <div>
                            <div className="text-[10px] uppercase font-bold text-silver mb-1">Amount</div>
                            <div className="font-medium text-sm text-ink flex items-center gap-1">
                              {displayAmount.startsWith('₹') ? '' : <IndianRupee size={12} className="text-silver" />}
                              {displayAmount}
                            </div>
                          </div>
                          <div>
                            <div className="text-[10px] uppercase font-bold text-silver mb-1">Date</div>
                            <div className="font-medium text-sm text-ink truncate">
                              {order.date ? new Date(order.date).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' }) : '—'}
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </AnimatedSection>
      </div>
    </div>
  );
}

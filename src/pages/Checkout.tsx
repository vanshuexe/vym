import React, { useState, useEffect } from 'react';
import { useParams, Link, useLocation } from 'react-router-dom';
import { AnimatedSection } from '../components/ui/AnimatedSection';
import { SEO } from '../components/SEO';
import { ShieldCheck, CheckCircle2, ArrowLeft, Loader2, CreditCard, Lock, Mail, User, Phone, MapPin, GraduationCap, Banknote, Calendar, Building, Tag, Globe } from 'lucide-react';
import { Button } from '../components/ui/Button';
import { loadRazorpayScript } from '../lib/razorpay';

export function Checkout() {
  const { id } = useParams();
  const location = useLocation();
  const [academyPrograms, setAcademyPrograms] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const token = localStorage.getItem('user_token');
    const storedEmail = localStorage.getItem('user_email');
    if (token && storedEmail) {
      setUser({ email: storedEmail });
      setFormData(prev => ({...prev, email: storedEmail}));
      setStep('details');
    }

    fetch('/api/cms/data')
      .then(res => res.json())
      .then(data => {
        if (data && data.courses) {
          setAcademyPrograms(data.courses);
        }
        setIsLoading(false);
      })
      .catch((err) => {
        console.error(err);
        setIsLoading(false);
      });
  }, []);

  const searchParams = new URLSearchParams(location.search);
  const programId = id || searchParams.get('program');

  // Fallback to first program if not found, just so we don't white screen
  const program = academyPrograms.find(p => p.id === programId) || (academyPrograms.length > 0 ? academyPrograms[0] : null);
  // Sessions (venue + dates) are set per course in the admin panel; the value matches the server's format.
  const sessionOptions = (Array.isArray(program?.sessions) ? program.sessions : [])
    .map((session: any) => {
      const name = String(session?.name || '').trim();
      const dates = String(session?.dates || '').trim();
      return { name, dates, value: [name, dates].filter(Boolean).join(' · ') };
    })
    .filter((session: { value: string }) => session.value);
  
  const [step, setStep] = useState<'auth' | 'details' | 'payment' | 'success'>('auth');
  const [isProcessing, setIsProcessing] = useState(false);
  const [checkoutError, setCheckoutError] = useState('');
  const [pendingOrder, setPendingOrder] = useState<any>(null);
  const [paymentReference, setPaymentReference] = useState('');
  const [invoiceNumber, setInvoiceNumber] = useState('');
  const [invoiceState, setInvoiceState] = useState<{ id: string; number: string; status: 'Unpaid' | 'Paid'; orderId: string } | null>(null);
  
  const [user, setUser] = useState<any>(null);
  const [authMode, setAuthMode] = useState<'login'|'signup'>('signup');
  const [authEmail, setAuthEmail] = useState('');
  const [authPassword, setAuthPassword] = useState('');
  const [authError, setAuthError] = useState('');
  const [isAuthLoading, setIsAuthLoading] = useState(false);

  const [formData, setFormData] = useState({
    name: '', education: '', college: '', email: '', phone: '', address: '', city: '', state: '', country: '', role: 'Student', referredBy: '', onSiteWorkshop: true, demo: false, bootcamp: false, track: 'Business track', session: '', organization: '', coupon: '', gateway: 'razorpay'
  });

  useEffect(() => {
    const savedDetails = sessionStorage.getItem('vyomatrix_checkout_details');
    if (savedDetails) {
      try {
        setFormData(prev => ({ ...prev, ...JSON.parse(savedDetails) }));
        sessionStorage.removeItem('vyomatrix_checkout_details');
      } catch (err) {
        console.error('Failed to restore registration details', err);
      }
    }
  }, []);

  const handleAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsAuthLoading(true);
    setAuthError('');
    
    try {
      const res = await fetch('/api/user/auth', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: authEmail, password: authPassword, mode: authMode })
      });
      const data = await res.json();
      
      if (res.ok) {
        localStorage.setItem('user_token', data.token);
        localStorage.setItem('user_email', data.user.email);
        window.dispatchEvent(new Event('auth_change'));
        
        setUser(data.user);
        setFormData(prev => ({...prev, email: data.user.email || ''}));
        setStep('details');
      } else {
        setAuthError(data.error || 'Authentication failed');
      }
    } catch (err) {
      setAuthError('Connection error during authentication.');
    } finally {
      setIsAuthLoading(false);
    }
  };

  const handleDetailsSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setCheckoutError('');
    void handlePayment();
  };

  const handlePayment = async () => {
    setIsProcessing(true);
    setCheckoutError('');
    
    try {
      // Enrich formData with course context
      const enrichedDetails = {
        ...formData,
        programId: program.id,
        programTitle: program.title,
        price: program.price,
      };

      let orderData = pendingOrder;
      if (!orderData) {
        const token = localStorage.getItem('user_token');
        if (!token) throw new Error('Please sign in again before continuing to payment.');
        const orderRes = await fetch('/api/payment/create-order', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
          body: JSON.stringify({ programId: program.id, studentDetails: formData })
        });
        orderData = await orderRes.json();
        if (!orderRes.ok || !orderData.orderId) {
          throw new Error(orderData.error || 'Razorpay could not create a payment order.');
        }
        setPendingOrder(orderData);
        setInvoiceNumber(orderData.invoiceNumber || '');
        setInvoiceState({
          id: orderData.invoiceId,
          number: orderData.invoiceNumber,
          status: 'Unpaid',
          orderId: orderData.orderId
        });
        setStep('payment');
      }
      if (!orderData.keyId && !import.meta.env.VITE_RAZORPAY_KEY_ID) {
        throw new Error('Razorpay public key is missing. Please contact support.');
      }

      // 2. Load razorpay script
      const res = await loadRazorpayScript();
      if (!res || !window.Razorpay) {
        throw new Error('Razorpay could not load. Please check your internet connection and try again.');
      }

      // 3. Initialize Razorpay Checkout
      const options = {
        key: orderData.keyId || import.meta.env.VITE_RAZORPAY_KEY_ID || '',
        amount: orderData.amount,
        currency: orderData.currency,
        name: 'Vyomatrix Academy',
        description: `Enrolment: ${program.title}`,
        order_id: orderData.orderId,
        handler: async function (response: any) {
          // 4. Verify signature on backend
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
              setPaymentReference(verifyData.paymentId || response.razorpay_payment_id);
              setInvoiceState(prev => prev ? { ...prev, status: 'Paid' } : prev);
              setStep('success');
            } else {
              setCheckoutError(verifyData.message || 'Payment verification failed. Your invoice remains unpaid.');
            }
          } catch (e) {
            console.error(e);
            setCheckoutError('We could not verify the payment yet. Your invoice remains unpaid; please retry or contact support.');
          }
        },
        prefill: {
          name: formData.name,
          email: formData.email,
          contact: formData.phone
        },
        notes: {
          address: formData.city,
          track: formData.track
        },
        theme: {
          color: '#5B4AF0'
        }
      };

      const paymentObject = new window.Razorpay(options);
      paymentObject.on('payment.failed', function (response: any) {
        setCheckoutError(response?.error?.description || 'Payment did not complete. You can retry using this invoice.');
      });
      paymentObject.on('payment.dismissed', () => {
        setCheckoutError('Checkout was closed. Your invoice is still unpaid; you can retry below.');
      });
      paymentObject.open();
    } catch (e) {
      console.error(e);
      setCheckoutError(e instanceof Error ? e.message : 'An error occurred during checkout setup.');
    } finally {
      setIsProcessing(false);
    }
  };

  if (isLoading) return <div className="p-24 text-center">Loading secure checkout...</div>;
  if (!program) return <div className="p-24 text-center">Program not found.</div>;

  if (step === 'success') {
     return (
       <div className="w-full bg-silver-light min-h-[calc(100vh-80px)] py-24 flex flex-col items-center justify-center px-6">
         <AnimatedSection className="bg-white p-10 md:p-16 rounded-sm shadow-xl border border-silver/20 max-w-2xl w-full text-center relative overflow-hidden">
           <div className="absolute top-0 left-0 w-full h-2 bg-green-500"></div>
           <div className="w-24 h-24 bg-green-500/10 border-4 border-green-500 text-green-500 rounded-full flex items-center justify-center shadow-lg mb-8 mx-auto">
             <CheckCircle2 size={48} strokeWidth={2.5} />
           </div>
           <h2 className="text-3xl font-bold text-ink mb-4 font-heading">Enrolment Successful</h2>
           <p className="text-lg text-ink/80 mb-8 max-w-md mx-auto">
             Welcome to Vyomatrix Academy! Your seat in the <strong>{program.title}</strong> is confirmed.
           </p>
           
           <div className="bg-silver-light/50 border border-silver/20 rounded-sm p-8 mb-10 text-left">
             <h3 className="font-bold text-ink mb-6 text-lg border-b border-silver/20 pb-4">Your Next Steps</h3>
             
             <div className="space-y-8">
               <div className="flex items-start gap-4 relative">
                 <div className="absolute left-6 top-10 w-0.5 h-12 bg-silver/30"></div>
                 <div className="w-12 h-12 bg-white border border-silver/30 rounded-full flex items-center justify-center shadow-sm flex-shrink-0 z-10">
                   <Mail className="text-primary" size={20} />
                 </div>
                 <div>
                   <h4 className="font-bold text-ink mb-1">1. Check your inbox</h4>
                   <p className="text-sm text-ink/70">
                     Razorpay has processed your payment. Your payment receipt will be sent to <strong>{formData.email || 'your email'}</strong> by the gateway.
                   </p>
                   {paymentReference && <p className="text-xs text-ink/60 mt-2">Payment ID: <strong>{paymentReference}</strong></p>}
                   {invoiceNumber && <p className="text-xs text-ink/60 mt-1">Invoice: <strong>{invoiceNumber}</strong> · Paid</p>}
                 </div>
               </div>

               <div className="flex items-start gap-4 relative">
                 <div className="absolute left-6 top-10 w-0.5 h-12 bg-silver/30"></div>
                 <div className="w-12 h-12 bg-white border border-silver/30 rounded-full flex items-center justify-center shadow-sm flex-shrink-0 z-10">
                   <User className="text-primary" size={20} />
                 </div>
                 <div>
                   <h4 className="font-bold text-ink mb-1">2. Complete your profile</h4>
                   <p className="text-sm text-ink/70">
                     Follow the link in your email to set up your student dashboard and access pre-reading materials.
                   </p>
                 </div>
               </div>

               <div className="flex items-start gap-4">
                 <div className="w-12 h-12 bg-white border border-silver/30 rounded-full flex items-center justify-center shadow-sm flex-shrink-0 z-10">
                   <Calendar className="text-primary" size={20} />
                 </div>
                 <div>
                   <h4 className="font-bold text-ink mb-1">3. Join the live orientation</h4>
                   <p className="text-sm text-ink/70">
                     Your cohort schedule and calendar invites will be available in your dashboard 48 hours before start.
                   </p>
                 </div>
               </div>
             </div>
           </div>

           <Button to="/academy" variant="primary" className="px-8 shadow-md">
             Return to Academy
           </Button>
         </AnimatedSection>
       </div>
     );
  }

  return (
    <div className="w-full bg-silver-light min-h-[calc(100vh-80px)] py-12 md:py-24 relative overflow-hidden">
      <SEO 
        title={`Checkout: ${program.title}`} 
        description="Secure checkout for Vyomatrix Academy." 
      />
      <div className="absolute top-0 right-0 w-[600px] h-[600px] bg-primary/5 rounded-full blur-[80px] pointer-events-none -translate-y-1/2 translate-x-1/2"></div>
      
      <div className="max-w-6xl mx-auto px-6 relative z-10">
        <Link to="/academy" className="inline-flex items-center gap-2 text-sm font-medium text-ink/60 hover:text-primary mb-8 transition-colors">
          <ArrowLeft size={16} /> Back to Programs
        </Link>
        
        <div className="flex flex-col md:flex-row gap-8 lg:gap-12">
          {/* Left Column: Form / Payment */}
          <div className="flex-1">
            {step === 'auth' && (
              <AnimatedSection>
                <div className="bg-white border border-silver/20 rounded-sm shadow-md p-6 md:p-10 relative overflow-hidden text-center">
                  <div className="absolute top-0 left-0 w-1 h-full bg-primary"></div>
                  <Lock className="text-primary w-12 h-12 mx-auto mb-4" />
                  <h2 className="text-3xl font-bold text-ink mb-2 font-heading">
                    {authMode === 'signup' ? 'Create an Account' : 'Welcome Back'}
                  </h2>
                  <p className="text-ink/60 mb-8 pb-6 border-b border-silver/10 text-sm">
                    {authMode === 'signup' 
                      ? 'Please sign up to proceed with enrolment and track your courses.' 
                      : 'Log in to continue your enrolment securely.'}
                  </p>
                  
                  <form onSubmit={handleAuth} className="space-y-4 max-w-sm mx-auto text-left">
                    <div>
                      <label className="block text-sm font-bold text-ink mb-1">Email</label>
                      <input 
                        type="email" 
                        required 
                        value={authEmail} 
                        onChange={e => setAuthEmail(e.target.value)}
                        className="w-full px-4 py-3 bg-silver-light/20 border border-silver/30 rounded-sm focus:outline-none focus:border-primary shadow-inner"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-bold text-ink mb-1">Password</label>
                      <input 
                        type="password" 
                        required 
                        value={authPassword} 
                        onChange={e => setAuthPassword(e.target.value)}
                        className="w-full px-4 py-3 bg-silver-light/20 border border-silver/30 rounded-sm focus:outline-none focus:border-primary shadow-inner"
                      />
                    </div>
                    {authError && <p className="text-red-500 text-xs font-bold">{authError}</p>}
                    
                    <button 
                      type="submit" 
                      disabled={isAuthLoading}
                      className="w-full py-3 bg-primary text-white rounded-sm font-bold hover:bg-primary-dark transition-colors mt-4 disabled:opacity-70 flex items-center justify-center gap-2"
                    >
                      {isAuthLoading ? <Loader2 className="animate-spin" size={18} /> : null}
                      {authMode === 'signup' ? 'Create Account' : 'Secure Login'}
                    </button>
                    
                    <div className="text-center mt-4 pt-4 border-t border-silver/10">
                      <button 
                        type="button" 
                        onClick={() => { setAuthMode(authMode === 'signup' ? 'login' : 'signup'); setAuthError(''); }} 
                        className="text-sm font-bold text-ink/60 hover:text-primary transition-colors"
                      >
                        {authMode === 'signup' ? 'Already have an account? Log in' : "Don't have an account? Sign up"}
                      </button>
                    </div>
                  </form>
                </div>
              </AnimatedSection>
            )}
            
            {step === 'details' && (
              <AnimatedSection>
                <div className="bg-white border border-silver/20 rounded-sm shadow-md p-6 md:p-10 relative overflow-hidden">
                  <div className="absolute top-0 left-0 w-1 h-full bg-primary"></div>
                  <h2 className="text-3xl font-bold text-ink mb-2 font-heading">Enrolment Details</h2>
                  <p className="text-ink/60 mb-8 pb-6 border-b border-silver/10 text-sm">Please fill out your details. This information will be used for your official tax invoice and academy certificate.</p>
                  
                  <form onSubmit={handleDetailsSubmit} onInvalidCapture={() => setCheckoutError('Please complete the required fields above before continuing to Razorpay.')} className="space-y-6">
                    <div className="grid md:grid-cols-2 gap-6">
                      <div>
                        <label className="block text-sm font-bold text-ink mb-2 flex items-center gap-2"><User size={16} className="text-primary" /> Full name *</label>
                        <input required type="text" value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} className="w-full px-4 py-3 bg-silver-light/20 border border-silver/30 rounded-sm text-base focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary focus:bg-white transition-colors shadow-inner" placeholder="John Doe" />
                      </div>
                      <div>
                        <label className="block text-sm font-bold text-ink mb-2 flex items-center gap-2"><Mail size={16} className="text-primary" /> Email address *</label>
                        <input required type="email" value={formData.email} onChange={e => setFormData({...formData, email: e.target.value})} className="w-full px-4 py-3 bg-silver-light/20 border border-silver/30 rounded-sm text-base focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary focus:bg-white transition-colors shadow-inner" placeholder="john@example.com" />
                      </div>
                    </div>

                    <div className="grid md:grid-cols-2 gap-6">
                      <div>
                        <label className="block text-sm font-bold text-ink mb-2 flex items-center gap-2"><GraduationCap size={16} className="text-primary" /> Education</label>
                        <input type="text" value={formData.education} onChange={e => setFormData({...formData, education: e.target.value})} className="w-full px-4 py-3 bg-silver-light/20 border border-silver/30 rounded-sm text-base focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary focus:bg-white transition-colors shadow-inner" placeholder="B.Tech, M.Sc, etc." />
                      </div>
                      <div>
                        <label className="block text-sm font-bold text-ink mb-2 flex items-center gap-2"><Building size={16} className="text-primary" /> College / Organization *</label>
                        <input required type="text" value={formData.college} onChange={e => setFormData({...formData, college: e.target.value, organization: e.target.value})} className="w-full px-4 py-3 bg-silver-light/20 border border-silver/30 rounded-sm text-base focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary focus:bg-white transition-colors shadow-inner" placeholder="College or organization" />
                      </div>
                    </div>

                    <div>
                      <label className="block text-sm font-bold text-ink mb-2">Current status *</label>
                      <div className="grid grid-cols-2 gap-4">
                        {['Student', 'Employee'].map(option => (
                          <label key={option} className={`flex items-center justify-center gap-2 p-3 border rounded-sm cursor-pointer ${formData.role === option ? 'border-primary bg-primary/5 text-primary font-bold' : 'border-silver/30 text-ink/80'}`}>
                            <input type="radio" name="role" value={option} checked={formData.role === option} onChange={e => setFormData({...formData, role: e.target.value})} />
                            {option}
                          </label>
                        ))}
                      </div>
                    </div>
                    
                    <div className="grid md:grid-cols-2 gap-6">
                      <div>
                        <label className="block text-sm font-bold text-ink mb-2 flex items-center gap-2"><Phone size={16} className="text-primary" /> Phone number *</label>
                        <input required type="tel" value={formData.phone} onChange={e => setFormData({...formData, phone: e.target.value})} className="w-full px-4 py-3 bg-silver-light/20 border border-silver/30 rounded-sm text-base focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary focus:bg-white transition-colors shadow-inner" placeholder="+91 98765 43210" />
                      </div>
                      <div>
                        <label className="block text-sm font-bold text-ink mb-2 flex items-center gap-2"><MapPin size={16} className="text-primary" /> City *</label>
                        <input required type="text" value={formData.city} onChange={e => setFormData({...formData, city: e.target.value})} className="w-full px-4 py-3 bg-silver-light/20 border border-silver/30 rounded-sm text-base focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary focus:bg-white transition-colors shadow-inner" placeholder="e.g. Bangalore" />
                      </div>
                    </div>

                    <div className="grid md:grid-cols-2 gap-6">
                      <div>
                        <label className="block text-sm font-bold text-ink mb-2">State</label>
                        <input type="text" value={formData.state} onChange={e => setFormData({...formData, state: e.target.value})} className="w-full px-4 py-3 bg-silver-light/20 border border-silver/30 rounded-sm text-base focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary focus:bg-white transition-colors shadow-inner" placeholder="State" />
                      </div>
                      <div>
                        <label className="block text-sm font-bold text-ink mb-2">Country</label>
                        <input type="text" value={formData.country} onChange={e => setFormData({...formData, country: e.target.value})} className="w-full px-4 py-3 bg-silver-light/20 border border-silver/30 rounded-sm text-base focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary focus:bg-white transition-colors shadow-inner" placeholder="Country" />
                      </div>
                    </div>

                    <div>
                      <label className="block text-sm font-bold text-ink mb-2 flex items-center gap-2"><MapPin size={16} className="text-primary" /> Billing address *</label>
                      <textarea required value={formData.address} onChange={e => setFormData({...formData, address: e.target.value})} className="w-full px-4 py-3 min-h-24 bg-silver-light/20 border border-silver/30 rounded-sm text-base focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary focus:bg-white transition-colors shadow-inner resize-y" placeholder="Street address, area, landmark" />
                    </div>

                    <div>
                      <label className="block text-sm font-bold text-ink mb-2">Referred by</label>
                      <input type="text" value={formData.referredBy} onChange={e => setFormData({...formData, referredBy: e.target.value})} className="w-full px-4 py-3 bg-silver-light/20 border border-silver/30 rounded-sm text-base focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary focus:bg-white transition-colors shadow-inner" placeholder="Name or source" />
                    </div>

                    <div className="pt-4 border-t border-silver/10">
                      <label className="block text-sm font-bold text-ink mb-3">Interests</label>
                      <div className="grid sm:grid-cols-3 gap-3">
                        {[['onSiteWorkshop', 'On-site workshop'], ['demo', 'Demo'], ['bootcamp', 'Boot camp']].map(([key, label]) => (
                          <label key={key} className="flex items-center gap-2 text-sm text-ink/80">
                            <input type="checkbox" checked={Boolean(formData[key as keyof typeof formData])} onChange={e => setFormData({...formData, [key]: e.target.checked})} className="w-4 h-4 text-primary" />
                            {label}
                          </label>
                        ))}
                      </div>
                    </div>

                    <div className="pt-4 border-t border-silver/10">
                      <label className="block text-sm font-bold text-ink mb-3 flex items-center gap-2"><GraduationCap size={16} className="text-primary" /> Track preference *</label>
                      <div className="grid sm:grid-cols-2 gap-4">
                        {program.tracks.map((track: string) => (
                          <label key={track} className={`flex items-center gap-3 p-4 border rounded-sm cursor-pointer transition-all ${formData.track === track ? 'border-primary bg-primary/5 text-primary font-bold shadow-sm' : 'border-silver/30 hover:border-primary/50 text-ink/80 hover:bg-silver-light/50'}`}>
                            <input 
                              type="radio" 
                              name="track" 
                              value={track} 
                              checked={formData.track === track}
                              onChange={e => setFormData({...formData, track: e.target.value})}
                              className="w-4 h-4 text-primary border-silver/30 focus:ring-primary"
                            />
                            <span className="text-sm">{track}</span>
                          </label>
                        ))}
                      </div>
                    </div>

                    {sessionOptions.length > 0 && (
                      <div className="pt-4 border-t border-silver/10">
                        <label className="block text-sm font-bold text-ink mb-3 flex items-center gap-2"><Calendar size={16} className="text-primary" /> Choose your session *</label>
                        <div className="grid lg:grid-cols-3 gap-3">
                          {sessionOptions.map(({ name, dates, value }, idx) => (
                            <label key={value} className={`flex items-start gap-3 p-4 border rounded-sm cursor-pointer transition-all ${formData.session === value ? 'border-primary bg-primary/5 shadow-sm' : 'border-silver/30 hover:border-primary/50 hover:bg-silver-light/50'}`}>
                              <input
                                type="radio"
                                name="session"
                                value={value}
                                required={idx === 0}
                                checked={formData.session === value}
                                onChange={e => setFormData({...formData, session: e.target.value})}
                                className="mt-0.5 w-4 h-4 text-primary border-silver/30 focus:ring-primary"
                              />
                              <span>
                                <span className={`block text-sm font-bold ${formData.session === value ? 'text-primary' : 'text-ink'}`}>{name}</span>
                                {dates && <span className="block text-xs text-ink/60 mt-0.5">{dates}</span>}
                              </span>
                            </label>
                          ))}
                        </div>
                      </div>
                    )}

                    {program.sessionsClosed && (
                      <div className="pt-4 border-t border-silver/10">
                        <p role="status" className="rounded-sm border border-yellow-200 bg-yellow-50 p-3 text-sm font-medium text-yellow-800">
                          All sessions for this program have ended. New dates will be announced soon.
                        </p>
                      </div>
                    )}

                    <div className="pt-6 mt-6 border-t border-silver/10">
                      {checkoutError && <p role="alert" className="mb-4 rounded-sm border border-red-200 bg-red-50 p-3 text-sm font-medium text-red-700">{checkoutError}</p>}
                      <button type="submit" disabled={Boolean(program.sessionsClosed)} className="w-full py-4 bg-primary text-white rounded-sm font-bold hover:bg-primary-dark transition-colors shadow-xl shadow-primary/20 flex items-center justify-center gap-2 text-lg disabled:opacity-50 disabled:cursor-not-allowed">
                        Continue to Razorpay <ArrowLeft size={18} className="rotate-180" />
                      </button>
                    </div>
                  </form>
                </div>
              </AnimatedSection>
            )}

            {step === 'payment' && (
              <AnimatedSection>
                <div className="bg-white border border-silver/20 rounded-sm shadow-md p-6 md:p-10 relative overflow-hidden">
                  <div className="absolute top-0 left-0 w-1 h-full bg-primary"></div>
                  <h2 className="text-3xl font-bold text-ink mb-2 font-heading flex items-center gap-3">
                    Secure Checkout
                  </h2>
                  <p className="text-ink/60 mb-8 pb-6 border-b border-silver/10 text-sm">Review your order summary, then continue securely with Razorpay using cards, UPI, net banking, or wallets.</p>
                  {checkoutError && <p role="alert" className="mb-6 rounded-sm border border-red-200 bg-red-50 p-3 text-sm font-medium text-red-700">{checkoutError}</p>}

                  {invoiceState && (
                    <div className={`mb-8 p-5 rounded-sm border ${invoiceState.status === 'Paid' ? 'bg-green-50 border-green-200' : 'bg-yellow-50 border-yellow-200'}`}>
                      <div className="flex items-center justify-between gap-4">
                        <div>
                          <div className="text-xs uppercase tracking-wider font-bold text-silver mb-1">Invoice</div>
                          <div className="font-mono font-bold text-ink">{invoiceState.number}</div>
                          <div className="text-xs text-ink/60 mt-1">Order: {invoiceState.orderId}</div>
                        </div>
                        <span className={`px-3 py-1.5 rounded-full border text-xs font-bold ${invoiceState.status === 'Paid' ? 'bg-green-100 text-green-800 border-green-200' : 'bg-yellow-100 text-yellow-800 border-yellow-200'}`}>
                          {invoiceState.status}
                        </span>
                      </div>
                      {invoiceState.status === 'Unpaid' && (
                        <p className="text-sm text-yellow-800 mt-3">This invoice will change to Paid after Razorpay confirms your payment.</p>
                      )}
                    </div>
                  )}
                  
                  <div className="mb-8 border border-silver/20 rounded-sm p-6 bg-silver-light/20">
                    <h3 className="text-sm font-bold text-ink mb-2 flex items-center gap-2"><Globe size={16} className="text-primary"/> Razorpay Secure Payment</h3>
                    <p className="text-sm text-ink/70">Cards, UPI, net banking, and wallets are available in the Razorpay payment window.</p>
                  </div>

                  <div className="bg-silver-light/20 border border-silver/20 rounded-sm p-10 mb-8 text-center shadow-inner">
                    <Lock className="mx-auto text-primary mb-4" size={48} strokeWidth={1.5} />
                    <h3 className="font-bold text-ink mb-3 text-xl">Pay securely with Razorpay</h3>
                    <p className="text-sm text-ink/70 max-w-sm mx-auto mb-8 leading-relaxed">
                      Razorpay will open its secure payment window to complete your INR transaction. We do not store your card details.
                    </p>
                    <button 
                      onClick={handlePayment}
                      disabled={isProcessing}
                      className="w-full md:w-auto px-12 py-4 bg-ink text-white rounded-sm font-bold hover:bg-ink/80 transition-colors disabled:opacity-70 flex items-center justify-center gap-3 mx-auto text-lg shadow-xl"
                    >
                      {isProcessing ? <><Loader2 size={20} className="animate-spin" /> Preparing Checkout...</> : <><CreditCard size={20} /> Pay {program.price}</>}
                    </button>
                    <div className="flex items-center justify-center gap-2 mt-6 text-xs text-ink/60 font-medium">
                      <ShieldCheck size={16} className="text-primary" /> 256-bit SSL Encrypted Transaction
                    </div>
                  </div>
                  <div className="text-center">
                    <button onClick={() => { setPendingOrder(null); setInvoiceState(null); setStep('details'); }} className="text-sm font-bold text-ink/60 hover:text-primary transition-colors flex items-center justify-center gap-2 mx-auto">
                      <ArrowLeft size={16} /> Edit student details
                    </button>
                  </div>
                </div>
              </AnimatedSection>
            )}
          </div>

          {/* Right Column: Order Summary */}
          <div className="w-full md:w-80 lg:w-96">
            <AnimatedSection delay={0.1}>
              <div className="bg-white border border-silver/20 rounded-sm shadow-md p-8 sticky top-28">
                <h3 className="font-bold text-ink mb-6 font-heading border-b border-silver/10 pb-4 text-xl flex items-center gap-2">
                  <Banknote size={20} className="text-primary" /> Order Summary
                </h3>
                <div className="pb-6 mb-6 border-b border-silver/10 space-y-5">
                  <div className="font-bold text-ink text-xl leading-tight font-heading">{program.title}</div>
                  
                  <div className="flex items-start gap-3">
                    <Calendar size={18} className="text-primary mt-0.5" />
                    <div>
                      <div className="text-xs text-ink/50 uppercase tracking-wider font-mono mb-1 font-bold">Cohort</div>
                      <div className="text-sm font-medium text-ink">{program.date}</div>
                    </div>
                  </div>
                  
                  <div className="flex items-start gap-3">
                    <GraduationCap size={18} className="text-primary mt-0.5" />
                    <div>
                      <div className="text-xs text-ink/50 uppercase tracking-wider font-mono mb-1 font-bold">Selected Track</div>
                      <div className="text-sm font-medium text-ink">{formData.track || 'Pending Selection'}</div>
                    </div>
                  </div>

                  {sessionOptions.length > 0 && (
                    <div className="flex items-start gap-3">
                      <Building size={18} className="text-primary mt-0.5" />
                      <div>
                        <div className="text-xs text-ink/50 uppercase tracking-wider font-mono mb-1 font-bold">Session</div>
                        <div className="text-sm font-medium text-ink">{formData.session || 'Pending Selection'}</div>
                      </div>
                    </div>
                  )}
                </div>

                <div className="bg-silver-light/30 border border-silver/10 rounded-sm p-5 mb-6">
                  <h4 className="text-xs font-bold text-ink uppercase tracking-wider mb-4 border-b border-silver/10 pb-2">What's Included</h4>
                  <ul className="space-y-3">
                    {program.highlights.slice(0, 3).map((highlight, idx) => (
                      <li key={idx} className="flex items-start gap-3 text-sm text-ink/80 leading-snug">
                        <CheckCircle2 size={16} className="text-primary flex-shrink-0 mt-0.5" />
                        <span>{highlight}</span>
                      </li>
                    ))}
                  </ul>
                </div>
                
                <div className="mb-6">
                  <label className="block text-xs font-bold text-ink mb-2 uppercase tracking-wider flex items-center gap-2"><Tag size={12} className="text-primary" /> Coupon Code</label>
                  <div className="flex gap-2">
                    <input type="text" value={formData.coupon} onChange={e => setFormData({...formData, coupon: e.target.value})} className="flex-1 px-3 py-2 bg-silver-light/20 border border-silver/30 rounded-sm text-sm focus:outline-none focus:border-primary focus:bg-white" placeholder="Optional" />
                    <button className="px-4 py-2 bg-silver-light text-ink text-sm font-bold rounded-sm border border-silver/30 hover:bg-silver/10 transition-colors">Apply</button>
                  </div>
                </div>

                <div className="py-5 flex items-center justify-between font-bold text-2xl text-ink border-t border-silver/20">
                  <span>Total</span>
                  <span className="text-right">
                    {program.originalPrice && (
                      <span className="block text-xs text-silver line-through">{program.originalPrice}</span>
                    )}
                    <span className="block text-primary">{program.price}</span>
                    {program.offerLabel && (
                      <span className="block text-xs font-semibold text-primary/80">{program.offerLabel}</span>
                    )}
                  </span>
                </div>
                <div className="text-xs text-ink/50 text-right -mt-4 mb-6">(Inclusive of all applicable taxes)</div>
                
                <div className="flex items-start gap-3 text-xs text-ink/60 leading-relaxed bg-silver-light/50 p-4 rounded-sm border border-silver/20">
                  <ShieldCheck size={20} className="flex-shrink-0 text-primary" />
                  <span>By completing this purchase, you consent to our Terms of Service and Refund Policy. No card data is stored on our servers.</span>
                </div>
              </div>
            </AnimatedSection>
          </div>
        </div>
      </div>
    </div>
  );
}

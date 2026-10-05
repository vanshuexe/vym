import React, { useState, useEffect } from 'react';
import { AnimatedSection } from '../components/ui/AnimatedSection';
import { Lock, LogOut, FileText, Database, Settings, GraduationCap, CheckCircle2, ShieldAlert, CreditCard, User, Mail, Phone, MapPin, BookOpen, Building2, Hash, IndianRupee, Clock, Filter, Calendar, Plus, Trash2 } from 'lucide-react';
import { Button } from '../components/ui/Button';

// Course prices are display strings such as "INR 2,499"; read the first number in them.
const parsePrice = (value: unknown) => {
  const match = String(value ?? '').match(/\d[\d,]*(?:\.\d{1,2})?/);
  return match ? Number(match[0].replace(/,/g, '')) : NaN;
};

export function Admin() {
  const [token, setToken] = useState<string | null>(localStorage.getItem('admin_token'));
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  
  const [db, setDb] = useState<any>(null);
  const [activeTab, setActiveTab] = useState<'pages' | 'courses' | 'media' | 'enquiries' | 'orders' | 'invoices' | 'settings' | 'registrations'>('pages');
  const [isSaving, setIsSaving] = useState(false);
  const [saveMessage, setSaveMessage] = useState('');

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await fetch('/api/admin/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ password })
      });
      const data = await res.json();
      if (res.ok) {
        setToken(data.token);
        localStorage.setItem('admin_token', data.token);
        setError('');
      } else {
        setError(data.error);
      }
    } catch (err) {
      setError('Connection failed');
    }
  };

  const loadData = async () => {
    try {
      const res = await fetch('/api/cms/data', {
        headers: { Authorization: `Bearer ${token}` }
      });
      const data = await res.json();
      // An expired or old-secret token still gets the public CMS view (no enquiries); send the admin back to login.
      if (!Array.isArray(data.enquiries)) {
        setToken(null);
        localStorage.removeItem('admin_token');
        setError('Your admin session has expired. Please log in again.');
        return;
      }
      setDb(data);
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    if (token) loadData();
  }, [token]);

  const handleSave = async () => {
    setIsSaving(true);
    setSaveMessage('');
    try {
      const res = await fetch('/api/cms/data', {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        // Only the CMS-editable sections; orders, invoices and users are managed by the server.
        body: JSON.stringify({ pages: db.pages, courses: db.courses, media: db.media, settings: db.settings })
      });
      if (res.ok) {
        setSaveMessage('Saved successfully');
        setTimeout(() => setSaveMessage(''), 3000);
      } else {
        setSaveMessage('Error saving data (Check auth)');
      }
    } catch (err) {
      setSaveMessage('Connection error');
    } finally {
      setIsSaving(false);
    }
  };

  const handleLogout = () => {
    setToken(null);
    localStorage.removeItem('admin_token');
  };

  const handleInvoiceDownload = async (invoice: any) => {
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

  if (!token) {
    return (
      <div className="w-full min-h-screen bg-silver-light flex items-center justify-center p-6">
        <div className="max-w-md w-full bg-white p-10 rounded-sm shadow-xl border border-silver/20 text-center">
          <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-6 text-primary">
            <Lock size={32} />
          </div>
          <h1 className="text-2xl font-bold font-heading mb-2">Secure Admin Area</h1>
          <p className="text-sm text-ink/60 mb-8">Enter your administrative password to access the CMS.</p>
          
          <form onSubmit={handleLogin} className="space-y-4">
            <input 
              type="password" 
              value={password}
              onChange={e => setPassword(e.target.value)}
              placeholder="Enter admin password"
              className="w-full px-4 py-3 bg-silver-light/30 border border-silver/30 rounded-sm focus:outline-none focus:border-primary shadow-inner text-center"
            />
            {error && <p className="text-red-500 text-sm font-medium">{error}</p>}
            <button type="submit" className="w-full py-3 bg-primary text-white font-bold rounded-sm shadow-lg shadow-primary/20 hover:bg-primary-dark transition-all">
              Login to CMS
            </button>
          </form>
        </div>
      </div>
    );
  }

  if (!db) return <div className="p-24 text-center">Loading secure database...</div>;

  return (
    <div className="w-full min-h-screen bg-silver-light flex flex-col md:flex-row">
      {/* Sidebar */}
      <div className="w-full md:w-64 bg-ink text-white p-6 flex flex-col">
        <div className="flex items-center gap-2 mb-12 font-heading font-bold text-xl">
          <ShieldAlert className="text-primary-light" /> Vyomatrix CMS
        </div>
        
        <nav className="flex-1 space-y-2">
          <button onClick={() => setActiveTab('pages')} className={`w-full flex items-center gap-3 px-4 py-3 rounded-sm text-left transition-colors ${activeTab === 'pages' ? 'bg-primary text-white' : 'text-silver hover:bg-ink-light'}`}>
            <BookOpen size={18} /> Page Content
          </button>
          <button onClick={() => setActiveTab('courses')} className={`w-full flex items-center gap-3 px-4 py-3 rounded-sm text-left transition-colors ${activeTab === 'courses' ? 'bg-primary text-white' : 'text-silver hover:bg-ink-light'}`}>
            <GraduationCap size={18} /> Academy Courses
          </button>
          <button onClick={() => setActiveTab('media')} className={`w-full flex items-center gap-3 px-4 py-3 rounded-sm text-left transition-colors ${activeTab === 'media' ? 'bg-primary text-white' : 'text-silver hover:bg-ink-light'}`}>
            <FileText size={18} /> Media & Posts
          </button>
          <button onClick={() => setActiveTab('enquiries')} className={`w-full flex items-center gap-3 px-4 py-3 rounded-sm text-left transition-colors ${activeTab === 'enquiries' ? 'bg-primary text-white' : 'text-silver hover:bg-ink-light'}`}>
            <Database size={18} /> Enquiries ({db.enquiries?.filter((e: any) => e.type !== 'Academy Enrolment' && e.type !== 'Registration').length || 0})
          </button>
          <button onClick={() => setActiveTab('registrations')} className={`w-full flex items-center gap-3 px-4 py-3 rounded-sm text-left transition-colors ${activeTab === 'registrations' ? 'bg-primary text-white' : 'text-silver hover:bg-ink-light'}`}>
            <User size={18} /> Registrations ({db.enquiries?.filter((e: any) => e.type === 'Registration').length || 0})
          </button>
          <button onClick={() => setActiveTab('orders')} className={`w-full flex items-center gap-3 px-4 py-3 rounded-sm text-left transition-colors ${activeTab === 'orders' ? 'bg-primary text-white' : 'text-silver hover:bg-ink-light'}`}>
            <CheckCircle2 size={18} /> Orders ({db.enquiries?.filter((e: any) => e.type === 'Academy Enrolment').length || 0})
          </button>
          <button onClick={() => setActiveTab('invoices')} className={`w-full flex items-center gap-3 px-4 py-3 rounded-sm text-left transition-colors ${activeTab === 'invoices' ? 'bg-primary text-white' : 'text-silver hover:bg-ink-light'}`}>
            <FileText size={18} /> Invoices ({db.invoices?.length || 0})
          </button>
          <button onClick={() => setActiveTab('settings')} className={`w-full flex items-center gap-3 px-4 py-3 rounded-sm text-left transition-colors ${activeTab === 'settings' ? 'bg-primary text-white' : 'text-silver hover:bg-ink-light'}`}>
            <Settings size={18} /> Gateway Settings
          </button>
        </nav>

        <button onClick={handleLogout} className="mt-auto flex items-center gap-2 text-silver hover:text-white transition-colors">
          <LogOut size={18} /> Secure Logout
        </button>
      </div>

      {/* Main Content */}
      <div className="flex-1 p-8 md:p-12 overflow-y-auto">
        <div className="flex justify-between items-center mb-8 pb-4 border-b border-silver/30">
          <h2 className="text-3xl font-bold font-heading text-ink capitalize">{activeTab} Management</h2>
          <div className="flex items-center gap-4">
            {saveMessage && <span className="text-sm font-bold text-green-600 flex items-center gap-1"><CheckCircle2 size={16}/> {saveMessage}</span>}
            {(activeTab === 'pages' || activeTab === 'courses' || activeTab === 'media' || activeTab === 'settings') && (
              <button onClick={handleSave} disabled={isSaving} className="px-6 py-2 bg-ink text-white font-bold rounded-sm shadow-lg hover:bg-primary transition-colors disabled:opacity-50">
                {isSaving ? 'Saving...' : 'Save Database'}
              </button>
            )}
          </div>
        </div>

        {/* Pages Content Editor */}
        {activeTab === 'pages' && (() => {
          const updatePage = (pageKey: string, fieldKey: string, value: string) => {
            const newDb = { ...db };
            if (!newDb.pages) newDb.pages = {};
            if (!newDb.pages[pageKey]) newDb.pages[pageKey] = {};
            newDb.pages[pageKey][fieldKey] = value;
            setDb(newDb);
          };

          return (
            <div className="space-y-6">
              <div className="bg-white p-8 rounded-sm shadow-sm border border-silver/30 max-w-4xl">
                <h3 className="text-xl font-bold font-heading mb-6 border-b border-silver/20 pb-4">Home Page Content</h3>
                <div className="space-y-5">
                  <div>
                    <label className="block text-sm font-bold text-ink mb-2">Hero Title</label>
                    <input type="text" value={db.pages?.home?.heroTitle || 'TRUSTED AI FOR ENTERPRISE.'} 
                          onChange={e => updatePage('home', 'heroTitle', e.target.value)} 
                          className="w-full p-3 bg-silver-light/30 border border-silver/30 rounded-sm text-sm focus:outline-none focus:border-primary shadow-inner" />
                  </div>
                  <div>
                    <label className="block text-sm font-bold text-ink mb-2">Hero Subtitle</label>
                    <textarea value={db.pages?.home?.heroSubtitle || 'INDEPENDENT QUALITY ASSURANCE, MANAGED DELIVERY, AND GOVERNANCE IN ONE PLATFORM.'} 
                          onChange={e => updatePage('home', 'heroSubtitle', e.target.value)} 
                          className="w-full p-3 bg-silver-light/30 border border-silver/30 rounded-sm text-sm focus:outline-none focus:border-primary shadow-inner" rows={2} />
                  </div>
                </div>
              </div>

              <div className="bg-white p-8 rounded-sm shadow-sm border border-silver/30 max-w-4xl">
                <h3 className="text-xl font-bold font-heading mb-6 border-b border-silver/20 pb-4">Services Page Content</h3>
                <div className="space-y-5">
                  <div>
                    <label className="block text-sm font-bold text-ink mb-2">Hero Title</label>
                    <input type="text" value={db.pages?.services?.heroTitle || 'Our Services'} 
                          onChange={e => updatePage('services', 'heroTitle', e.target.value)} 
                          className="w-full p-3 bg-silver-light/30 border border-silver/30 rounded-sm text-sm focus:outline-none focus:border-primary shadow-inner" />
                  </div>
                  <div>
                    <label className="block text-sm font-bold text-ink mb-2">Hero Subtitle</label>
                    <textarea value={db.pages?.services?.heroSubtitle || 'Trusted AI, proven and accountable. We help organizations deploy AI they can stand behind.'} 
                          onChange={e => updatePage('services', 'heroSubtitle', e.target.value)} 
                          className="w-full p-3 bg-silver-light/30 border border-silver/30 rounded-sm text-sm focus:outline-none focus:border-primary shadow-inner" rows={2} />
                  </div>
                </div>
              </div>
            </div>
          );
        })()}

        {/* Courses Editor */}
        {activeTab === 'courses' && (() => {
          const updateCourse = (idx: number, field: string, value: unknown) => {
            setDb({ ...db, courses: db.courses.map((course: any, i: number) => i === idx ? { ...course, [field]: value } : course) });
          };
          const inputClass = 'w-full p-2 border border-silver/30 rounded-sm text-sm focus:outline-none focus:border-primary';
          const labelClass = 'block text-xs font-bold text-silver mb-1';
          // Same rule as the server: a session stays open through its last day, judged in India time.
          const today = new Intl.DateTimeFormat('en-CA', { timeZone: 'Asia/Kolkata', year: 'numeric', month: '2-digit', day: '2-digit' }).format(new Date());

          return (
            <div className="space-y-6">
              {db.courses.map((course: any, idx: number) => {
                const price = parsePrice(course.price);
                const original = parsePrice(course.originalPrice);
                const discount = price > 0 && original > price ? Math.round((1 - price / original) * 100) : null;
                const suggestedLabel = discount === null ? '' : /\d+%\s*off/i.test(course.offerLabel || '')
                  ? course.offerLabel.replace(/\d+%\s*off/i, `${discount}% off`)
                  : `Introductory offer · ${discount}% off`;

                return (
                  <div key={course.id} className="bg-white p-6 rounded-sm shadow-sm border border-silver/30">
                    <div className="flex justify-between items-start mb-4">
                      <h3 className="text-lg font-bold font-heading">{course.title} (ID: {course.id})</h3>
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className={labelClass}>Title</label>
                        <input type="text" value={course.title || ''} onChange={e => updateCourse(idx, 'title', e.target.value)} className={inputClass} />
                      </div>
                      <div>
                        <label className={labelClass}>Level</label>
                        <input type="text" value={course.level || ''} onChange={e => updateCourse(idx, 'level', e.target.value)} className={inputClass} />
                      </div>
                      <div className="col-span-2">
                        <label className={labelClass}>Description</label>
                        <textarea value={course.desc || ''} onChange={e => updateCourse(idx, 'desc', e.target.value)} className={inputClass} rows={2} />
                      </div>
                      <div>
                        <label className={labelClass}>Duration</label>
                        <input type="text" value={course.duration || ''} onChange={e => updateCourse(idx, 'duration', e.target.value)} className={inputClass} />
                      </div>
                      <div>
                        <label className={labelClass}>Date / Cohort</label>
                        <input type="text" value={course.date || ''} onChange={e => updateCourse(idx, 'date', e.target.value)} className={inputClass} />
                      </div>
                    </div>

                    <div className="mt-6 pt-5 border-t border-silver/20">
                      <h4 className="text-sm font-bold text-ink mb-3 flex items-center gap-2"><IndianRupee size={14} className="text-primary" /> Pricing</h4>
                      <div className="grid md:grid-cols-3 gap-4">
                        <div>
                          <label className={labelClass}>Price (charged at checkout) *</label>
                          <input type="text" value={course.price || ''} onChange={e => updateCourse(idx, 'price', e.target.value)} placeholder="e.g. INR 2,499" className={inputClass} />
                        </div>
                        <div>
                          <label className={labelClass}>Original price (shown struck through)</label>
                          <input type="text" value={course.originalPrice || ''} onChange={e => updateCourse(idx, 'originalPrice', e.target.value)} placeholder="Optional, e.g. INR 4,999" className={inputClass} />
                        </div>
                        <div>
                          <label className={labelClass}>Offer label</label>
                          <input type="text" value={course.offerLabel || ''} onChange={e => updateCourse(idx, 'offerLabel', e.target.value)} placeholder="Optional, e.g. Introductory offer · 50% off" className={inputClass} />
                        </div>
                      </div>

                      <div className="mt-3 flex flex-wrap items-center gap-3 text-xs">
                        {!(price > 0) && <span className="text-red-600 font-bold">Price needs an amount (e.g. INR 2,499), otherwise checkout cannot charge for this course.</span>}
                        {discount !== null ? (
                          <>
                            <span className="text-ink/70">Calculated discount: <strong className="text-primary">{discount}% off</strong></span>
                            {course.offerLabel !== suggestedLabel && (
                              <button type="button" onClick={() => updateCourse(idx, 'offerLabel', suggestedLabel)} className="px-3 py-1 rounded-sm border border-primary/30 text-primary font-bold hover:bg-primary/5 transition-colors">
                                Set label to "{suggestedLabel}"
                              </button>
                            )}
                          </>
                        ) : course.originalPrice ? (
                          <span className="text-yellow-700 font-medium">Original price should be higher than the price, or leave it empty.</span>
                        ) : (
                          <span className="text-silver">Leave Original price and Offer label empty to show only the price.</span>
                        )}
                      </div>

                      <div className="mt-4 p-4 bg-silver-light/30 border border-silver/20 rounded-sm">
                        <div className="text-[10px] text-silver uppercase tracking-wider font-bold mb-1">Preview · Tuition Investment</div>
                        <div className="flex flex-wrap items-baseline gap-x-3 gap-y-1">
                          {course.originalPrice && <span className="text-base font-medium text-silver line-through">{course.originalPrice}</span>}
                          <span className="text-2xl font-bold text-ink">{course.price || '—'}</span>
                        </div>
                        {course.offerLabel && <div className="mt-1 text-sm font-semibold text-primary">{course.offerLabel}</div>}
                      </div>
                    </div>

                    <div className="mt-6 pt-5 border-t border-silver/20">
                      <h4 className="text-sm font-bold text-ink mb-1 flex items-center gap-2"><Calendar size={14} className="text-primary" /> Sessions</h4>
                      <p className="text-xs text-silver mb-3">Students must pick one of these at enrolment. Each session disappears from enrolment automatically after its last day (India time). Leave empty if this course has no session choice.</p>
                      {(course.sessions || []).length > 0 && (
                        <div className="hidden md:grid grid-cols-[1fr_1fr_10rem_2.5rem] gap-3 mb-1 text-[10px] font-bold uppercase tracking-wider text-silver">
                          <span>University / venue</span><span>Dates shown to students</span><span>Last day</span><span />
                        </div>
                      )}
                      <div className="space-y-3">
                        {(course.sessions || []).map((session: any, sIdx: number) => {
                          const updateSession = (field: 'name' | 'dates' | 'endDate', value: string) => updateCourse(idx, 'sessions',
                            course.sessions.map((s: any, i: number) => i === sIdx ? { ...s, [field]: value } : s));
                          const hasEnd = /^\d{4}-\d{2}-\d{2}$/.test(session.endDate || '');
                          const ended = hasEnd && session.endDate < today;
                          const endLabel = hasEnd ? new Date(`${session.endDate}T00:00:00`).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' }) : '';
                          return (
                            <div key={sIdx}>
                              <div className="grid md:grid-cols-[1fr_1fr_10rem_2.5rem] gap-3 items-center">
                                <input type="text" value={session.name || ''} onChange={e => updateSession('name', e.target.value)} placeholder="University / venue, e.g. SK University" className={inputClass} />
                                <input type="text" value={session.dates || ''} onChange={e => updateSession('dates', e.target.value)} placeholder="Dates, e.g. Oct 16, Oct 17" className={inputClass} />
                                <input type="date" value={session.endDate || ''} onChange={e => updateSession('endDate', e.target.value)} aria-label="Last day" title="Hidden from enrolment after this day" className={inputClass} />
                                <button type="button" onClick={() => updateCourse(idx, 'sessions', course.sessions.filter((_: any, i: number) => i !== sIdx))} aria-label={`Remove ${session.name || 'session'}`} className="p-2 text-silver hover:text-red-600 transition-colors justify-self-start">
                                  <Trash2 size={16} />
                                </button>
                              </div>
                              <p className={`mt-1 text-xs font-medium ${ended ? 'text-red-600' : hasEnd ? 'text-green-700' : 'text-silver'}`}>
                                {ended ? `Ended ${endLabel} · hidden from enrolment` : hasEnd ? `Live · shown at enrolment until ${endLabel}` : 'No last day set · always shown'}
                              </p>
                            </div>
                          );
                        })}
                      </div>
                      <button type="button" onClick={() => updateCourse(idx, 'sessions', [...(course.sessions || []), { name: '', dates: '', endDate: '' }])} className="mt-3 inline-flex items-center gap-1.5 px-3 py-1.5 rounded-sm border border-primary/30 text-primary text-xs font-bold hover:bg-primary/5 transition-colors">
                        <Plus size={14} /> Add session
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          );
        })()}

        {/* Media Editor */}
        {activeTab === 'media' && (
          <div className="space-y-6">
            {db.media.map((post: any, idx: number) => (
              <div key={post.id} className="bg-white p-6 rounded-sm shadow-sm border border-silver/30">
                <div className="flex justify-between items-start mb-4">
                  <h3 className="text-lg font-bold font-heading">{post.title}</h3>
                  <select value={post.status} onChange={e => { const newDb = {...db}; newDb.media[idx].status = e.target.value; setDb(newDb); }} className={`text-xs font-bold px-3 py-1 rounded-full ${post.status === 'Published' ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'}`}>
                    <option value="Published">Published</option>
                    <option value="Draft">Draft</option>
                  </select>
                </div>
                <div className="grid grid-cols-1 gap-4">
                  <div>
                    <label className="block text-xs font-bold text-silver mb-1">Title</label>
                    <input type="text" value={post.title} onChange={e => { const newDb = {...db}; newDb.media[idx].title = e.target.value; setDb(newDb); }} className="w-full p-2 border border-silver/30 rounded-sm text-sm" />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-silver mb-1">Summary</label>
                    <textarea value={post.summary} onChange={e => { const newDb = {...db}; newDb.media[idx].summary = e.target.value; setDb(newDb); }} className="w-full p-2 border border-silver/30 rounded-sm text-sm" rows={2}></textarea>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Enquiries Viewer */}
        {activeTab === 'enquiries' && (() => {
          const enquiries = [...(db.enquiries || [])].filter((e: any) => e.type !== 'Academy Enrolment' && e.type !== 'Registration').reverse();
          return (
            <div className="space-y-4">
              {/* Stats */}
              <div className="grid grid-cols-2 gap-4 mb-2">
                <div className="bg-white border border-silver/30 rounded-sm p-5 shadow-sm">
                  <div className="text-2xl font-bold text-ink font-heading">{enquiries.length}</div>
                  <div className="text-xs text-silver font-bold uppercase tracking-wider mt-1">Total Enquiries</div>
                </div>
                <div className="bg-white border border-blue-200 rounded-sm p-5 shadow-sm">
                  <div className="text-2xl font-bold text-blue-600 font-heading">{enquiries.length}</div>
                  <div className="text-xs text-blue-600 font-bold uppercase tracking-wider mt-1">Awaiting Response</div>
                </div>
              </div>

              {enquiries.length === 0 ? (
                <div className="bg-white border border-silver/30 rounded-sm p-16 text-center text-silver shadow-sm">
                  <Database size={48} className="mx-auto mb-4 opacity-30" />
                  <p className="font-medium">No enquiries received yet.</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {enquiries.map((enq: any, i: number) => (
                    <div key={i} className="bg-white border border-silver/20 rounded-sm shadow-sm hover:shadow-md transition-shadow overflow-hidden">
                      {/* Card Header */}
                      <div className="flex flex-wrap items-center justify-between gap-3 px-6 py-4 border-b border-silver/10 bg-silver-light/20">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-full bg-primary/10 border border-primary/20 flex items-center justify-center text-primary font-bold text-sm flex-shrink-0">
                            {(enq.name || '?')[0].toUpperCase()}
                          </div>
                          <div>
                            <div className="font-bold text-ink">{enq.name || 'Unknown'}</div>
                            <div className="text-xs text-silver">{enq.company || 'No organization'}</div>
                          </div>
                        </div>
                        <div className="flex items-center gap-3 flex-wrap">
                          {enq.interest && (
                            <span className="px-3 py-1 bg-primary/10 text-primary text-xs font-bold rounded-full">{enq.interest}</span>
                          )}
                          <span className="px-3 py-1 bg-green-100 text-green-800 text-xs font-bold rounded-full flex items-center gap-1">
                            <CheckCircle2 size={11} /> Received
                          </span>
                          <span className="text-xs font-mono text-silver">
                            {enq.date ? new Date(enq.date).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' }) : ''}{' '}
                            {enq.date ? new Date(enq.date).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' }) : ''}
                          </span>
                        </div>
                      </div>

                      {/* Card Body */}
                      <div className="px-6 py-5 grid md:grid-cols-3 gap-4">
                        {/* Contact Info */}
                        <div className="space-y-2">
                          <div className="text-xs font-bold text-silver uppercase tracking-wider mb-3">Contact Info</div>
                          <div className="flex items-center gap-2 text-sm text-ink">
                            <Mail size={14} className="text-primary flex-shrink-0" />
                            <a href={`mailto:${enq.email}`} className="hover:text-primary transition-colors truncate">{enq.email || 'N/A'}</a>
                          </div>
                          <div className="flex items-center gap-2 text-sm text-ink">
                            <Phone size={14} className="text-primary flex-shrink-0" />
                            <span>{enq.phone || 'N/A'}</span>
                          </div>
                          {enq.company && (
                            <div className="flex items-center gap-2 text-sm text-ink">
                              <Building2 size={14} className="text-primary flex-shrink-0" />
                              <span>{enq.company}</span>
                            </div>
                          )}
                        </div>

                        {/* Message */}
                        <div className="md:col-span-2">
                          <div className="text-xs font-bold text-silver uppercase tracking-wider mb-3">Message</div>
                          <div className="bg-silver-light/40 border border-silver/10 rounded-sm p-4 text-sm text-ink leading-relaxed whitespace-pre-wrap">
                            {enq.message || <span className="text-silver italic">No message provided.</span>}
                          </div>
                        </div>
                      </div>

                      {/* Card Footer */}
                      <div className="px-6 py-3 border-t border-silver/10 bg-silver-light/10 flex items-center justify-between">
                        <span className="text-xs font-mono text-silver">ID: {enq.id || 'N/A'}</span>
                        <a href={`mailto:${enq.email}?subject=Re: Your Inquiry - ${enq.interest}`} className="text-xs font-bold text-primary hover:underline flex items-center gap-1">
                          <Mail size={12} /> Reply via Email
                        </a>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          );
        })()}

        {/* Registrations Viewer */}
        {activeTab === 'registrations' && (() => {
          const registrations = [...(db.enquiries || [])].filter((e: any) => e.type === 'Registration').reverse();
          return (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4 mb-2">
                <div className="bg-white border border-silver/30 rounded-sm p-5 shadow-sm">
                  <div className="text-2xl font-bold text-ink font-heading">{registrations.length}</div>
                  <div className="text-xs text-silver font-bold uppercase tracking-wider mt-1">Total Registrations</div>
                </div>
              </div>

              {registrations.length === 0 ? (
                <div className="bg-white border border-silver/30 rounded-sm p-16 text-center text-silver shadow-sm">
                  <User size={48} className="mx-auto mb-4 opacity-30" />
                  <p className="font-medium">No registrations received yet.</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {registrations.map((reg: any, i: number) => (
                    <div key={i} className="bg-white border border-silver/20 rounded-sm shadow-sm overflow-hidden">
                      <div className="flex flex-wrap items-center justify-between gap-3 px-6 py-4 border-b border-silver/10 bg-silver-light/20">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-full bg-primary/10 border border-primary/20 flex items-center justify-center text-primary font-bold text-sm flex-shrink-0">
                            {(reg.name || '?')[0].toUpperCase()}
                          </div>
                          <div>
                            <div className="font-bold text-ink">{reg.name || 'Unknown'}</div>
                            <div className="text-xs text-silver">{reg.email}</div>
                          </div>
                        </div>
                        <div className="flex items-center gap-3 flex-wrap">
                          <span className="text-xs font-mono text-silver">
                            {reg.date ? new Date(reg.date).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' }) : ''}{' '}
                            {reg.date ? new Date(reg.date).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' }) : ''}
                          </span>
                        </div>
                      </div>

                      <div className="px-6 py-5 grid md:grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <div className="text-xs font-bold text-silver uppercase tracking-wider mb-3">Academic & Personal Info</div>
                          <div className="text-sm text-ink"><span className="font-bold">Education:</span> {reg.education}</div>
                          <div className="text-sm text-ink"><span className="font-bold">College:</span> {reg.college}</div>
                          <div className="text-sm text-ink"><span className="font-bold">Location:</span> {reg.city}, {reg.state}, {reg.country}</div>
                          <div className="text-sm text-ink"><span className="font-bold">Status:</span> {reg.role || reg.status}</div>
                        </div>
                        
                        <div className="space-y-2">
                          <div className="text-xs font-bold text-silver uppercase tracking-wider mb-3">Interests & Contact</div>
                          <div className="text-sm text-ink"><span className="font-bold">Phone:</span> {reg.phone}</div>
                          <div className="text-sm text-ink"><span className="font-bold">Referred By:</span> {reg.referredBy || 'None'}</div>
                          
                          <div className="mt-3">
                            <span className="text-xs font-bold text-silver uppercase tracking-wider">Interests:</span>
                            <div className="flex gap-2 mt-2">
                              {reg.onSiteWorkshop && <span className="px-2 py-1 bg-blue-100 text-blue-800 text-xs font-bold rounded-sm">On-site Workshop</span>}
                              {reg.demo && <span className="px-2 py-1 bg-green-100 text-green-800 text-xs font-bold rounded-sm">Demo</span>}
                              {reg.bootcamp && <span className="px-2 py-1 bg-purple-100 text-purple-800 text-xs font-bold rounded-sm">Bootcamp</span>}
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          );
        })()}

        {/* Orders Viewer */}
        {activeTab === 'orders' && (() => {
          const orders = [...(db.enquiries || [])].filter((e: any) => e.type === 'Academy Enrolment').reverse();
          const verifiedOrders = orders.filter((o: any) => o.adminStatus === 'Payment Verified' || (!o.adminStatus && o.paymentId && o.paymentId !== 'simulated'));
          const cancelledOrders = orders.filter((o: any) => o.adminStatus === 'Cancelled');
          const pendingOrders = orders.filter((o: any) => !o.adminStatus || o.adminStatus === 'Pending' || o.adminStatus === 'Simulated / Test');

          const STATUS_CONFIG: Record<string, { label: string; classes: string; dot: string }> = {
            'Payment Verified': { label: 'Payment Verified', classes: 'bg-green-100 text-green-800 border-green-200', dot: 'bg-green-500' },
            'Pending':          { label: 'Pending',          classes: 'bg-yellow-100 text-yellow-800 border-yellow-200', dot: 'bg-yellow-500' },
            'Simulated / Test': { label: 'Simulated / Test', classes: 'bg-orange-100 text-orange-800 border-orange-200', dot: 'bg-orange-400' },
            'Reviewed':         { label: 'Reviewed',         classes: 'bg-blue-100 text-blue-800 border-blue-200', dot: 'bg-blue-500' },
            'Cancelled':        { label: 'Cancelled',        classes: 'bg-red-100 text-red-800 border-red-200', dot: 'bg-red-500' },
            'Refunded':         { label: 'Refunded',         classes: 'bg-purple-100 text-purple-800 border-purple-200', dot: 'bg-purple-500' },
          };

          // Resolve course title from db.courses by programId
          const resolveCourseTitle = (d: any): string => {
            if (d.programTitle) return d.programTitle;
            if (d.programId && db.courses) {
              const course = db.courses.find((c: any) => c.id === d.programId);
              if (course) return course.title;
            }
            return d.programId || '—';
          };

          // Resolve amount to display string
          const resolveAmount = (d: any): string => {
            if (d.price) return d.price; // e.g. "INR 45,000"
            if (d.amountINR) return `₹${Number(d.amountINR).toLocaleString('en-IN')}`;
            if (d.amount && d.amount > 1000) return `₹${(d.amount / 100).toLocaleString('en-IN')}`; // paise
            if (d.amount) return `₹${Number(d.amount).toLocaleString('en-IN')}`;
            return '—';
          };

          const handleStatusChange = async (orderId: string, newStatus: string) => {
            const newDb = { ...db, enquiries: db.enquiries.map((e: any) =>
              e.id === orderId ? { ...e, adminStatus: newStatus } : e
            )};
            setDb(newDb);
            try {
              await fetch(`/api/orders/${orderId}`, {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
                body: JSON.stringify({ adminStatus: newStatus })
              });
            } catch (err) { console.error('Status update failed', err); }
          };

          return (
            <div className="space-y-6">
              {/* Stats Bar */}
              <div className="grid grid-cols-4 gap-4">
                {[
                  { label: 'Total Orders', value: orders.length, color: 'border-silver/30 text-ink' },
                  { label: 'Verified', value: verifiedOrders.length, color: 'border-green-200 text-green-600' },
                  { label: 'Pending / Test', value: pendingOrders.length, color: 'border-yellow-200 text-yellow-600' },
                  { label: 'Cancelled', value: cancelledOrders.length, color: 'border-red-200 text-red-600' },
                ].map(s => (
                  <div key={s.label} className={`bg-white border rounded-sm p-5 shadow-sm ${s.color.split(' ')[0]}`}>
                    <div className={`text-2xl font-bold font-heading ${s.color.split(' ')[1]}`}>{s.value}</div>
                    <div className={`text-xs font-bold uppercase tracking-wider mt-1 ${s.color.split(' ')[1]} opacity-80`}>{s.label}</div>
                  </div>
                ))}
              </div>

              {/* Orders Table */}
              {orders.length === 0 ? (
                <div className="bg-white border border-silver/30 rounded-sm p-16 text-center text-silver shadow-sm">
                  <CreditCard size={48} className="mx-auto mb-4 opacity-20" />
                  <p className="font-bold text-ink">No orders yet</p>
                  <p className="text-xs mt-1">Orders appear here after students complete checkout.</p>
                </div>
              ) : (
                <div className="bg-white border border-silver/20 rounded-sm shadow-sm overflow-hidden">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="bg-ink text-white">
                        <th className="px-4 py-3 text-left text-xs font-bold uppercase tracking-wider">Order / Payment ID</th>
                        <th className="px-4 py-3 text-left text-xs font-bold uppercase tracking-wider">Student</th>
                        <th className="px-4 py-3 text-left text-xs font-bold uppercase tracking-wider">Course & Track</th>
                        <th className="px-4 py-3 text-left text-xs font-bold uppercase tracking-wider">Amount</th>
                        <th className="px-4 py-3 text-left text-xs font-bold uppercase tracking-wider">Date</th>
                        <th className="px-4 py-3 text-left text-xs font-bold uppercase tracking-wider w-48">Status</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-silver/10">
                      {orders.map((enq: any, i: number) => {
                        const d = enq.details || {};
                        const isRealPayment = enq.paymentId && enq.paymentId !== 'simulated';
                        const defaultStatus = isRealPayment ? 'Payment Verified' : 'Simulated / Test';
                        const currentStatus = enq.adminStatus || defaultStatus;
                        const statusCfg = STATUS_CONFIG[currentStatus] || STATUS_CONFIG['Pending'];
                        const courseTitle = resolveCourseTitle(d);
                        const amount = resolveAmount(d);
                        const dateStr = enq.date ? new Date(enq.date).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' }) : '—';
                        const timeStr = enq.date ? new Date(enq.date).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' }) : '';

                        return (
                          <tr key={enq.id || i} className={`hover:bg-silver-light/30 transition-colors align-top ${currentStatus === 'Cancelled' ? 'opacity-60' : ''}`}>
                            {/* Order / Payment ID */}
                            <td className="px-4 py-4">
                              <div className="space-y-1">
                                <div>
                                  <span className="text-[10px] text-silver font-bold uppercase tracking-wider">Order ID</span>
                                  <div className="font-mono text-xs text-ink/70 max-w-[140px] truncate" title={enq.orderId}>
                                    {enq.orderId && enq.orderId !== 'simulated' ? enq.orderId : <span className="text-orange-400 italic">simulated</span>}
                                  </div>
                                </div>
                                <div>
                                  <span className="text-[10px] text-silver font-bold uppercase tracking-wider">Payment ID</span>
                                  <div className="font-mono text-xs max-w-[140px] truncate" title={enq.paymentId}>
                                    {isRealPayment ? <span className="text-green-700">{enq.paymentId}</span> : <span className="text-orange-400 italic">simulated</span>}
                                  </div>
                                </div>
                              </div>
                            </td>

                            {/* Student */}
                            <td className="px-4 py-4">
                              <div className="flex items-center gap-2 mb-1">
                                <div className="w-7 h-7 rounded-full bg-primary/10 text-primary text-xs font-bold flex items-center justify-center flex-shrink-0">
                                  {(d.name || '?')[0].toUpperCase()}
                                </div>
                                <span className="font-bold text-ink text-sm">{d.name || '—'}</span>
                              </div>
                              <div className="pl-9 space-y-0.5">
                                <div className="flex items-center gap-1 text-xs text-silver">
                                  <Mail size={10} /><a href={`mailto:${d.email}`} className="hover:text-primary truncate max-w-[130px]">{d.email || '—'}</a>
                                </div>
                                <div className="flex items-center gap-1 text-xs text-silver">
                                  <Phone size={10} /><span>{d.phone || '—'}</span>
                                </div>
                                <div className="flex items-center gap-1 text-xs text-silver">
                                  <MapPin size={10} /><span>{d.city || '—'}</span>
                                </div>
                              </div>
                            </td>

                            {/* Course & Track */}
                            <td className="px-4 py-4">
                              <div className="font-medium text-ink text-sm leading-snug">{courseTitle}</div>
                              {d.track && (
                                <span className="inline-block mt-1.5 px-2 py-0.5 bg-primary/10 text-primary text-xs font-bold rounded-full">{d.track}</span>
                              )}
                              {d.session && <div className="mt-1.5 text-xs text-ink/70 flex items-center gap-1"><Calendar size={11} className="text-primary" /> {d.session}</div>}
                            </td>

                            {/* Amount */}
                            <td className="px-4 py-4">
                              <span className="font-bold text-ink text-base">{amount}</span>
                            </td>

                            {/* Date */}
                            <td className="px-4 py-4">
                              <div className="text-sm font-medium text-ink">{dateStr}</div>
                              <div className="text-xs text-silver">{timeStr}</div>
                            </td>

                            {/* Status — editable */}
                            <td className="px-4 py-4">
                              <div className="space-y-2">
                                <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 text-xs font-bold rounded-full border ${statusCfg.classes}`}>
                                  <span className={`w-1.5 h-1.5 rounded-full ${statusCfg.dot} flex-shrink-0`}></span>
                                  {statusCfg.label}
                                </span>
                                <select
                                  value={currentStatus}
                                  onChange={(e) => handleStatusChange(enq.id, e.target.value)}
                                  className="w-full px-2 py-1.5 border border-silver/30 rounded-sm text-xs text-ink bg-white focus:outline-none focus:border-primary cursor-pointer hover:border-primary/50 transition-colors"
                                >
                                  <option value="Payment Verified">✅ Payment Verified</option>
                                  <option value="Pending">⏳ Pending</option>
                                  <option value="Simulated / Test">🧪 Simulated / Test</option>
                                  <option value="Reviewed">🔍 Reviewed</option>
                                  <option value="Cancelled">❌ Cancelled</option>
                                  <option value="Refunded">↩️ Refunded</option>
                                </select>
                              </div>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          );
        })()}

        {/* Invoices Viewer */}
        {activeTab === 'invoices' && (() => {
          const invoices = [...(db.invoices || [])].reverse();
          const paid = invoices.filter((invoice: any) => invoice.status === 'Paid');
          const unpaid = invoices.filter((invoice: any) => invoice.status !== 'Paid');
          return (
            <div className="space-y-6">
              <div className="grid grid-cols-3 gap-4">
                {[
                  { label: 'Total Invoices', value: invoices.length, color: 'border-silver/30 text-ink' },
                  { label: 'Paid', value: paid.length, color: 'border-green-200 text-green-600' },
                  { label: 'Unpaid', value: unpaid.length, color: 'border-yellow-200 text-yellow-600' },
                ].map(stat => (
                  <div key={stat.label} className={`bg-white border rounded-sm p-5 shadow-sm ${stat.color.split(' ')[0]}`}>
                    <div className={`text-2xl font-bold font-heading ${stat.color.split(' ')[1]}`}>{stat.value}</div>
                    <div className={`text-xs font-bold uppercase tracking-wider mt-1 ${stat.color.split(' ')[1]} opacity-80`}>{stat.label}</div>
                  </div>
                ))}
              </div>

              {invoices.length === 0 ? (
                <div className="bg-white border border-silver/30 rounded-sm p-16 text-center text-silver shadow-sm">
                  <FileText size={48} className="mx-auto mb-4 opacity-30" />
                  <p className="font-medium">No invoices created yet.</p>
                </div>
              ) : (
                <div className="bg-white border border-silver/20 rounded-sm shadow-sm overflow-hidden">
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                      <thead className="bg-silver-light/30 border-b border-silver/20">
                        <tr>
                          <th className="text-left px-5 py-4 font-bold">Invoice</th>
                          <th className="text-left px-5 py-4 font-bold">Customer</th>
                          <th className="text-left px-5 py-4 font-bold">Order</th>
                          <th className="text-left px-5 py-4 font-bold">Amount</th>
                          <th className="text-left px-5 py-4 font-bold">Status</th>
                          <th className="text-left px-5 py-4 font-bold">Created</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-silver/10">
                        {invoices.map((invoice: any) => (
                          <tr key={invoice.id} className="hover:bg-silver-light/20">
                            <td className="px-5 py-4 font-mono font-bold text-primary">{invoice.invoiceNumber || invoice.id}</td>
                            <td className="px-5 py-4">
                              <div className="font-bold text-ink">{invoice.customer?.name || '—'}</div>
                              <div className="text-xs text-silver">{invoice.customer?.email || '—'}</div>
                              {invoice.customer?.session && <div className="text-xs text-ink/70 mt-1">Session: {invoice.customer.session}</div>}
                            </td>
                            <td className="px-5 py-4 font-mono text-xs text-ink/70">{invoice.orderId || '—'}</td>
                            <td className="px-5 py-4 font-bold">₹{Number(invoice.amountINR || 0).toLocaleString('en-IN')}</td>
                            <td className="px-5 py-4">
                              <span className={`inline-flex items-center gap-2 px-3 py-1 rounded-full border text-xs font-bold ${invoice.status === 'Paid' ? 'bg-green-100 text-green-800 border-green-200' : 'bg-yellow-100 text-yellow-800 border-yellow-200'}`}>
                                <span className={`w-2 h-2 rounded-full ${invoice.status === 'Paid' ? 'bg-green-500' : 'bg-yellow-500'}`}></span>
                                {invoice.status || 'Unpaid'}
                              </span>
                              <button onClick={() => handleInvoiceDownload(invoice)} className="block mt-2 text-xs font-bold text-primary hover:text-primary-dark">
                                Download PDF
                              </button>
                            </td>
                            <td className="px-5 py-4 text-xs text-silver">{invoice.createdAt ? new Date(invoice.createdAt).toLocaleString('en-IN') : '—'}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}
            </div>
          );
        })()}


        {/* Settings */}
        {activeTab === 'settings' && (
          <div className="bg-white p-8 rounded-sm shadow-sm border border-silver/30 max-w-2xl">
            <h3 className="text-xl font-bold font-heading mb-6 border-b border-silver/20 pb-4">Payment Gateway Configuration</h3>
            <p className="text-sm text-ink/70 mb-6">Connect your enterprise payment processor. This gateway is used to securely process Academy enrolments.</p>
            
            <div className="space-y-5">
              <div>
                <label className="block text-sm font-bold text-ink mb-2">Provider</label>
                <select 
                  value={db.settings?.paymentGateway?.provider || 'Stripe'}
                  onChange={e => { const newDb = {...db}; newDb.settings.paymentGateway.provider = e.target.value; setDb(newDb); }}
                  className="w-full p-3 bg-silver-light/30 border border-silver/30 rounded-sm text-sm focus:outline-none focus:border-primary shadow-inner"
                >
                  <option value="Stripe">Stripe (Enterprise)</option>
                  <option value="Razorpay">Razorpay</option>
                  <option value="PayPal">PayPal Business</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-bold text-ink mb-2">Public API Key</label>
                <input 
                  type="text" 
                  value={db.settings?.paymentGateway?.publicKey || ''}
                  onChange={e => { const newDb = {...db}; newDb.settings.paymentGateway.publicKey = e.target.value; setDb(newDb); }}
                  placeholder="pk_live_..."
                  className="w-full p-3 bg-silver-light/30 border border-silver/30 rounded-sm text-sm focus:outline-none focus:border-primary shadow-inner font-mono" 
                />
              </div>
              <div className="pt-4 border-t border-silver/20">
                <p className="text-xs text-silver flex items-start gap-2">
                  <ShieldAlert size={16} className="text-yellow-500 flex-shrink-0" />
                  Note: The Secret API Key should never be stored in the CMS. It must be provided via the server environment variables (e.g. STRIPE_SECRET_KEY) for secure server-side validation.
                </p>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

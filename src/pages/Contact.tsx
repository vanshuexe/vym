import React, { useState, useEffect } from 'react';
import { AnimatedSection } from '../components/ui/AnimatedSection';
import { SEO } from '../components/SEO';
import { useLocation } from 'react-router-dom';
import { Button } from '../components/ui/Button';
import { Mail, MapPin, Phone, ShieldCheck, CheckCircle2, User, Building, MessageSquare, Lock, Database, Globe, AlertCircle, Send, Check } from 'lucide-react';

export function Contact() {
  const location = useLocation();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);

  const [formData, setFormData] = useState({
    name: '',
    email: '',
    company: '',
    phone: '',
    interest: 'General inquiry',
    message: '',
    consent: false,
    honeypot: '' // Invisible field for spam bots
  });

  const [formErrors, setFormErrors] = useState<Record<string, string>>({});

  // Pre-select interest from URL param
  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const interestParam = params.get('interest');
    
    if (interestParam) {
      const mapping: Record<string, string> = {
        'quality': 'AI Quality & Assurance',
        'managed': 'Managed AI Services',
        'platform': 'Platform',
        'academy': 'Academy',
        'general': 'General inquiry'
      };
      
      if (mapping[interestParam.toLowerCase()]) {
        setFormData(prev => ({ ...prev, interest: mapping[interestParam.toLowerCase()] }));
      }
    }
  }, [location]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? (e.target as HTMLInputElement).checked : value
    }));
    // Clear error when user types
    if (formErrors[name]) {
      setFormErrors(prev => ({ ...prev, [name]: '' }));
    }
  };

  const validateForm = () => {
    const errors: Record<string, string> = {};
    if (!formData.name.trim()) errors.name = 'Full name is required';
    if (!formData.email.trim()) {
      errors.email = 'Work email is required';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      errors.email = 'Please enter a valid email address';
    }
    if (!formData.phone.trim()) errors.phone = 'Phone number is required';
    if (!formData.message.trim()) errors.message = 'Please provide a detailed message';
    if (!formData.consent) errors.consent = 'You must agree to the privacy policy';

    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) {
      // Scroll to first error roughly
      const firstError = document.querySelector('.text-red-500');
      if (firstError) firstError.scrollIntoView({ behavior: 'smooth', block: 'center' });
      return;
    }

    // Silent honeypot check - if filled, silently succeed to fool the bot
    if (formData.honeypot) {
      console.warn("Bot detected via honeypot. Discarding silently.");
      setIsSuccess(true);
      window.scrollTo({ top: 0, behavior: 'smooth' });
      return;
    }

    setIsSubmitting(true);
    
    try {
      const response = await fetch('/api/contact', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      });
      if (!response.ok) {
        const data = await response.json().catch(() => ({}));
        throw new Error(data.error || 'Failed to send inquiry.');
      }
      setIsSuccess(true);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    } catch (err) {
      alert(`${err instanceof Error ? err.message : 'Failed to send inquiry.'} Please try again or email us directly.`);
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isSuccess) {
    return (
      <div className="w-full bg-silver-light min-h-[calc(100vh-80px)] py-24 flex items-center justify-center">
        <div className="max-w-2xl w-full px-6">
          <AnimatedSection className="bg-white p-10 md:p-16 rounded-sm shadow-xl border border-silver/20 text-center relative overflow-hidden">
            <div className="absolute top-0 right-0 w-64 h-64 bg-green-500/10 rounded-full blur-3xl -z-10"></div>
            <div className="w-20 h-20 bg-green-500 rounded-full flex items-center justify-center mx-auto mb-8 shadow-lg shadow-green-500/20 text-white">
              <Check size={40} strokeWidth={3} />
            </div>
            <h2 className="text-3xl font-bold mb-4 text-ink font-heading">Secure Inquiry Received</h2>
            <p className="text-lg text-ink/70 mb-10 leading-relaxed max-w-lg mx-auto">
              Thank you for contacting Vyomatrix. Your inquiry regarding <strong className="text-primary">{formData.interest}</strong> has been successfully captured and routed to the appropriate engineering or advisory inbox.
            </p>
            
            <div className="bg-silver-light/50 border border-silver/20 rounded-sm p-8 mb-10 text-left shadow-sm">
              <h3 className="font-bold text-ink mb-6 text-lg border-b border-silver/20 pb-4">What happens next?</h3>
              
              <div className="space-y-8">
                <div className="flex items-start gap-4 relative">
                  <div className="absolute left-6 top-10 w-0.5 h-14 bg-silver/30"></div>
                  <div className="w-12 h-12 bg-white border border-silver/30 rounded-full flex items-center justify-center shadow-sm flex-shrink-0 z-10">
                    <Mail className="text-primary" size={20} />
                  </div>
                  <div>
                    <h4 className="font-bold text-ink mb-1 text-base">1. Automated Email Confirmation</h4>
                    <p className="text-sm text-ink/70 leading-relaxed">
                      An immediate acknowledgement receipt has been dispatched to <strong>{formData.email}</strong>. Please check your spam folder if you do not see it within a few minutes.
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-4 relative">
                  <div className="absolute left-6 top-10 w-0.5 h-14 bg-silver/30"></div>
                  <div className="w-12 h-12 bg-white border border-silver/30 rounded-full flex items-center justify-center shadow-sm flex-shrink-0 z-10">
                    <Database className="text-primary" size={20} />
                  </div>
                  <div>
                    <h4 className="font-bold text-ink mb-1 text-base">2. Backup Record Initialized</h4>
                    <p className="text-sm text-ink/70 leading-relaxed">
                      Your inquiry has been safely backed up and indexed in our secure CRM. This ensures no data is lost even if email delivery fails.
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-4">
                  <div className="w-12 h-12 bg-white border border-silver/30 rounded-full flex items-center justify-center shadow-sm flex-shrink-0 z-10">
                    <User className="text-primary" size={20} />
                  </div>
                  <div>
                    <h4 className="font-bold text-ink mb-1 text-base">3. Route & Respond</h4>
                    <p className="text-sm text-ink/70 leading-relaxed">
                      The assigned specialist for the {formData.interest} team will review your message and reach out with the next steps shortly.
                    </p>
                  </div>
                </div>
              </div>
            </div>

            <Button to="/" variant="primary" className="px-10 py-4 font-bold shadow-lg shadow-primary/20">
              Return to Homepage
            </Button>
          </AnimatedSection>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full bg-silver-light min-h-[calc(100vh-80px)] py-16 md:py-24 relative overflow-hidden">
      <SEO 
        title="Contact Vyomatrix" 
        description="Get in touch with Vyomatrix to deploy AI you can trust. Discuss AI quality, managed services, or our enterprise governance platform." 
        canonical="/contact" 
      />
      <div className="absolute top-0 right-0 w-[800px] h-[800px] bg-primary/5 rounded-full blur-[100px] pointer-events-none -translate-y-1/2 translate-x-1/3"></div>
      
      <div className="max-w-7xl mx-auto px-6 relative z-10">
        <AnimatedSection className="mb-16 text-center max-w-3xl mx-auto">
          <div className="font-mono text-xs font-bold tracking-widest text-primary mb-6 uppercase flex items-center justify-center gap-2">
            <MessageSquare size={16} /> Contact & Inquiries
          </div>
          <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold text-ink mb-6 font-heading leading-tight">
            Partner with Vyomatrix
          </h1>
          <p className="text-lg md:text-xl text-ink/80 leading-relaxed font-light">
            Whether you require deep-dive AI compliance audits, continuous model red-teaming, or enterprise training for your engineering teams, our specialists are ready to architect a solution.
          </p>
        </AnimatedSection>

        <AnimatedSection>
          <div className="grid lg:grid-cols-3 gap-8 lg:gap-12">
            {/* Contact Info Sidebar */}
            <div className="lg:col-span-1 space-y-8">
              <div className="bg-white border border-silver/20 rounded-sm shadow-md p-8 md:p-10 space-y-8 h-full relative overflow-hidden group">
                <div className="absolute top-0 left-0 w-1 h-full bg-primary transform origin-bottom scale-y-0 group-hover:scale-y-100 transition-transform duration-500"></div>
                <h3 className="text-2xl font-bold text-ink mb-2 font-heading border-b border-silver/10 pb-6">Global Reach, Local Expertise</h3>
                
                <div className="space-y-8 pt-4">
                  <div className="flex items-start gap-5">
                    <div className="w-14 h-14 bg-primary/5 border border-primary/10 rounded-sm flex items-center justify-center flex-shrink-0 shadow-sm text-primary">
                      <Mail size={24} strokeWidth={1.5} />
                    </div>
                    <div>
                      <h4 className="font-bold text-ink mb-1 uppercase text-xs tracking-wider font-mono">Enterprise Sales & Support</h4>
                      <a href="mailto:hello@vyomatrix.ai" className="text-base text-ink hover:text-primary transition-colors font-medium">hello@vyomatrix.ai</a>
                      <p className="text-sm text-ink/60 mt-1">Average response time: 4 hours</p>
                    </div>
                  </div>
                  
                  <div className="flex items-start gap-5">
                    <div className="w-14 h-14 bg-primary/5 border border-primary/10 rounded-sm flex items-center justify-center flex-shrink-0 shadow-sm text-primary">
                      <Globe size={24} strokeWidth={1.5} />
                    </div>
                    <div>
                      <h4 className="font-bold text-ink mb-1 uppercase text-xs tracking-wider font-mono">APAC Headquarters</h4>
                      <p className="text-base text-ink font-medium">Kuala Lumpur, Malaysia</p>
                      <p className="text-sm text-ink/60 mt-1">Serving Southeast Asia & Oceania</p>
                    </div>
                  </div>
                  
                  <div className="flex items-start gap-5">
                    <div className="w-14 h-14 bg-primary/5 border border-primary/10 rounded-sm flex items-center justify-center flex-shrink-0 shadow-sm text-primary">
                      <MapPin size={24} strokeWidth={1.5} />
                    </div>
                    <div>
                      <h4 className="font-bold text-ink mb-1 uppercase text-xs tracking-wider font-mono">Engineering & Academy Hub</h4>
                      <p className="text-base text-ink font-medium">Hyderabad, India</p>
                      <p className="text-sm text-ink/60 mt-1">R&D and Technical Training Center</p>
                    </div>
                  </div>
                </div>

                <div className="mt-10 pt-8 border-t border-silver/10">
                  <div className="flex items-start gap-4 text-sm text-ink/70 bg-silver-light/30 p-5 rounded-sm border border-silver/20">
                    <ShieldCheck size={28} className="text-primary flex-shrink-0 mt-0.5" strokeWidth={1.5} />
                    <span className="leading-relaxed">Your data is strictly confidential. We adhere to enterprise-grade SOC2 and GDPR compliance standards.</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Form */}
            <div className="lg:col-span-2 bg-white border border-silver/20 rounded-sm shadow-xl p-8 md:p-12 relative overflow-hidden">
              <div className="mb-8 border-b border-silver/10 pb-6">
                <h2 className="text-3xl font-bold text-ink font-heading mb-3">Submit an Inquiry</h2>
                <p className="text-base text-ink/70">Fill out the secure form below. We route inquiries directly to the relevant internal department. Fields marked with (*) are required.</p>
              </div>

              <form onSubmit={handleSubmit} className="space-y-8" noValidate>
                {/* Honeypot Field */}
                <div style={{ position: 'absolute', left: '-5000px' }} aria-hidden="true">
                  <label htmlFor="honeypot">Website URL</label>
                  <input type="text" id="honeypot" name="honeypot" tabIndex={-1} autoComplete="off" value={formData.honeypot} onChange={handleChange} />
                </div>

                <div className="grid md:grid-cols-2 gap-8">
                  <div className="md:col-span-1 space-y-2">
                    <label htmlFor="name" className="block text-sm font-bold text-ink mb-2 flex items-center gap-2">
                      <User size={16} className="text-primary" /> Full name *
                    </label>
                    <input 
                      id="name"
                      required
                      type="text" 
                      value={formData.name}
                      onChange={(e) => {
                        setFormData({...formData, name: e.target.value});
                        if (formErrors.name) setFormErrors({...formErrors, name: ''});
                      }}
                      className={`w-full px-5 py-4 bg-silver-light/20 border ${formErrors.name ? 'border-red-500 bg-red-50' : 'border-silver/30'} rounded-sm text-base focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary focus:bg-white transition-all shadow-inner`}
                      placeholder="John Doe"
                    />
                    {formErrors.name && <p className="text-red-500 text-xs mt-2 flex items-center gap-1"><AlertCircle size={12} /> {formErrors.name}</p>}
                  </div>
                  
                  <div className="md:col-span-1 space-y-2">
                    <label htmlFor="email" className="block text-sm font-bold text-ink mb-2 flex items-center gap-2">
                      <Mail size={16} className="text-primary" /> Work email *
                    </label>
                    <input 
                      id="email"
                      required
                      type="email" 
                      value={formData.email}
                      onChange={(e) => {
                        setFormData({...formData, email: e.target.value});
                        if (formErrors.email) setFormErrors({...formErrors, email: ''});
                      }}
                      className={`w-full px-5 py-4 bg-silver-light/20 border ${formErrors.email ? 'border-red-500 bg-red-50' : 'border-silver/30'} rounded-sm text-base focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary focus:bg-white transition-all shadow-inner`}
                      placeholder="john@company.com"
                    />
                    {formErrors.email && <p className="text-red-500 text-xs mt-2 flex items-center gap-1"><AlertCircle size={12} /> {formErrors.email}</p>}
                  </div>
                </div>

                <div className="grid md:grid-cols-2 gap-8">
                  <div>
                    <label htmlFor="company" className="block text-sm font-bold text-ink mb-2 flex items-center gap-2">
                      <Building size={16} className="text-primary" /> Company / Organization
                    </label>
                    <input
                      type="text"
                      id="company"
                      name="company"
                      placeholder="Organization name"
                      value={formData.company}
                      onChange={handleChange}
                      className="w-full px-5 py-4 bg-silver-light/20 border border-silver/30 rounded-sm text-base focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary focus:bg-white transition-all shadow-inner"
                    />
                  </div>
                  <div>
                    <label htmlFor="phone" className="block text-sm font-bold text-ink mb-2 flex items-center gap-2">
                      <Phone size={16} className="text-primary" /> Phone / WhatsApp *
                    </label>
                    <input
                      type="tel"
                      id="phone"
                      name="phone"
                      placeholder="+Country Code"
                      value={formData.phone}
                      onChange={handleChange}
                      className={`w-full px-5 py-4 bg-silver-light/20 border ${formErrors.phone ? 'border-red-500 bg-red-50' : 'border-silver/30'} rounded-sm text-base focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary focus:bg-white transition-all shadow-inner`}
                    />
                    {formErrors.phone && <p className="text-red-500 text-xs mt-2 flex items-center gap-1"><AlertCircle size={12} /> {formErrors.phone}</p>}
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-bold text-ink mb-4 border-t border-silver/10 pt-8">Primary area of interest *</label>
                  <div className="grid sm:grid-cols-2 md:grid-cols-3 gap-4">
                    {['AI Quality & Assurance', 'Managed AI Services', 'Platform', 'Academy', 'General inquiry'].map((option) => (
                      <label 
                        key={option} 
                        className={`flex items-center gap-3 p-4 border rounded-sm cursor-pointer transition-all ${
                          formData.interest === option 
                            ? 'border-primary bg-primary/5 shadow-md shadow-primary/5 text-primary font-bold' 
                            : 'border-silver/30 bg-white hover:border-primary/50 text-ink/80 hover:bg-silver-light/50'
                        }`}
                      >
                        <input 
                          type="radio" 
                          name="interest" 
                          value={option} 
                          checked={formData.interest === option}
                          onChange={handleChange}
                          className="w-5 h-5 text-primary border-silver/30 focus:ring-primary flex-shrink-0"
                        />
                        <span className="text-sm leading-tight">{option}</span>
                      </label>
                    ))}
                  </div>
                </div>

                <div>
                  <div className="space-y-2">
                    <label htmlFor="message" className="block text-sm font-bold text-ink flex items-center justify-between">
                      Message *
                      {formErrors.message && <span className="text-red-500 text-xs font-normal flex items-center gap-1"><AlertCircle size={12}/> Required</span>}
                    </label>
                    <textarea 
                      id="message"
                      required
                      rows={4}
                      value={formData.message}
                      onChange={(e) => {
                        setFormData({...formData, message: e.target.value});
                        if (formErrors.message) setFormErrors({...formErrors, message: ''});
                      }}
                      className={`w-full px-5 py-4 bg-silver-light/20 border ${formErrors.message ? 'border-red-500 bg-red-50' : 'border-silver/30'} rounded-sm text-base focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary focus:bg-white transition-all resize-y shadow-inner`}
                      placeholder="How can we help?"
                    ></textarea>
                  </div>
                  {formErrors.message && <p className="text-red-500 text-xs mt-2 flex items-center gap-1"><AlertCircle size={12} /> {formErrors.message}</p>}
                </div>

                <div className={`bg-silver-light/30 border ${formErrors.consent ? 'border-red-500' : 'border-silver/20'} p-6 rounded-sm shadow-sm`}>
                  <div className="flex items-start gap-4 mb-5 pb-5 border-b border-silver/10">
                    <Lock size={24} className="text-primary flex-shrink-0 mt-0.5" />
                    <div>
                      <h5 className="text-base font-bold text-ink mb-1">Spam Protection & Validation</h5>
                      <p className="text-sm text-ink/70 leading-relaxed">This form utilizes invisible honeypot challenge and server-side verification algorithms to prevent automated spam and protect systems.</p>
                    </div>
                  </div>
                  
                  <label className="flex items-start gap-4 cursor-pointer group">
                    <div className="relative flex items-center justify-center mt-1">
                      <input
                        type="checkbox"
                        name="consent"
                        checked={formData.consent}
                        onChange={handleChange}
                        className="peer w-5 h-5 text-primary border-silver/40 rounded-sm focus:ring-primary focus:ring-offset-1 cursor-pointer transition-colors"
                      />
                    </div>
                    <span className="text-sm text-ink/80 leading-relaxed">
                      I explicitly consent to Vyomatrix processing this data to contact me regarding my inquiry. I acknowledge and agree to the <a href="#" className="text-primary hover:underline font-bold">Privacy Policy</a> and <a href="#" className="text-primary hover:underline font-bold">Terms of Service</a>. *
                      {formErrors.consent && <span className="block text-red-500 text-xs mt-2 flex items-center gap-1 font-medium"><AlertCircle size={12} /> {formErrors.consent}</span>}
                    </span>
                  </label>
                </div>

                <div className="pt-4">
                  <button
                    type="submit"
                    disabled={isSubmitting}
                    className="w-full py-5 bg-primary text-white rounded-sm font-bold hover:bg-primary-dark transition-all disabled:opacity-70 disabled:cursor-not-allowed flex items-center justify-center gap-3 shadow-xl shadow-primary/20 text-lg group"
                  >
                    {isSubmitting ? (
                      <>
                        <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                        </svg>
                        Transmitting Data securely...
                      </>
                    ) : (
                      <>Submit Secure Inquiry <Send size={20} className="group-hover:translate-x-1 group-hover:-translate-y-1 transition-transform" /></>
                    )}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </AnimatedSection>
      </div>
    </div>
  );
}

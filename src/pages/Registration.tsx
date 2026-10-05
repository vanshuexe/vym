import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { AnimatedSection } from '../components/ui/AnimatedSection';
import { SEO } from '../components/SEO';
import { Button } from '../components/ui/Button';
import { 
  Mail, MapPin, Phone, User, Building, Globe, 
  GraduationCap, Users, AlertCircle, Send, Check 
} from 'lucide-react';

export function Registration() {
  const navigate = useNavigate();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);

  const [formData, setFormData] = useState({
    name: '',
    education: '',
    college: '',
    city: '',
    state: '',
    country: '',
    role: 'Student', // Student or Employee
    onSiteWorkshop: false,
    demo: false,
    bootcamp: false,
    referredBy: '',
    phone: '',
    email: '',
    honeypot: ''
  });

  const [formErrors, setFormErrors] = useState<Record<string, string>>({});

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
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
    if (!formData.name.trim()) errors.name = 'Name is required';
    if (!formData.email.trim()) {
      errors.email = 'Email is required';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      errors.email = 'Please enter a valid email address';
    }
    if (!formData.phone.trim()) errors.phone = 'Phone number is required';
    if (!formData.college.trim()) errors.college = 'College/Organization is required';
    if (!formData.city.trim()) errors.city = 'City is required';

    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) {
      alert('Please fill out all required fields marked with *');
      const firstError = document.querySelector('.text-red-500');
      if (firstError) firstError.scrollIntoView({ behavior: 'smooth', block: 'center' });
      return;
    }

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
        body: JSON.stringify({ ...formData, type: 'Registration' })
      });

      if (!response.ok) {
        throw new Error('Registration could not be saved');
      }
      
      if (formData.onSiteWorkshop) {
        sessionStorage.setItem('vyomatrix_checkout_details', JSON.stringify({
          name: formData.name,
          email: formData.email,
          phone: formData.phone,
          address: [formData.city, formData.state, formData.country].filter(Boolean).join(', '),
          city: formData.city,
          organization: formData.college,
          track: 'Business track'
        }));
        navigate('/checkout?program=one-day');
      } else {
        setIsSuccess(true);
        window.scrollTo({ top: 0, behavior: 'smooth' });
      }
    } catch (err) {
      alert('Failed to submit registration. Please try again.');
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
            <h2 className="text-3xl font-bold mb-4 text-ink font-heading">Registration Done</h2>
            <p className="text-lg text-ink/70 mb-10 leading-relaxed max-w-lg mx-auto">
              We will contact with you as soon possible.
            </p>
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
        title="Student Registration | Vyomatrix" 
        description="Register for Vyomatrix academy, bootcamps, workshops and demos." 
        canonical="/register" 
      />
      <div className="absolute top-0 right-0 w-[800px] h-[800px] bg-primary/5 rounded-full blur-[100px] pointer-events-none -translate-y-1/2 translate-x-1/3"></div>
      
      <div className="max-w-4xl mx-auto px-6 relative z-10">
        <AnimatedSection className="mb-12 text-center max-w-3xl mx-auto">
          <div className="font-mono text-xs font-bold tracking-widest text-primary mb-6 uppercase flex items-center justify-center gap-2">
            <GraduationCap size={16} /> Academy
          </div>
          <h1 className="text-4xl md:text-5xl font-bold text-ink mb-6 font-heading leading-tight">
            Registration Form
          </h1>
          <p className="text-lg text-ink/80 leading-relaxed font-light">
            Join our workshops, bootcamps, and demos by filling out your details below.
          </p>
        </AnimatedSection>

        <AnimatedSection>
          <div className="bg-white border border-silver/20 rounded-sm shadow-xl p-8 md:p-12 relative overflow-hidden">
            <form onSubmit={handleSubmit} className="space-y-8" noValidate>
              {/* Honeypot Field */}
              <div style={{ position: 'absolute', left: '-5000px' }} aria-hidden="true">
                <label htmlFor="honeypot">Website URL</label>
                <input type="text" id="honeypot" name="honeypot" tabIndex={-1} autoComplete="off" value={formData.honeypot} onChange={handleChange} />
              </div>

              {/* Personal Details */}
              <div className="space-y-6">
                <h3 className="text-xl font-bold text-ink font-heading border-b border-silver/10 pb-4">Personal Details</h3>
                
                <div className="grid md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <label htmlFor="name" className="block text-sm font-bold text-ink mb-2 flex items-center gap-2">
                      <User size={16} className="text-primary" /> Full Name *
                    </label>
                    <input 
                      id="name"
                      name="name"
                      required
                      type="text" 
                      value={formData.name}
                      onChange={handleChange}
                      className={`w-full px-4 py-3 bg-silver-light/20 border ${formErrors.name ? 'border-red-500 bg-red-50' : 'border-silver/30'} rounded-sm text-base focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary focus:bg-white transition-all shadow-inner`}
                      placeholder="John Doe"
                    />
                    {formErrors.name && <p className="text-red-500 text-xs mt-1 flex items-center gap-1"><AlertCircle size={12} /> {formErrors.name}</p>}
                  </div>
                  
                  <div className="space-y-2">
                    <label htmlFor="education" className="block text-sm font-bold text-ink mb-2 flex items-center gap-2">
                      <GraduationCap size={16} className="text-primary" /> Education
                    </label>
                    <input 
                      id="education"
                      name="education"
                      type="text" 
                      value={formData.education}
                      onChange={handleChange}
                      className="w-full px-4 py-3 bg-silver-light/20 border border-silver/30 rounded-sm text-base focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary focus:bg-white transition-all shadow-inner"
                      placeholder="B.Tech, M.Sc, etc."
                    />
                  </div>
                </div>

                <div className="grid md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <label htmlFor="college" className="block text-sm font-bold text-ink mb-2 flex items-center gap-2">
                      <Building size={16} className="text-primary" /> College / Organization *
                    </label>
                    <input 
                      id="college"
                      name="college"
                      required
                      type="text" 
                      value={formData.college}
                      onChange={handleChange}
                      className={`w-full px-4 py-3 bg-silver-light/20 border ${formErrors.college ? 'border-red-500 bg-red-50' : 'border-silver/30'} rounded-sm text-base focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary focus:bg-white transition-all shadow-inner`}
                      placeholder="University Name"
                    />
                    {formErrors.college && <p className="text-red-500 text-xs mt-1 flex items-center gap-1"><AlertCircle size={12} /> {formErrors.college}</p>}
                  </div>

                  <div className="space-y-2">
                    <label className="block text-sm font-bold text-ink mb-2">Current Status *</label>
                    <div className="flex gap-4">
                      {['Student', 'Employee'].map((option) => (
                        <label 
                          key={option} 
                          className={`flex-1 flex items-center justify-center gap-2 p-3 border rounded-sm cursor-pointer transition-all ${
                            formData.role === option 
                              ? 'border-primary bg-primary/5 text-primary font-bold shadow-sm' 
                              : 'border-silver/30 bg-white hover:border-primary/50 text-ink/80'
                          }`}
                        >
                          <input 
                            type="radio" 
                            name="role" 
                            value={option} 
                            checked={formData.role === option}
                            onChange={handleChange}
                            className="w-4 h-4 text-primary border-silver/30 focus:ring-primary"
                          />
                          <span className="text-sm">{option}</span>
                        </label>
                      ))}
                    </div>
                  </div>
                </div>
              </div>

              {/* Location Details */}
              <div className="space-y-6">
                <h3 className="text-xl font-bold text-ink font-heading border-b border-silver/10 pb-4">Location</h3>
                
                <div className="grid md:grid-cols-3 gap-6">
                  <div className="space-y-2">
                    <label htmlFor="city" className="block text-sm font-bold text-ink mb-2 flex items-center gap-2">
                      <MapPin size={16} className="text-primary" /> City / Town *
                    </label>
                    <input 
                      id="city"
                      name="city"
                      required
                      type="text" 
                      value={formData.city}
                      onChange={handleChange}
                      className={`w-full px-4 py-3 bg-silver-light/20 border ${formErrors.city ? 'border-red-500 bg-red-50' : 'border-silver/30'} rounded-sm text-base focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary focus:bg-white transition-all shadow-inner`}
                      placeholder="City"
                    />
                    {formErrors.city && <p className="text-red-500 text-xs mt-1 flex items-center gap-1"><AlertCircle size={12} /> {formErrors.city}</p>}
                  </div>
                  
                  <div className="space-y-2">
                    <label htmlFor="state" className="block text-sm font-bold text-ink mb-2 flex items-center gap-2">
                      State
                    </label>
                    <input 
                      id="state"
                      name="state"
                      type="text" 
                      value={formData.state}
                      onChange={handleChange}
                      className="w-full px-4 py-3 bg-silver-light/20 border border-silver/30 rounded-sm text-base focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary focus:bg-white transition-all shadow-inner"
                      placeholder="State"
                    />
                  </div>

                  <div className="space-y-2">
                    <label htmlFor="country" className="block text-sm font-bold text-ink mb-2 flex items-center gap-2">
                      <Globe size={16} className="text-primary" /> Country
                    </label>
                    <input 
                      id="country"
                      name="country"
                      type="text" 
                      value={formData.country}
                      onChange={handleChange}
                      className="w-full px-4 py-3 bg-silver-light/20 border border-silver/30 rounded-sm text-base focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary focus:bg-white transition-all shadow-inner"
                      placeholder="Country"
                    />
                  </div>
                </div>
              </div>

              {/* Interests & Referrals */}
              <div className="space-y-6">
                <h3 className="text-xl font-bold text-ink font-heading border-b border-silver/10 pb-4">Interests</h3>
                
                <div className="grid md:grid-cols-2 gap-8">
                  <div className="space-y-4">
                    <label className="block text-sm font-bold text-ink">I am interested in (Select all that apply):</label>
                    
                    <label className="flex items-center gap-3 cursor-pointer group">
                      <div className="relative flex items-center justify-center">
                        <input
                          type="checkbox"
                          name="onSiteWorkshop"
                          checked={formData.onSiteWorkshop}
                          onChange={handleChange}
                          className="peer w-5 h-5 text-primary border-silver/40 rounded-sm focus:ring-primary focus:ring-offset-1 cursor-pointer transition-colors"
                        />
                      </div>
                      <span className="text-base text-ink/80 group-hover:text-ink transition-colors">
                        On-site workshop <span className="text-sm text-primary font-semibold">(₹2,499 · pay online)</span>
                      </span>
                    </label>

                    <label className="flex items-center gap-3 cursor-pointer group">
                      <div className="relative flex items-center justify-center">
                        <input
                          type="checkbox"
                          name="demo"
                          checked={formData.demo}
                          onChange={handleChange}
                          className="peer w-5 h-5 text-primary border-silver/40 rounded-sm focus:ring-primary focus:ring-offset-1 cursor-pointer transition-colors"
                        />
                      </div>
                      <span className="text-base text-ink/80 group-hover:text-ink transition-colors">Demo</span>
                    </label>

                    <label className="flex items-center gap-3 cursor-pointer group">
                      <div className="relative flex items-center justify-center">
                        <input
                          type="checkbox"
                          name="bootcamp"
                          checked={formData.bootcamp}
                          onChange={handleChange}
                          className="peer w-5 h-5 text-primary border-silver/40 rounded-sm focus:ring-primary focus:ring-offset-1 cursor-pointer transition-colors"
                        />
                      </div>
                      <span className="text-base text-ink/80 group-hover:text-ink transition-colors">Boot camp</span>
                    </label>
                  </div>

                  <div className="space-y-2">
                    <label htmlFor="referredBy" className="block text-sm font-bold text-ink mb-2 flex items-center gap-2">
                      <Users size={16} className="text-primary" /> Referred By
                    </label>
                    <input 
                      id="referredBy"
                      name="referredBy"
                      type="text" 
                      value={formData.referredBy}
                      onChange={handleChange}
                      className="w-full px-4 py-3 bg-silver-light/20 border border-silver/30 rounded-sm text-base focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary focus:bg-white transition-all shadow-inner"
                      placeholder="Name or Source"
                    />
                  </div>
                </div>
              </div>

              {/* Contact Details */}
              <div className="space-y-6">
                <h3 className="text-xl font-bold text-ink font-heading border-b border-silver/10 pb-4">Contact Details</h3>
                
                <div className="grid md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <label htmlFor="phone" className="block text-sm font-bold text-ink mb-2 flex items-center gap-2">
                      <Phone size={16} className="text-primary" /> Phone *
                    </label>
                    <input 
                      id="phone"
                      name="phone"
                      required
                      type="tel" 
                      value={formData.phone}
                      onChange={handleChange}
                      className={`w-full px-4 py-3 bg-silver-light/20 border ${formErrors.phone ? 'border-red-500 bg-red-50' : 'border-silver/30'} rounded-sm text-base focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary focus:bg-white transition-all shadow-inner`}
                      placeholder="+Country Code and Number"
                    />
                    {formErrors.phone && <p className="text-red-500 text-xs mt-1 flex items-center gap-1"><AlertCircle size={12} /> {formErrors.phone}</p>}
                  </div>
                  
                  <div className="space-y-2">
                    <label htmlFor="email" className="block text-sm font-bold text-ink mb-2 flex items-center gap-2">
                      <Mail size={16} className="text-primary" /> Email ID *
                    </label>
                    <input 
                      id="email"
                      name="email"
                      required
                      type="email" 
                      value={formData.email}
                      onChange={handleChange}
                      className={`w-full px-4 py-3 bg-silver-light/20 border ${formErrors.email ? 'border-red-500 bg-red-50' : 'border-silver/30'} rounded-sm text-base focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary focus:bg-white transition-all shadow-inner`}
                      placeholder="you@example.com"
                    />
                    {formErrors.email && <p className="text-red-500 text-xs mt-1 flex items-center gap-1"><AlertCircle size={12} /> {formErrors.email}</p>}
                  </div>
                </div>
              </div>

              <div className="pt-6">
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
                      Submitting Registration...
                    </>
                  ) : (
                    <>{formData.onSiteWorkshop ? 'Continue to payment · ₹2,499' : 'Submit Registration'} <Send size={20} className="group-hover:translate-x-1 group-hover:-translate-y-1 transition-transform" /></>
                  )}
                </button>
              </div>
            </form>
          </div>
        </AnimatedSection>
      </div>
    </div>
  );
}

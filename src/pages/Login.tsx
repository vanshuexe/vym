import React, { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { AnimatedSection } from '../components/ui/AnimatedSection';
import { LogIn, Mail, Lock, AlertCircle } from 'lucide-react';
import { SEO } from '../components/SEO';

export function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');
  
  const navigate = useNavigate();
  const location = useLocation();
  const from = (location.state as any)?.from?.pathname || '/dashboard';

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setError('');

    try {
      const res = await fetch('/api/user/auth', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password, mode: 'login' })
      });
      const data = await res.json();

      if (res.ok) {
        localStorage.setItem('user_token', data.token);
        localStorage.setItem('user_email', data.user.email);
        
        // Dispatch a custom event so the Navbar can update
        window.dispatchEvent(new Event('auth_change'));
        
        navigate(from, { replace: true });
      } else {
        setError(data.error || 'Authentication failed');
      }
    } catch (err) {
      setError('Connection failed. Please check your internet connection.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="flex-1 bg-silver-light min-h-[calc(100vh-80px)] flex items-center justify-center p-6">
      <SEO title="Student Login" description="Access your Vyomatrix Academy courses and enrolment status." />
      
      <AnimatedSection className="w-full max-w-md">
        <div className="bg-white rounded-sm shadow-xl p-8 border border-silver/20">
          <div className="text-center mb-8">
            <div className="w-12 h-12 bg-primary/10 text-primary rounded-full flex items-center justify-center mx-auto mb-4">
              <LogIn size={24} />
            </div>
            <h1 className="text-2xl font-bold font-heading text-ink">Student Portal</h1>
            <p className="text-sm text-silver mt-2">Log in or create an account to view your courses.</p>
          </div>

          {error && (
            <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-sm flex items-start gap-3 text-red-600 text-sm">
              <AlertCircle size={16} className="mt-0.5 flex-shrink-0" />
              <span>{error}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label className="block text-sm font-bold text-ink mb-2">Email Address</label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 text-silver" size={18} />
                <input 
                  type="email" 
                  required
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  className="w-full pl-10 pr-4 py-3 bg-silver-light/30 border border-silver/30 rounded-sm focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary text-ink"
                  placeholder="you@example.com"
                />
              </div>
            </div>
            
            <div>
              <label className="block text-sm font-bold text-ink mb-2">Password</label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 text-silver" size={18} />
                <input 
                  type="password" 
                  required
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  className="w-full pl-10 pr-4 py-3 bg-silver-light/30 border border-silver/30 rounded-sm focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary text-ink"
                  placeholder="••••••••"
                />
              </div>
              <p className="text-xs text-silver mt-2">If you don't have an account, one will be created automatically.</p>
            </div>

            <button 
              type="submit" 
              disabled={isSubmitting}
              className="w-full py-3 mt-4 bg-primary text-white font-bold rounded-sm shadow-lg shadow-primary/20 hover:bg-primary-dark transition-all disabled:opacity-70 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              {isSubmitting ? 'Authenticating...' : 'Continue'}
            </button>
          </form>
        </div>
      </AnimatedSection>
    </div>
  );
}

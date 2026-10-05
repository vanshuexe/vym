import React, { useState, useEffect } from 'react';
import { Link, Outlet, useLocation, useNavigate } from 'react-router-dom';
import { Menu, X, ArrowUpRight, Linkedin, Twitter, Mail, LogIn, User } from 'lucide-react';
import { ChatWidget } from './ChatWidget';
import { NavbarLogo } from './NavbarLogo';
import { AnimatedSection } from './ui/AnimatedSection';

export function Layout() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [isAuthenticated, setIsAuthenticated] = useState(!!localStorage.getItem('user_token'));
  const location = useLocation();
  const navigate = useNavigate();

  useEffect(() => {
    const handleAuthChange = () => {
      setIsAuthenticated(!!localStorage.getItem('user_token'));
    };
    window.addEventListener('auth_change', handleAuthChange);
    return () => window.removeEventListener('auth_change', handleAuthChange);
  }, []);

  const closeMenu = () => setMobileMenuOpen(false);

  const navLinks = [
    { name: 'Home', path: '/' },
    { name: 'Services', path: '/services' },
    { name: 'Academy', path: '/academy' },
    { name: 'Media', path: '/media' },
  ];

  const isCurrentPath = (path: string) => {
    if (path === '/' && location.pathname !== '/') return false;
    return location.pathname.startsWith(path);
  };

  return (
    <div className="flex flex-col min-h-screen">
      <header className="fixed top-0 left-0 right-0 z-50 border-b border-white/8 backdrop-blur-md" style={{ background: 'rgba(0,0,0,0.6)' }}>
        <div className="max-w-7xl mx-auto px-6 h-20 flex items-center justify-between">
          <Link to="/" className="flex items-center" onClick={closeMenu} aria-label="Vyomatrix home">
            <NavbarLogo />
          </Link>

          {/* Desktop Nav */}
          <nav className="hidden md:flex items-center gap-8">
            {navLinks.map((link) => (
              <Link 
                key={link.name} 
                to={link.path} 
                className={`text-sm font-medium transition-colors hover:text-white ${isCurrentPath(link.path) ? 'text-white' : 'text-white/60'}`}
              >
                {link.name}
              </Link>
            ))}
            
            {isAuthenticated ? (
              <Link to="/dashboard" className="flex items-center gap-2 text-white/70 border border-white/20 px-5 py-2 text-sm font-bold rounded-sm hover:border-white/50 hover:text-white transition-colors">
                <User size={16} /> Dashboard
              </Link>
            ) : (
              <Link to="/login" className="flex items-center gap-2 text-white/60 hover:text-white px-3 py-2 text-sm font-medium transition-colors">
                <LogIn size={16} /> Login
              </Link>
            )}

            <Link to="/contact" className="bg-primary text-white px-5 py-2.5 text-sm font-medium rounded-sm hover:bg-primary-dark transition-colors">
              Talk to us
            </Link>
          </nav>

          {/* Mobile Menu Toggle */}
          <button 
            className="md:hidden text-white p-2 -mr-2" 
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            aria-label="Toggle menu"
          >
            {mobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
          </button>
        </div>
      </header>

      {/* Mobile Nav */}
      {mobileMenuOpen && (
        <div className="fixed inset-0 top-20 z-40 border-t border-white/10 md:hidden flex flex-col p-6" style={{ background: 'rgba(0,0,0,0.95)', backdropFilter: 'blur(12px)' }}>
          <nav className="flex flex-col gap-6 text-lg font-heading">
            {navLinks.map((link) => (
              <Link 
                key={link.name} 
                to={link.path} 
                className={`transition-colors ${isCurrentPath(link.path) ? 'text-white' : 'text-white/60'}`}
                onClick={closeMenu}
              >
                {link.name}
              </Link>
            ))}
            
            {isAuthenticated ? (
              <Link to="/dashboard" className="flex items-center gap-2 text-white/70 transition-colors" onClick={closeMenu}>
                <User size={20} /> My Dashboard
              </Link>
            ) : (
              <Link to="/login" className="flex items-center gap-2 text-white/60 transition-colors" onClick={closeMenu}>
                <LogIn size={20} /> Student Login
              </Link>
            )}

            <Link 
              to="/contact" 
              className="mt-4 flex items-center justify-center gap-2 bg-primary text-white p-4 rounded-sm"
              onClick={closeMenu}
            >
              Talk to us <ArrowUpRight size={18} />
            </Link>
          </nav>
        </div>
      )}

      <main className="flex-1 flex flex-col pt-20">
        <Outlet />
      </main>

      <footer className="bg-primary-dark text-white pt-20 pb-10 overflow-hidden">
        <AnimatedSection className="max-w-7xl mx-auto px-6">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-12 md:gap-8 mb-16">
            <div className="md:col-span-2">
              <div className="flex items-center gap-2 mb-6">
                <div className="w-8 h-8 bg-white rounded-sm flex items-center justify-center">
                  <span className="text-primary-dark font-heading font-bold text-lg">V</span>
                </div>
                <span className="font-heading font-semibold text-xl tracking-tight">Vyomatrix.ai</span>
              </div>
              <p className="text-white/70 text-sm max-w-sm mb-6">
                Trusted AI, proven and accountable. Vyomatrix helps organizations deploy AI they can stand behind, with independent quality assurance, managed delivery and a governance platform.
              </p>
              <div className="flex items-center gap-4">
                <a href="#" className="w-10 h-10 rounded-full bg-white/10 flex items-center justify-center hover:bg-primary transition-colors text-white" aria-label="LinkedIn">
                  <Linkedin size={18} />
                </a>
                <a href="#" className="w-10 h-10 rounded-full bg-white/10 flex items-center justify-center hover:bg-primary transition-colors text-white" aria-label="Twitter">
                  <Twitter size={18} />
                </a>
                <a href="mailto:hello@vyomatrix.ai" className="w-10 h-10 rounded-full bg-white/10 flex items-center justify-center hover:bg-primary transition-colors text-white" aria-label="Email">
                  <Mail size={18} />
                </a>
              </div>
            </div>
            <div>
              <h4 className="font-heading font-semibold mb-4">Offerings</h4>
              <ul className="flex flex-col gap-3 text-sm text-white/70">
                <li><Link to="/?section=quality" className="hover:text-white transition-colors">AI Quality & Assurance</Link></li>
                <li><Link to="/?section=managed" className="hover:text-white transition-colors">Managed AI Services</Link></li>
                <li><Link to="/?section=platform" className="hover:text-white transition-colors">Governance Platform</Link></li>
                <li><Link to="/academy" className="hover:text-white transition-colors">Vyomatrix Academy</Link></li>
                <li><Link to="/register" className="hover:text-white transition-colors">Academy Enrolment</Link></li>
              </ul>
            </div>
            <div>
              <h4 className="font-heading font-semibold mb-4">Company</h4>
              <ul className="flex flex-col gap-3 text-sm text-white/70">
                <li><Link to="/media" className="hover:text-white transition-colors">Media & Publications</Link></li>
                <li><Link to="/contact" className="hover:text-white transition-colors">Contact Us</Link></li>
              </ul>
            </div>
          </div>
          <div className="pt-8 border-t border-white/10 flex flex-col md:flex-row items-center justify-between gap-4 text-xs text-white/50">
            <p>&copy; {new Date().getFullYear()} Vyomatrix.ai. All rights reserved.</p>
            <div className="flex items-center gap-4">
              <Link to="/admin" className="hover:text-white transition-colors">Admin Portal</Link>
              <Link to="#" className="hover:text-white transition-colors">Privacy Policy</Link>
              <Link to="#" className="hover:text-white transition-colors">Terms of Service</Link>
            </div>
          </div>
        </AnimatedSection>
      </footer>
      <ChatWidget />
    </div>
  );
}

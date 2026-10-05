import React, { useState, useEffect } from 'react';
import { AnimatedSection } from '../components/ui/AnimatedSection';
import { SEO } from '../components/SEO';
import { Button } from '../components/ui/Button';
import { Calendar, Clock, ArrowRight, MousePointer2, CreditCard, Terminal, Briefcase, GraduationCap, CheckCircle2, ShieldCheck, Target, Trophy, Laptop, MessageSquare, Star } from 'lucide-react';

export function Academy() {
  const defaultPrograms = [
    {
      id: 'one-day',
      title: 'One-day workshop',
      desc: 'A focused 3 to 4 hour introduction to the world of AI evaluation.',
      duration: '3-4 hours',
      price: 'INR 2,499',
      originalPrice: 'INR 4,999',
      offerLabel: 'Introductory offer · 50% off',
      date: 'Starts soon',
      tracks: ['Business track', 'Technology track'],
      highlights: ['Intensive crash course', 'Practical intro to evaluation']
    },
    {
      id: 'demo',
      title: 'Demo workshop',
      desc: 'Pay small for the trial session before your bootcamp.',
      duration: '1-2 hours',
      price: 'INR 999',
      date: 'Rolling admissions',
      tracks: ['General intro'],
      highlights: ['Sneak peek into the bootcamp', 'Try before you commit']
    },
    {
      id: 'bootcamp',
      title: 'Four to five week bootcamp',
      desc: 'Applied training with live work and a comprehensive capstone project.',
      duration: '4-5 weeks',
      price: 'INR 45,000',
      date: 'Enrolling now',
      tracks: ['Business track', 'Technology track'],
      highlights: ['Live production work', 'Comprehensive capstone project', 'Pathway to paid roles']
    },
    {
      id: 'advanced',
      title: 'Advanced workshop',
      desc: 'For working professionals, QA and DevOps who already know the basics.',
      duration: '2 days',
      price: 'INR 18,500',
      date: 'TBD',
      tracks: ['Technology track'],
      highlights: ['Advanced EvalOps', 'CI/CD Integration', 'Automated red-teaming']
    }
  ];

  // null until the CMS answers, so visitors never see stale built-in prices flash before the admin's prices.
  const [academyPrograms, setAcademyPrograms] = useState<any[] | null>(null);

  useEffect(() => {
    fetch('/api/cms/data')
      .then(res => res.json())
      .then(data => setAcademyPrograms(data?.courses?.length > 0 ? data.courses : defaultPrograms))
      .catch(err => {
        console.error(err);
        setAcademyPrograms(defaultPrograms);
      });
  }, []);

  return (
    <div className="w-full">
      <SEO 
        title="AI Evaluation Academy" 
        description="Train for a career in AI quality and evaluation. Hands-on programs in prompt engineering and QA taught on real work." 
        canonical="/academy" 
      />
      {/* Hero Section */}
      <section className="bg-ink text-white pt-24 pb-32 relative overflow-hidden">
        {/* Subtle grid background */}
        <div className="absolute inset-0 opacity-10 pointer-events-none" style={{ backgroundImage: 'linear-gradient(to right, #9AA0A8 1px, transparent 1px), linear-gradient(to bottom, #9AA0A8 1px, transparent 1px)', backgroundSize: '4rem 4rem' }}></div>
        <div className="max-w-7xl mx-auto px-6 relative z-10">
          <AnimatedSection>
            <div className="font-mono text-xs font-bold tracking-widest text-primary-light mb-6 uppercase flex items-center gap-2">
              <GraduationCap size={18} /> VYOMATRIX ACADEMY
            </div>
            <h1 className="text-4xl md:text-6xl font-bold leading-tight mb-6 max-w-4xl font-heading">
              Train for a career in AI quality and evaluation.
            </h1>
            <p className="text-lg md:text-2xl text-white/90 max-w-3xl mb-10 font-light leading-relaxed">
              Hands-on programs in AI evaluation, prompt engineering and quality assurance, taught on real work, with a pathway into paid roles for top performers.
            </p>
            <div className="flex flex-col sm:flex-row items-start sm:items-center gap-6">
              <Button to="/checkout" className="!bg-white !text-primary hover:!bg-silver-light shadow-xl font-bold px-10 py-4 text-lg">
                Enrol now
              </Button>
              <Button to="/contact?interest=academy" variant="ghost" className="!bg-transparent !border !border-white/30 !text-white hover:!bg-white/10 px-8 py-4 flex items-center gap-2 font-bold">
                <MessageSquare size={18} /> Ask a question
              </Button>
            </div>
          </AnimatedSection>
        </div>
      </section>

      {/* Why train with us */}
      <section className="py-24 bg-silver-light border-b border-silver/20">
        <div className="max-w-7xl mx-auto px-6">
          <AnimatedSection className="text-center mb-16 max-w-3xl mx-auto">
            <h2 className="text-3xl md:text-4xl font-bold mb-6 text-ink font-heading">Why train with us</h2>
            <p className="text-xl text-ink/80 leading-relaxed font-light">
              Demand for skilled AI evaluators is rising fast. Our programs are practical and job-linked, learners work on real production tasks rather than simulations, and strong performers are considered for paid roles.
            </p>
          </AnimatedSection>

          <div className="grid md:grid-cols-3 gap-8">
            {[
              { title: "Surging Demand", desc: "The need for AI quality assurance engineers is skyrocketing as companies push AI to production.", icon: Target },
              { title: "Real Production Work", desc: "No toy datasets. You will be trained on the exact same platforms and tasks we use for our enterprise clients.", icon: Laptop },
              { title: "Direct Career Pathway", desc: "We actively monitor our cohorts. Top performers are evaluated and recruited directly into our paid delivery teams.", icon: Trophy }
            ].map((item, i) => (
               <AnimatedSection key={i} delay={i * 0.1} direction="up" className="bg-white p-8 rounded-sm shadow-sm border border-silver/20 hover:border-primary/30 transition-all hover:-translate-y-1">
                  <div className="w-14 h-14 bg-silver-light flex items-center justify-center rounded-sm mb-6 border border-silver/10">
                    <item.icon className="text-primary" size={28} strokeWidth={1.5} />
                  </div>
                  <h4 className="font-bold text-xl text-ink mb-3 font-heading">{item.title}</h4>
                  <p className="text-ink/70 leading-relaxed">{item.desc}</p>
               </AnimatedSection>
            ))}
          </div>
        </div>
      </section>

      {/* Programs */}
      <section id="programs" className="py-24 bg-white scroll-mt-20">
        <div className="max-w-7xl mx-auto px-6">
          <AnimatedSection className="mb-16">
            <h2 className="text-3xl md:text-4xl font-bold text-ink font-heading mb-4">Training Programs</h2>
            <p className="text-ink/70 text-lg max-w-2xl">Select a program to view details and begin your enrolment.</p>
          </AnimatedSection>

          <div className="grid md:grid-cols-2 gap-8">
            {!academyPrograms && (
              <div className="md:col-span-2 py-16 text-center text-ink/50 font-medium animate-pulse">Loading programs...</div>
            )}
            {(academyPrograms || []).map((program, idx) => (
              <AnimatedSection key={idx} delay={idx * 0.1}>
                <div className="flex flex-col h-full bg-white border border-silver/30 rounded-sm hover:border-primary/50 transition-colors shadow-sm hover:shadow-lg overflow-hidden group">
                  <div className="p-8 flex-1">
                    <h3 className="text-2xl font-bold text-ink font-heading mb-4 group-hover:text-primary transition-colors">{program.title}</h3>
                    <p className="text-ink/80 text-base mb-8 min-h-[50px] leading-relaxed">{program.desc}</p>
                    
                    <div className="grid grid-cols-2 gap-4 mb-8">
                      <div className="bg-silver-light/50 p-4 rounded-sm border border-silver/10 flex flex-col justify-center">
                        <div className="flex items-center gap-2 text-primary mb-1">
                          <Clock size={16} /> <span className="text-xs font-bold uppercase tracking-wider">Duration</span>
                        </div>
                        <span className="text-ink font-medium">{program.duration}</span>
                      </div>
                      <div className="bg-silver-light/50 p-4 rounded-sm border border-silver/10 flex flex-col justify-center">
                        <div className="flex items-center gap-2 text-primary mb-1">
                          <Calendar size={16} /> <span className="text-xs font-bold uppercase tracking-wider">Next Start</span>
                        </div>
                        <span className="text-ink font-medium">{program.date}</span>
                      </div>
                    </div>

                    <div className="mb-8">
                      <div className="text-xs font-bold tracking-widest text-silver uppercase mb-4 flex items-center gap-2">
                        <Star size={14} className="text-primary"/> Available Tracks
                      </div>
                      <div className="flex flex-wrap gap-2">
                        {program.tracks.map((track: string) => (
                          <span key={track} className="px-4 py-2 bg-silver-light/80 border border-silver/20 text-sm font-medium text-ink rounded-sm flex items-center gap-2">
                            <CheckCircle2 size={14} className="text-primary" /> {track}
                          </span>
                        ))}
                      </div>
                    </div>
                  </div>
                  
                  <div className="p-8 border-t border-silver/10 flex flex-col sm:flex-row items-start sm:items-center justify-between bg-silver-light/20 gap-6">
                    <div>
                      <div className="text-xs text-silver mb-1 uppercase tracking-wider font-bold">Tuition Investment</div>
                      <div className="flex flex-wrap items-baseline gap-x-3 gap-y-1">
                        {program.originalPrice && (
                          <span className="text-base font-medium text-silver line-through">
                            {program.originalPrice}
                          </span>
                        )}
                        <span className="text-3xl font-bold text-ink">{program.price}</span>
                      </div>
                      {program.offerLabel && (
                        <div className="mt-1 text-sm font-semibold text-primary">
                          {program.offerLabel}
                        </div>
                      )}
                    </div>
                    {/* Route to actual checkout integration */}
                    {program.sessionsClosed ? (
                      <span className="w-full sm:w-auto px-8 py-3 text-center text-sm font-bold text-ink/50 border border-silver/30 rounded-sm">
                        New dates coming soon
                      </span>
                    ) : (
                      <Button to={`/checkout?program=${program.id}`} variant="primary" className="shadow-md shadow-primary/20 w-full sm:w-auto px-8 py-3">
                        Enrol Now
                      </Button>
                    )}
                  </div>
                </div>
              </AnimatedSection>
            ))}
          </div>
        </div>
      </section>

      {/* How it works */}
      <section className="py-24 bg-silver-light border-y border-silver/20">
        <div className="max-w-7xl mx-auto px-6">
          <AnimatedSection className="text-center mb-20">
            <h2 className="text-3xl md:text-4xl font-bold text-ink font-heading">How it works</h2>
          </AnimatedSection>
          
          <div className="grid sm:grid-cols-2 md:grid-cols-4 gap-12 md:gap-8">
            {[
              { step: '01', title: 'Choose', desc: 'Choose your program and track.', icon: MousePointer2 },
              { step: '02', title: 'Enrol', desc: 'Enrol and pay securely online.', icon: CreditCard },
              { step: '03', title: 'Train', desc: 'Train on real production work.', icon: Terminal },
              { step: '04', title: 'Advance', desc: 'Top performers are evaluated for paid roles.', icon: Briefcase },
            ].map((item, i) => (
              <AnimatedSection key={i} delay={i * 0.1} className="relative text-center md:text-left">
                {/* Connecting Line for Desktop */}
                {i !== 3 && <div className="hidden md:block absolute top-8 left-16 right-0 w-full h-[2px] bg-silver/20 z-0"></div>}
                
                <div className="relative z-10 flex flex-col items-center md:items-start">
                  <div className="w-16 h-16 bg-white border-2 border-primary text-primary rounded-full flex items-center justify-center mb-6 shadow-md shadow-primary/10 relative">
                    <item.icon size={24} strokeWidth={2} />
                    <div className="absolute -top-3 -right-3 w-8 h-8 bg-ink text-white rounded-full flex items-center justify-center text-xs font-bold border-4 border-silver-light">
                      {i + 1}
                    </div>
                  </div>
                  <h4 className="text-xl font-bold mb-3 text-ink font-heading">{item.title}</h4>
                  <p className="text-base text-ink/70 leading-relaxed">{item.desc}</p>
                </div>
              </AnimatedSection>
            ))}
          </div>
        </div>
      </section>

      {/* Closing CTA */}
      <section className="bg-primary text-white py-24 text-center">
        <div className="max-w-3xl mx-auto px-6">
          <AnimatedSection>
            <h2 className="text-4xl md:text-5xl font-bold mb-10 font-heading">Ready to start your AI evaluation career?</h2>
            <Button to="/checkout" className="!bg-white !text-primary hover:!bg-silver-light text-xl px-12 py-5 shadow-2xl font-bold">
              Enrol now
            </Button>
          </AnimatedSection>
        </div>
      </section>
    </div>
  );
}

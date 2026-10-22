import React from 'react';
import { AnimatedSection } from '../components/ui/AnimatedSection';
import { SEO } from '../components/SEO';
import { Button } from '../components/ui/Button';
import { programmeDuration } from '../data/academyCatalog';
import { useAcademy } from '../components/CMSContext';
import { Calendar, Clock, ArrowRight, MousePointer2, CreditCard, Terminal, Briefcase, GraduationCap, CheckCircle2, ShieldCheck, Target, Trophy, Laptop, MessageSquare, Star } from 'lucide-react';

const inr = (n: number) => '₹' + n.toLocaleString('en-IN');

export function Academy() {
  const academy = useAcademy();

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
              <Button to="/register" className="!bg-white !text-primary hover:!bg-silver-light shadow-xl font-bold px-10 py-4 text-lg">
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

          <div className="grid md:grid-cols-3 gap-8">
            {academy.programmes.map((p, idx) => {
              const allLevels = p.levels.reduce((sum, l) => sum + l.price, 0);
              const allLevelsStd = p.levels.reduce((sum, l) => sum + l.std, 0);
              const from = p.single ? p.price : Math.min(...p.levels.map(l => l.price));
              return (
                <AnimatedSection key={p.id} delay={idx * 0.1}>
                  <div className="flex flex-col h-full bg-white border border-silver/30 rounded-sm hover:border-primary/50 transition-colors shadow-sm hover:shadow-lg overflow-hidden group">
                    <div className="p-8 flex-1">
                      {p.tag && <div className="font-mono text-[11px] font-bold tracking-widest text-primary mb-2">{p.tag}</div>}
                      <h3 className="text-2xl font-bold text-ink font-heading mb-3 group-hover:text-primary transition-colors">{p.name}</h3>
                      {p.line && <p className="text-ink font-semibold text-base mb-2 leading-snug">{p.line}</p>}
                      <p className="text-ink/70 text-sm mb-8 leading-relaxed">{p.who}</p>

                      <div className="grid grid-cols-2 gap-4 mb-8">
                        <div className="bg-silver-light/50 p-4 rounded-sm border border-silver/10 flex flex-col justify-center">
                          <div className="flex items-center gap-2 text-primary mb-1">
                            <Clock size={16} /> <span className="text-xs font-bold uppercase tracking-wider">Duration</span>
                          </div>
                          <span className="text-ink font-medium text-sm">{programmeDuration(p) || '—'}</span>
                        </div>
                        <div className="bg-silver-light/50 p-4 rounded-sm border border-silver/10 flex flex-col justify-center">
                          <div className="flex items-center gap-2 text-primary mb-1">
                            <Calendar size={16} /> <span className="text-xs font-bold uppercase tracking-wider">Next Start</span>
                          </div>
                          <span className="text-ink font-medium text-sm">{academy.page.cohortText}</span>
                        </div>
                      </div>

                      <div>
                        <div className="text-xs font-bold tracking-widest text-silver uppercase mb-4 flex items-center gap-2">
                          <Star size={14} className="text-primary"/> Available Tracks
                        </div>
                        <div className="flex flex-wrap gap-2">
                          {p.tracks.map(track => (
                            <span key={track} className="px-4 py-2 bg-silver-light/80 border border-silver/20 text-sm font-medium text-ink rounded-sm flex items-center gap-2">
                              <CheckCircle2 size={14} className="text-primary" /> {track}
                            </span>
                          ))}
                        </div>
                      </div>
                    </div>

                    <div className="p-8 border-t border-silver/10 flex flex-col items-start justify-between bg-silver-light/20 gap-6">
                      <div>
                        <div className="text-xs text-silver mb-1 uppercase tracking-wider font-bold">Tuition Investment</div>
                        <div className="flex flex-wrap items-baseline gap-x-3 gap-y-1">
                          {p.single && p.std > p.price && <span className="text-base font-medium text-silver line-through">{inr(p.std)}</span>}
                          <span className="text-3xl font-bold text-ink">{p.single ? '' : 'From '}{inr(from)}</span>
                          {academy.gstRate > 0 && <span className="text-sm text-ink/60">+ {academy.gstRate}% GST</span>}
                        </div>
                        {!p.single && p.levels.length > 1 && (
                          <div className="mt-1 text-sm font-semibold text-primary">
                            All {p.levels.length} levels {inr(allLevels)} {allLevelsStd > allLevels && <span className="font-normal text-silver line-through">{inr(allLevelsStd)}</span>}
                          </div>
                        )}
                        {p.cardNote && <div className="mt-1 text-xs text-ink/60">{p.cardNote}</div>}
                      </div>
                      <Button to={`/register?programme=${encodeURIComponent(p.id)}`} variant="primary" className="shadow-md shadow-primary/20 w-full px-8 py-3">
                        Enrol Now
                      </Button>
                    </div>
                  </div>
                </AnimatedSection>
              );
            })}
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
            <Button to="/register" className="!bg-white !text-primary hover:!bg-silver-light text-xl px-12 py-5 shadow-2xl font-bold">
              Enrol now
            </Button>
          </AnimatedSection>
        </div>
      </section>
    </div>
  );
}

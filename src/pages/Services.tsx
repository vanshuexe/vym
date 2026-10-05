import React from 'react';
import { Helmet } from 'react-helmet-async';
import { Link } from 'react-router-dom';
import { ShieldCheck, Activity, Layers, ArrowRight, CheckCircle2, Target, ClipboardCheck, ShieldAlert, Bot, Code2, RefreshCw, TestTube2, Network, Cpu, FileLock2, Briefcase, ServerCrash, Settings } from 'lucide-react';
import { AnimatedSection } from '../components/ui/AnimatedSection';
import { Button } from '../components/ui/Button';
import { useCMS } from '../components/CMSContext';

export function Services() {
  const { db } = useCMS();

  const heroTitle = db?.pages?.services?.heroTitle || 'Our Services';
  const heroSubtitle = db?.pages?.services?.heroSubtitle || 'Trusted AI, proven and accountable. We help organizations deploy AI they can stand behind.';

  return (
    <div className="w-full bg-[#050505]">
      <Helmet>
        <title>Services | Vyomatrix.ai</title>
        <meta name="description" content="Explore our AI Quality & Assurance, Managed IT Services, and Platform solutions." />
      </Helmet>

      {/* Hero Section */}
      <section className="relative w-full bg-black overflow-hidden py-24 lg:py-32">
        <div className="absolute top-0 right-0 w-full lg:w-[65%] h-full bg-[radial-gradient(ellipse_at_80%_50%,rgba(34,211,238,0.15)_0%,rgba(30,20,80,0.1)_40%,transparent_70%)] pointer-events-none z-0" />
        
        <div className="relative z-10 w-full max-w-7xl mx-auto px-6 sm:px-12 text-center">
          <AnimatedSection>
            <h1 className="text-4xl md:text-6xl font-heading font-bold mb-6 text-white uppercase tracking-tight">
              {heroTitle.includes('Services') ? (
                <>Our <span className="text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-blue-500">Services</span></>
              ) : (
                heroTitle
              )}
            </h1>
            <p className="text-lg md:text-xl text-silver max-w-2xl mx-auto font-light leading-relaxed">
              {heroSubtitle}
            </p>
          </AnimatedSection>
        </div>
      </section>

      {/* Service 01 - AI Quality & Assurance */}
      <section id="quality" className="py-24 bg-[#050505] relative overflow-hidden border-t border-white/5">
        <div className="max-w-7xl mx-auto px-6 grid md:grid-cols-2 gap-16 items-center relative z-10">
          <AnimatedSection direction="left">
            <div className="w-16 h-16 bg-cyan-500/20 border border-cyan-500/40 flex items-center justify-center rounded-xl mb-8 shadow-[0_0_15px_rgba(34,211,238,0.25)]">
              <ShieldCheck className="text-cyan-400" size={32} />
            </div>
            <div className="font-mono text-xs font-bold tracking-widest text-cyan-400 mb-6 uppercase flex items-center gap-2">
              <div className="w-2 h-2 rounded-full bg-cyan-400 shadow-[0_0_8px_#22d3ee]"></div> Service 01
            </div>
            <h2 className="text-3xl font-bold mb-4 text-white font-heading">AI Quality & Assurance</h2>
            <p className="text-xl text-cyan-400 font-medium mb-6">"Independent assurance for the AI you run."</p>
            <p className="text-silver mb-8 leading-relaxed font-light">
              We audit AI systems for accuracy, safety, bias, brand and tone, so you can prove your AI works, to customers and regulators.
            </p>
            <div className="grid sm:grid-cols-2 gap-4 mb-10">
              {[
                { title: 'AI System Audits', desc: 'Comprehensive audits for production AI.', icon: ClipboardCheck },
                { title: 'Accuracy Scoring', desc: 'Measuring hallucinations and precision.', icon: Target },
                { title: 'Safety & Bias Review', desc: 'Ensuring fair, safe, and aligned outputs.', icon: ShieldAlert },
                { title: 'Ongoing Monitoring', desc: 'Continuous retainer for live systems.', icon: Activity }
              ].map((item, i) => (
                <div key={i} className="flex flex-col p-5 bg-cyan-950/30 backdrop-blur-sm border border-cyan-500/20 rounded-xl hover:bg-cyan-900/40 hover:border-cyan-400/50 hover:shadow-[0_0_20px_rgba(34,211,238,0.15)] transition-all">
                  <item.icon className="text-cyan-400 mb-3" size={24} strokeWidth={1.5} />
                  <strong className="text-white font-bold text-sm mb-1">{item.title}</strong>
                  <span className="text-silver text-xs leading-relaxed">{item.desc}</span>
                </div>
              ))}
            </div>
            <Button to="/contact?interest=quality" className="!bg-cyan-500 !text-black hover:!bg-cyan-400 shadow-[0_0_15px_rgba(34,211,238,0.3)]">Enquire</Button>
          </AnimatedSection>
          
          <AnimatedSection direction="right" className="relative h-[450px] bg-[#0A0A0C] rounded-2xl shadow-inner border border-white/10 overflow-hidden hidden md:flex items-center justify-center">
            <div className="absolute inset-0 opacity-10" style={{ backgroundImage: 'radial-gradient(rgba(34,211,238,0.4) 1px, transparent 1px)', backgroundSize: '24px 24px' }}></div>
            {/* Custom 3D-like Glowing Elements */}
            <div className="relative z-10 grid grid-cols-2 gap-6">
              <div className="w-32 h-32 bg-cyan-500/20 backdrop-blur-md text-cyan-300 rounded-xl shadow-[0_12px_40px_rgba(34,211,238,0.2)] border border-cyan-500/40 flex items-center justify-center animate-[bounce_4s_infinite]"><Target size={48} strokeWidth={1.5}/></div>
              <div className="w-32 h-32 bg-cyan-500/20 backdrop-blur-md text-cyan-300 rounded-xl shadow-[0_12px_40px_rgba(34,211,238,0.2)] border border-cyan-500/40 flex items-center justify-center translate-y-12 animate-[bounce_5s_infinite]"><ShieldCheck size={48} strokeWidth={1.5}/></div>
              <div className="w-32 h-32 bg-blue-500/20 backdrop-blur-md text-blue-300 rounded-xl shadow-[0_12px_40px_rgba(59,130,246,0.2)] border border-blue-500/40 flex items-center justify-center -translate-y-8 animate-[bounce_6s_infinite]"><Activity size={48} strokeWidth={1.5}/></div>
              <div className="w-32 h-32 bg-blue-500/20 backdrop-blur-md text-blue-300 rounded-xl shadow-[0_12px_40px_rgba(59,130,246,0.2)] border border-blue-500/40 flex items-center justify-center translate-y-4 animate-[bounce_4.5s_infinite]"><ClipboardCheck size={48} strokeWidth={1.5}/></div>
            </div>
          </AnimatedSection>
        </div>
      </section>

      {/* Service 02 - Managed IT Services */}
      <section id="managed" className="py-24 bg-[#0A0A0C] border-y border-white/10 relative overflow-hidden">
        <div className="max-w-7xl mx-auto px-6 relative z-10">
          <AnimatedSection className="mb-16 text-center max-w-3xl mx-auto">
            <div className="w-16 h-16 bg-blue-500/20 border border-blue-500/40 flex items-center justify-center rounded-xl mb-8 shadow-[0_0_15px_rgba(59,130,246,0.25)] mx-auto">
              <Cpu className="text-blue-400" size={32} />
            </div>
            <div className="font-mono text-xs font-bold tracking-widest text-blue-400 mb-6 uppercase flex items-center justify-center gap-2">
              <div className="w-2 h-2 rounded-full bg-blue-400 shadow-[0_0_8px_#3b82f6]"></div> Service 02
            </div>
            <h2 className="text-3xl md:text-4xl font-bold mb-4 text-white font-heading">Managed IT Services</h2>
            <p className="text-xl md:text-2xl text-blue-400 font-medium mb-6">"We build, run and assure your AI and platforms, at the right cost."</p>
            <p className="text-silver text-lg leading-relaxed font-light">
              We become your managed delivery partner for AI and the platforms it runs on. We take full ownership of the work you would rather not build or staff in-house, from implementation through day-to-day operations.
            </p>
          </AnimatedSection>

          <div className="grid md:grid-cols-2 gap-12 mb-16 items-start">
            <AnimatedSection direction="left" className="bg-[#0f172a]/60 backdrop-blur-md p-8 rounded-2xl shadow-[0_8px_32px_rgba(0,0,0,0.4)] border border-slate-700/50 h-full hover:border-blue-400/50 transition-all group">
              <div className="absolute top-0 right-0 w-32 h-32 bg-blue-500/10 blur-3xl rounded-full group-hover:bg-blue-500/20 transition-all"></div>
              <h3 className="text-2xl font-bold mb-8 text-white flex items-center gap-3 pb-4 border-b border-white/10 relative z-10">
                <Bot className="text-blue-400" size={28} /> We build and deploy
              </h3>
              <div className="space-y-8 relative z-10">
                {[
                  { title: 'AI bots and assistants', desc: 'We design, build and deploy chatbots, voice agents and AI assistants.', icon: Bot },
                  { title: 'AI integration and development', desc: 'We build AI into your existing products and connect it to your systems.', icon: Code2 },
                  { title: 'Legacy modernization', desc: 'We bring older systems up to date faster using AI-accelerated development.', icon: RefreshCw },
                  { title: 'AI-powered QA and testing', desc: 'Automated testing and simulated users to catch flaws before release.', icon: TestTube2 }
                ].map((item, i) => (
                  <div key={i} className="flex gap-5">
                    <div className="mt-1 flex-shrink-0 w-12 h-12 bg-blue-500/20 flex items-center justify-center rounded-xl border border-blue-500/40 shadow-inner">
                      <item.icon className="text-blue-400" size={24} strokeWidth={1.5} />
                    </div>
                    <div>
                      <h4 className="font-bold text-white mb-1 text-lg">{item.title}</h4>
                      <p className="text-silver leading-relaxed">{item.desc}</p>
                    </div>
                  </div>
                ))}
              </div>
            </AnimatedSection>

            <div className="space-y-8 flex flex-col h-full">
              <AnimatedSection direction="right" className="bg-[#0f172a]/60 backdrop-blur-md p-8 rounded-2xl shadow-[0_8px_32px_rgba(0,0,0,0.4)] border border-slate-700/50 flex-grow hover:border-purple-400/50 transition-all group">
                <div className="absolute top-0 left-0 w-32 h-32 bg-purple-500/10 blur-3xl rounded-full group-hover:bg-purple-500/20 transition-all"></div>
                <h3 className="text-2xl font-bold mb-8 text-white flex items-center gap-3 pb-4 border-b border-white/10 relative z-10">
                  <Activity className="text-purple-400" size={28} /> We run and manage
                </h3>
                <div className="space-y-8 relative z-10">
                  {[
                    { title: 'Data annotation & human feedback', desc: 'The human work that keeps models accurate.', icon: ClipboardCheck },
                    { title: 'Content moderation, trust & safety', desc: 'Managed operations that protect your users and your brand.', icon: ShieldCheck },
                    { title: 'Managed support operations', desc: 'Dedicated teams, governed by SLAs and continuous quality monitoring.', icon: Settings }
                  ].map((item, i) => (
                    <div key={i} className="flex gap-5">
                      <div className="mt-1 flex-shrink-0 w-12 h-12 bg-purple-500/20 flex items-center justify-center rounded-xl border border-purple-500/40 shadow-inner">
                        <item.icon className="text-purple-400" size={24} strokeWidth={1.5} />
                      </div>
                      <div>
                        <h4 className="font-bold text-white mb-1 text-lg">{item.title}</h4>
                        <p className="text-silver leading-relaxed">{item.desc}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </AnimatedSection>

              <AnimatedSection direction="right" delay={0.2} className="bg-gradient-to-br from-blue-900/60 to-purple-900/60 backdrop-blur-md text-white p-8 rounded-2xl shadow-[0_12px_40px_rgba(59,130,246,0.15)] border border-blue-400/40">
                <h3 className="text-xl font-bold mb-4 flex items-center gap-3">
                  <Network className="text-blue-300" size={24} /> Platform practices we manage
                </h3>
                <p className="text-blue-100 leading-relaxed mb-4 text-sm">
                  Databricks, Salesforce Agentic AI, Elastic Stack, and LogicMonitor — fully implemented and operated end to end with human oversight built in.
                </p>
                <div className="border-t border-blue-500/30 pt-4 mt-4">
                  <h4 className="font-bold text-white mb-2">Our difference</h4>
                  <p className="text-blue-100 leading-relaxed text-sm">
                    We do not just build the AI, we stand behind its quality. The same independent assurance we sell on its own is built into everything we implement.
                  </p>
                </div>
              </AnimatedSection>
            </div>
          </div>

          <AnimatedSection className="text-center">
            <Button to="/contact?interest=managed" variant="primary" className="px-8 py-4 text-lg bg-blue-500 text-white hover:bg-blue-400 shadow-[0_0_20px_rgba(59,130,246,0.4)]">
              Enquire
            </Button>
          </AnimatedSection>
        </div>
      </section>

      {/* Service 03 - Platform */}
      <section id="platform" className="py-24 bg-[#050505] relative overflow-hidden">
        <div className="max-w-7xl mx-auto px-6 grid md:grid-cols-2 gap-16 items-center relative z-10">
          <AnimatedSection direction="left">
            <div className="w-16 h-16 bg-emerald-500/20 border border-emerald-500/40 flex items-center justify-center rounded-xl mb-8 shadow-[0_0_15px_rgba(16,185,129,0.25)]">
              <Layers className="text-emerald-400" size={32} />
            </div>
            <div className="font-mono text-xs font-bold tracking-widest text-emerald-400 mb-6 uppercase flex items-center gap-2">
              <div className="w-2 h-2 rounded-full bg-emerald-400 shadow-[0_0_8px_#34d399]"></div> Service 03
            </div>
            <h2 className="text-3xl md:text-4xl font-bold mb-4 text-white font-heading">Platform</h2>
            <p className="text-xl md:text-2xl text-emerald-400 font-medium mb-6">"One platform for AI quality, governance and accountability."</p>
            <p className="text-silver text-lg mb-8 leading-relaxed font-light">
              A single platform that brings AI quality, compliance and oversight together in one place. Choose the modules you need, configure them to your industry, and get one login, one bill and one permanent record of how your AI behaves.
            </p>
            <div className="space-y-4 mb-10">
              {[
                { title: 'Quality & monitoring modules', desc: 'Track accuracy and hallucination risk.', icon: Settings },
                { title: 'Immutable audit trail', desc: 'Permanent record for regulators and auditors.', icon: FileLock2 },
                { title: 'Industry configuration packs', desc: 'Setups for banking, healthcare, government.', icon: Briefcase },
                { title: 'Provider resilience with failover', desc: 'Traffic moves to backup if AI provider slows.', icon: ServerCrash }
              ].map((item, i) => (
                <div key={i} className="flex items-center gap-4 p-4 bg-emerald-950/30 backdrop-blur-sm border border-emerald-500/20 rounded-xl hover:bg-emerald-900/40 hover:border-emerald-400/50 hover:shadow-[0_0_20px_rgba(16,185,129,0.15)] transition-all">
                  <div className="w-12 h-12 bg-emerald-500/20 rounded-xl flex items-center justify-center flex-shrink-0 shadow-inner border border-emerald-500/40">
                    <item.icon className="text-emerald-400" size={24} strokeWidth={2} />
                  </div>
                  <div>
                    <strong className="text-white font-bold block">{item.title}</strong>
                    <span className="text-silver text-sm">{item.desc}</span>
                  </div>
                </div>
              ))}
            </div>
            <Button to="/contact?interest=platform" className="!bg-emerald-500 !text-black hover:!bg-emerald-400 px-8 py-4 text-lg shadow-[0_0_15px_rgba(16,185,129,0.3)]">Request a demo</Button>
          </AnimatedSection>

          <AnimatedSection direction="right" className="relative h-[550px] bg-[#0A0A0C] rounded-2xl shadow-inner border border-white/10 overflow-hidden hidden md:flex items-center justify-center">
            {/* 3D Dashboard representation */}
             <div className="w-full max-w-md p-8 bg-slate-900/80 backdrop-blur-2xl shadow-[0_20px_50px_rgba(0,0,0,0.5)] rounded-2xl border border-slate-700/80 relative z-10 transform perspective-1000 rotate-y-[-10deg] rotate-x-[5deg] hover:rotate-y-0 hover:rotate-x-0 transition-transform duration-700">
                <div className="flex justify-between items-center mb-6 border-b border-white/10 pb-4">
                  <div className="flex gap-2"><div className="w-3 h-3 rounded-full bg-red-400/80"></div><div className="w-3 h-3 rounded-full bg-yellow-400/80"></div><div className="w-3 h-3 rounded-full bg-green-400/80"></div></div>
                  <Layers className="text-silver" size={16} />
                </div>
                <div className="space-y-4">
                  <div className="w-full bg-emerald-950/40 p-4 rounded-xl flex items-center justify-between border border-emerald-500/20 hover:border-emerald-400/40 transition-colors">
                    <div className="flex items-center gap-3"><Settings size={20} className="text-emerald-400"/><span className="font-bold text-white">Quality Monitor</span></div>
                    <CheckCircle2 size={20} className="text-emerald-400" />
                  </div>
                  <div className="w-full bg-emerald-950/40 p-4 rounded-xl flex items-center justify-between border border-emerald-500/20 hover:border-emerald-400/40 transition-colors">
                    <div className="flex items-center gap-3"><FileLock2 size={20} className="text-emerald-400"/><span className="font-bold text-white">Audit Logger</span></div>
                    <CheckCircle2 size={20} className="text-emerald-400" />
                  </div>
                  <div className="w-full bg-gradient-to-r from-emerald-500/30 to-teal-500/30 p-5 rounded-xl flex items-center justify-between shadow-[0_10px_30px_rgba(16,185,129,0.25)] border border-emerald-400/50 text-white transform scale-105 z-10">
                    <div className="flex items-center gap-3"><ShieldCheck size={20} className="text-emerald-400"/><span className="font-bold">Healthcare Pack</span></div>
                    <span className="text-xs font-mono bg-emerald-500/40 text-emerald-200 border border-emerald-400/60 px-3 py-1 rounded-sm animate-pulse">Active</span>
                  </div>
                </div>
                
                <div className="mt-8 pt-6 border-t border-white/10">
                  <h4 className="font-semibold text-white mb-3 text-sm">Flexible to adopt</h4>
                  <p className="text-silver text-xs leading-relaxed">Start with the modules you need now and add more as your AI footprint grows, with subscription pricing and usage that scales with you.</p>
                  <div className="mt-4 inline-block bg-emerald-500/20 border border-emerald-500/40 rounded-full px-4 py-1.5">
                    <span className="text-emerald-400 text-xs font-medium">Now in early access</span>
                  </div>
                </div>
             </div>
          </AnimatedSection>
        </div>
      </section>

    </div>
  );
}

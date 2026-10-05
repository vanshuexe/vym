import React, { useEffect, Suspense, lazy, useState, useRef } from 'react';
import { useLocation, Link } from 'react-router-dom';
import { useCMS } from '../components/CMSContext';
import { motion } from 'motion/react';
import { AnimatedSection } from '../components/ui/AnimatedSection';
import { SEO } from '../components/SEO';
import { Button } from '../components/ui/Button';
const Spline = lazy(() => import('@splinetool/react-spline'));
import { CheckCircle2, ShieldCheck, Cpu, ArrowRight, Layers, Scale, Globe, TrendingDown, Landmark, HeartPulse, Building2, Signal, Lightbulb, ClipboardCheck, Target, ShieldAlert, Activity, Bot, Code2, RefreshCw, TestTube2, Settings, FileLock2, Briefcase, ServerCrash, MessageSquare, Users, Star, ArrowUpRight, Search, LayoutDashboard, Database, Network } from 'lucide-react';

// High-performance native Spline 3D canvas loader — with 4-second mobile auto-animation
function SplineRobotViewer({ sceneUrl }: { sceneUrl: string }) {
  const [isLoaded, setIsLoaded] = useState(false);
  const [hasError, setHasError] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  // Auto-animation loop specifically for Mobile UI (smoothly looking here and there every 4s)
  useEffect(() => {
    let animFrameId: number;
    let poseIntervalId: NodeJS.Timeout;

    // Check if current screen is mobile / tablet (< 1024px or touch enabled)
    const isMobile = window.innerWidth < 1024 || 'ontouchstart' in window;
    if (!isMobile) return;

    let poseIndex = 0;
    let currX = window.innerWidth * 0.5;
    let currY = window.innerHeight * 0.4;
    let targetX = currX;
    let targetY = currY;

    // Smooth lerp animation tick (faster 0.08 transition)
    const tick = () => {
      // Lerp current coordinates towards target pose (smooth factor 0.08 for faster response)
      currX += (targetX - currX) * 0.08;
      currY += (targetY - currY) * 0.08;

      const opts = {
        clientX: currX,
        clientY: currY,
        pageX: currX,
        pageY: currY + window.scrollY,
        bubbles: true,
        cancelable: true,
        view: window,
      };

      const pointerEvt = new PointerEvent('pointermove', opts);
      const mouseEvt = new MouseEvent('mousemove', opts);

      if (containerRef.current) {
        const canvas = containerRef.current.querySelector('canvas') || containerRef.current;
        canvas.dispatchEvent(pointerEvt);
        canvas.dispatchEvent(mouseEvt);
      }
      window.dispatchEvent(pointerEvt);
      window.dispatchEvent(mouseEvt);

      animFrameId = requestAnimationFrame(tick);
    };

    // Pose sequence: Look left, look right, look top-right, look down, look straight
    const getNextTarget = () => {
      if (!containerRef.current) return;
      const rect = containerRef.current.getBoundingClientRect();
      const relativePoses = [
        { x: rect.left + rect.width * 0.15, y: rect.top + rect.height * 0.35 }, // Look Left-Up
        { x: rect.left + rect.width * 0.85, y: rect.top + rect.height * 0.45 }, // Look Right
        { x: rect.left + rect.width * 0.50, y: rect.top + rect.height * 0.15 }, // Look Top-Center
        { x: rect.left + rect.width * 0.20, y: rect.top + rect.height * 0.70 }, // Look Down-Left
        { x: rect.left + rect.width * 0.50, y: rect.top + rect.height * 0.50 }, // Look Straight / Center
      ];

      poseIndex = (poseIndex + 1) % relativePoses.length;
      const pose = relativePoses[poseIndex];
      targetX = pose.x;
      targetY = pose.y;
    };

    // Start tick and 2-second pose rotation gap
    animFrameId = requestAnimationFrame(tick);
    poseIntervalId = setInterval(getNextTarget, 2000); // Continuous 2-second gap

    // Mobile touch interaction: direct look at touch point
    const handleTouch = (e: TouchEvent) => {
      if (e.touches && e.touches[0]) {
        targetX = e.touches[0].clientX;
        targetY = e.touches[0].clientY;
      }
    };

    window.addEventListener('touchstart', handleTouch, { passive: true });
    window.addEventListener('touchmove', handleTouch, { passive: true });

    return () => {
      if (animFrameId) cancelAnimationFrame(animFrameId);
      if (poseIntervalId) clearInterval(poseIntervalId);
      window.removeEventListener('touchstart', handleTouch);
      window.removeEventListener('touchmove', handleTouch);
    };
  }, []);

  const handleLoad = (splineApp: any) => {
    setIsLoaded(true);
    try {
      if (splineApp) {
        // Direct object search by common names
        const namesToHide = ['AK DEV.', 'AK DEV', 'AK', 'DEV', 'Robot#0531', 'Text', 'Text 2', 'Text 1', 'text', 'logo', 'Logo', 'Group'];
        namesToHide.forEach(name => {
          const obj = splineApp.findObjectByName ? splineApp.findObjectByName(name) : null;
          if (obj) obj.visible = false;
        });

        // Search Three.js / Spline scene graph recursively
        const scene = splineApp._scene || splineApp.scene || (splineApp._camera && splineApp._camera.parent);
        if (scene && typeof scene.traverse === 'function') {
          scene.traverse((child: any) => {
            if (child) {
              const name = (child.name || '').toLowerCase();
              if (
                name.includes('ak') || 
                name.includes('dev') || 
                name.includes('robot#') ||
                name.includes('text') ||
                child.type === 'Text' ||
                child.isText
              ) {
                child.visible = false;
                if (child.material) child.material.visible = false;
              }
            }
          });
        }
      }
    } catch (err) {
      console.log('Spline object hide warning:', err);
    }
  };

  return (
    <div ref={containerRef} style={{ position: 'relative', width: '100%', height: '100%', transform: 'translateZ(0)', willChange: 'transform' }}>
      {/* Glow placeholder while WebGL initializes */}
      {!isLoaded && !hasError && (
        <div
          style={{
            position: 'absolute',
            inset: 0,
            background: 'radial-gradient(ellipse at center, rgba(139,92,246,0.2) 0%, rgba(30,20,80,0.1) 50%, transparent 70%)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 1,
            pointerEvents: 'none',
          }}
        >
          <div style={{ width: '48px', height: '48px', borderRadius: '50%', border: '2px solid rgba(167,139,250,0.3)', borderTopColor: '#a78bfa', animation: 'spin 1s linear infinite' }} />
        </div>
      )}

      {/* Direct WebGL Spline Canvas — No iframe overhead */}
      {!hasError ? (
        <Suspense fallback={null}>
          <Spline
            scene={sceneUrl}
            onLoad={handleLoad}
            onError={() => setHasError(true)}
            style={{ width: '100%', height: '100%', opacity: isLoaded ? 1 : 0, transition: 'opacity 0.5s ease' }}
          />
        </Suspense>
      ) : (
        /* Backup lightweight viewer iframe if splinecode URL fails */
        <iframe
          src="https://my.spline.design/robotfollowcursor-9d60c478-0e28-4514-a1ac-5605c039d6e6/"
          frameBorder="0"
          style={{ width: '100%', height: '100%', border: 'none' }}
          title="3D Robot"
        />
      )}
    </div>
  );
}

export function Home() {
  const location = useLocation();
  const { db } = useCMS();

  const heroTitle = db?.pages?.home?.heroTitle || 'TRUSTED AI FOR ENTERPRISE.';
  const heroSubtitle = db?.pages?.home?.heroSubtitle || 'INDEPENDENT QUALITY ASSURANCE, MANAGED DELIVERY, AND GOVERNANCE IN ONE PLATFORM.';

  // Scroll to section if defined in URL query
  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const section = params.get('section');
    if (section) {
      const element = document.getElementById(section);
      if (element) {
        element.scrollIntoView({ behavior: 'smooth' });
      }
    }
  }, [location]);

  return (
    <div className="w-full">
      <SEO 
        title="Enterprise AI Quality & Governance" 
        description="Vyomatrix helps organizations deploy AI they can trust, with independent quality assurance, managed delivery, and an enterprise governance platform." 
        canonical="/" 
      />
      
      {/* ===== HERO SECTION — Responsive Desktop & Mobile ===== */}
      <section
        id="hero"
        className="relative w-full min-h-screen bg-black overflow-hidden flex flex-col lg:flex-row lg:items-center justify-between pt-24 pb-16 lg:py-0"
      >
        {/* Radial gradient glow */}
        <div className="absolute top-0 right-0 w-full lg:w-[65%] h-full bg-[radial-gradient(ellipse_at_80%_50%,rgba(80,60,160,0.35)_0%,rgba(30,20,80,0.18)_40%,transparent_70%)] pointer-events-none z-0" />

        {/* Content container */}
        <div className="relative z-10 w-full max-w-7xl mx-auto px-6 sm:px-12 pt-2 lg:pt-20 flex flex-col lg:flex-row items-center justify-between gap-8">

          {/* MOBILE 3D ROBOT: Smooth edge fade with zero square box border */}
          <div
            className="block lg:hidden w-full h-[330px] sm:h-[400px] relative pointer-events-auto overflow-hidden"
            style={{
              maskImage: 'radial-gradient(ellipse at center, black 65%, transparent 100%)',
              WebkitMaskImage: 'radial-gradient(ellipse at center, black 65%, transparent 100%)',
            }}
          >
            <SplineRobotViewer sceneUrl="https://prod.spline.design/82srUI5BfSZ7QCVY/scene.splinecode" />
          </div>

          {/* Left Text Content */}
          <div className="w-full lg:max-w-[520px] text-left">

            {/* Badge pill — "INTRODUCING △" style */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6 }}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '8px',
                border: '1px solid rgba(139,92,246,0.7)',
                borderRadius: '999px',
                padding: '6px 18px',
                marginBottom: '32px',
                background: 'transparent',
              }}
            >
              <span style={{ color: '#fff', fontFamily: 'inherit', fontSize: '12px', fontWeight: 600, letterSpacing: '0.15em', textTransform: 'uppercase' }}>
                INTRODUCING
              </span>
              <span style={{ color: '#a78bfa', fontSize: '14px' }}>△</span>
            </motion.div>

            {/* Main Heading — huge uppercase, bold, white */}
            <motion.h1
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.7, delay: 0.15 }}
              style={{
                fontFamily: 'Sora, sans-serif',
                fontSize: 'clamp(40px, 6vw, 88px)',
                fontWeight: 800,
                lineHeight: 1.0,
                letterSpacing: '-0.02em',
                color: '#ffffff',
                textTransform: 'uppercase',
                margin: '0 0 24px 0',
              }}
            >
              {heroTitle.split('FOR').length > 1 ? (
                <>
                  {heroTitle.split('FOR')[0]}<br />
                  <span style={{ color: '#ffffff' }}>FOR</span><br />
                  <span style={{
                    backgroundImage: 'linear-gradient(90deg, #a78bfa, #60a5fa)',
                    WebkitBackgroundClip: 'text',
                    WebkitTextFillColor: 'transparent',
                    backgroundClip: 'text',
                  }}>{heroTitle.split('FOR')[1].trim()}</span>
                </>
              ) : (
                heroTitle
              )}
            </motion.h1>

            {/* Subtitle */}
            <motion.p
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.3 }}
              style={{
                color: 'rgba(255,255,255,0.55)',
                fontSize: '14px',
                lineHeight: 1.7,
                fontWeight: 400,
                letterSpacing: '0.05em',
                textTransform: 'uppercase',
                maxWidth: '420px',
                margin: '0 0 40px 0',
              }}
            >
              {heroSubtitle}
            </motion.p>

            {/* CTA Buttons */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.45 }}
              style={{ display: 'flex', gap: '16px', flexWrap: 'wrap', alignItems: 'center' }}
            >
              {/* Outlined button */}
              <Link
                to="/academy"
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '6px',
                  padding: '12px 28px',
                  border: '1px solid rgba(167,139,250,0.6)',
                  borderRadius: '999px',
                  color: '#a78bfa',
                  fontWeight: 600,
                  fontSize: '14px',
                  textDecoration: 'none',
                  background: 'transparent',
                  transition: 'all 0.2s',
                  letterSpacing: '0.02em',
                }}
                onMouseEnter={e => { (e.currentTarget as HTMLAnchorElement).style.background = 'rgba(167,139,250,0.1)'; }}
                onMouseLeave={e => { (e.currentTarget as HTMLAnchorElement).style.background = 'transparent'; }}
              >
                Academy &gt;
              </Link>

              {/* Filled button */}
              <Link
                to="/contact"
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '6px',
                  padding: '12px 28px',
                  borderRadius: '999px',
                  color: '#000',
                  fontWeight: 700,
                  fontSize: '14px',
                  textDecoration: 'none',
                  background: '#ffffff',
                  transition: 'all 0.2s',
                  letterSpacing: '0.02em',
                  border: '1px solid transparent',
                }}
                onMouseEnter={e => { (e.currentTarget as HTMLAnchorElement).style.background = '#e0e0e0'; }}
                onMouseLeave={e => { (e.currentTarget as HTMLAnchorElement).style.background = '#ffffff'; }}
              >
                Get Started &gt;
              </Link>
            </motion.div>
          </div>
        </div>

        {/* DESKTOP 3D ROBOT: Positioned on right side on desktop (>=1024px) */}
        <div className="hidden lg:block absolute right-0 top-0 w-[62%] h-full z-1 pointer-events-auto overflow-hidden will-change-transform">
          <SplineRobotViewer sceneUrl="https://prod.spline.design/82srUI5BfSZ7QCVY/scene.splinecode" />
        </div>
      </section>

      {/* Intro Line */}
      <section className="py-24 bg-[#f2f3f1] border-b border-[#dfe3df] relative overflow-hidden">
        {/* Prominent Floating 3D Background Decorations */}
        <motion.div 
          animate={{ rotateZ: 360, rotateX: 360, y: [0, -20, 0] }}
          transition={{ duration: 25, repeat: Infinity, ease: "linear" }}
          className="absolute -top-10 -right-10 w-48 h-48 opacity-20 pointer-events-none"
          style={{ transformStyle: 'preserve-3d' }}
        >
          <div className="absolute inset-0 border-[3px] border-primary rounded-lg" style={{ transform: 'rotateX(45deg) rotateY(45deg)' }}></div>
          <div className="absolute inset-0 border-[3px] border-cyan-400 rounded-lg" style={{ transform: 'rotateX(-45deg) rotateY(-45deg)' }}></div>
        </motion.div>
        
        <motion.div 
          animate={{ rotateZ: -360, rotateY: 360, y: [0, 20, 0] }}
          transition={{ duration: 30, repeat: Infinity, ease: "linear" }}
          className="absolute -bottom-20 -left-10 w-64 h-64 opacity-10 pointer-events-none text-primary"
          style={{ transformStyle: 'preserve-3d' }}
        >
          <div className="absolute inset-0 border-2 border-dashed border-primary rounded-full" style={{ transform: 'rotateX(75deg)' }}></div>
          <div className="absolute inset-0 border-2 border-primary rounded-full" style={{ transform: 'rotateX(75deg) translateZ(40px)' }}></div>
        </motion.div>

        <div className="max-w-7xl mx-auto px-6 text-center relative z-10">
          <AnimatedSection>
            <h2 className="text-3xl md:text-4xl font-semibold text-[#111111]">
              Three core pillars to deploy AI you can trust.
            </h2>
            <p className="mt-6 text-xl text-[#4a4a4a] max-w-3xl mx-auto">We provide an end-to-end ecosystem for enterprise AI adoption, ensuring safety and compliance at every step of your journey.</p>
          </AnimatedSection>
        </div>
      </section>

      {/* How It Works / Methodology */}
      <section className="py-24 bg-[#f1f3f0] border-b border-[#dfe3df] relative overflow-hidden">
        {/* 3D Grid & Floating Tech Objects */}
        <div className="absolute inset-0 opacity-100 pointer-events-none" style={{ backgroundImage: 'linear-gradient(rgba(17,17,17,0.05) 1px, transparent 1px), linear-gradient(90deg, rgba(17,17,17,0.05) 1px, transparent 1px)', backgroundSize: '40px 40px' }}></div>
        
        <motion.div 
          animate={{ y: [-15, 15, -15], rotateY: [0, 180, 360] }}
          transition={{ duration: 20, repeat: Infinity, ease: "linear" }}
          className="absolute bottom-10 left-10 w-32 h-32 opacity-20 pointer-events-none text-cyan-400"
        >
          <Cpu size={128} strokeWidth={1} />
        </motion.div>

        <motion.div 
          animate={{ y: [15, -15, 15], rotateY: [360, 180, 0] }}
          transition={{ duration: 22, repeat: Infinity, ease: "linear" }}
          className="absolute top-10 right-10 w-32 h-32 opacity-10 pointer-events-none text-primary"
        >
          <Database size={128} strokeWidth={1} />
        </motion.div>

        <div className="max-w-7xl mx-auto px-6 relative z-10">
          <AnimatedSection className="text-center mb-16">
            <div className="inline-block px-4 py-1 bg-[#dff5fa] text-cyan-700 font-bold text-sm rounded-full mb-4 border border-[#8bcfe3] shadow-sm">Our Methodology</div>
            <h2 className="text-3xl md:text-4xl font-bold text-[#111111] font-heading">How We Ensure AI Excellence</h2>
          </AnimatedSection>
          <div className="grid md:grid-cols-3 gap-8">
            {[
              { step: '01', title: 'Audit & Assess', desc: 'We conduct rigorous stress-testing and baseline evaluations of your models to identify vulnerabilities and accuracy gaps before they hit production.', icon: Search },
              { step: '02', title: 'Build & Refine', desc: 'Our managed services team implements robust guardrails, human-in-the-loop annotations, and integrates secure AI solutions directly into your workflows.', icon: Settings },
              { step: '03', title: 'Monitor & Govern', desc: 'Using our enterprise platform, we provide 24/7 continuous monitoring, automated compliance logging, and real-time health dashboards.', icon: LayoutDashboard }
            ].map((item, i) => (
              <AnimatedSection key={i} delay={i * 0.1} className="relative bg-[#edf1f0] backdrop-blur-md p-8 rounded-xl shadow-[0_8px_24px_rgba(17,24,39,0.08)] border border-[#7b888d] hover:border-cyan-500/60 hover:-translate-y-0.5 transition-all overflow-hidden group">
                <div className="text-8xl font-black text-black/5 absolute -top-4 -right-4 group-hover:text-cyan-400/10 transition-colors">{item.step}</div>
                <div className="w-14 h-14 bg-[#dfeef3] rounded-xl flex items-center justify-center mb-6 text-cyan-700 border border-[#4a6f7c] shadow-sm">
                  <item.icon size={28} />
                </div>
                <h3 className="text-2xl font-bold text-[#0b0b0b] mb-4 relative z-10">{item.title}</h3>
                <p className="text-[#1f1f1f] leading-relaxed relative z-10">{item.desc}</p>
              </AnimatedSection>
            ))}
          </div>
        </div>
      </section>

      {/* Offerings - AI Quality & Assurance */}
      <section id="quality" className="py-24 bg-[#050505] relative overflow-hidden">
        {/* Floating 3D Background Decoration */}
        <motion.div 
          animate={{ y: [-30, 30, -30], rotateX: [-20, 20, -20], rotateY: [0, 180, 360] }}
          transition={{ duration: 25, repeat: Infinity, ease: "linear" }}
          className="absolute top-20 right-20 w-64 h-64 opacity-[0.12] pointer-events-none text-primary"
          style={{ transformStyle: 'preserve-3d' }}
        >
          <div className="absolute inset-0 border-[6px] border-primary rounded-full border-dashed" style={{ transform: 'rotateX(60deg)' }}></div>
          <div className="absolute inset-0 border-[6px] border-blue-500 rounded-full border-dashed" style={{ transform: 'rotateY(60deg)' }}></div>
          <ShieldAlert size={160} className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2" />
        </motion.div>

        <div className="max-w-7xl mx-auto px-6 grid md:grid-cols-2 gap-16 items-center relative z-10">
          <AnimatedSection direction="left">
            <div className="w-16 h-16 bg-cyan-500/10 border border-cyan-500/30 flex items-center justify-center rounded-xl mb-8 shadow-[0_0_15px_rgba(34,211,238,0.15)]">
              <ShieldCheck className="text-cyan-400" size={32} />
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
                <div key={i} className="flex flex-col p-5 bg-white/5 backdrop-blur-sm border border-white/10 rounded-xl hover:border-cyan-400/50 hover:shadow-[0_0_20px_rgba(34,211,238,0.1)] transition-all">
                  <item.icon className="text-cyan-400 mb-3" size={24} strokeWidth={1.5} />
                  <strong className="text-white font-bold text-sm mb-1">{item.title}</strong>
                  <span className="text-silver text-xs leading-relaxed">{item.desc}</span>
                </div>
              ))}
            </div>
            <Button to="/contact?interest=quality" className="!bg-cyan-500 !text-black hover:!bg-cyan-400 shadow-[0_0_15px_rgba(34,211,238,0.3)]">Enquire Now</Button>
          </AnimatedSection>
          
          <AnimatedSection direction="right" className="relative h-[450px] bg-[#0A0A0C]/50 rounded-2xl shadow-inner border border-white/5 overflow-hidden hidden md:flex items-center justify-center">
            <div className="absolute inset-0 opacity-10" style={{ backgroundImage: 'radial-gradient(rgba(34,211,238,0.4) 1px, transparent 1px)', backgroundSize: '24px 24px' }}></div>
            <div className="relative z-10 grid grid-cols-2 gap-6">
              <div className="w-32 h-32 bg-white/5 backdrop-blur-md rounded-xl shadow-lg flex items-center justify-center border border-white/10 animate-[bounce_4s_infinite]"><Target size={48} className="text-cyan-400" strokeWidth={1}/></div>
              <div className="w-32 h-32 bg-cyan-500/20 backdrop-blur-md text-cyan-300 rounded-xl shadow-[0_0_20px_rgba(34,211,238,0.2)] border border-cyan-500/30 flex items-center justify-center translate-y-12 animate-[bounce_5s_infinite]"><ShieldCheck size={48} strokeWidth={1}/></div>
              <div className="w-32 h-32 bg-white/5 backdrop-blur-md rounded-xl shadow-lg flex items-center justify-center border border-white/10 -translate-y-8 animate-[bounce_6s_infinite]"><Activity size={48} className="text-blue-400" strokeWidth={1}/></div>
              <div className="w-32 h-32 bg-blue-500/20 backdrop-blur-md text-blue-300 rounded-xl shadow-[0_0_20px_rgba(59,130,246,0.2)] border border-blue-500/30 flex items-center justify-center translate-y-4 animate-[bounce_4.5s_infinite]"><ClipboardCheck size={48} strokeWidth={1}/></div>
            </div>
          </AnimatedSection>
        </div>
      </section>

      {/* Offerings - Managed AI Services */}
      <section id="managed" className="py-24 bg-[#0A0A0C] border-y border-white/10 relative overflow-hidden">
        {/* Giant Floating Robotics SVG */}
        <motion.div 
          animate={{ y: [40, -40, 40], rotateZ: [-5, 5, -5] }}
          transition={{ duration: 18, repeat: Infinity, ease: "easeInOut" }}
          className="absolute top-1/3 left-5 w-80 h-80 opacity-10 pointer-events-none text-cyan-400"
        >
          <Bot size={320} strokeWidth={1.5} />
        </motion.div>
        
        {/* Floating Core */}
        <motion.div 
          animate={{ rotateZ: 360, rotateX: [10, -10, 10], rotateY: [10, -10, 10] }}
          transition={{ duration: 20, repeat: Infinity, ease: "linear" }}
          className="absolute bottom-20 right-20 w-40 h-40 opacity-15 pointer-events-none text-primary"
          style={{ transformStyle: 'preserve-3d' }}
        >
          <div className="absolute inset-0 border-[4px] border-blue-500 rounded-full" style={{ transform: 'rotateX(45deg)' }}></div>
          <div className="absolute inset-0 border-[4px] border-cyan-400 rounded-full" style={{ transform: 'rotateY(45deg)' }}></div>
          <Network size={80} className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2" />
        </motion.div>

        <div className="max-w-7xl mx-auto px-6 relative z-10">
          <AnimatedSection className="mb-16 text-center max-w-3xl mx-auto">
            <div className="w-16 h-16 bg-cyan-500/10 border border-cyan-500/30 flex items-center justify-center rounded-xl mb-8 shadow-[0_0_15px_rgba(34,211,238,0.15)] mx-auto">
              <Cpu className="text-cyan-400" size={32} />
            </div>
            <h2 className="text-3xl md:text-4xl font-bold mb-4 text-white font-heading">Managed AI Services</h2>
            <p className="text-xl md:text-2xl text-cyan-400 font-medium mb-6">"We build, deploy and run your AI, at the right cost."</p>
            <p className="text-silver text-lg leading-relaxed font-light">
              We take over the AI work you would rather not build or staff in-house, from implementing AI bots and assistants to the human quality operations behind them, all delivered with our quality guarantee.
            </p>
          </AnimatedSection>

          <div className="grid md:grid-cols-2 gap-12 mb-16 items-start">
            <AnimatedSection direction="left" className="bg-white/5 backdrop-blur-md p-8 rounded-2xl shadow-lg border border-white/10 h-full hover:border-cyan-400/50 transition-all">
              <h3 className="text-2xl font-bold mb-8 text-white flex items-center gap-3 pb-4 border-b border-white/10">
                <Bot className="text-cyan-400" size={28} /> We build and deploy
              </h3>
              <div className="space-y-8">
                {[
                  { title: 'AI bot and assistant implementation', desc: 'We design, build and deploy chatbots, voice agents and AI assistants.', icon: Bot },
                  { title: 'AI integration and development', desc: 'We build AI into your existing products and connect it to your systems.', icon: Code2 },
                  { title: 'Legacy modernization', desc: 'We bring older systems up to date faster using AI-accelerated development.', icon: RefreshCw },
                  { title: 'AI-powered QA and testing', desc: 'Automated testing and simulated users to catch flaws before release.', icon: TestTube2 }
                ].map((item, i) => (
                  <div key={i} className="flex gap-5">
                    <div className="mt-1 flex-shrink-0 w-10 h-10 bg-white/5 flex items-center justify-center rounded-xl border border-white/10">
                      <item.icon className="text-cyan-400" size={20} />
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
              <AnimatedSection direction="right" className="bg-white/5 backdrop-blur-md p-8 rounded-2xl shadow-lg border border-white/10 flex-grow hover:border-cyan-400/50 transition-all">
                <h3 className="text-2xl font-bold mb-8 text-white flex items-center gap-3 pb-4 border-b border-white/10">
                  <Activity className="text-cyan-400" size={28} /> We run and assure
                </h3>
                <div className="space-y-8">
                  {[
                    { title: 'Data annotation, evaluation & feedback', desc: 'The human work that keeps models accurate.', icon: ClipboardCheck },
                    { title: 'Content moderation, trust & safety', desc: 'And managed support operations.', icon: ShieldCheck }
                  ].map((item, i) => (
                    <div key={i} className="flex gap-5">
                      <div className="mt-1 flex-shrink-0 w-10 h-10 bg-white/5 flex items-center justify-center rounded-xl border border-white/10">
                        <item.icon className="text-cyan-400" size={20} />
                      </div>
                      <div>
                        <h4 className="font-bold text-white mb-1 text-lg">{item.title}</h4>
                        <p className="text-silver leading-relaxed">{item.desc}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </AnimatedSection>

              <AnimatedSection direction="right" delay={0.2} className="bg-gradient-to-br from-blue-600/20 to-cyan-500/20 backdrop-blur-md text-white p-8 rounded-2xl shadow-[0_0_30px_rgba(34,211,238,0.15)] border border-cyan-400/30">
                <h3 className="text-xl font-bold mb-4 flex items-center gap-3">
                  <ShieldCheck className="text-cyan-400" size={24} /> Our difference
                </h3>
                <p className="text-silver leading-relaxed">
                  We do not just build the AI, we stand behind its quality. The same independent assurance we sell on its own is built into everything we implement.
                </p>
              </AnimatedSection>
            </div>
          </div>

          <AnimatedSection className="text-center">
            <Button to="/contact?interest=managed" variant="primary" className="px-8 py-4 text-lg">
              Enquire
            </Button>
          </AnimatedSection>
        </div>
      </section>

      {/* Offerings - Platform */}
      {/* Offerings - Platform */}
      <section id="platform" className="py-24 bg-[#050505] relative overflow-hidden">
        {/* Isometric 3D Data Layers */}
        <motion.div 
          animate={{ y: [-20, 20, -20] }}
          transition={{ duration: 12, repeat: Infinity, ease: "easeInOut" }}
          className="absolute top-1/4 right-32 w-64 h-64 opacity-[0.12] pointer-events-none text-primary flex flex-col gap-8 items-center justify-center"
          style={{ transform: 'rotateX(60deg) rotateZ(45deg)', transformStyle: 'preserve-3d' }}
        >
          <div className="w-48 h-48 border-[6px] border-primary rounded-xl absolute" style={{ transform: 'translateZ(60px)' }}></div>
          <div className="w-48 h-48 border-[6px] border-cyan-400 rounded-xl absolute" style={{ transform: 'translateZ(0px)' }}></div>
          <div className="w-48 h-48 border-[6px] border-blue-500 rounded-xl absolute" style={{ transform: 'translateZ(-60px)' }}></div>
        </motion.div>

        <div className="max-w-7xl mx-auto px-6 grid md:grid-cols-2 gap-16 items-center relative z-10">
          <AnimatedSection direction="left">
            <div className="w-16 h-16 bg-cyan-500/10 border border-cyan-500/30 flex items-center justify-center rounded-xl mb-8 shadow-[0_0_15px_rgba(34,211,238,0.15)]">
              <Layers className="text-cyan-400" size={32} />
            </div>
            <div className="font-mono text-xs font-bold tracking-widest text-cyan-400 mb-6 uppercase flex items-center gap-2">
              <div className="w-2 h-2 rounded-full bg-cyan-400 animate-pulse shadow-[0_0_8px_#22d3ee]"></div> Pre-launch
            </div>
            <h2 className="text-3xl md:text-4xl font-bold mb-4 text-white font-heading">Platform</h2>
            <p className="text-xl md:text-2xl text-cyan-400 font-medium mb-6">"One platform for AI quality, governance and accountability."</p>
            <p className="text-silver text-lg mb-8 leading-relaxed font-light">
              Configurable quality and compliance modules on a single platform, with a permanent audit trail and ready-made packs for banking, healthcare, government and telco.
            </p>
            <div className="space-y-4 mb-10">
              {[
                { title: 'Quality and monitoring modules', icon: Settings },
                { title: 'Immutable audit trail', icon: FileLock2 },
                { title: 'Industry configuration packs', icon: Briefcase },
                { title: 'Provider resilience with failover', icon: ServerCrash }
              ].map((item, i) => (
                <div key={i} className="flex items-center gap-4 p-4 bg-white/5 backdrop-blur-sm border border-white/10 rounded-xl hover:border-cyan-400/50 hover:shadow-[0_0_20px_rgba(34,211,238,0.1)] transition-all">
                  <div className="w-10 h-10 bg-cyan-500/20 rounded-xl flex items-center justify-center flex-shrink-0 shadow-sm border border-cyan-500/30">
                    <item.icon className="text-cyan-400" size={20} strokeWidth={2} />
                  </div>
                  <strong className="text-white font-bold">{item.title}</strong>
                </div>
              ))}
            </div>
            <Button to="/contact?interest=platform" className="!bg-cyan-500 !text-black hover:!bg-cyan-400 px-8 py-4 text-lg shadow-[0_0_15px_rgba(34,211,238,0.3)]">Request a demo</Button>
          </AnimatedSection>

          <AnimatedSection direction="right" className="relative h-[450px] bg-[#0A0A0C]/50 rounded-2xl shadow-inner border border-white/5 overflow-hidden hidden md:flex items-center justify-center">
             <div className="w-full max-w-md p-8 bg-white/10 backdrop-blur-xl shadow-[0_0_50px_rgba(34,211,238,0.1)] rounded-2xl border border-white/20 relative z-10">
                <div className="flex justify-between items-center mb-6 border-b border-white/20 pb-4">
                  <div className="flex gap-2"><div className="w-3 h-3 rounded-full bg-red-400/80"></div><div className="w-3 h-3 rounded-full bg-yellow-400/80"></div><div className="w-3 h-3 rounded-full bg-green-400/80"></div></div>
                  <Layers className="text-silver" size={16} />
                </div>
                <div className="space-y-4">
                  <div className="w-full bg-white/5 p-4 rounded-xl flex items-center justify-between border border-white/10 hover:border-cyan-400/30 transition-colors">
                    <div className="flex items-center gap-3"><Settings size={18} className="text-cyan-400"/><span className="text-sm font-bold text-white">Quality Monitor</span></div>
                    <CheckCircle2 size={18} className="text-green-400"/>
                  </div>
                  <div className="w-full bg-white/5 p-4 rounded-xl flex items-center justify-between border border-white/10 hover:border-cyan-400/30 transition-colors">
                    <div className="flex items-center gap-3"><FileLock2 size={18} className="text-cyan-400"/><span className="text-sm font-bold text-white">Audit Logger</span></div>
                    <CheckCircle2 size={18} className="text-green-400"/>
                  </div>
                  <div className="w-full bg-gradient-to-r from-cyan-500/20 to-blue-500/20 p-4 rounded-xl flex items-center justify-between shadow-[0_0_20px_rgba(34,211,238,0.15)] border border-cyan-400/30 text-white">
                    <div className="flex items-center gap-3"><ShieldCheck size={18} className="text-cyan-400"/><span className="text-sm font-bold">Healthcare Pack</span></div>
                    <span className="text-xs font-mono bg-cyan-500/30 text-cyan-300 border border-cyan-400/50 px-2 py-1 rounded-sm">Active</span>
                  </div>
                </div>
             </div>
          </AnimatedSection>
        </div>
      </section>

      {/* Academy Teaser */}
      <section className="bg-primary text-white border-y border-primary-dark">
        <div className="max-w-7xl mx-auto px-6 py-12 flex flex-col md:flex-row items-center justify-between gap-8">
          <AnimatedSection direction="right" className="max-w-3xl flex items-center gap-6">
            <div className="hidden md:flex w-16 h-16 bg-white/10 rounded-sm items-center justify-center flex-shrink-0">
              <Lightbulb size={32} className="text-white" />
            </div>
            <div>
              <h3 className="text-2xl font-bold mb-2">Vyomatrix Academy</h3>
              <p className="text-white/90 text-lg leading-relaxed">
                Train for a career in AI quality and evaluation, on real production work.
              </p>
            </div>
          </AnimatedSection>
          <AnimatedSection direction="left">
            <Button to="/academy" className="!bg-white !text-primary hover:!bg-silver-light whitespace-nowrap flex items-center gap-2 px-6 py-3 text-lg shadow-lg">
              Explore the Academy <ArrowRight size={18} />
            </Button>
          </AnimatedSection>
        </div>
      </section>

      {/* Success Stories */}
      <section className="py-24 bg-[#0A0A0C] border-b border-white/10">
        <div className="max-w-7xl mx-auto px-6">
          <AnimatedSection className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold text-white font-heading mb-4">Trusted by Industry Leaders</h2>
            <p className="text-xl text-silver max-w-2xl mx-auto">Real results from enterprises deploying compliant, high-quality AI at scale.</p>
          </AnimatedSection>
          <div className="grid md:grid-cols-2 gap-8">
            <AnimatedSection direction="left" className="bg-white/5 backdrop-blur-md p-10 rounded-2xl shadow-lg border border-white/10 relative overflow-hidden group hover:border-cyan-400/50 transition-all">
              <div className="absolute top-0 left-0 w-1 h-full bg-cyan-400 shadow-[0_0_15px_#22d3ee]"></div>
              <div className="flex items-center gap-4 mb-6">
                <div className="w-12 h-12 bg-cyan-500/10 rounded-xl flex items-center justify-center text-cyan-400 border border-cyan-500/30"><Landmark size={24} /></div>
                <div>
                  <h4 className="font-bold text-white">Global Retail Bank</h4>
                  <p className="text-xs text-cyan-400 font-bold uppercase tracking-wider">AI Quality Audit</p>
                </div>
              </div>
              <p className="text-silver text-lg italic mb-6">"Vyomatrix's rigorous auditing caught critical hallucination vulnerabilities in our customer-facing chatbot before launch. Their ongoing monitoring gives our compliance team complete peace of mind."</p>
              <div className="flex gap-1 text-cyan-400"><Star size={16} fill="currentColor"/><Star size={16} fill="currentColor"/><Star size={16} fill="currentColor"/><Star size={16} fill="currentColor"/><Star size={16} fill="currentColor"/></div>
            </AnimatedSection>
            
            <AnimatedSection direction="right" className="bg-white/5 backdrop-blur-md p-10 rounded-2xl shadow-lg border border-white/10 relative overflow-hidden group hover:border-cyan-400/50 transition-all">
              <div className="absolute top-0 left-0 w-1 h-full bg-cyan-400 shadow-[0_0_15px_#22d3ee]"></div>
              <div className="flex items-center gap-4 mb-6">
                <div className="w-12 h-12 bg-cyan-500/10 rounded-xl flex items-center justify-center text-cyan-400 border border-cyan-500/30"><HeartPulse size={24} /></div>
                <div>
                  <h4 className="font-bold text-white">National Healthcare Provider</h4>
                  <p className="text-xs text-cyan-400 font-bold uppercase tracking-wider">Managed AI Services</p>
                </div>
              </div>
              <p className="text-silver text-lg italic mb-6">"They didn't just build our patient triaging assistant; they provided the medical annotators to ensure it met strict clinical accuracy standards. Exceptional end-to-end delivery."</p>
              <div className="flex gap-1 text-cyan-400"><Star size={16} fill="currentColor"/><Star size={16} fill="currentColor"/><Star size={16} fill="currentColor"/><Star size={16} fill="currentColor"/><Star size={16} fill="currentColor"/></div>
            </AnimatedSection>
          </div>
        </div>
      </section>

      {/* Why Vyomatrix & Who We Serve */}
      <section className="py-24 bg-[#050505]">
        <div className="max-w-7xl mx-auto px-6">
          <AnimatedSection className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold text-white font-heading">Why Vyomatrix</h2>
          </AnimatedSection>
          
          <div className="grid md:grid-cols-3 gap-12 mb-24">
            {[
              {
                title: "Independent accountability",
                desc: "We check AI so you can prove it works, to customers and regulators.",
                icon: <Scale className="text-cyan-400 mb-6" size={40} strokeWidth={1.5} />
              },
              {
                title: "Local-language depth",
                desc: "Quality assured in Southeast Asian languages, including Bahasa Melayu, that others overlook.",
                icon: <Globe className="text-cyan-400 mb-6" size={40} strokeWidth={1.5} />
              },
              {
                title: "Built-in cost advantage",
                desc: "An efficient delivery corridor that keeps quality high and cost competitive.",
                icon: <TrendingDown className="text-cyan-400 mb-6" size={40} strokeWidth={1.5} />
              }
            ].map((item, i) => (
              <AnimatedSection key={i} delay={i * 0.1}>
                <div className="p-8 border border-white/10 rounded-2xl bg-white/5 backdrop-blur-sm hover:bg-white/10 hover:border-cyan-400/50 hover:shadow-[0_0_30px_rgba(34,211,238,0.1)] transition-all duration-300 h-full">
                  <div className="w-16 h-16 bg-cyan-500/10 rounded-xl flex items-center justify-center shadow-sm border border-cyan-500/30 mb-6">
                    {item.icon}
                  </div>
                  <h4 className="text-xl font-bold mb-4 text-white font-heading">{item.title}</h4>
                  <p className="text-silver text-base leading-relaxed">{item.desc}</p>
                </div>
              </AnimatedSection>
            ))}
          </div>

          <AnimatedSection className="text-center border-t border-white/10 pt-16">
            <h3 className="font-mono text-xs font-bold tracking-widest text-silver mb-8 uppercase">Who we serve</h3>
            <div className="flex flex-wrap justify-center gap-4">
              {[
                { name: 'Banking', icon: Landmark },
                { name: 'Healthcare', icon: HeartPulse },
                { name: 'Government', icon: Building2 },
                { name: 'Telco', icon: Signal },
                { name: 'AI-first companies', icon: Lightbulb }
              ].map((industry) => (
                <span key={industry.name} className="px-6 py-3 border border-white/10 rounded-xl text-sm font-bold text-silver bg-white/5 flex items-center gap-2 hover:border-cyan-400/50 hover:text-cyan-400 transition-colors backdrop-blur-sm">
                  <industry.icon size={18} className="text-cyan-400" />
                  {industry.name}
                </span>
              ))}
            </div>
          </AnimatedSection>
        </div>
      </section>

      {/* Final CTA */}
      <section className="bg-gradient-to-r from-blue-900 to-primary text-white py-24 text-center border-y border-cyan-400/20 relative overflow-hidden">
        <div className="absolute inset-0 opacity-20" style={{ backgroundImage: 'radial-gradient(circle at center, rgba(34,211,238,0.8) 0, transparent 50%)' }}></div>
        <div className="max-w-3xl mx-auto px-6 relative z-10">
          <AnimatedSection>
            <h2 className="text-4xl md:text-5xl font-bold mb-8 font-heading">Ready to deploy AI you can trust?</h2>
            <Button to="/contact" className="!bg-cyan-400 !text-black hover:!bg-cyan-300 text-lg px-10 py-4 shadow-[0_0_30px_rgba(34,211,238,0.4)] font-bold">
              Talk to us
            </Button>
          </AnimatedSection>
        </div>
      </section>
    </div>
  );
}

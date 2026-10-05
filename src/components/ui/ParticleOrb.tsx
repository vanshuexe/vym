import React, { useEffect, useRef } from 'react';
import { motion } from 'motion/react';
import { ShieldCheck, Cpu, Globe, Activity } from 'lucide-react';

interface Particle {
  theta: number;
  phi: number;
  radius: number;
  size: number;
  alpha: number;
  speed: number;
  color: string;
  glowColor: string;
}

interface OrbitalDot {
  angle: number;
  orbitRadius: number;
  orbitTilt: number;
  orbitTiltAxis: number;
  size: number;
  speed: number;
  color: string;
  glow: string;
  trail: { x: number; y: number }[];
}

export function ParticleOrb() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animFrameRef = useRef<number>(0);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const resize = () => {
      const dpr = window.devicePixelRatio || 1;
      canvas.width = canvas.offsetWidth * dpr;
      canvas.height = canvas.offsetHeight * dpr;
      ctx.scale(dpr, dpr);
    };
    resize();
    window.addEventListener('resize', resize);

    const W = () => canvas.offsetWidth;
    const H = () => canvas.offsetHeight;
    const CX = () => W() / 2;
    const CY = () => H() / 2;

    const NUM_PARTICLES = 180;
    const getOrbR = () => Math.min(W(), H()) * 0.28;

    const colors = [
      { c: '#22d3ee', g: 'rgba(34,211,238,' },
      { c: '#60a5fa', g: 'rgba(96,165,250,' },
      { c: '#a5f3fc', g: 'rgba(165,243,252,' },
      { c: '#ffffff', g: 'rgba(255,255,255,' },
    ];

    const particles: Particle[] = Array.from({ length: NUM_PARTICLES }, (_, i) => {
      const isInner = i < 60;
      const isStray = i >= 140;
      const orbR = getOrbR();
      const col = colors[Math.floor(Math.random() * colors.length)];
      return {
        theta: Math.random() * Math.PI * 2,
        phi: Math.acos(2 * Math.random() - 1),
        radius: isInner
          ? orbR * (0.3 + Math.random() * 0.3)
          : isStray
          ? orbR * (1.0 + Math.random() * 0.4)
          : orbR * (0.85 + Math.random() * 0.15),
        size: isStray ? 1 + Math.random() * 1.5 : 1.5 + Math.random() * 2,
        alpha: 0.3 + Math.random() * 0.7,
        speed: (Math.random() - 0.5) * 0.004,
        color: col.c,
        glowColor: col.g,
      };
    });

    const orbR0 = getOrbR();
    const orbitDots: OrbitalDot[] = [
      { angle: 0, orbitRadius: orbR0 * 0.95, orbitTilt: 70, orbitTiltAxis: 0, size: 4, speed: 0.018, color: '#22d3ee', glow: 'rgba(34,211,238,', trail: [] },
      { angle: Math.PI, orbitRadius: orbR0 * 0.95, orbitTilt: 70, orbitTiltAxis: 0, size: 3, speed: 0.018, color: '#a5f3fc', glow: 'rgba(165,243,252,', trail: [] },
      { angle: 0, orbitRadius: orbR0 * 0.95, orbitTilt: 70, orbitTiltAxis: 90, size: 3.5, speed: -0.013, color: '#60a5fa', glow: 'rgba(96,165,250,', trail: [] },
      { angle: Math.PI * 0.7, orbitRadius: orbR0 * 0.95, orbitTilt: 70, orbitTiltAxis: 90, size: 2.5, speed: -0.013, color: '#3b82f6', glow: 'rgba(59,130,246,', trail: [] },
      { angle: Math.PI * 0.3, orbitRadius: orbR0 * 1.0, orbitTilt: 45, orbitTiltAxis: 45, size: 2, speed: 0.022, color: '#ffffff', glow: 'rgba(255,255,255,', trail: [] },
    ];

    let globalAngle = 0;
    let t = 0;

    const project3D = (x3: number, y3: number, z3: number, cx: number, cy: number) => {
      const cosX = Math.cos(0.3);
      const sinX = Math.sin(0.3);
      const y2 = y3 * cosX - z3 * sinX;
      const z2 = y3 * sinX + z3 * cosX;
      return { x: cx + x3, y: cy + y2, z: z2 };
    };

    const drawEllipseRing = (
      tilt: number,
      tiltAxis: number,
      rX: number,
      color: string,
      alpha: number,
      dash: number[] = []
    ) => {
      const cx = CX(), cy = CY();
      ctx.save();
      ctx.translate(cx, cy);
      ctx.rotate((tiltAxis * Math.PI) / 180);
      ctx.scale(1, Math.sin((tilt * Math.PI) / 180));
      ctx.rotate((-tiltAxis * Math.PI) / 180);
      ctx.beginPath();
      ctx.ellipse(0, 0, rX, rX, 0, 0, Math.PI * 2);
      ctx.strokeStyle = color;
      ctx.globalAlpha = alpha;
      ctx.lineWidth = 0.8;
      if (dash.length) ctx.setLineDash(dash);
      ctx.stroke();
      ctx.setLineDash([]);
      ctx.globalAlpha = 1;
      ctx.restore();
    };

    const draw = () => {
      const w = W(), h = H(), cx = CX(), cy = CY();
      const orbR = getOrbR();
      ctx.clearRect(0, 0, w, h);
      t += 0.008;
      globalAngle += 0.003;

      // Central core glow
      const coreRadius = orbR * 0.22;
      const coreGrad = ctx.createRadialGradient(cx, cy, 0, cx, cy, coreRadius * 3);
      coreGrad.addColorStop(0, 'rgba(34,211,238,0.25)');
      coreGrad.addColorStop(0.4, 'rgba(34,211,238,0.08)');
      coreGrad.addColorStop(1, 'rgba(34,211,238,0)');
      ctx.beginPath();
      ctx.arc(cx, cy, coreRadius * 3, 0, Math.PI * 2);
      ctx.fillStyle = coreGrad;
      ctx.fill();

      // Pulsing inner core
      const pulse = 0.85 + 0.15 * Math.sin(t * 2.5);
      const innerGrad = ctx.createRadialGradient(cx, cy, 0, cx, cy, coreRadius * pulse);
      innerGrad.addColorStop(0, 'rgba(165,243,252,0.6)');
      innerGrad.addColorStop(0.5, 'rgba(34,211,238,0.3)');
      innerGrad.addColorStop(1, 'rgba(34,211,238,0)');
      ctx.beginPath();
      ctx.arc(cx, cy, coreRadius * pulse, 0, Math.PI * 2);
      ctx.fillStyle = innerGrad;
      ctx.fill();

      // Wire rings
      drawEllipseRing(70, globalAngle * 30, orbR, 'rgba(34,211,238,0.35)', 1);
      drawEllipseRing(70, globalAngle * 30 + 90, orbR, 'rgba(34,211,238,0.25)', 1);
      drawEllipseRing(45, globalAngle * 30 + 45, orbR, 'rgba(96,165,250,0.2)', 1);
      drawEllipseRing(45, globalAngle * 30 - 45, orbR, 'rgba(96,165,250,0.15)', 1, [4, 6]);
      drawEllipseRing(15, 0, orbR * 1.12, 'rgba(34,211,238,0.07)', 1, [2, 8]);

      // Surface particles
      particles.forEach((p) => {
        p.theta += p.speed + globalAngle * 0.1;
        const cosP = Math.cos(p.phi);
        const sinP = Math.sin(p.phi);
        const cosT = Math.cos(p.theta);
        const sinT = Math.sin(p.theta);

        const x3 = p.radius * sinP * cosT;
        const y3 = p.radius * sinP * sinT;
        const z3 = p.radius * cosP;

        const proj = project3D(x3, y3, z3, cx, cy);
        const depthFactor = (proj.z + p.radius) / (2 * p.radius);
        const a = p.alpha * (0.2 + 0.8 * depthFactor);
        const s = p.size * (0.5 + 0.5 * depthFactor);

        const grad = ctx.createRadialGradient(proj.x, proj.y, 0, proj.x, proj.y, s * 4);
        grad.addColorStop(0, p.glowColor + a + ')');
        grad.addColorStop(1, p.glowColor + '0)');
        ctx.beginPath();
        ctx.arc(proj.x, proj.y, s * 4, 0, Math.PI * 2);
        ctx.fillStyle = grad;
        ctx.fill();

        ctx.beginPath();
        ctx.arc(proj.x, proj.y, s, 0, Math.PI * 2);
        ctx.fillStyle = p.color;
        ctx.globalAlpha = a;
        ctx.fill();
        ctx.globalAlpha = 1;
      });

      // Orbital dots with trails
      orbitDots.forEach((od) => {
        od.angle += od.speed;
        const tiltRad = (od.orbitTilt * Math.PI) / 180;
        const tiltAxisRad = ((od.orbitTiltAxis + globalAngle * 20) * Math.PI) / 180;

        const cosA = Math.cos(od.angle);
        const sinA = Math.sin(od.angle);

        const x3 = od.orbitRadius * cosA;
        const y3 = od.orbitRadius * sinA * Math.sin(tiltRad);
        const z3 = od.orbitRadius * sinA * Math.cos(tiltRad);

        const cosAxis = Math.cos(tiltAxisRad);
        const sinAxis = Math.sin(tiltAxisRad);
        const rx = x3 * cosAxis - y3 * sinAxis;
        const ry = x3 * sinAxis + y3 * cosAxis;

        const proj = project3D(rx, ry, z3, cx, cy);

        od.trail.push({ x: proj.x, y: proj.y });
        if (od.trail.length > 18) od.trail.shift();

        od.trail.forEach((pt, i) => {
          const trailA = (i / od.trail.length) * 0.5;
          const trailS = od.size * (i / od.trail.length) * 0.7;
          ctx.beginPath();
          ctx.arc(pt.x, pt.y, trailS, 0, Math.PI * 2);
          ctx.fillStyle = od.color;
          ctx.globalAlpha = trailA;
          ctx.fill();
          ctx.globalAlpha = 1;
        });

        const gGrad = ctx.createRadialGradient(proj.x, proj.y, 0, proj.x, proj.y, od.size * 5);
        gGrad.addColorStop(0, od.glow + '0.9)');
        gGrad.addColorStop(0.3, od.glow + '0.4)');
        gGrad.addColorStop(1, od.glow + '0)');
        ctx.beginPath();
        ctx.arc(proj.x, proj.y, od.size * 5, 0, Math.PI * 2);
        ctx.fillStyle = gGrad;
        ctx.fill();

        ctx.beginPath();
        ctx.arc(proj.x, proj.y, od.size, 0, Math.PI * 2);
        ctx.fillStyle = od.color;
        ctx.globalAlpha = 0.95;
        ctx.fill();
        ctx.globalAlpha = 1;
      });

      // Atmospheric outer glow
      const atmGrad = ctx.createRadialGradient(cx, cy, orbR * 0.8, cx, cy, orbR * 1.3);
      atmGrad.addColorStop(0, 'rgba(34,211,238,0)');
      atmGrad.addColorStop(0.7, 'rgba(34,211,238,0.03)');
      atmGrad.addColorStop(1, 'rgba(34,211,238,0)');
      ctx.beginPath();
      ctx.arc(cx, cy, orbR * 1.3, 0, Math.PI * 2);
      ctx.fillStyle = atmGrad;
      ctx.fill();

      animFrameRef.current = requestAnimationFrame(draw);
    };

    animFrameRef.current = requestAnimationFrame(draw);

    return () => {
      cancelAnimationFrame(animFrameRef.current);
      window.removeEventListener('resize', resize);
    };
  }, []);

  return (
    <div className="relative w-full h-full flex items-center justify-center" style={{ minHeight: '480px' }}>
      <canvas
        ref={canvasRef}
        className="absolute inset-0 w-full h-full"
        style={{ display: 'block' }}
      />

      {/* Security - Top Right */}
      <motion.div
        animate={{ y: [-10, 10, -10], x: [0, 5, 0] }}
        transition={{ duration: 6, repeat: Infinity, ease: 'easeInOut' }}
        className="absolute top-8 right-4 w-16 h-16 flex items-center justify-center rounded-2xl z-20"
        style={{
          background: 'rgba(10,10,14,0.85)',
          border: '1px solid rgba(34,211,238,0.4)',
          boxShadow: '0 0 24px rgba(34,211,238,0.25), inset 0 1px 0 rgba(255,255,255,0.08)',
          backdropFilter: 'blur(12px)',
        }}
      >
        <ShieldCheck className="text-cyan-400" size={30} />
      </motion.div>

      {/* CPU - Bottom Left */}
      <motion.div
        animate={{ y: [10, -10, 10], x: [0, -5, 0] }}
        transition={{ duration: 7, repeat: Infinity, ease: 'easeInOut', delay: 1 }}
        className="absolute bottom-8 left-4 w-14 h-14 flex items-center justify-center rounded-xl z-20"
        style={{
          background: 'rgba(10,10,14,0.85)',
          border: '1px solid rgba(96,165,250,0.4)',
          boxShadow: '0 0 20px rgba(96,165,250,0.25), inset 0 1px 0 rgba(255,255,255,0.06)',
          backdropFilter: 'blur(12px)',
        }}
      >
        <Cpu className="text-blue-400" size={26} />
      </motion.div>

      {/* Globe - Top Left */}
      <motion.div
        animate={{ y: [-8, 8, -8] }}
        transition={{ duration: 5, repeat: Infinity, ease: 'easeInOut', delay: 2 }}
        className="absolute top-16 left-2 w-12 h-12 flex items-center justify-center rounded-xl z-20"
        style={{
          background: 'rgba(10,10,14,0.8)',
          border: '1px solid rgba(255,255,255,0.12)',
          boxShadow: '0 0 15px rgba(255,255,255,0.06)',
          backdropFilter: 'blur(10px)',
        }}
      >
        <Globe className="text-slate-300" size={22} />
      </motion.div>

      {/* Activity - Bottom Right */}
      <motion.div
        animate={{ y: [-12, 12, -12], x: [5, -5, 5] }}
        transition={{ duration: 6.5, repeat: Infinity, ease: 'easeInOut', delay: 0.5 }}
        className="absolute bottom-12 right-2 w-14 h-14 flex items-center justify-center rounded-xl z-20"
        style={{
          background: 'rgba(10,10,14,0.85)',
          border: '1px solid rgba(45,212,191,0.4)',
          boxShadow: '0 0 18px rgba(45,212,191,0.2)',
          backdropFilter: 'blur(12px)',
        }}
      >
        <Activity className="text-teal-400" size={26} />
      </motion.div>
    </div>
  );
}

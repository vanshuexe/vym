import React, { useState, useEffect, useRef } from 'react';

const GIF_URL = 'https://ik.imagekit.io/kirgb3odmp/lokpo.gif';
const FALLBACK_STATIC_URL = 'https://ik.imagekit.io/kirgb3odmp/lokpo.png';
const GIF_DURATION_MS = 5000; // 74 frames at ~15fps = 5.0 seconds

// Module-level variable to maintain frozen state across SPA client route transitions
let sessionFrozenSrc: string | null = null;

interface NavbarLogoProps {
  className?: string;
  onClick?: () => void;
}

export function NavbarLogo({ className = "h-9 sm:h-12 w-auto object-contain", onClick }: NavbarLogoProps) {
  const [frozenSrc, setFrozenSrc] = useState<string | null>(sessionFrozenSrc);
  const [loadTime] = useState(() => Date.now());
  const imgRef = useRef<HTMLImageElement>(null);
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    if (sessionFrozenSrc) {
      setFrozenSrc(sessionFrozenSrc);
      return;
    }

    const freezeFrame = () => {
      const img = imgRef.current;
      if (!img) return;

      try {
        const canvas = document.createElement('canvas');
        canvas.width = img.naturalWidth || img.width || 800;
        canvas.height = img.naturalHeight || img.height || 150;
        const ctx = canvas.getContext('2d');
        if (ctx) {
          ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
          const dataUrl = canvas.toDataURL('image/png');
          sessionFrozenSrc = dataUrl;
          setFrozenSrc(dataUrl);
          return;
        }
      } catch (err) {
        console.warn('Canvas freeze failed, using fallback static logo:', err);
      }
      
      // Fallback to static URL if canvas capture failed
      sessionFrozenSrc = FALLBACK_STATIC_URL;
      setFrozenSrc(FALLBACK_STATIC_URL);
    };

    // Schedule freeze after GIF completes its animation loop
    timerRef.current = setTimeout(() => {
      freezeFrame();
    }, GIF_DURATION_MS);

    return () => {
      if (timerRef.current) {
        clearTimeout(timerRef.current);
      }
    };
  }, []);

  const handleImageLoad = () => {
    // If not already frozen, ensure timer is aligned with actual image load time
    if (!sessionFrozenSrc && !timerRef.current) {
      timerRef.current = setTimeout(() => {
        const img = imgRef.current;
        if (!img) return;
        try {
          const canvas = document.createElement('canvas');
          canvas.width = img.naturalWidth || img.width || 800;
          canvas.height = img.naturalHeight || img.height || 150;
          const ctx = canvas.getContext('2d');
          if (ctx) {
            ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
            const dataUrl = canvas.toDataURL('image/png');
            sessionFrozenSrc = dataUrl;
            setFrozenSrc(dataUrl);
            return;
          }
        } catch {
          // ignore
        }
        sessionFrozenSrc = FALLBACK_STATIC_URL;
        setFrozenSrc(FALLBACK_STATIC_URL);
      }, GIF_DURATION_MS);
    }
  };

  if (frozenSrc) {
    return (
      <img
        src={frozenSrc}
        alt="Vyomatrix logo"
        className={className}
        onClick={onClick}
      />
    );
  }

  return (
    <img
      ref={imgRef}
      src={`${GIF_URL}?t=${loadTime}`}
      alt="Vyomatrix logo"
      crossOrigin="anonymous"
      onLoad={handleImageLoad}
      className={className}
      onClick={onClick}
    />
  );
}

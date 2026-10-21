import React, { useEffect, useState, useRef } from 'react';
import KnowSphereLogo from './KnowSphereLogo';

/**
 * Animated splash screen shown when KnowSphere first loads.
 * Auto-dismisses smoothly after ~1.8 s.
 * Includes an immediate skip option so user is never blocked.
 */
export default function SplashScreen({ onDone }) {
  const [fadingOut, setFadingOut] = useState(false);
  const onDoneRef = useRef(onDone);
  onDoneRef.current = onDone;

  const handleFinish = useRef(() => {
    setFadingOut(true);
    setTimeout(() => {
      if (onDoneRef.current) onDoneRef.current();
    }, 350);
  }).current;

  useEffect(() => {
    const timer = setTimeout(() => {
      handleFinish();
    }, 1800);

    return () => clearTimeout(timer);
  }, [handleFinish]);

  return (
    <div className={`splash${fadingOut ? ' fade-out' : ''}`}>
      {/* Floating background circles */}
      <div className="splash-bg-circle" />
      <div className="splash-bg-circle" />
      <div className="splash-bg-circle" />

      {/* Skip button for instant bypass */}
      <button
        type="button"
        onClick={handleFinish}
        style={{
          position: 'absolute',
          top: 24,
          right: 24,
          background: 'rgba(255, 255, 255, 0.85)',
          border: '1px solid rgba(0, 0, 0, 0.08)',
          color: '#1D1D1F',
          boxShadow: '0 2px 8px rgba(0,0,0,0.05)',
          borderRadius: 99,
          padding: '5px 14px',
          fontSize: 12,
          fontWeight: 600,
          cursor: 'pointer',
          backdropFilter: 'blur(8px)',
          zIndex: 10,
          fontFamily: 'Inter, sans-serif',
          letterSpacing: '-0.01em',
          transition: 'all 0.15s ease',
        }}
        title="Skip intro and open KnowSphere immediately"
      >
        Skip Intro →
      </button>

      {/* Logo + wordmark */}
      <div className="splash-logo-wrap">
        <KnowSphereLogo size={120} color="#ffffff" />
        <div className="splash-wordmark">KnowSphere</div>
        <div className="splash-tagline">The Global Offline Library · Knowledge for everyone, everywhere.</div>
      </div>

      {/* Loading bar */}
      <div className="splash-progress">
        <div className="splash-bar-wrap">
          <div className="splash-bar-fill" />
        </div>
        <div className="splash-hint">Preparing your offline library…</div>
      </div>
    </div>
  );
}

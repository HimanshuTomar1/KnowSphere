import React from 'react';

/**
 * KnowSphereLogo — The Official Icon for KnowSphere: The Global Offline Library
 * Sleek, high-res geometric knowledge sphere with orbiting rings and core lattice.
 */
export default function KnowSphereLogo({ size = 48, className = '', color = '#ffffff' }) {
  const s = size;
  return (
    <svg
      width={s}
      height={s}
      viewBox="0 0 100 100"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      style={{ display: 'inline-block', verticalAlign: 'middle', flexShrink: 0 }}
      role="img"
      aria-label="KnowSphere Logo"
    >
      <defs>
        <radialGradient id="sphereCore" cx="38%" cy="32%" r="65%">
          <stop offset="0%" stopColor="#60A5FA" />
          <stop offset="45%" stopColor="#2563EB" />
          <stop offset="100%" stopColor="#1E3A8A" />
        </radialGradient>
        <linearGradient id="orbitRing" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#93C5FD" stopOpacity="0.9" />
          <stop offset="50%" stopColor="#60A5FA" stopOpacity="0.4" />
          <stop offset="100%" stopColor="#3B82F6" stopOpacity="0.8" />
        </linearGradient>
        <linearGradient id="equatorGlow" x1="0%" y1="50%" x2="100%" y2="50%">
          <stop offset="0%" stopColor="#38BDF8" stopOpacity="0.1" />
          <stop offset="50%" stopColor="#FFFFFF" stopOpacity="0.8" />
          <stop offset="100%" stopColor="#38BDF8" stopOpacity="0.1" />
        </linearGradient>
        <filter id="glow" x="-20%" y="-20%" width="140%" height="140%">
          <feGaussianBlur stdDeviation="3" result="blur" />
          <feComposite in="SourceGraphic" in2="blur" operator="over" />
        </filter>
      </defs>

      {/* Outer Orbit Halo */}
      <ellipse
        cx="50"
        cy="50"
        rx="46"
        ry="17"
        transform="rotate(-28 50 50)"
        stroke="url(#orbitRing)"
        strokeWidth="3.2"
        strokeDasharray="4 2"
        filter="url(#glow)"
      />

      {/* Main Knowledge Sphere */}
      <circle cx="50" cy="50" r="36" fill="url(#sphereCore)" />

      {/* Latitude grid lines */}
      <ellipse
        cx="50"
        cy="50"
        rx="36"
        ry="14"
        stroke="rgba(255, 255, 255, 0.35)"
        strokeWidth="1.8"
        fill="none"
      />
      <ellipse
        cx="50"
        cy="40"
        rx="30"
        ry="10"
        stroke="rgba(255, 255, 255, 0.2)"
        strokeWidth="1.4"
        fill="none"
      />
      <ellipse
        cx="50"
        cy="60"
        rx="30"
        ry="10"
        stroke="rgba(255, 255, 255, 0.2)"
        strokeWidth="1.4"
        fill="none"
      />

      {/* Longitude meridian curve */}
      <ellipse
        cx="50"
        cy="50"
        rx="15"
        ry="36"
        stroke="rgba(255, 255, 255, 0.3)"
        strokeWidth="1.8"
        fill="none"
      />

      {/* Front Orbit Ring Section */}
      <path
        d="M 12 68 C 22 78, 68 84, 88 56"
        stroke="#93C5FD"
        strokeWidth="3.6"
        strokeLinecap="round"
      />

      {/* Core Knowledge Sparks (Interconnected nodes) */}
      <circle cx="50" cy="50" r="4.5" fill="#FFFFFF" filter="url(#glow)" />
      <circle cx="36" cy="44" r="2.8" fill="#BAE6FD" />
      <circle cx="64" cy="56" r="2.8" fill="#BAE6FD" />
      <circle cx="52" cy="36" r="2.2" fill="#E0F2FE" />
      <circle cx="48" cy="64" r="2.2" fill="#E0F2FE" />

      {/* Connection rays */}
      <line x1="36" y1="44" x2="50" y2="50" stroke="rgba(255,255,255,0.7)" strokeWidth="1.5" />
      <line x1="50" y1="50" x2="64" y2="56" stroke="rgba(255,255,255,0.7)" strokeWidth="1.5" />
      <line x1="50" y1="50" x2="52" y2="36" stroke="rgba(255,255,255,0.5)" strokeWidth="1.2" />
      <line x1="50" y1="50" x2="48" y2="64" stroke="rgba(255,255,255,0.5)" strokeWidth="1.2" />

      {/* Surface light reflection highlight */}
      <ellipse cx="40" cy="28" rx="14" ry="7" fill="rgba(255, 255, 255, 0.25)" transform="rotate(-15 40 28)" />
    </svg>
  );
}

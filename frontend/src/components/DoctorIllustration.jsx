import { useId } from 'react';

/**
 * Flat, half-body doctor illustration used as faded background art.
 * Drawn in SVG so there's no stock-photo licensing or extra download.
 * variant: 'male' (short hair, stethoscope) | 'female' (long hair, clipboard)
 */
export function DoctorIllustration({ variant = 'male', className = '' }) {
  const id = useId().replace(/:/g, '');
  const coat = `coat-${id}`;
  const skin = `skin-${id}`;
  const glow = `glow-${id}`;
  const female = variant === 'female';

  return (
    <svg
      className={className}
      viewBox="0 0 300 400"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden="true"
    >
      <defs>
        <linearGradient id={coat} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#ffffff" />
          <stop offset="100%" stopColor="#e0e7ff" />
        </linearGradient>
        <linearGradient id={skin} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#f5c9a8" />
          <stop offset="100%" stopColor="#e6ae88" />
        </linearGradient>
        <radialGradient id={glow} cx="50%" cy="45%" r="50%">
          <stop offset="0%" stopColor={female ? '#2dd4bf' : '#818cf8'} stopOpacity="0.45" />
          <stop offset="100%" stopColor={female ? '#2dd4bf' : '#818cf8'} stopOpacity="0" />
        </radialGradient>
      </defs>

      {/* soft halo behind the figure */}
      <circle cx="150" cy="170" r="140" fill={`url(#${glow})`} />

      {/* long hair behind the shoulders */}
      {female && (
        <path d="M96 118c-8 60 -2 110 10 140h88c12-30 18-80 10-140c-8-44-100-44-108 0z" fill="#3b2a4a" />
      )}

      {/* coat / shoulders */}
      <path
        d="M40 400c0-90 20-150 70-172l40-12 40 12c50 22 70 82 70 172z"
        fill={`url(#${coat})`}
        stroke="#c7d2fe"
        strokeWidth="3"
      />

      {/* shirt V-neck */}
      <path d="M126 222l24 64 24-64-24-8z" fill={female ? '#14b8a6' : '#6366f1'} />
      {!female && <path d="M146 236h8l4 56-8 12-8-12z" fill="#312e81" />}

      {/* coat lapels */}
      <path d="M110 228l40 90-20-4-34-78z" fill="#ffffff" stroke="#c7d2fe" strokeWidth="3" strokeLinejoin="round" />
      <path d="M190 228l-40 90 20-4 34-78z" fill="#ffffff" stroke="#c7d2fe" strokeWidth="3" strokeLinejoin="round" />

      {/* breast pocket with pen */}
      <rect x="186" y="300" width="36" height="30" rx="4" fill="#ffffff" stroke="#c7d2fe" strokeWidth="3" />
      <rect x="194" y="288" width="6" height="22" rx="3" fill="#4f46e5" />
      <rect x="204" y="292" width="6" height="18" rx="3" fill="#0d9488" />

      {/* neck */}
      <path d="M134 184h32v34l-16 10-16-10z" fill={`url(#${skin})`} />

      {/* head */}
      <ellipse cx="150" cy="140" rx="46" ry="52" fill={`url(#${skin})`} />
      <ellipse cx="104" cy="146" rx="7" ry="11" fill="#e6ae88" />
      <ellipse cx="196" cy="146" rx="7" ry="11" fill="#e6ae88" />

      {/* hair */}
      {female ? (
        <path d="M102 136c-4-44 22-66 48-66s54 20 48 66c-10-22-30-34-52-34-20 0-34 14-44 34z" fill="#3b2a4a" />
      ) : (
        <path d="M104 134c-6-40 18-62 46-62 30 0 52 20 46 60-6-16-18-26-34-28-18 4-36 2-50-6-4 10-6 22-8 36z" fill="#2e2a3a" />
      )}

      {/* face */}
      <circle cx="134" cy="142" r="4" fill="#2e2a3a" />
      <circle cx="166" cy="142" r="4" fill="#2e2a3a" />
      <path d="M126 130q8-5 16 0M158 130q8-5 16 0" stroke="#2e2a3a" strokeWidth="3" strokeLinecap="round" />
      <path d="M140 164q10 9 20 0" stroke="#b4634a" strokeWidth="3.5" strokeLinecap="round" />

      {female ? (
        /* clipboard held in front */
        <g>
          <rect x="72" y="300" width="70" height="92" rx="8" fill="#ffffff" stroke="#a5b4fc" strokeWidth="3" />
          <rect x="94" y="292" width="26" height="14" rx="4" fill="#4f46e5" />
          <rect x="84" y="322" width="46" height="5" rx="2.5" fill="#c7d2fe" />
          <rect x="84" y="336" width="36" height="5" rx="2.5" fill="#c7d2fe" />
          <rect x="84" y="350" width="42" height="5" rx="2.5" fill="#c7d2fe" />
          <path d="M86 372l6 6 12-12" stroke="#0d9488" strokeWidth="4" strokeLinecap="round" strokeLinejoin="round" />
        </g>
      ) : (
        /* stethoscope around the neck */
        <g stroke="#475569" strokeWidth="5" strokeLinecap="round" fill="none">
          <path d="M122 214c-14 30-12 70 10 88" />
          <path d="M178 214c14 30 12 70-10 88" />
          <path d="M132 302c8 10 28 10 36 0" />
          <path d="M150 306v34" />
          <circle cx="150" cy="352" r="12" fill="#94a3b8" />
          <circle cx="150" cy="352" r="5" fill="#e2e8f0" stroke="none" />
        </g>
      )}
    </svg>
  );
}

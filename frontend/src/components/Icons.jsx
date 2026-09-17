export function Icon({ name, size = 20, className = '', color = 'currentColor' }) {
  const strokeProps = {
    width: size,
    height: size,
    viewBox: '0 0 24 24',
    fill: 'none',
    stroke: color,
    strokeWidth: '2',
    strokeLinecap: 'round',
    strokeLinejoin: 'round',
    className,
  };

  switch (name) {
    case 'logo':
      return (
        <svg {...strokeProps} viewBox="0 0 32 32" fill="none">
          <rect width="32" height="32" rx="9" fill="url(#brand-grad)" />
          <circle cx="16" cy="16" r="13.5" stroke="rgba(255,255,255,0.35)" strokeWidth="1" strokeDasharray="2.2 3" fill="none" />
          {/* soft cross watermark */}
          <rect x="13.6" y="6.5" width="4.8" height="19" rx="2.4" fill="#ffffff" opacity="0.16" />
          <rect x="6.5" y="13.6" width="19" height="4.8" rx="2.4" fill="#ffffff" opacity="0.16" />
          {/* heartbeat pulse */}
          <path
            d="M5 17H10.6L12.8 10.4L16 23.4L18.6 12.6L20.4 17H27"
            stroke="#ffffff"
            strokeWidth="2.3"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
          <circle cx="27" cy="17" r="1.9" fill="#fbbf24" />
          <defs>
            <linearGradient id="brand-grad" x1="0" y1="0" x2="32" y2="32" gradientUnits="userSpaceOnUse">
              <stop stopColor="#4338ca" />
              <stop offset="0.55" stopColor="#6d28d9" />
              <stop offset="1" stopColor="#0d9488" />
            </linearGradient>
          </defs>
        </svg>
      );
    case 'stethoscope':
      return (
        <svg {...strokeProps}>
          <path d="M4.5 3v5a4.5 4.5 0 0 0 9 0V3" />
          <path d="M9 12.5v3.5a4 4 0 0 0 8 0v-2" />
          <circle cx="17" cy="12" r="2" />
          <circle cx="4.5" cy="3" r="1.5" />
          <circle cx="13.5" cy="3" r="1.5" />
        </svg>
      );
    case 'video':
      return (
        <svg {...strokeProps}>
          <polygon points="23 7 16 12 23 17 23 7" />
          <rect x="1" y="5" width="15" height="14" rx="2" ry="2" />
        </svg>
      );
    case 'award':
      return (
        <svg {...strokeProps}>
          <circle cx="12" cy="8" r="7" />
          <polyline points="8.21 13.89 7 23 12 20 17 23 15.79 13.88" />
        </svg>
      );
    case 'activity':
      return (
        <svg {...strokeProps}>
          <polyline points="22 12 18 12 15 21 9 3 6 12 2 12" />
        </svg>
      );
    case 'heart':
      return (
        <svg {...strokeProps}>
          <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" />
        </svg>
      );
    case 'shield':
    case 'badge-check':
      return (
        <svg {...strokeProps}>
          <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
          <polyline points="9 12 11 14 15 10" />
        </svg>
      );
    case 'home':
      return (
        <svg {...strokeProps}>
          <path d="M3 11.5 12 4l9 7.5" />
          <path d="M5.5 10v9a1 1 0 0 0 1 1H9a1 1 0 0 0 1-1v-4a1 1 0 0 1 1-1h2a1 1 0 0 1 1 1v4a1 1 0 0 0 1 1h2.5a1 1 0 0 0 1-1v-9" />
        </svg>
      );
    case 'utensils':
      return (
        <svg {...strokeProps}>
          <path d="M3 2v7c0 1.1.9 2 2 2s2-.9 2-2V2M5 11v11M12 2v20M19 2c-1.5 0-3 1.5-3 5v3c0 1 .5 2 2 2h1M19 12v10" />
        </svg>
      );
    case 'log-out':
      return (
        <svg {...strokeProps}>
          <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
          <polyline points="16 17 21 12 16 7" />
          <line x1="21" y1="12" x2="9" y2="12" />
        </svg>
      );
    case 'lock':
      return (
        <svg {...strokeProps}>
          <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
          <path d="M7 11V7a5 5 0 0 1 10 0v4" />
        </svg>
      );
    case 'clock':
      return (
        <svg {...strokeProps}>
          <circle cx="12" cy="12" r="10" />
          <polyline points="12 6 12 12 16 14" />
        </svg>
      );
    case 'credit-card':
      return (
        <svg {...strokeProps}>
          <rect x="1" y="4" width="22" height="16" rx="2" ry="2" />
          <line x1="1" y1="10" x2="23" y2="10" />
        </svg>
      );
    case 'folder':
      return (
        <svg {...strokeProps}>
          <path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z" />
        </svg>
      );
    case 'sparkles':
      return (
        <svg {...strokeProps}>
          <path d="m12 3-1.9 5.8a2 2 0 0 1-1.3 1.3L3 12l5.8 1.9a2 2 0 0 1 1.3 1.3L12 21l1.9-5.8a2 2 0 0 1 1.3-1.3L21 12l-5.8-1.9a2 2 0 0 1-1.3-1.3Z" />
        </svg>
      );
    case 'star':
      return (
        <svg {...strokeProps} fill="#f59e0b" stroke="#f59e0b">
          <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
        </svg>
      );
    case 'check':
      return (
        <svg {...strokeProps}>
          <polyline points="20 6 9 17 4 12" />
        </svg>
      );
    case 'phone':
      return (
        <svg {...strokeProps}>
          <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z" />
        </svg>
      );
    case 'mail':
      return (
        <svg {...strokeProps}>
          <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z" />
          <polyline points="22,6 12,13 2,6" />
        </svg>
      );
    case 'map-pin':
      return (
        <svg {...strokeProps}>
          <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z" />
          <circle cx="12" cy="10" r="3" />
        </svg>
      );
    case 'user':
      return (
        <svg {...strokeProps}>
          <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
          <circle cx="12" cy="7" r="4" />
        </svg>
      );
    case 'calendar':
      return (
        <svg {...strokeProps}>
          <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
          <line x1="16" y1="2" x2="16" y2="6" />
          <line x1="8" y1="2" x2="8" y2="6" />
          <line x1="3" y1="10" x2="21" y2="10" />
        </svg>
      );
    case 'arrow-right':
      return (
        <svg {...strokeProps}>
          <line x1="5" y1="12" x2="19" y2="12" />
          <polyline points="12 5 19 12 12 19" />
        </svg>
      );
    case 'menu':
      return (
        <svg {...strokeProps}>
          <line x1="3" y1="12" x2="21" y2="12" />
          <line x1="3" y1="6" x2="21" y2="6" />
          <line x1="3" y1="18" x2="21" y2="18" />
        </svg>
      );
    case 'close':
      return (
        <svg {...strokeProps}>
          <line x1="18" y1="6" x2="6" y2="18" />
          <line x1="6" y1="6" x2="18" y2="18" />
        </svg>
      );
    case 'search':
      return (
        <svg {...strokeProps}>
          <circle cx="11" cy="11" r="8" />
          <line x1="21" y1="21" x2="16.65" y2="16.65" />
        </svg>
      );
    case 'navigation':
    case 'directions':
      return (
        <svg {...strokeProps}>
          <polygon points="3 11 22 2 13 21 11 13 3 11" />
        </svg>
      );
    case 'crosshair':
    case 'locate':
      return (
        <svg {...strokeProps}>
          <circle cx="12" cy="12" r="10" />
          <line x1="22" y1="12" x2="18" y2="12" />
          <line x1="6" y1="12" x2="2" y2="12" />
          <line x1="12" y1="6" x2="12" y2="2" />
          <line x1="12" y1="22" x2="12" y2="18" />
        </svg>
      );
    case 'building':
    case 'hospital':
      return (
        <svg {...strokeProps}>
          <rect x="4" y="2" width="16" height="20" rx="2" ry="2" />
          <path d="M9 22v-4h6v4" />
          <line x1="8" y1="6" x2="8.01" y2="6" />
          <line x1="16" y1="6" x2="16.01" y2="6" />
          <line x1="12" y1="6" x2="12.01" y2="6" />
          <line x1="8" y1="10" x2="8.01" y2="10" />
          <line x1="16" y1="10" x2="16.01" y2="10" />
          <line x1="12" y1="10" x2="12.01" y2="10" />
          <line x1="8" y1="14" x2="8.01" y2="14" />
          <line x1="16" y1="14" x2="16.01" y2="14" />
          <line x1="12" y1="14" x2="12.01" y2="14" />
        </svg>
      );
    case 'filter':
      return (
        <svg {...strokeProps}>
          <polygon points="22 3 2 3 10 12.46 10 19 14 21 14 12.46 22 3" />
        </svg>
      );
    case 'chevron-down':
      return (
        <svg {...strokeProps}>
          <polyline points="6 9 12 15 18 9" />
        </svg>
      );
    case 'chevron-up':
      return (
        <svg {...strokeProps}>
          <polyline points="18 15 12 9 6 15" />
        </svg>
      );
    case 'help':
      return (
        <svg {...strokeProps}>
          <circle cx="12" cy="12" r="10" />
          <path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3" />
          <line x1="12" y1="17" x2="12.01" y2="17" />
        </svg>
      );
    default:
      return (
        <svg {...strokeProps}>
          <circle cx="12" cy="12" r="10" />
        </svg>
      );
  }
}

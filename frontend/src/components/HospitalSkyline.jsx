/** Decorative flat-style hospital skyline silhouette used as ambient background art. */
export function HospitalSkyline({ className = '', tone = 'light' }) {
  const fill = tone === 'dark' ? 'rgba(255,255,255,0.07)' : 'rgba(79,70,229,0.06)';
  const fillStrong = tone === 'dark' ? 'rgba(255,255,255,0.1)' : 'rgba(79,70,229,0.09)';
  const cross = tone === 'dark' ? 'rgba(251,191,36,0.55)' : 'rgba(13,148,136,0.35)';

  return (
    <svg
      className={className}
      viewBox="0 0 1200 260"
      preserveAspectRatio="none"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden="true"
    >
      <rect x="0" y="150" width="120" height="110" fill={fill} />
      <rect x="130" y="110" width="90" height="150" fill={fillStrong} />
      <rect x="235" y="170" width="70" height="90" fill={fill} />
      <rect x="320" y="60" width="140" height="200" fill={fillStrong} />
      {/* hospital cross on the tallest tower */}
      <rect x="380" y="20" width="20" height="60" rx="3" fill={cross} />
      <rect x="360" y="40" width="60" height="20" rx="3" fill={cross} />
      <rect x="475" y="130" width="80" height="130" fill={fill} />
      <rect x="565" y="90" width="100" height="170" fill={fillStrong} />
      <rect x="680" y="160" width="60" height="100" fill={fill} />
      <rect x="750" y="100" width="110" height="160" fill={fillStrong} />
      <rect x="875" y="150" width="85" height="110" fill={fill} />
      <rect x="975" y="70" width="95" height="190" fill={fillStrong} />
      <rect x="1085" y="140" width="115" height="120" fill={fill} />

      {/* window grids on the two hero towers */}
      {Array.from({ length: 5 }).map((_, row) =>
        Array.from({ length: 4 }).map((_, col) => (
          <rect
            key={`w1-${row}-${col}`}
            x={340 + col * 26}
            y={90 + row * 30}
            width="12"
            height="14"
            fill={tone === 'dark' ? 'rgba(255,255,255,0.12)' : 'rgba(79,70,229,0.14)'}
          />
        ))
      )}
      {Array.from({ length: 4 }).map((_, row) =>
        Array.from({ length: 4 }).map((_, col) => (
          <rect
            key={`w2-${row}-${col}`}
            x={585 + col * 22}
            y={120 + row * 32}
            width="11"
            height="14"
            fill={tone === 'dark' ? 'rgba(255,255,255,0.12)' : 'rgba(79,70,229,0.14)'}
          />
        ))
      )}
    </svg>
  );
}

import { Icon } from './Icons';
import { computeStayScore } from '../utils/stayEngine';

/** Compact "MediTrust Stay Score" pill, mirrors TrustBadge for hospitals. */
export function StayScoreBadge({ stay, size = 'md' }) {
  const score = computeStayScore(stay.stayBreakdown);
  const tone = score >= 90 ? 'excellent' : score >= 75 ? 'good' : 'fair';

  return (
    <span
      className={`trust-badge trust-badge-${tone} trust-badge-${size}`}
      title="MediTrust Stay Score — distance, long-stay support, price transparency, verification, caregiver support & accessibility"
    >
      <Icon name="home" size={size === 'sm' ? 12 : 14} />
      <span>Stay Score {score}</span>
    </span>
  );
}

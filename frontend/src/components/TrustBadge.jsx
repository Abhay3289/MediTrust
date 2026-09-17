import { Icon } from './Icons';
import { computeTrustScore, trustScoreLabel } from '../utils/trustEngine';

/** Compact "MediTrust Trust Score" pill used on hospital cards throughout the app. */
export function TrustBadge({ hospital, size = 'md' }) {
  const score = computeTrustScore(hospital.trustBreakdown);
  const { tone } = trustScoreLabel(score);

  return (
    <span className={`trust-badge trust-badge-${tone} trust-badge-${size}`} title="MediTrust Trust Score — verification, service availability, doctor verification, complaint resolution & transparency">
      <Icon name="shield" size={size === 'sm' ? 12 : 14} />
      <span>Trust {score}</span>
    </span>
  );
}

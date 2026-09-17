import { Icon } from './Icons';
import { WhyRecommended } from './WhyRecommended';
import {
  TRUST_WEIGHTS,
  TRUST_FACTOR_LABELS,
  computeTrustScore,
  trustScoreLabel,
} from '../utils/trustEngine';
import { featuredDoctors } from '../data/healthcareData';

/**
 * The MediTrust Trust Engine panel — PRD Section 14/15/16/17/24.
 * Explains, rather than just asserts, why a hospital is trusted.
 */
export function TrustScorePanel({ hospital, specialty }) {
  const score = computeTrustScore(hospital.trustBreakdown);
  const { label, tone } = trustScoreLabel(score);

  return (
    <div className="details-section-card trust-engine-panel">
      <div className="trust-panel-header">
        <div>
          <div className="section-pill trust-panel-pill">
            <Icon name="shield" size={14} />
            <span>MediTrust Trust Engine</span>
          </div>
          <h2 className="details-card-heading">How trustworthy is this hospital?</h2>
          <p className="trust-panel-subtext">
            A multi-factor score — not a single star rating — calculated from verified signals only.
          </p>
        </div>

        <div className={`trust-score-dial trust-score-dial-${tone}`}>
          <span className="trust-score-dial-value">{score}</span>
          <span className="trust-score-dial-max">/100</span>
          <span className="trust-score-dial-label">{label}</span>
        </div>
      </div>

      <div className="trust-verified-strip">
        {hospital.hospitalVerified && (
          <span className="verified-pill">
            <Icon name="badge-check" size={14} />
            <span>MediTrust Verified Hospital</span>
          </span>
        )}
        {hospital.qualityAccreditation ? (
          <span className="quality-signal-pill">
            <Icon name="award" size={14} />
            <span>External Quality Signal: {hospital.qualityAccreditation}</span>
          </span>
        ) : (
          <span className="quality-signal-pill pending">
            <Icon name="clock" size={14} />
            <span>External accreditation review pending</span>
          </span>
        )}
      </div>

      <div className="trust-breakdown-list">
        {Object.entries(TRUST_WEIGHTS).map(([key, weight]) => {
          const value = hospital.trustBreakdown?.[key] || 0;
          return (
            <div key={key} className="trust-breakdown-row">
              <div className="trust-breakdown-row-top">
                <span className="trust-breakdown-label">
                  {TRUST_FACTOR_LABELS[key]}
                  <span className="trust-breakdown-weight">{Math.round(weight * 100)}% weight</span>
                </span>
                <strong>{value}/100</strong>
              </div>
              <div className="trust-breakdown-track">
                <div className="trust-breakdown-fill" style={{ width: `${value}%` }} />
              </div>
            </div>
          );
        })}
      </div>

      <WhyRecommended hospital={hospital} specialty={specialty} doctors={featuredDoctors} />

      <div className="no-pay-to-rank-note">
        <Icon name="lock" size={13} />
        <span>
          MediTrust never accepts payment to raise a Trust Score or organic ranking. Hospitals cannot buy this score.
        </span>
      </div>
    </div>
  );
}

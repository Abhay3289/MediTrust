import { Icon } from './Icons';
import { getWhyRecommended } from '../utils/trustEngine';

/** Explainable "Why MediTrust recommends this hospital" bullet list — PRD Section 17. */
export function WhyRecommended({ hospital, specialty, doctors = [], title = 'Why MediTrust recommends it' }) {
  const reasons = getWhyRecommended(hospital, { specialty, doctors });

  return (
    <div className="why-recommended-box">
      <span className="why-recommended-title">{title}</span>
      <ul className="why-recommended-list">
        {reasons.map((reason, idx) => (
          <li key={idx}>
            <Icon name="check" size={13} color="#0d9488" />
            <span>{reason}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}

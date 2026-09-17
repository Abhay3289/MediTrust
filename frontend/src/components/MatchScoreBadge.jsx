/** "94% Match" pill — Healthcare Match Score, distinct from the hospital's Trust Score. */
export function MatchScoreBadge({ score, size = 'md' }) {
  return (
    <span className={`match-score-badge match-score-badge-${size}`} title="How well this hospital fits your stated healthcare requirement. Not a guarantee of treatment outcome.">
      <span className="match-score-value">{score}%</span>
      <span className="match-score-label">Match</span>
    </span>
  );
}

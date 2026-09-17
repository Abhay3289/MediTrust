import { platformStats } from '../data/healthcareData';

export function Stats() {
  return (
    <section className="stats-section">
      <div className="container">
        <div className="stats-grid">
          {platformStats.map((stat, idx) => (
            <div key={idx} className="stat-card">
              <span className="stat-value">{stat.value}</span>
              <span className="stat-label">{stat.label}</span>
              <span className="stat-subtext">{stat.subtext}</span>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

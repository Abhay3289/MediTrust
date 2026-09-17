import { patientTestimonials } from '../data/healthcareData';
import { Icon } from './Icons';

export function About({ onOpenAppointment }) {
  return (
    <section id="about" className="about-section">
      <div className="container">
        {/* Mission & Story Box */}
        <div className="about-story-grid">
          <div className="about-story-text">
            <div className="section-pill">
              <Icon name="heart" size={14} />
              <span>Our Mission</span>
            </div>
            <h2 className="section-title">Democratizing Trusted Healthcare for Everyone</h2>
            <p className="about-lead">
              MediTrust was founded on a simple premise: quality healthcare should not be hindered by geography, 
              hours-long waiting room delays, or complex paperwork.
            </p>
            <p className="about-body">
              By combining empathetic clinicians with modern digital infrastructure, we empower patients 
              to consult certified medical professionals in minutes, monitor chronic conditions effortlessly, 
              and take proactive control over their health and wellness.
            </p>

            <div className="values-grid">
              <div className="value-item">
                <div className="value-icon"><Icon name="shield" size={20} /></div>
                <div>
                  <h4>Patient Privacy First</h4>
                  <p>Encrypted records adhering to strict healthcare privacy frameworks.</p>
                </div>
              </div>
              <div className="value-item">
                <div className="value-icon"><Icon name="award" size={20} /></div>
                <div>
                  <h4>Clinical Excellence</h4>
                  <p>Only top-tier, board-certified healthcare providers.</p>
                </div>
              </div>
            </div>
          </div>

          <div className="about-story-graphic">
            <div className="about-metric-card">
              <div className="metric-header">
                <span className="metric-tag">MediTrust Network</span>
                <span className="metric-status">Active Nationwide</span>
              </div>
              <div className="network-stats">
                <div className="n-stat">
                  <strong>48 States</strong>
                  <span>Telehealth Coverage</span>
                </div>
                <div className="n-stat">
                  <strong>99.4%</strong>
                  <span>Satisfaction Rate</span>
                </div>
                <div className="n-stat">
                  <strong>100%</strong>
                  <span>Digital Prescriptions</span>
                </div>
                <div className="n-stat">
                  <strong>24/7</strong>
                  <span>Nurse Support</span>
                </div>
              </div>
              <div className="metric-quote">
                <p>“MediTrust brings hospital-grade care right to your home screen.”</p>
                <div className="quotee">
                  <span>Medical Advisory Board</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Testimonials */}
        <div className="testimonials-wrap">
          <div className="section-header center">
            <span className="section-pill">
              <Icon name="star" size={14} />
              <span>Real Patient Stories</span>
            </span>
            <h2 className="section-title">Trusted by Thousands of Families</h2>
            <p className="section-subtitle">
              Hear directly from individuals and families who rely on MediTrust for their daily healthcare needs.
            </p>
          </div>

          <div className="testimonials-grid">
            {patientTestimonials.map((t, idx) => (
              <div key={idx} className="testimonial-card">
                <div className="stars-row">
                  {[...Array(t.rating)].map((_, i) => (
                    <Icon key={i} name="star" size={16} />
                  ))}
                </div>
                <p className="testimonial-quote">“{t.quote}”</p>
                <div className="testimonial-footer">
                  <div className="patient-avatar">
                    <span>{t.author.charAt(0)}</span>
                  </div>
                  <div className="patient-info">
                    <strong>{t.author}</strong>
                    <span>{t.role} • <span className="patient-tag">{t.tag}</span></span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Action Banner */}
        <div className="cta-banner">
          <div className="cta-banner-content">
            <h2>Ready to experience a better standard of care?</h2>
            <p>Join over 50,000 satisfied patients who trust MediTrust for their routine and urgent healthcare.</p>
            <div className="cta-banner-actions">
              <button
                type="button"
                className="btn btn-white btn-lg"
                onClick={onOpenAppointment}
              >
                <span>Book Your First Consultation</span>
                <Icon name="arrow-right" size={18} />
              </button>
              <a href="tel:18005550199" className="btn btn-ghost-white btn-lg">
                <Icon name="phone" size={18} />
                <span>Call Helpline: (800) 555-0199</span>
              </a>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

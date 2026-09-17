import { whyChooseUsFeatures } from '../data/healthcareData';
import { Icon } from './Icons';

export function WhyUs({ onOpenAppointment }) {
  return (
    <section id="why-us" className="why-us-section">
      <div className="container">
        <div className="section-header">
          <div className="section-pill">
            <Icon name="badge-check" size={14} />
            <span>The MediTrust Advantage</span>
          </div>
          <h2 className="section-title">Why Patients Choose MediTrust</h2>
          <p className="section-subtitle">
            We are redefining the patient experience by blending top clinical expertise with 
            modern technology, eliminating long waits, confusion, and fragmented care.
          </p>
        </div>

        <div className="why-us-grid">
          {whyChooseUsFeatures.map((feature) => (
            <div key={feature.id} className="why-card">
              <div className="why-icon-container">
                <Icon name={feature.icon} size={24} />
              </div>
              <h3 className="why-title">{feature.title}</h3>
              <p className="why-desc">{feature.description}</p>
            </div>
          ))}
        </div>

        {/* Interactive Trust Metric Feature Block */}
        <div className="trust-feature-box">
          <div className="trust-feature-left">
            <span className="trust-feature-label">Patient Safety & Quality Promise</span>
            <h3>Healthcare Built on Transparency, Privacy & Empathy</h3>
            <p>
              Unlike traditional clinics with endless paperwork and surprise bills, MediTrust gives you 
              immediate access to verified specialists with clear upfront pricing and ironclad HIPAA privacy.
            </p>
            <ul className="trust-checklist">
              <li>
                <span className="check-bullet"><Icon name="check" size={14} /></span>
                <span>Zero hidden clinic facility fees or unexpected bills</span>
              </li>
              <li>
                <span className="check-bullet"><Icon name="check" size={14} /></span>
                <span>End-to-end encrypted medical consults and e-prescriptions</span>
              </li>
              <li>
                <span className="check-bullet"><Icon name="check" size={14} /></span>
                <span>Immediate digital notes sent to you and your chosen family doctor</span>
              </li>
            </ul>
            <button
              type="button"
              className="btn btn-primary"
              onClick={onOpenAppointment}
            >
              <span>Experience MediTrust Today</span>
              <Icon name="arrow-right" size={16} />
            </button>
          </div>

          <div className="trust-feature-right">
            <div className="trust-stat-badge">
              <span className="stat-large">99.4%</span>
              <span className="stat-meta">Patient recommendation rating</span>
            </div>
            <div className="trust-comparison-card">
              <div className="comparison-row highlight">
                <span className="comp-name">MediTrust Telehealth</span>
                <span className="comp-value green">Avg. 12 mins</span>
              </div>
              <div className="comparison-row">
                <span className="comp-name">Traditional Clinic Visit</span>
                <span className="comp-value gray">Avg. 18 days wait</span>
              </div>
              <div className="comparison-row highlight">
                <span className="comp-name">Prescription Delivery</span>
                <span className="comp-value green">Same-day available</span>
              </div>
              <div className="comparison-row">
                <span className="comp-name">Traditional Pharmacy Line</span>
                <span className="comp-value gray">45-60 mins waiting</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

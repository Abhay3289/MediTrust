import { healthcareServices } from '../data/healthcareData';
import { Icon } from './Icons';

export function Services({ onSelectService }) {
  return (
    <section id="services" className="services-section">
      <div className="container">
        <div className="section-header">
          <div className="section-pill">
            <Icon name="heart" size={14} />
            <span>Comprehensive Care Offerings</span>
          </div>
          <h2 className="section-title">Specialized Healthcare Services</h2>
          <p className="section-subtitle">
            From routine check-ups and preventative screenings to on-demand virtual urgent care, 
            explore accessible medical services designed around you.
          </p>
        </div>

        <div className="services-grid">
          {healthcareServices.map((service) => (
            <div key={service.id} className="service-card">
              <div className="service-card-top">
                <div className="service-icon-box">
                  <Icon name={service.icon} size={26} />
                </div>
                <span className="service-badge">{service.badge}</span>
              </div>

              <h3 className="service-title">{service.title}</h3>
              <p className="service-desc">{service.description}</p>

              <div className="service-tags">
                {service.tags.map((tag, idx) => (
                  <span key={idx} className="service-tag">
                    {tag}
                  </span>
                ))}
              </div>

              <button
                type="button"
                className="service-action-btn"
                onClick={() => onSelectService(service.title)}
              >
                <span>Book this service</span>
                <Icon name="arrow-right" size={16} />
              </button>
            </div>
          ))}
        </div>

        {/* Highlight banner below services */}
        <div className="services-callout">
          <div className="callout-content">
            <div className="callout-icon">
              <Icon name="shield" size={28} />
            </div>
            <div>
              <h4>Need assistance selecting the right care path?</h4>
              <p>Our clinical triage coordinators are available 24/7 to guide you to the right specialist.</p>
            </div>
          </div>
          <button
            type="button"
            className="btn btn-outline"
            onClick={() => onSelectService('Clinical Triage')}
          >
            <span>Speak with a Nurse</span>
            <Icon name="phone" size={16} />
          </button>
        </div>
      </div>
    </section>
  );
}

import { featuredDoctors } from '../data/healthcareData';
import { Icon } from './Icons';

export function Doctors({ onBookDoctor }) {
  return (
    <section id="doctors" className="doctors-section">
      <div className="container">
        <div className="section-header">
          <div className="section-pill">
            <Icon name="award" size={14} />
            <span>Top Medical Practitioners</span>
          </div>
          <h2 className="section-title">Meet Our Certified Specialists</h2>
          <p className="section-subtitle">
            Our physicians bring decades of combined experience from top medical centers across the country, 
            delivering empathetic, evidence-based care.
          </p>
        </div>

        <div className="doctors-grid">
          {featuredDoctors.map((doc) => (
            <div key={doc.id} className="doctor-card">
              <div className="doctor-card-header">
                <div
                  className="doctor-avatar"
                  style={{ backgroundColor: doc.avatarBg }}
                >
                  <span className="avatar-initials">{doc.initials}</span>
                </div>
                {doc.availableToday ? (
                  <span className="availability-badge available">
                    <span className="dot"></span> Available Today
                  </span>
                ) : (
                  <span className="availability-badge next-day">
                    <span className="dot"></span> Next Available Tomorrow
                  </span>
                )}
              </div>

              <div className="doctor-info">
                <h3 className="doctor-name">{doc.name}</h3>
                <span className="doctor-spec">{doc.specialty}</span>
                <span className="doctor-hospital">{doc.hospital}</span>

                <div className="doctor-meta">
                  <div className="doctor-rating">
                    <Icon name="star" size={15} />
                    <strong>{doc.rating}</strong>
                    <span>({doc.reviewsCount} reviews)</span>
                  </div>
                  <span className="doctor-exp">{doc.experience}</span>
                </div>
              </div>

              <div className="doctor-card-actions">
                <button
                  type="button"
                  className="btn btn-outline btn-sm btn-block"
                  onClick={() => onBookDoctor(doc.name, doc.specialty)}
                >
                  <Icon name="calendar" size={15} />
                  <span>Book Consultation</span>
                </button>
              </div>
            </div>
          ))}
        </div>

        <div className="doctors-footer-note">
          <div className="doc-verify-badge">
            <Icon name="badge-check" size={18} color="#0d9488" />
            <span>All doctors are actively licensed, insured, and verified by our medical board.</span>
          </div>
        </div>
      </div>
    </section>
  );
}

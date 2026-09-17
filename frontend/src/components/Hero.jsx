import { Icon } from './Icons';

export function Hero({ onOpenAppointment }) {
  const scrollToSection = (id) => {
    const el = document.getElementById(id);
    if (el) {
      const navHeight = 80;
      const pos = el.getBoundingClientRect().top + window.pageYOffset;
      window.scrollTo({ top: pos - navHeight, behavior: 'smooth' });
    }
  };

  return (
    <section id="home" className="hero-section">
      <div className="container hero-container">
        <div className="hero-content">
          <div className="hero-pill">
            <span className="pill-dot"></span>
            <span className="pill-text">Next-Gen Digital Healthcare</span>
            <span className="pill-highlight">Trusted by 50k+ Families</span>
          </div>

          <h1 className="hero-title">
            Compassionate Care, <span className="highlight-text">Anytime & Anywhere.</span>
          </h1>

          <p className="hero-description">
            MediTrust connects you with board-certified physicians, 24/7 telehealth consultations, 
            rapid diagnostics, and secure digital prescriptions — all backed by bank-grade data security.
          </p>

          <div className="hero-cta-group">
            <button
              type="button"
              className="btn btn-primary btn-lg"
              onClick={onOpenAppointment}
            >
              <span>Get Started</span>
              <Icon name="arrow-right" size={18} />
            </button>

            <button
              type="button"
              className="btn btn-secondary btn-lg"
              onClick={() => scrollToSection('doctors')}
            >
              <Icon name="user" size={18} />
              <span>Find a Doctor</span>
            </button>
          </div>

          {/* Quick trust proofs */}
          <div className="hero-trust-row">
            <div className="trust-item">
              <span className="trust-check">
                <Icon name="check" size={14} />
              </span>
              <span>100% Board Certified</span>
            </div>
            <div className="trust-item">
              <span className="trust-check">
                <Icon name="check" size={14} />
              </span>
              <span>HIPAA Compliant</span>
            </div>
            <div className="trust-item">
              <span className="trust-check">
                <Icon name="check" size={14} />
              </span>
              <span>Zero Waiting Room</span>
            </div>
          </div>
        </div>

        {/* Hero Visual Presentation Card */}
        <div className="hero-visual">
          <div className="hero-card-wrapper">
            <div className="hero-main-card">
              <div className="card-header-badge">
                <span className="live-indicator"></span>
                <span>Virtual Clinic Live</span>
              </div>

              <div className="hero-doctor-spotlight">
                <div className="spotlight-avatar">
                  <span>Dr. SC</span>
                </div>
                <div className="spotlight-details">
                  <h4>Dr. Sarah Chen, MD</h4>
                  <p>Chief of Telehealth & Cardiology</p>
                  <div className="spotlight-rating">
                    <div className="stars">
                      <Icon name="star" size={14} />
                      <Icon name="star" size={14} />
                      <Icon name="star" size={14} />
                      <Icon name="star" size={14} />
                      <Icon name="star" size={14} />
                    </div>
                    <span>4.98 (340+ reviews)</span>
                  </div>
                </div>
              </div>

              <div className="quick-scheduler-preview">
                <div className="scheduler-header">
                  <span className="scheduler-title">Next Available Consultation:</span>
                  <span className="scheduler-time">In ~12 mins</span>
                </div>
                <div className="scheduler-specialties">
                  <span className="spec-tag active">General Medicine</span>
                  <span className="spec-tag">Pediatrics</span>
                  <span className="spec-tag">Cardiology</span>
                </div>
                <button
                  type="button"
                  className="btn btn-accent btn-block"
                  onClick={onOpenAppointment}
                >
                  <span>Book Immediate Visit</span>
                  <Icon name="arrow-right" size={16} />
                </button>
              </div>

              {/* Floating micro-badges */}
              <div className="floating-badge badge-top-right">
                <div className="floating-icon secure">
                  <Icon name="shield" size={18} />
                </div>
                <div>
                  <strong>Encrypted E-Records</strong>
                  <small>Bank-grade AES-256</small>
                </div>
              </div>

              <div className="floating-badge badge-bottom-left">
                <div className="floating-icon pulse">
                  <Icon name="activity" size={18} />
                </div>
                <div>
                  <strong>50k+ Happy Patients</strong>
                  <small>99.4% satisfaction score</small>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

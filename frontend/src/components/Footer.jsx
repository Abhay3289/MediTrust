import { Icon } from './Icons';

export function Footer({ onNavigate }) {
  const scrollToTop = (e) => {
    e.preventDefault();
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleNav = (e, page) => {
    e.preventDefault();
    if (onNavigate) {
      onNavigate(page);
    }
  };

  return (
    <footer className="site-footer">
      <div className="container">
        <div className="footer-top">
          {/* Col 1: Brand & Mission */}
          <div className="footer-col brand-col">
            <div className="brand-logo footer-brand">
              <Icon name="logo" size={32} />
              <div className="brand-text">
                <span className="brand-name">Medi<span>Trust</span></span>
                <span className="brand-tagline">Hospital Discovery Platform</span>
              </div>
            </div>
            <p className="footer-about">
              Dedicated to helping individuals and families discover the right hospital for their health needs, 
              compare real-time emergency wait times, explore certified departments, and access trusted care.
            </p>
            <div className="footer-compliance-badges">
              <span className="badge-pill">
                <Icon name="shield" size={13} />
                <span>HIPAA Compliant</span>
              </span>
              <span className="badge-pill">
                <Icon name="badge-check" size={13} />
                <span>Accredited Network</span>
              </span>
              <span className="badge-pill">
                <Icon name="lock" size={13} />
                <span>No Pay-to-Rank</span>
              </span>
            </div>
          </div>

          {/* Col 2: Hospital Discovery */}
          <div className="footer-col">
            <h4 className="footer-heading">Hospital Discovery</h4>
            <ul className="footer-links">
              <li><a href="#home" onClick={(e) => handleNav(e, 'home')}>Search Hospitals</a></li>
              <li><a href="#results" onClick={(e) => handleNav(e, 'results')}>Interactive Hospital Map</a></li>
              <li><a href="#health-problem" onClick={(e) => handleNav(e, 'health-problem')}>Search by Health Problem</a></li>
              <li><a href="#results" onClick={(e) => handleNav(e, 'results')}>Emergency Trauma Centers</a></li>
              <li><a href="#results" onClick={(e) => handleNav(e, 'results')}>Pediatric Hospitals</a></li>
            </ul>
          </div>

          {/* Col 3: Online Care & Help */}
          <div className="footer-col">
            <h4 className="footer-heading">Consultation & Help</h4>
            <ul className="footer-links">
              <li><a href="#consultation" onClick={(e) => handleNav(e, 'consultation')}>Online Doctor Consultation</a></li>
              <li><a href="#stays" onClick={(e) => handleNav(e, 'stays')}>Verified Patient Stay Network</a></li>
              <li><a href="#help" onClick={(e) => handleNav(e, 'help')}>Help for Customers</a></li>
              <li><a href="#help" onClick={(e) => handleNav(e, 'help')}>How to Find Hospitals</a></li>
              <li><a href="#help" onClick={(e) => handleNav(e, 'help')}>Customer FAQs</a></li>
              <li><a href="#help" onClick={(e) => handleNav(e, 'help')}>Patient Support Line</a></li>
            </ul>
          </div>

          {/* Col 4: Emergency Contact & Location */}
          <div className="footer-col contact-col">
            <h4 className="footer-heading">Patient Helpline</h4>
            <ul className="footer-contact-list">
              <li>
                <Icon name="phone" size={16} />
                <div>
                  <strong>24/7 Helpline</strong>
                  <span>(800) 555-0199</span>
                </div>
              </li>
              <li>
                <Icon name="mail" size={16} />
                <div>
                  <strong>Email Inquiries</strong>
                  <span>support@meditrust-health.org</span>
                </div>
              </li>
              <li>
                <Icon name="map-pin" size={16} />
                <div>
                  <strong>Healthcare Network Headquarters</strong>
                  <span>742 Healthcare Boulevard, Suite 400</span>
                </div>
              </li>
            </ul>
          </div>
        </div>

        {/* Emergency Medical Notice */}
        <div className="footer-disclaimer-box">
          <div className="disclaimer-icon">
            <Icon name="activity" size={18} />
          </div>
          <p>
            <strong>Critical Medical Notice:</strong> If you or someone you are assisting is experiencing a life-threatening medical emergency, 
            severe chest pain, uncontrollable bleeding, stroke symptoms, or acute trauma, dial <strong>911</strong> immediately. 
            MediTrust helps locate accredited healthcare facilities and is not an emergency dispatch provider.
          </p>
        </div>

        {/* Footer Bottom Bar */}
        <div className="footer-bottom">
          <p className="copyright">
            &copy; {new Date().getFullYear()} MediTrust Healthcare Platform. All rights reserved.
          </p>
          <div className="footer-bottom-links">
            <a href="#home" onClick={scrollToTop}>Back to top ↑</a>
            <span className="divider">•</span>
            <a href="#help" onClick={(e) => handleNav(e, 'help')}>Help & FAQs</a>
            <span className="divider">•</span>
            <a href="#privacy" onClick={(e) => e.preventDefault()}>Privacy Policy</a>
            <span className="divider">•</span>
            <a href="#terms" onClick={(e) => e.preventDefault()}>Terms of Service</a>
          </div>
        </div>
      </div>
    </footer>
  );
}

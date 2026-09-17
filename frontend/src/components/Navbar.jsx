import { useState, useEffect } from 'react';
import { Icon } from './Icons';

export function Navbar({ activePage = 'home', onNavigate, userName = null, onLogoutClick }) {
  const [isScrolled, setIsScrolled] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [accountMenuOpen, setAccountMenuOpen] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 15);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  useEffect(() => {
    if (!accountMenuOpen) return undefined;
    const closeMenu = () => setAccountMenuOpen(false);
    document.addEventListener('click', closeMenu);
    return () => document.removeEventListener('click', closeMenu);
  }, [accountMenuOpen]);

  const handleLinkClick = (e, page) => {
    e.preventDefault();
    setMobileMenuOpen(false);
    onNavigate(page);
  };

  return (
    <header className={`navbar-header ${isScrolled ? 'scrolled' : ''}`}>
      {/* Top emergency announcement bar */}
      <div className="top-banner">
        <div className="container banner-inner">
          <div className="banner-left">
            <span className="banner-badge">24/7 Hospital Discovery & Emergency</span>
            <span className="banner-text">Compare accredited trauma centers, wait times & diagnostics</span>
          </div>
          <div className="banner-right">
            <a href="tel:18005550199" className="banner-hotline">
              <Icon name="phone" size={14} />
              <span>Medical Emergency: (800) 555-0199</span>
            </a>
          </div>
        </div>
      </div>

      {/* Main Navbar */}
      <nav className="main-nav">
        <div className="container nav-container">
          {/* Logo */}
          <a
            href="#home"
            className="brand-logo"
            onClick={(e) => handleLinkClick(e, 'home')}
          >
            <Icon name="logo" size={34} />
            <div className="brand-text">
              <span className="brand-name">Medi<span>Trust</span></span>
              <span className="brand-tagline">Hospital Discovery Platform</span>
            </div>
          </a>

          {/* Desktop Navigation Links */}
          <ul className="nav-links desktop-only">
            <li>
              <a
                href="#home"
                className={activePage === 'home' || activePage === 'results' ? 'active-nav-link' : ''}
                onClick={(e) => handleLinkClick(e, 'home')}
              >
                Hospitals
              </a>
            </li>
            <li>
              <a
                href="#consultation"
                className={activePage === 'consultation' || activePage === 'doctor-details' ? 'active-nav-link' : ''}
                onClick={(e) => handleLinkClick(e, 'consultation')}
              >
                Online Consultation
              </a>
            </li>
            <li>
              <a
                href="#stays"
                className={activePage === 'stays' ? 'active-nav-link' : ''}
                onClick={(e) => handleLinkClick(e, 'stays')}
              >
                Patient Stay
              </a>
            </li>
          </ul>

          {/* Right Action: Help for Customers (clearly visible at top/right) */}
          <div className="nav-actions desktop-only">
            <a
              href="#help"
              className={`help-nav-link ${activePage === 'help' ? 'active' : ''}`}
              onClick={(e) => handleLinkClick(e, 'help')}
            >
              <Icon name="help" size={17} />
              <span>Help for Customers</span>
            </a>

            <button
              type="button"
              className="btn btn-primary btn-sm nav-cta"
              onClick={() => onNavigate('results')}
            >
              <Icon name="search" size={15} />
              <span>Find Hospitals</span>
            </button>

            {userName ? (
              <div className="account-menu-wrapper" onClick={(e) => e.stopPropagation()}>
                <button
                  type="button"
                  className="account-chip-btn"
                  onClick={() => setAccountMenuOpen((v) => !v)}
                  aria-expanded={accountMenuOpen}
                >
                  <span className="account-avatar">{userName.charAt(0).toUpperCase()}</span>
                  <span className="account-name">{userName}</span>
                  <Icon name={accountMenuOpen ? 'chevron-up' : 'chevron-down'} size={15} />
                </button>

                {accountMenuOpen && (
                  <div className="account-dropdown">
                    <div className="account-dropdown-header">
                      <span className="account-avatar lg">{userName.charAt(0).toUpperCase()}</span>
                      <div>
                        <strong>{userName}</strong>
                        <span>MediTrust Patient Account</span>
                      </div>
                    </div>
                    <ul className="account-dropdown-list">
                      <li>
                        <button type="button" onClick={() => { setAccountMenuOpen(false); onNavigate('help'); }}>
                          <Icon name="user" size={15} />
                          <span>My Account</span>
                        </button>
                      </li>
                      <li>
                        <button type="button" className="logout-link" onClick={() => { setAccountMenuOpen(false); onLogoutClick(); }}>
                          <Icon name="log-out" size={15} />
                          <span>Log Out</span>
                        </button>
                      </li>
                    </ul>
                  </div>
                )}
              </div>
            ) : (
              <button
                type="button"
                className="btn btn-secondary btn-sm nav-login-btn"
                onClick={() => onNavigate('login')}
              >
                <Icon name="lock" size={14} />
                <span>Log In</span>
              </button>
            )}
          </div>

          {/* Mobile Hamburger Toggle */}
          <button
            type="button"
            className="mobile-toggle"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            aria-label="Toggle navigation menu"
            aria-expanded={mobileMenuOpen}
          >
            <Icon name={mobileMenuOpen ? 'close' : 'menu'} size={24} />
          </button>
        </div>
      </nav>

      {/* Mobile Drawer */}
      {mobileMenuOpen && (
        <div className="mobile-menu-overlay" onClick={() => setMobileMenuOpen(false)}>
          <div className="mobile-menu-panel" onClick={(e) => e.stopPropagation()}>
            <div className="mobile-menu-header">
              <div className="brand-logo">
                <Icon name="logo" size={30} />
                <span className="brand-name">Medi<span>Trust</span></span>
              </div>
              <button
                type="button"
                className="close-btn"
                onClick={() => setMobileMenuOpen(false)}
                aria-label="Close menu"
              >
                <Icon name="close" size={22} />
              </button>
            </div>

            <ul className="mobile-nav-links">
              <li>
                <a
                  href="#home"
                  className={activePage === 'home' || activePage === 'results' ? 'active-mobile-link' : ''}
                  onClick={(e) => handleLinkClick(e, 'home')}
                >
                  <span>Hospitals Discovery</span>
                  <Icon name="arrow-right" size={16} />
                </a>
              </li>
              <li>
                <a
                  href="#consultation"
                  className={activePage === 'consultation' ? 'active-mobile-link' : ''}
                  onClick={(e) => handleLinkClick(e, 'consultation')}
                >
                  <span>Online Doctor Consultation</span>
                  <Icon name="arrow-right" size={16} />
                </a>
              </li>
              <li>
                <a
                  href="#stays"
                  className={activePage === 'stays' ? 'active-mobile-link' : ''}
                  onClick={(e) => handleLinkClick(e, 'stays')}
                >
                  <span>Verified Patient Stay</span>
                  <Icon name="arrow-right" size={16} />
                </a>
              </li>
              <li>
                <a
                  href="#help"
                  className={activePage === 'help' ? 'active-mobile-link' : ''}
                  onClick={(e) => handleLinkClick(e, 'help')}
                >
                  <span>Help for Customers</span>
                  <Icon name="arrow-right" size={16} />
                </a>
              </li>
            </ul>

            <div className="mobile-menu-footer">
              {userName ? (
                <div className="mobile-account-block">
                  <div className="mobile-account-info">
                    <span className="account-avatar">{userName.charAt(0).toUpperCase()}</span>
                    <div>
                      <strong>{userName}</strong>
                      <span>MediTrust Patient Account</span>
                    </div>
                  </div>
                  <button
                    type="button"
                    className="btn btn-secondary btn-block"
                    onClick={() => {
                      setMobileMenuOpen(false);
                      onLogoutClick();
                    }}
                  >
                    <Icon name="log-out" size={16} />
                    <span>Log Out</span>
                  </button>
                </div>
              ) : (
                <button
                  type="button"
                  className="btn btn-secondary btn-block"
                  onClick={() => {
                    setMobileMenuOpen(false);
                    onNavigate('login');
                  }}
                >
                  <Icon name="lock" size={16} />
                  <span>Log In / Sign Up</span>
                </button>
              )}

              <button
                type="button"
                className="btn btn-primary btn-block"
                onClick={() => {
                  setMobileMenuOpen(false);
                  onNavigate('results');
                }}
              >
                <Icon name="search" size={16} />
                <span>Search Hospitals</span>
              </button>
              <div className="mobile-emergency-call">
                <Icon name="phone" size={16} />
                <span>Emergency: (800) 555-0199</span>
              </div>
            </div>
          </div>
        </div>
      )}
    </header>
  );
}

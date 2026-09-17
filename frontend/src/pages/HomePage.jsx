import { useState,useEffect } from 'react';
import { Icon } from '../components/Icons';
import { HospitalSkyline } from '../components/HospitalSkyline';
import { TrustBadge } from '../components/TrustBadge';
import { patientTestimonials } from '../data/healthcareData';
import { hospitalService } from '../services/hospitalService';
import { doctorService } from '../services/doctorService';
import { apiError } from '../services/api';
import { TRUST_WEIGHTS, TRUST_FACTOR_LABELS } from '../utils/trustEngine';

export function HomePage({ onNavigate, onSelectHospital, onSearchHospitals }) {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedLocation, setSelectedLocation] = useState('Near me');
  const [isLocating, setIsLocating] = useState(false);
  const [hospitalsData,setHospitalsData]=useState([]); const [featuredDoctors,setFeaturedDoctors]=useState([]); const [loadError,setLoadError]=useState('');
  useEffect(()=>{Promise.all([hospitalService.list({limit:6}),doctorService.list({limit:6})]).then(([h,d])=>{setHospitalsData(h.items);setFeaturedDoctors(d.items)}).catch(e=>setLoadError(apiError(e)));},[]);

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    if (onSearchHospitals) {
      onSearchHospitals(searchQuery, selectedLocation);
    } else {
      onNavigate('results', { query: searchQuery, location: selectedLocation });
    }
  };

  const handleUseLocation = () => {
    setIsLocating(true);
    if(!navigator.geolocation){setSelectedLocation('Manual Location');setIsLocating(false);return;}
    navigator.geolocation.getCurrentPosition(async p=>{try{await hospitalService.nearby(p.coords.latitude,p.coords.longitude,5);setSelectedLocation('Current GPS Location (Within 5 km)');}catch{setSelectedLocation('Current GPS Location');}finally{setIsLocating(false);}},()=>{setSelectedLocation('Location permission denied');setIsLocating(false);});
  };

  return (
    <div className="homepage-container">
      {loadError && <div className="auth-error-note" style={{margin:'16px auto',maxWidth:'1100px'}}>{loadError}</div>}
      {/* 1. Hero / Hospital Discovery Search Area */}
      <section className="home-hero-section">
        <HospitalSkyline tone="light" className="hero-skyline-backdrop" />
        <div className="container">
          <div className="home-hero-content">
            <div className="hero-pill">
              <span className="pill-dot"></span>
              <span className="pill-text">Hospital Discovery & Emergency Network</span>
            </div>

            <h1 className="home-hero-title">
              Find the <span className="highlight-text">Right Hospital</span> for Your Healthcare Needs.
            </h1>

            <p className="home-hero-description">
              Compare accredited hospitals, verify live emergency room wait times, explore certified departments, 
              and get direct navigation to trusted medical centers near you.
            </p>

            {/* Main Search Box */}
            <form onSubmit={handleSearchSubmit} className="hospital-search-bar">
              <div className="search-input-wrapper">
                <Icon name="search" size={20} color="#4f46e5" />
                <input
                  type="text"
                  placeholder="Search hospitals, treatments or specialties (e.g. Cardiology, MetroHealth, Emergency)..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  aria-label="Search hospitals, treatments or locations"
                />
              </div>

              <div className="location-input-wrapper">
                <Icon name="map-pin" size={18} color="#0d9488" />
                <span className="location-text">{selectedLocation}</span>
                <button
                  type="button"
                  className="location-detect-btn"
                  onClick={handleUseLocation}
                  title="Detect GPS Location"
                >
                  <Icon name="crosshair" size={16} />
                  <span>{isLocating ? 'Detecting…' : 'Near Me'}</span>
                </button>
              </div>

              <button type="submit" className="btn btn-primary btn-search-cta">
                <Icon name="search" size={18} />
                <span>Search Hospitals</span>
              </button>
            </form>

            {/* Quick Helper Banner for Health Problem Input */}
            <div className="quick-problem-prompt">
              <span>Have specific symptoms or medical condition?</span>
              <button
                type="button"
                className="problem-link-btn"
                onClick={() => onNavigate('health-problem')}
              >
                <span>Search by Disease or Treatment</span>
                <Icon name="arrow-right" size={15} />
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* 2. Featured / Nearby Hospitals List */}
      <section className="home-hospitals-section">
        <div className="container">
          <div className="section-header-split">
            <div>
              <div className="section-pill">
                <Icon name="building" size={14} />
                <span>Verified Facilities</span>
              </div>
              <h2 className="section-title">Top Rated Hospitals Near You</h2>
              <p className="section-subtitle">
                Accredited medical centers with certified specialty departments, 24/7 trauma care, and verified patient reviews.
              </p>
            </div>

            <button
              type="button"
              className="btn btn-outline"
              onClick={() => onNavigate('results')}
            >
              <span>Explore All on Map</span>
              <Icon name="navigation" size={16} />
            </button>
          </div>

          <div className="home-hospitals-grid">
            {hospitalsData.slice(0, 4).map((hosp) => (
              <div key={hosp.id} className="home-hospital-card">
                <div className="hospital-card-header">
                  <div>
                    <span className="hospital-type-badge">{hosp.type}</span>
                    <h3 className="hospital-name">{hosp.name}</h3>
                    <p className="hospital-location">
                      <Icon name="map-pin" size={14} color="#64748b" />
                      <span>{hosp.address}</span>
                    </p>
                  </div>
                </div>

                <div className="hospital-meta-strip">
                  <div className="meta-badge distance">
                    <Icon name="navigation" size={13} />
                    <span>{hosp.distanceText}</span>
                  </div>
                  <div className="meta-badge rating">
                    <Icon name="star" size={13} color="#f59e0b" />
                    <strong>{hosp.rating}</strong>
                    <span>({hosp.reviewsCount})</span>
                  </div>
                  <div className={`meta-badge status ${hosp.is24x7Emergency ? 'open' : 'hours'}`}>
                    <span className="status-dot"></span>
                    <span>{hosp.is24x7Emergency ? '24/7 ER Open' : 'Open Day Care'}</span>
                  </div>
                  <TrustBadge hospital={hosp} size="sm" />
                </div>

                <div className="hospital-specialties-preview">
                  {hosp.specialties.slice(0, 3).map((spec, i) => (
                    <span key={i} className="spec-chip">
                      {spec}
                    </span>
                  ))}
                  {hosp.specialties.length > 3 && (
                    <span className="spec-more">+{hosp.specialties.length - 3} more</span>
                  )}
                </div>

                <div className="hospital-card-actions">
                  <button
                    type="button"
                    className="btn btn-outline btn-sm"
                    onClick={() => onNavigate('results', { selectedId: hosp.id })}
                  >
                    <Icon name="navigation" size={14} />
                    <span>Get Directions</span>
                  </button>

                  <button
                    type="button"
                    className="btn btn-primary btn-sm"
                    onClick={() => onSelectHospital(hosp.id)}
                  >
                    <span>View Details</span>
                    <Icon name="arrow-right" size={14} />
                  </button>
                </div>
              </div>
            ))}
          </div>

          <div className="all-hospitals-banner">
            <div className="banner-content">
              <h4>Need to filter by emergency trauma, pediatrics, or diagnostic MRI?</h4>
              <p>Filter all medical facilities with live interactive distance routing on our hospital map.</p>
            </div>
            <button
              type="button"
              className="btn btn-accent"
              onClick={() => onNavigate('results')}
            >
              <span>Open Interactive Hospital Map</span>
              <Icon name="navigation" size={16} />
            </button>
          </div>
        </div>
      </section>

      {/* 2.5 MediTrust Trust Engine Explainer — the "heart of MediTrust" (PRD Section 14/15) */}
      <section className="trust-engine-section">
        <div className="container">
          <div className="trust-engine-grid">
            <div className="trust-engine-intro">
              <div className="section-pill trust-panel-pill">
                <Icon name="shield" size={14} />
                <span>The MediTrust Trust Engine</span>
              </div>
              <h2 className="section-title">Not just a star rating. A trust score you can see through.</h2>
              <p className="section-subtitle">
                Every hospital on MediTrust carries a live Trust Score built from six verified signals —
                never from payment. Hospitals cannot buy a higher score or push down honest feedback.
              </p>

              <ul className="trust-engine-factor-list">
                {Object.entries(TRUST_WEIGHTS).map(([key, weight]) => (
                  <li key={key}>
                    <span className="trust-engine-factor-weight">{Math.round(weight * 100)}%</span>
                    <span>{TRUST_FACTOR_LABELS[key]}</span>
                  </li>
                ))}
              </ul>

              <button
                type="button"
                className="btn btn-outline"
                onClick={() => onNavigate('health-problem')}
              >
                <span>See Trust Scores in Action</span>
                <Icon name="arrow-right" size={16} />
              </button>
            </div>

            <div className="trust-engine-showcase">
              {hospitalsData.slice(0, 2).map((hosp) => (
                <div key={hosp.id} className="trust-showcase-card">
                  <div className="trust-showcase-top">
                    <div>
                      <span className="suitable-hosp-type">{hosp.type}</span>
                      <h4>{hosp.name}</h4>
                    </div>
                    <TrustBadge hospital={hosp} />
                  </div>
                  {hosp.qualityAccreditation && (
                    <span className="quality-signal-pill sm">
                      <Icon name="award" size={12} />
                      <span>External Quality Signal: {hosp.qualityAccreditation}</span>
                    </span>
                  )}
                </div>
              ))}
              <p className="trust-showcase-caption">
                <Icon name="lock" size={13} />
                <span>No Pay-to-Rank: organic Trust Scores are never sold.</span>
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* 2.75 Meet Our Verified Doctors — reachable from the home page (PRD Module 3) */}
      <section className="home-doctors-section">
        <div className="container">
          <div className="section-header-split">
            <div>
              <div className="section-pill">
                <Icon name="stethoscope" size={14} />
                <span>MediTrust Verified Doctors</span>
              </div>
              <h2 className="section-title">Meet Our Verified Doctors</h2>
              <p className="section-subtitle">
                Board-certified physicians available for secure video consultation — each one MediTrust Verified,
                with real reviews from patients who completed a visit.
              </p>
            </div>

            <button
              type="button"
              className="btn btn-outline"
              onClick={() => onNavigate('consultation')}
            >
              <span>View All Doctors</span>
              <Icon name="arrow-right" size={16} />
            </button>
          </div>

          <div className="home-doctors-grid">
            {featuredDoctors.map((doc) => (
              <button
                key={doc.id}
                type="button"
                className="home-doctor-card"
                onClick={() => onNavigate('doctor-details', { doctorId: doc.id })}
              >
                <div className="doc-avatar-large" style={{ backgroundColor: doc.avatarBg }}>
                  {doc.initials}
                </div>
                <h4 className="doc-name">{doc.name}</h4>
                <span className="doc-specialty">{doc.specialty}</span>
                {doc.verified && (
                  <span className="doc-verified-tag">
                    <Icon name="badge-check" size={13} color="#0d9488" />
                    <span>MediTrust Verified</span>
                  </span>
                )}
                <div className="home-doctor-rating">
                  <Icon name="star" size={13} color="#f59e0b" />
                  <strong>{doc.rating}</strong>
                  <span>({doc.reviewsCount} reviews)</span>
                </div>
              </button>
            ))}
          </div>
        </div>
      </section>

      {/* 3. Patient Reviews Section (clean, towards lower portion) */}
      <section className="home-reviews-section">
        <div className="container">
          <div className="section-header center">
            <div className="section-pill">
              <Icon name="star" size={14} />
              <span>Verified Patient Feedback</span>
            </div>
            <h2 className="section-title">What Patients Say About MediTrust</h2>
            <p className="section-subtitle">
              Authentic reviews from families who found emergency care, specialist clinics, and diagnostics through MediTrust.
            </p>
          </div>

          <div className="home-reviews-grid">
            {patientTestimonials.map((t, idx) => (
              <div key={idx} className="home-review-card">
                <div className="review-top-row">
                  <div className="review-stars">
                    {[...Array(t.rating)].map((_, i) => (
                      <Icon key={i} name="star" size={15} />
                    ))}
                  </div>
                  {t.date && <span className="review-date">{t.date}</span>}
                </div>

                <p className="review-body">“{t.quote}”</p>

                <div className="review-author-row">
                  <div className="author-avatar">{t.author.charAt(0)}</div>
                  <div>
                    <strong className="author-name">{t.author}</strong>
                    <span className="author-role">{t.role}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>
    </div>
  );
}

import { useState,useEffect } from 'react';
import { Icon } from '../components/Icons';
import { TrustBadge } from '../components/TrustBadge';
import { TrustScorePanel } from '../components/TrustScorePanel';
import { hospitalService } from '../services/hospitalService';
import { apiError } from '../services/api';

export function HospitalDetailsPage({ hospitalId, onNavigate, onBookHospitalVisit }) {
  const [hospital,setHospital]=useState(null); const [reviews,setReviews]=useState([]); const [error,setError]=useState('');
  const [directionsNotice,setDirectionsNotice]=useState(null);
  useEffect(()=>{Promise.all([hospitalService.get(hospitalId),hospitalService.reviews(hospitalId)]).then(([h,r])=>{setHospital({...h,reviews:r});setReviews(r);}).catch(e=>setError(apiError(e)));},[hospitalId]);
  if(error) return <div className="container"><div className="no-results-state"><h3>{error}</h3></div></div>;
  if(!hospital) return <div className="container"><div className="no-results-state"><h3>Loading hospital...</h3></div></div>;

  const handleDirections = () => {
    if (navigator.geolocation) { navigator.geolocation.getCurrentPosition(pos => { const url=`https://www.google.com/maps/dir/?api=1&origin=${pos.coords.latitude},${pos.coords.longitude}&destination=${hospital.latitude},${hospital.longitude}`; window.open(url,'_blank','noopener,noreferrer'); }, ()=>setDirectionsNotice('Location permission was denied. Enable location or use your maps app manually.')); }
    else setDirectionsNotice('Location is not available in this browser.');
  };

  return (
    <div className="hospital-details-page">
      <div className="container">
        {/* Navigation Breadcrumb */}
        <div className="details-breadcrumb-bar">
          <button
            type="button"
            className="back-breadcrumb-btn"
            onClick={() => onNavigate('results')}
          >
            <Icon name="arrow-right" size={14} className="rotate-180" />
            <span>Back to Hospital Results</span>
          </button>
        </div>

        {/* Directions Notice Toast */}
        {directionsNotice && (
          <div className="directions-notice-toast">
            <Icon name="navigation" size={18} color="#4f46e5" />
            <span>{directionsNotice}</span>
            <button
              type="button"
              className="toast-close"
              onClick={() => setDirectionsNotice(null)}
            >
              <Icon name="close" size={14} />
            </button>
          </div>
        )}

        {/* Hospital Hero Card */}
        <div className="hospital-hero-banner">
          <div className="hospital-hero-left">
            <div className="hero-status-pills">
              <span className="type-badge">{hospital.type}</span>
              {hospital.is24x7Emergency ? (
                <span className="er-badge open">
                  <span className="dot"></span> 24/7 Emergency Active
                </span>
              ) : (
                <span className="er-badge day">Day Care & Scheduled</span>
              )}
            </div>

            <h1 className="details-hospital-title">{hospital.name}</h1>
            <p className="details-hospital-tagline">{hospital.tagline}</p>

            <div className="details-meta-highlights">
              <div className="meta-highlight-item">
                <Icon name="map-pin" size={16} color="#4f46e5" />
                <span>{hospital.address}, {hospital.city}</span>
              </div>
              <div className="meta-highlight-item">
                <Icon name="navigation" size={16} color="#0d9488" />
                <strong>{hospital.distanceText}</strong>
              </div>
              <div className="meta-highlight-item">
                <Icon name="clock" size={16} color="#3730a3" />
                <span>Current ER Triage Wait: <strong>{hospital.erWaitTime}</strong></span>
              </div>
            </div>
          </div>

          <div className="hospital-hero-right">
            <div className="rating-card-box">
              <div className="rating-num">
                <Icon name="star" size={24} color="#f59e0b" />
                <span>{hospital.rating}</span>
              </div>
              <span className="rating-count">Based on {hospital.reviewsCount} verified patient visits</span>
              <div className="rating-card-trust-row">
                <TrustBadge hospital={hospital} />
              </div>
            </div>

            <div className="details-hero-ctas">
              <button
                type="button"
                className="btn btn-outline btn-block"
                onClick={handleDirections}
              >
                <Icon name="navigation" size={16} />
                <span>Get Directions</span>
              </button>

              <button
                type="button"
                className="btn btn-primary btn-block"
                onClick={() => onBookHospitalVisit(hospital.name, hospital.specialties[0], hospital.id)}
              >
                <Icon name="calendar" size={16} />
                <span>Book Hospital Visit</span>
              </button>
            </div>
          </div>
        </div>

        {/* MediTrust Trust Engine — explainable trust score, not just a star rating */}
        <TrustScorePanel hospital={hospital} specialty={hospital.specialties[0]} />

        {/* Key Hospital Details Grid */}
        <div className="hospital-content-grid">
          {/* Main Left Content */}
          <div className="hospital-main-column">
            {/* Overview Box */}
            <div className="details-section-card">
              <h2 className="details-card-heading">Hospital Overview</h2>
              <p className="details-card-text">{hospital.overview}</p>

              <div className="hospital-contact-strip">
                <div className="contact-item">
                  <Icon name="phone" size={16} color="#4f46e5" />
                  <div>
                    <strong>Main Reception & Appointments</strong>
                    <a href={`tel:${hospital.phone.replace(/[^0-9]/g, '')}`}>{hospital.phone}</a>
                  </div>
                </div>

                <div className="contact-item emergency">
                  <Icon name="activity" size={16} color="#e11d48" />
                  <div>
                    <strong>24/7 Emergency Ambulance Hotline</strong>
                    <a href={`tel:${(hospital.emergencyHotline || hospital.phone || '').replace(/[^0-9]/g, '')}`}>
                      {hospital.emergencyHotline}
                    </a>
                  </div>
                </div>
              </div>
            </div>

            {/* Departments & Specialties */}
            <div className="details-section-card">
              <h2 className="details-card-heading">Accredited Clinical Departments</h2>
              <div className="departments-grid">
                {hospital.specialties.map((dept, idx) => (
                  <div key={idx} className="department-badge-card">
                    <div className="dept-icon-box">
                      <Icon name="badge-check" size={18} color="#4f46e5" />
                    </div>
                    <div>
                      <h4>{dept}</h4>
                      <p>Active Inpatient & Outpatient Unit</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Medical Facilities & Technology */}
            <div className="details-section-card">
              <h2 className="details-card-heading">Medical Equipment & Facilities</h2>
              <div className="facilities-grid">
                {hospital.facilities.map((fac, idx) => (
                  <div key={idx} className="facility-pill-item">
                    <Icon name="check" size={15} color="#0d9488" />
                    <span>{fac}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Patient Reviews Section */}
            <div className="details-section-card">
              <div className="reviews-header-row">
                <div>
                  <h2 className="details-card-heading">Patient Reviews & Feedback</h2>
                  <p className="reviews-subtext">
                    Verified ratings from patients who visited {hospital.name}.
                  </p>
                </div>
                <div className="average-rating-badge">
                  <Icon name="star" size={16} color="#f59e0b" />
                  <strong>{hospital.rating}</strong>
                  <span>/ 5.0</span>
                </div>
              </div>

              <div className="detailed-reviews-list">
                {reviews.map((rev, idx) => (
                  <div key={idx} className="single-patient-review">
                    <div className="review-meta">
                      <div className="reviewer-avatar">{rev.author.charAt(0)}</div>
                      <div>
                        <strong>{rev.author}</strong>
                        <span className="review-date-label">{rev.date} • Platform Review</span>
                      </div>
                      <div className="review-stars-inline">
                        {[...Array(rev.rating)].map((_, i) => (
                          <Icon key={i} name="star" size={14} />
                        ))}
                      </div>
                    </div>
                    <p className="review-comment-text">“{rev.comment}”</p>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Sidebar Right Column */}
          <div className="hospital-sidebar-column">
            {/* Quick Visit Action Card */}
            <div className="sidebar-action-card">
              <h3>Visiting {hospital.name}</h3>
              <ul className="sidebar-info-list">
                <li>
                  <Icon name="clock" size={16} color="#4f46e5" />
                  <div>
                    <strong>Emergency Department</strong>
                    <span>{hospital.openingHours}</span>
                  </div>
                </li>
                <li>
                  <Icon name="map-pin" size={16} color="#4f46e5" />
                  <div>
                    <strong>Address & Campus</strong>
                    <span>{hospital.address}</span>
                  </div>
                </li>
                <li>
                  <Icon name="shield" size={16} color="#0d9488" />
                  <div>
                    <strong>Accreditation Status</strong>
                    <span>JCAHO & State Board Accredited</span>
                  </div>
                </li>
              </ul>

              <button
                type="button"
                className="btn btn-primary btn-block"
                onClick={() => onBookHospitalVisit(hospital.name, hospital.specialties[0], hospital.id)}
              >
                <Icon name="calendar" size={16} />
                <span>Book Hospital Visit / Consult</span>
              </button>

              <button
                type="button"
                className="btn btn-outline btn-block"
                onClick={handleDirections}
              >
                <Icon name="navigation" size={16} />
                <span>Show On Map & Directions</span>
              </button>
            </div>

            {/* Patient Stay Prompt — PRD Section 29 Stay Matching Engine */}
            <div className="sidebar-stay-card">
              <div className="sidebar-stay-icon">
                <Icon name="home" size={20} />
              </div>
              <h4>Will you need to stay near the hospital?</h4>
              <p>
                Traveling from another city? MediTrust can show verified patient guest houses, budget
                hotels and caregiver-friendly stays near {hospital.name}.
              </p>
              <button
                type="button"
                className="btn btn-secondary btn-block"
                onClick={() => onNavigate('stays', { hospitalId: hospital.id })}
              >
                <Icon name="map-pin" size={15} />
                <span>Find Verified Patient Stay</span>
              </button>
            </div>

            {/* Emergency Assistance Notice */}
            <div className="sidebar-emergency-card">
              <div className="emergency-icon-wrap">
                <Icon name="activity" size={24} color="#e11d48" />
              </div>
              <h4>Critical Emergency?</h4>
              <p>For immediate paramedic response and ambulance dispatch, dial 911 immediately.</p>
              <a href={`tel:${(hospital.emergencyHotline || hospital.phone || '').replace(/[^0-9]/g, '')}`} className="btn btn-accent btn-sm btn-block">
                <Icon name="phone" size={15} />
                <span>Call Hospital ER</span>
              </a>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

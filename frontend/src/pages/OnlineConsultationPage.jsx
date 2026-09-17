import { useState, useMemo, useEffect } from 'react';
import { Icon } from '../components/Icons';
import { HospitalSkyline } from '../components/HospitalSkyline';
import { DoctorIllustration } from '../components/DoctorIllustration';
import { doctorService } from '../services/doctorService';
import { apiError } from '../services/api';

export function OnlineConsultationPage({ onSelectDoctor }) {
  const [doctorSearchQuery, setDoctorSearchQuery] = useState('');
  const [selectedSpecialty, setSelectedSpecialty] = useState('All');
  const [featuredDoctors,setFeaturedDoctors]=useState([]); const [loading,setLoading]=useState(true); const [error,setError]=useState('');
  useEffect(()=>{setLoading(true); const p={limit:100}; if(selectedSpecialty!=='All')p.specialty=selectedSpecialty; const req=doctorSearchQuery.trim()?doctorService.search(doctorSearchQuery.trim()):doctorService.list(p).then(r=>r.items); req.then(setFeaturedDoctors).catch(e=>setError(apiError(e))).finally(()=>setLoading(false));},[doctorSearchQuery,selectedSpecialty]);

  const specialtyFilters = [
    'All',
    'Cardiologist',
    'Pediatric Specialist',
    'Neurology & Brain Health',
    'Internal Medicine & Family Care',
  ];

  const filteredDoctors = useMemo(() => featuredDoctors.filter(doc => selectedSpecialty==='All' || doc.specialty.toLowerCase().includes(selectedSpecialty.toLowerCase())), [featuredDoctors,selectedSpecialty]);

  if(loading) return <div className="container"><div className="no-results-state"><h3>Loading doctors...</h3></div></div>;
  if(error) return <div className="container"><div className="no-results-state"><h3>{error}</h3></div></div>;
  return (
    <div className="consultation-page-wrapper">
      {/* Doctor Search Hero Section */}
      <section className="consultation-hero">
        <HospitalSkyline tone="light" className="hero-skyline-backdrop" />
        <DoctorIllustration variant="female" className="hero-doctor hero-doctor-left" />
        <DoctorIllustration variant="male" className="hero-doctor hero-doctor-right" />
        <div className="container">
          <div className="consultation-hero-content">
            <div className="section-pill">
              <Icon name="video" size={14} />
              <span>Virtual & Telehealth Consultations</span>
            </div>

            <h1 className="consultation-title">Find the Right Doctor</h1>
            <p className="consultation-subtitle">
              Connect directly with verified board-certified physicians for secure video consultations 
              or in-clinic follow-ups, with same-day prescription renewals.
            </p>

            {/* Separate Doctor Search Input */}
            <div className="doctor-search-box">
              <Icon name="search" size={20} color="#4f46e5" />
              <input
                type="text"
                placeholder="Search doctor, specialty or condition (e.g. Cardiologist, Dermatologist, Dr. Sarah Chen)..."
                value={doctorSearchQuery}
                onChange={(e) => setDoctorSearchQuery(e.target.value)}
                aria-label="Search doctor, specialty or condition"
              />
              {doctorSearchQuery && (
                <button
                  type="button"
                  className="clear-search-btn"
                  onClick={() => setDoctorSearchQuery('')}
                >
                  <Icon name="close" size={14} />
                </button>
              )}
            </div>

            {/* Quick Example Specialty Pills */}
            <div className="doctor-specialty-pills">
              <span className="pills-label">Popular specialties:</span>
              <div className="pills-row">
                {specialtyFilters.map((spec, idx) => (
                  <button
                    key={idx}
                    type="button"
                    className={`doctor-spec-pill ${selectedSpecialty === spec ? 'active' : ''}`}
                    onClick={() => setSelectedSpecialty(spec)}
                  >
                    {spec}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Doctor Cards Directory */}
      <section className="doctor-directory-section">
        <div className="container">
          <div className="directory-header">
            <div>
              <h2>Available Certified Physicians</h2>
              <p>Showing {filteredDoctors.length} verified specialists available for appointment booking.</p>
            </div>
          </div>

          {filteredDoctors.length === 0 ? (
            <div className="no-doctors-state">
              <Icon name="user" size={40} color="#94a3b8" />
              <h3>No doctors found matching "{doctorSearchQuery}"</h3>
              <p>Try clearing your search query or selecting "All" specialties.</p>
              <button
                type="button"
                className="btn btn-outline btn-sm"
                onClick={() => {
                  setDoctorSearchQuery('');
                  setSelectedSpecialty('All');
                }}
              >
                Show All Doctors
              </button>
            </div>
          ) : (
            <div className="consultation-doctors-grid">
              {filteredDoctors.map((doc) => (
                <div key={doc.id} className="consultation-doctor-card">
                  <div className="doc-card-top">
                    <div
                      className="doc-avatar-large"
                      style={{ backgroundColor: doc.avatarBg }}
                    >
                      <span>{doc.initials}</span>
                    </div>

                    <div className="doc-card-status">
                      {doc.availableToday ? (
                        <span className="availability-pill available">
                          <span className="dot"></span> Available Today
                        </span>
                      ) : (
                        <span className="availability-pill next-day">
                          Next Available Tomorrow
                        </span>
                      )}
                    </div>
                  </div>

                  <div className="doc-card-body">
                    <h3 className="doc-name">{doc.name}</h3>
                    <span className="doc-specialty">{doc.specialty}</span>
                    <span className="doc-hospital-affiliation">{doc.hospital}</span>

                    <p className="doc-bio-snippet">{doc.bio}</p>

                    <div className="doc-card-stats">
                      <div className="doc-stat-item">
                        <Icon name="star" size={14} color="#f59e0b" />
                        <strong>{doc.rating}</strong>
                        <span>({doc.reviewsCount})</span>
                      </div>
                      <div className="doc-stat-item">
                        <Icon name="award" size={14} color="#4f46e5" />
                        <span>{doc.experience}</span>
                      </div>
                      <div className="doc-stat-item fee">
                        <span>Fee: <strong>{doc.consultationFee}</strong></span>
                      </div>
                    </div>
                  </div>

                  <div className="doc-card-footer">
                    <button
                      type="button"
                      className="btn btn-primary btn-block"
                      onClick={() => onSelectDoctor(doc.id)}
                    >
                      <Icon name="calendar" size={15} />
                      <span>Select Doctor & View Slots</span>
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </section>
    </div>
  );
}

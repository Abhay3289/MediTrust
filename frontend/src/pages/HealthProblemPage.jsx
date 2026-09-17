import { useState, useMemo, useEffect } from 'react';
import { Icon } from '../components/Icons';
import { HospitalSkyline } from '../components/HospitalSkyline';
import { TrustBadge } from '../components/TrustBadge';
import { MatchScoreBadge } from '../components/MatchScoreBadge';
import { WhyRecommended } from '../components/WhyRecommended';
import { healthProblemService } from '../services/healthProblemService';
import { hospitalService } from '../services/hospitalService';
import { doctorService } from '../services/doctorService';
import { apiError } from '../services/api';
import { computeMatchScore, hasVerifiedDoctorAt } from '../utils/trustEngine';

export function HealthProblemPage({ onNavigate, onSelectHospital }) {
  const [inputText, setInputText] = useState('');
  const [activeCatalogId, setActiveCatalogId] = useState(null);
  const [healthProblemsCatalog,setHealthProblemsCatalog]=useState([]); const [hospitalsData,setHospitalsData]=useState([]); const [featuredDoctors,setFeaturedDoctors]=useState([]); const [error,setError]=useState('');
  useEffect(()=>{Promise.all([healthProblemService.list(),hospitalService.list({limit:100}),doctorService.list({limit:100})]).then(([p,h,d])=>{setHealthProblemsCatalog(p);setHospitalsData(h.items);setFeaturedDoctors(d.items)}).catch(e=>setError(apiError(e)));},[]);

  // Suggested condition shortcuts
  const popularSuggestions = [
    { label: 'Cardiology / Heart problem', query: 'heart' },
    { label: 'Orthopedic / Bone & Joint', query: 'bone' },
    { label: 'Pediatrics / Child Care', query: 'child' },
    { label: 'Skin Problems / Rash', query: 'skin' },
    { label: 'Diabetes / Endocrine', query: 'diabetes' },
    { label: 'General Medicine / Fever', query: 'fever' },
    { label: 'Neurology / Migraine', query: 'brain' },
    { label: 'Maternity / Pregnancy', query: 'pregnancy' },
  ];

  // Match catalog entries based on input query or active selection
  const matchedCatalog = useMemo(() => {
    if (activeCatalogId) {
      return healthProblemsCatalog.filter((c) => c.id === activeCatalogId);
    }
    if (!inputText.trim()) {
      return [];
    }

    const q = inputText.toLowerCase().trim();
    return healthProblemsCatalog.filter((cat) => {
      const nameMatch = cat.name.toLowerCase().includes(q);
      const keywordMatch = cat.keywords.some((k) => q.includes(k) || k.includes(q));
      const deptMatch = cat.recommendedDepartments.some((d) => d.toLowerCase().includes(q));
      return nameMatch || keywordMatch || deptMatch;
    });
  }, [inputText, activeCatalogId]);

  // Suitable hospitals derived from matches
  const recommendedHospitals = useMemo(() => {
    if (matchedCatalog.length === 0) {
      // If no query entered yet, show top emergency-equipped hospitals
      return hospitalsData.slice(0, 3);
    }

    const targetHospitalIds = new Set();
    matchedCatalog.forEach((cat) => {
      cat.relevantHospitalIds.forEach((id) => targetHospitalIds.add(id));
    });

    const matches = hospitalsData.filter((h) => targetHospitalIds.has(h.id));
    return matches.length > 0 ? matches : hospitalsData.slice(0, 3);
  }, [matchedCatalog]);

  // The specialty MediTrust is matching against, used by both the Match Score and "Why This Hospital?" explainer
  const effectiveSpecialty = matchedCatalog[0]?.recommendedDepartments[0] || inputText;

  const handleSuggestionClick = (query) => {
    setInputText(query);
    setActiveCatalogId(null);
  };

  const handleFindHospitals = (e) => {
    e.preventDefault();
    onNavigate('results', { query: inputText });
  };

  if(error) return <div className="container"><div className="no-results-state"><h3>{error}</h3></div></div>;
  return (
    <div className="health-problem-page-container">
      <HospitalSkyline tone="light" className="hero-skyline-backdrop problem-page-skyline" />
      <div className="container">
        {/* Breadcrumb back */}
        <div className="problem-nav-header">
          <button
            type="button"
            className="back-breadcrumb-btn"
            onClick={() => onNavigate('home')}
          >
            <Icon name="arrow-right" size={14} className="rotate-180" />
            <span>Back to Hospital Search</span>
          </button>
        </div>

        {/* Hero Input Box */}
        <div className="problem-hero-card">
          <div className="section-pill">
            <Icon name="activity" size={14} />
            <span>Customer Health & Facility Matching</span>
          </div>

          <h1 className="problem-hero-title">
            What health problem or treatment are you looking for?
          </h1>

          <p className="problem-hero-subtitle">
            Enter your symptoms, diagnosis, or required treatment to discover accredited hospitals 
            with certified medical departments and active equipment to care for your condition.
          </p>

          <form onSubmit={handleFindHospitals} className="problem-input-form">
            <div className="problem-input-box">
              <Icon name="search" size={22} color="#4f46e5" />
              <input
                type="text"
                placeholder="Enter your disease, symptoms or treatment (e.g. Heart problem, Joint pain, Child fever, Diabetes)..."
                value={inputText}
                onChange={(e) => {
                  setInputText(e.target.value);
                  setActiveCatalogId(null);
                }}
                aria-label="Enter your disease, symptoms or treatment"
              />
              {inputText && (
                <button
                  type="button"
                  className="clear-search-btn"
                  onClick={() => {
                    setInputText('');
                    setActiveCatalogId(null);
                  }}
                >
                  <Icon name="close" size={16} />
                </button>
              )}
            </div>

            <button type="submit" className="btn btn-primary btn-lg">
              <Icon name="building" size={18} />
              <span>Find Suitable Hospitals</span>
            </button>
          </form>

          {/* Quick Suggestion Chips */}
          <div className="suggestions-bar">
            <span className="suggestions-label">Common searches:</span>
            <div className="suggestion-chips-row">
              {popularSuggestions.map((item, idx) => (
                <button
                  key={idx}
                  type="button"
                  className={`suggestion-chip ${inputText.toLowerCase() === item.query ? 'active' : ''}`}
                  onClick={() => handleSuggestionClick(item.query)}
                >
                  {item.label}
                </button>
              ))}
            </div>
          </div>

          {/* Important Medical Disclaimer Notice */}
          <div className="clinical-guidance-disclaimer">
            <Icon name="shield" size={18} color="#0d9488" />
            <p>
              <strong>Notice:</strong> This feature matches your input with hospital departments and facilities. 
              It is not a medical diagnosis tool. For life-threatening emergencies, call <strong>911</strong> immediately.
            </p>
          </div>
        </div>

        {/* Matched Health Facilities & Recommended Departments */}
        <div className="matched-departments-section">
          {matchedCatalog.length > 0 && (
            <div className="matched-catalog-summary">
              {matchedCatalog.map((cat) => (
                <div key={cat.id} className="matched-category-box">
                  <div className="cat-top">
                    <span className="cat-badge">Relevant Health Area</span>
                    <h3>{cat.name}</h3>
                  </div>

                  <div className="cat-departments">
                    <span className="dept-label">Recommended Hospital Departments:</span>
                    <div className="dept-tags">
                      {cat.recommendedDepartments.map((dept, i) => (
                        <span key={i} className="dept-tag">
                          <Icon name="check" size={13} color="#0d9488" />
                          <span>{dept}</span>
                        </span>
                      ))}
                    </div>
                  </div>

                  <div className="cat-guidance-note">
                    <Icon name="activity" size={15} color="#4f46e5" />
                    <span>{cat.guidance}</span>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Suitable Hospitals List */}
          <div className="suitable-hospitals-header">
            <div>
              <h2>
                {inputText ? `Suitable Hospitals for "${inputText}"` : 'Recommended Multi-Specialty Hospitals'}
              </h2>
              <p>Hospitals verified to have certified departments and active facilities for this condition.</p>
            </div>
            <button
              type="button"
              className="btn btn-outline btn-sm"
              onClick={() => onNavigate('results', { query: inputText })}
            >
              <span>View All on Interactive Map</span>
              <Icon name="navigation" size={14} />
            </button>
          </div>

          <div className="suitable-hospitals-grid">
            {recommendedHospitals.map((hosp) => {
              const matchScore = computeMatchScore(hosp, {
                specialty: effectiveSpecialty,
                hasVerifiedDoctor: hasVerifiedDoctorAt(hosp, featuredDoctors),
              });
              return (
              <div key={hosp.id} className="suitable-hospital-card">
                <div className="suitable-card-header">
                  <div>
                    <span className="suitable-hosp-type">{hosp.type}</span>
                    <h3 className="suitable-hosp-name">{hosp.name}</h3>
                    <p className="suitable-hosp-address">
                      <Icon name="map-pin" size={13} color="#64748b" />
                      <span>{hosp.address}</span>
                    </p>
                  </div>
                  <div className="suitable-rating">
                    <Icon name="star" size={14} color="#f59e0b" />
                    <strong>{hosp.rating}</strong>
                  </div>
                </div>

                <div className="suitable-trust-row">
                  <MatchScoreBadge score={matchScore} />
                  <TrustBadge hospital={hosp} />
                </div>

                <div className="suitable-meta-row">
                  <span className="meta-pill distance">
                    <Icon name="navigation" size={13} />
                    <span>{hosp.distanceText}</span>
                  </span>
                  <span className="meta-pill wait">
                    <Icon name="clock" size={13} />
                    <span>ER Wait: {hosp.erWaitTime}</span>
                  </span>
                  {hosp.is24x7Emergency && (
                    <span className="meta-pill emergency">
                      <span className="dot"></span> 24/7 Emergency
                    </span>
                  )}
                </div>

                <WhyRecommended
                  hospital={hosp}
                  specialty={effectiveSpecialty}
                  doctors={featuredDoctors}
                  title="Why This Hospital?"
                />

                <div className="suitable-card-actions">
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
                    <span>View Hospital Details</span>
                    <Icon name="arrow-right" size={14} />
                  </button>
                </div>
              </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}

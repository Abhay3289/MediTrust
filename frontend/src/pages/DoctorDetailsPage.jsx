import { useState,useEffect } from 'react';
import { Icon } from '../components/Icons';
import { ReviewCarousel } from '../components/ReviewCarousel';
import { doctorService } from '../services/doctorService';
import { apiError } from '../services/api';

export function DoctorDetailsPage({ doctorId, onNavigate, onProceedToBooking }) {
  const [doctor,setDoctor]=useState(null); const [error,setError]=useState('');
  useEffect(()=>{Promise.all([doctorService.get(doctorId),doctorService.reviews(doctorId)]).then(([d,r])=>setDoctor({...d,reviews:r.map(x=>({...x,author:x.reviewer_name||`User ${x.user_id}`,date:new Date(x.created_at).toLocaleDateString()}))})).catch(e=>setError(apiError(e)));},[doctorId]);
  if(error) return <div className="container"><div className="no-results-state"><h3>{error}</h3></div></div>;
  if(!doctor) return <div className="container"><div className="no-results-state"><h3>Loading doctor...</h3></div></div>;

  const [consultationType, setConsultationType] = useState('video'); // 'video' | 'in-person'
  const today = new Date();
  const iso = (offset=0) => { const d=new Date(today); d.setDate(d.getDate()+offset); return d.toISOString().slice(0,10); };
  const [selectedDate, setSelectedDate] = useState(iso(0));
  const [selectedTime, setSelectedTime] = useState('10:30 AM');

  const availableDates = [
    { label: 'Today', sub: 'Available', value: iso(0) },
    { label: 'Tomorrow', sub: 'Open', value: iso(1) },
    { label: 'Day 3', sub: 'Open', value: iso(2) },
    { label: 'Day 4', sub: 'Open', value: iso(3) },
  ];

  const morningSlots = ['09:00 AM', '10:30 AM', '11:15 AM'];
  const afternoonSlots = ['01:30 PM', '02:45 PM', '04:00 PM'];
  const eveningSlots = ['05:30 PM', '06:45 PM', '07:30 PM'];

  const handleBook = () => {
    onProceedToBooking({
      doctor: doctor.name, doctorId: doctor.id, hospitalId: doctor.hospital_id,
      specialty: doctor.specialty,
      consultationType: consultationType === 'video' ? 'HD Video Consultation' : 'In-Clinic Hospital Visit',
      date: selectedDate,
      time: selectedTime,
      fee: doctor.consultationFee,
    });
  };

  return (
    <div className="doctor-details-page">
      <div className="container">
        {/* Navigation Breadcrumb */}
        <div className="details-breadcrumb-bar">
          <button
            type="button"
            className="back-breadcrumb-btn"
            onClick={() => onNavigate('consultation')}
          >
            <Icon name="arrow-right" size={14} className="rotate-180" />
            <span>Back to Doctor Directory</span>
          </button>
        </div>

        <div className="doctor-details-grid">
          {/* Left Column: Doctor Profile & Credentials */}
          <div className="doctor-profile-column">
            <div className="profile-hero-card">
              <div className="profile-hero-top">
                <div
                  className="profile-avatar-xl"
                  style={{ backgroundColor: doctor.avatarBg }}
                >
                  <span>{doctor.initials}</span>
                </div>

                <div className="profile-title-block">
                  <div className={`doc-verified-tag ${doctor.verified ? '' : 'unverified'}`}>
                    <Icon name="badge-check" size={14} color={doctor.verified ? '#0d9488' : '#94a3b8'} />
                    <span>{doctor.verified ? 'MediTrust Verified Doctor' : 'Verification Pending'}</span>
                  </div>
                  <h1 className="profile-doc-name">{doctor.name}</h1>
                  <span className="profile-doc-spec">{doctor.specialty}</span>
                  <span className="profile-doc-hospital">{doctor.hospital}</span>
                </div>
              </div>

              <div className="profile-metrics-strip">
                <div className="metric-cell">
                  <Icon name="star" size={16} color="#f59e0b" />
                  <strong>{doctor.rating}</strong>
                  <span>{doctor.reviewsCount} reviews</span>
                </div>
                <div className="metric-cell">
                  <Icon name="award" size={16} color="#4f46e5" />
                  <strong>{doctor.experience}</strong>
                  <span>Clinical practice</span>
                </div>
                <div className="metric-cell">
                  <Icon name="video" size={16} color="#0d9488" />
                  <strong>100% HIPAA</strong>
                  <span>Encrypted visit</span>
                </div>
              </div>

              <div className="profile-bio-section">
                <h3>About Physician</h3>
                <p>{doctor.bio}</p>
              </div>

              <div className="profile-consultation-info">
                <h3>Consultation Options</h3>
                <div className="consult-options-toggle">
                  <div
                    className={`option-card ${consultationType === 'video' ? 'active' : ''}`}
                    onClick={() => setConsultationType('video')}
                  >
                    <Icon name="video" size={20} color="#4f46e5" />
                    <div>
                      <strong>Video Consultation</strong>
                      <span>Connect securely on phone or PC</span>
                    </div>
                  </div>

                  <div
                    className={`option-card ${consultationType === 'in-person' ? 'active' : ''}`}
                    onClick={() => setConsultationType('in-person')}
                  >
                    <Icon name="building" size={20} color="#0d9488" />
                    <div>
                      <strong>In-Clinic Hospital Visit</strong>
                      <span>Meet in person at hospital suite</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Right Column: Date & Time Slot Selection */}
          <div className="slot-selection-column">
            <div className="slot-booking-card">
              <div className="slot-card-header">
                <h3>Select Appointment Slot</h3>
                <span className="fee-badge">Fee: {doctor.consultationFee}</span>
              </div>

              {/* Date Selection */}
              <div className="date-picker-group">
                <label className="picker-label">1. Choose Date:</label>
                <div className="date-buttons-row">
                  {availableDates.map((d, idx) => (
                    <button
                      key={idx}
                      type="button"
                      className={`date-select-btn ${selectedDate === d.value ? 'selected' : ''}`}
                      onClick={() => setSelectedDate(d.value)}
                    >
                      <span className="date-main">{d.label}</span>
                      <span className="date-sub">{d.sub}</span>
                    </button>
                  ))}
                </div>
              </div>

              {/* Time Slots Selection */}
              <div className="time-picker-group">
                <label className="picker-label">2. Choose Time Window:</label>

                <div className="slot-section">
                  <span className="slot-section-title">Morning (9:00 AM - 12:00 PM)</span>
                  <div className="slots-grid">
                    {morningSlots.map((time, idx) => (
                      <button
                        key={idx}
                        type="button"
                        className={`time-slot-btn ${selectedTime === time ? 'selected' : ''}`}
                        onClick={() => setSelectedTime(time)}
                      >
                        {time}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="slot-section">
                  <span className="slot-section-title">Afternoon (1:00 PM - 5:00 PM)</span>
                  <div className="slots-grid">
                    {afternoonSlots.map((time, idx) => (
                      <button
                        key={idx}
                        type="button"
                        className={`time-slot-btn ${selectedTime === time ? 'selected' : ''}`}
                        onClick={() => setSelectedTime(time)}
                      >
                        {time}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="slot-section">
                  <span className="slot-section-title">Evening (5:00 PM - 8:00 PM)</span>
                  <div className="slots-grid">
                    {eveningSlots.map((time, idx) => (
                      <button
                        key={idx}
                        type="button"
                        className={`time-slot-btn ${selectedTime === time ? 'selected' : ''}`}
                        onClick={() => setSelectedTime(time)}
                      >
                        {time}
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              {/* Slot Summary */}
              <div className="selected-slot-summary">
                <Icon name="calendar" size={16} color="#4f46e5" />
                <span>
                  Selected: <strong>{selectedDate}</strong> at <strong>{selectedTime}</strong> ({consultationType === 'video' ? 'Video Visit' : 'In-Clinic'})
                </span>
              </div>

              {/* CTA */}
              <button
                type="button"
                className="btn btn-primary btn-lg btn-block"
                onClick={handleBook}
              >
                <span>Proceed to Book Appointment</span>
                <Icon name="arrow-right" size={16} />
              </button>

              <div className="booking-guarantee-note">
                <Icon name="shield" size={14} color="#0d9488" />
                <span>Free cancellation up to 2 hours prior to scheduled consultation.</span>
              </div>
            </div>
          </div>
        </div>

        {/* Verified Patient Experience — sliding reviews (PRD Section 21) */}
        {doctor.reviews && doctor.reviews.length > 0 && (
          <div className="doctor-reviews-section">
            <div className="reviews-header-row">
              <div>
                <h2 className="details-card-heading">Verified Patient Experience</h2>
                <p className="reviews-subtext">
                  Feedback shown here comes only from patients who completed a real consultation with {doctor.name} through MediTrust.
                </p>
              </div>
              <div className="average-rating-badge">
                <Icon name="star" size={16} color="#f59e0b" />
                <strong>{doctor.rating}</strong>
                <span>/ 5.0</span>
              </div>
            </div>

            <ReviewCarousel reviews={doctor.reviews} />
          </div>
        )}
      </div>
    </div>
  );
}

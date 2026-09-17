import { useState,useEffect } from 'react';
import { Icon } from '../components/Icons';
import { appointmentService } from '../services/appointmentService';
import { doctorService } from '../services/doctorService';
import { apiError } from '../services/api';
import { useAuth } from '../context/AuthContext';

export function AppointmentBookingPage({ prefilledData = {}, onNavigate }) {
  const { user } = useAuth();
  const [formData, setFormData] = useState({
    fullName: '',
    phone: '',
    email: '',
    age: '',
    doctorOrHospital: prefilledData.doctor || prefilledData.hospital || 'MetroHealth Regional Medical Center',
    specialty: prefilledData.specialty || 'General Medicine',
    consultationType: prefilledData.consultationType || 'In-Clinic Hospital Visit',
    date: prefilledData.date || new Date().toISOString().split('T')[0],
    time: prefilledData.time || '10:30 AM',
    reason: '',
    hasInsurance: 'yes',
    doctorId: prefilledData.doctorId || '',
    hospitalId: prefilledData.hospitalId || '',
  });

  const [isConfirmed, setIsConfirmed] = useState(false);
  const [confirmationCode, setConfirmationCode] = useState('');
  const [submitError, setSubmitError] = useState('');
  const [submitting, setSubmitting] = useState(false);
  useEffect(()=>{ if(formData.hospitalId && !formData.doctorId){ doctorService.list({hospital_id:formData.hospitalId,limit:1}).then(r=>{const d=r.items[0];if(d)setFormData(v=>({...v,doctorId:d.id,doctorOrHospital:d.name}))}).catch(()=>{}); } },[formData.hospitalId,formData.doctorId]);

  const handleSubmit = async (e) => {
    e.preventDefault(); setSubmitError('');
    if (!user) { setSubmitError('Please log in before booking an appointment.'); return; }
    if (!formData.doctorId) { setSubmitError('Please choose a doctor before confirming the appointment.'); return; }
    const timeMatch = formData.time.match(/(\d{1,2}):(\d{2})\s*(AM|PM)/i);
    if (!timeMatch) { setSubmitError('Please enter a valid appointment time.'); return; }
    let hour=Number(timeMatch[1]), minute=Number(timeMatch[2]); if(timeMatch[3].toUpperCase()==='PM'&&hour<12)hour+=12;if(timeMatch[3].toUpperCase()==='AM'&&hour===12)hour=0;
    setSubmitting(true);
    try {
      const result=await appointmentService.create({doctor_id:formData.doctorId,hospital_id:formData.hospitalId||null,appointment_date:formData.date,appointment_time:`${String(hour).padStart(2,'0')}:${String(minute).padStart(2,'0')}:00`,appointment_type:formData.consultationType.includes('Video')?'online':'in_clinic',notes:formData.reason||null});
      setConfirmationCode(`MT-${String(result.id).padStart(6,'0')}`); setIsConfirmed(true); window.scrollTo({top:0,behavior:'smooth'});
    } catch(err) { setSubmitError(apiError(err)); } finally { setSubmitting(false); }
  };

  return (
    <div className="appointment-page-wrapper">
      <div className="container">
        {/* Navigation Breadcrumb */}
        <div className="details-breadcrumb-bar">
          <button
            type="button"
            className="back-breadcrumb-btn"
            onClick={() => onNavigate('home')}
          >
            <Icon name="arrow-right" size={14} className="rotate-180" />
            <span>Return to Hospital Search</span>
          </button>
        </div>

        {!isConfirmed ? (
          <div className="booking-page-grid">
            {/* Form Column */}
            <div className="booking-form-column">
              <div className="booking-form-card">
                <div className="form-header-badge">
                  <span className="pill-dot"></span>
                  <span>Direct Healthcare Booking</span>
                </div>

                <h1 className="booking-form-title">Confirm Your Appointment</h1>
                <p className="booking-form-subtitle">
                  Please review your consultation details and provide patient contact information for verification.
                </p>

                <form onSubmit={handleSubmit} className="main-booking-form">
                  {/* Patient Info Section */}
                  <div className="form-section-title">
                    <Icon name="user" size={18} color="#4f46e5" />
                    <span>1. Patient Information</span>
                  </div>

                  <div className="form-two-col">
                    <div className="form-field">
                      <label htmlFor="fullName">Patient Full Name *</label>
                      <input
                        type="text"
                        id="fullName"
                        required
                        placeholder="e.g. Johnathan Doe"
                        value={formData.fullName}
                        onChange={(e) => setFormData({ ...formData, fullName: e.target.value })}
                      />
                    </div>

                    <div className="form-field">
                      <label htmlFor="phone">Phone Number *</label>
                      <input
                        type="tel"
                        id="phone"
                        required
                        placeholder="(555) 000-0000"
                        value={formData.phone}
                        onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                      />
                    </div>
                  </div>

                  <div className="form-two-col">
                    <div className="form-field">
                      <label htmlFor="email">Email Address *</label>
                      <input
                        type="email"
                        id="email"
                        required
                        placeholder="patient@example.com"
                        value={formData.email}
                        onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                      />
                    </div>

                    <div className="form-field">
                      <label htmlFor="age">Age (Years) *</label>
                      <input
                        type="number"
                        id="age"
                        required
                        min="1"
                        max="120"
                        placeholder="e.g. 34"
                        value={formData.age}
                        onChange={(e) => setFormData({ ...formData, age: e.target.value })}
                      />
                    </div>
                  </div>

                  {/* Consultation Specifics */}
                  <div className="form-section-title">
                    <Icon name="calendar" size={18} color="#4f46e5" />
                    <span>2. Facility & Time Schedule</span>
                  </div>

                  <div className="form-two-col">
                    <div className="form-field">
                      <label htmlFor="provider">Selected Provider / Hospital</label>
                      <input
                        type="text"
                        id="provider"
                        readOnly
                        value={formData.doctorOrHospital}
                        className="readonly-input"
                      />
                    </div>

                    <div className="form-field">
                      <label htmlFor="spec">Department / Specialty</label>
                      <input
                        type="text"
                        id="spec"
                        readOnly
                        value={formData.specialty}
                        className="readonly-input"
                      />
                    </div>
                  </div>

                  <div className="form-two-col">
                    <div className="form-field">
                      <label htmlFor="bDate">Scheduled Date</label>
                      <input
                        type="text"
                        id="bDate"
                        value={formData.date}
                        onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                      />
                    </div>

                    <div className="form-field">
                      <label htmlFor="bTime">Time Window</label>
                      <input
                        type="text"
                        id="bTime"
                        value={formData.time}
                        onChange={(e) => setFormData({ ...formData, time: e.target.value })}
                      />
                    </div>
                  </div>

                  <div className="form-field">
                    <label htmlFor="reason">Symptoms or Reason for Consultation</label>
                    <textarea
                      id="reason"
                      rows="3"
                      placeholder="Briefly describe your symptoms or specific tests needed (optional)..."
                      value={formData.reason}
                      onChange={(e) => setFormData({ ...formData, reason: e.target.value })}
                    ></textarea>
                  </div>

                  <div className="form-disclaimer-pill">
                    <Icon name="shield" size={16} color="#0d9488" />
                    <span>All records and personal details are protected under HIPAA data encryption.</span>
                  </div>

                  {submitError && <div className="auth-error-note">{submitError}</div>}
                  <button type="submit" disabled={submitting} className="btn btn-primary btn-lg btn-block">
                    <Icon name="calendar" size={18} />
                    <span>{submitting ? 'Saving Appointment...' : 'Confirm & Finalize Appointment'}</span>
                  </button>
                </form>
              </div>
            </div>

            {/* Sidebar Summary Card */}
            <div className="booking-summary-column">
              <div className="booking-summary-card">
                <h3>Booking Summary</h3>

                <div className="summary-hospital-item">
                  <Icon name="building" size={20} color="#4f46e5" />
                  <div>
                    <strong>{formData.doctorOrHospital}</strong>
                    <span>{formData.specialty}</span>
                  </div>
                </div>

                <div className="summary-details-list">
                  <div className="sum-item">
                    <span>Visit Type:</span>
                    <strong>{formData.consultationType}</strong>
                  </div>
                  <div className="sum-item">
                    <span>Date:</span>
                    <strong>{formData.date}</strong>
                  </div>
                  <div className="sum-item">
                    <span>Time Window:</span>
                    <strong>{formData.time}</strong>
                  </div>
                  <div className="sum-item">
                    <span>Booking Fee:</span>
                    <strong className="free-tag">No Upfront Charge</strong>
                  </div>
                </div>

                <div className="summary-support-box">
                  <Icon name="phone" size={15} color="#3730a3" />
                  <span>Need assistance? Call Patient Support at <strong>(800) 555-0199</strong></span>
                </div>
              </div>
            </div>
          </div>
        ) : (
          /* Confirmation Success State */
          <div className="booking-confirmed-wrapper">
            <div className="confirmed-card">
              <div className="confirmed-icon-badge">
                <Icon name="check" size={38} color="#0d9488" />
              </div>

              <span className="confirmed-status-pill">Booking Successful</span>
              <h1 className="confirmed-heading">Appointment Confirmed!</h1>
              <p className="confirmed-sub">
                Your appointment has been registered with {formData.doctorOrHospital}. A confirmation notice has been sent to <strong>{formData.email}</strong>.
              </p>

              <div className="confirmed-voucher-box">
                <div className="voucher-header">
                  <div>
                    <span className="voucher-label">Appointment ID:</span>
                    <strong className="voucher-code">{confirmationCode}</strong>
                  </div>
                  <span className="voucher-badge">Verified Status</span>
                </div>

                <div className="voucher-grid">
                  <div className="voucher-item">
                    <span>Patient Name:</span>
                    <strong>{formData.fullName}</strong>
                  </div>
                  <div className="voucher-item">
                    <span>Contact:</span>
                    <strong>{formData.phone}</strong>
                  </div>
                  <div className="voucher-item">
                    <span>Facility / Doctor:</span>
                    <strong>{formData.doctorOrHospital}</strong>
                  </div>
                  <div className="voucher-item">
                    <span>Department:</span>
                    <strong>{formData.specialty}</strong>
                  </div>
                  <div className="voucher-item">
                    <span>Scheduled Date:</span>
                    <strong>{formData.date}</strong>
                  </div>
                  <div className="voucher-item">
                    <span>Scheduled Time:</span>
                    <strong>{formData.time}</strong>
                  </div>
                </div>
              </div>

              <div className="confirmed-next-steps">
                <h4>Next Steps for Patient:</h4>
                <ul>
                  <li>
                    <Icon name="check" size={14} color="#0d9488" />
                    <span>Please arrive 10 minutes before your scheduled window for contactless check-in.</span>
                  </li>
                  <li>
                    <Icon name="check" size={14} color="#0d9488" />
                    <span>Bring a valid government ID and any previous medical test reports.</span>
                  </li>
                  <li>
                    <Icon name="check" size={14} color="#0d9488" />
                    <span>If this is a video visit, your secure consultation link will activate 5 minutes prior to the start time.</span>
                  </li>
                </ul>
              </div>

              <div className="confirmed-actions">
                <button
                  type="button"
                  className="btn btn-outline"
                  onClick={() => window.print()}
                >
                  <span>Print Confirmation</span>
                </button>

                <button
                  type="button"
                  className="btn btn-primary"
                  onClick={() => onNavigate('home')}
                >
                  <Icon name="building" size={16} />
                  <span>Return to Hospital Discovery</span>
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

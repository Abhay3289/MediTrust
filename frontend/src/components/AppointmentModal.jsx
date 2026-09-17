import { useState } from 'react';
import { Icon } from './Icons';
import { featuredDoctors, healthcareServices } from '../data/healthcareData';

export function AppointmentModal({ isOpen, onClose, preselectedDoctor = '', preselectedService = '' }) {
  const [formData, setFormData] = useState({
    fullName: '',
    email: '',
    phone: '',
    doctor: preselectedDoctor || '',
    service: preselectedService || 'Primary & Family Care',
    date: new Date().toISOString().split('T')[0],
    time: '10:00 AM',
    reason: '',
  });

  const [isSubmitted, setIsSubmitted] = useState(false);
  const [confirmationCode, setConfirmationCode] = useState('');

  if (!isOpen) return null;

  const handleSubmit = (e) => {
    e.preventDefault();
    const randomCode = 'MT-' + Math.floor(100000 + Math.random() * 900000);
    setConfirmationCode(randomCode);
    setIsSubmitted(true);
  };

  const handleReset = () => {
    setIsSubmitted(false);
    onClose();
  };

  return (
    <div className="modal-overlay" onClick={onClose} role="dialog" aria-modal="true" aria-labelledby="modal-title">
      <div className="modal-container" onClick={(e) => e.stopPropagation()}>
        <button
          type="button"
          className="modal-close-btn"
          onClick={onClose}
          aria-label="Close dialog"
        >
          <Icon name="close" size={20} />
        </button>

        {!isSubmitted ? (
          <div className="modal-content">
            <div className="modal-header">
              <div className="modal-icon-badge">
                <Icon name="calendar" size={24} />
              </div>
              <div>
                <h3 id="modal-title" className="modal-title">Book an Appointment</h3>
                <p className="modal-subtitle">Fast, secure consultation with top-rated medical experts.</p>
              </div>
            </div>

            <form onSubmit={handleSubmit} className="appointment-form">
              <div className="form-row">
                <div className="form-group">
                  <label htmlFor="fullName">Full Name</label>
                  <input
                    type="text"
                    id="fullName"
                    required
                    placeholder="e.g. Eleanor Vance"
                    value={formData.fullName}
                    onChange={(e) => setFormData({ ...formData, fullName: e.target.value })}
                  />
                </div>
                <div className="form-group">
                  <label htmlFor="phone">Phone Number</label>
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

              <div className="form-group">
                <label htmlFor="email">Email Address</label>
                <input
                  type="email"
                  id="email"
                  required
                  placeholder="name@example.com"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                />
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label htmlFor="serviceSelect">Department / Service</label>
                  <select
                    id="serviceSelect"
                    value={formData.service}
                    onChange={(e) => setFormData({ ...formData, service: e.target.value })}
                  >
                    {healthcareServices.map((s) => (
                      <option key={s.id} value={s.title}>
                        {s.title}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="form-group">
                  <label htmlFor="doctorSelect">Preferred Doctor (Optional)</label>
                  <select
                    id="doctorSelect"
                    value={formData.doctor}
                    onChange={(e) => setFormData({ ...formData, doctor: e.target.value })}
                  >
                    <option value="">Any Available Specialist</option>
                    {featuredDoctors.map((d) => (
                      <option key={d.id} value={d.name}>
                        {d.name} ({d.specialty})
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label htmlFor="date">Preferred Date</label>
                  <input
                    type="date"
                    id="date"
                    required
                    value={formData.date}
                    onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                  />
                </div>

                <div className="form-group">
                  <label htmlFor="time">Preferred Time Window</label>
                  <select
                    id="time"
                    value={formData.time}
                    onChange={(e) => setFormData({ ...formData, time: e.target.value })}
                  >
                    <option value="09:00 AM">09:00 AM (Morning)</option>
                    <option value="10:30 AM">10:30 AM (Morning)</option>
                    <option value="01:00 PM">01:00 PM (Afternoon)</option>
                    <option value="03:30 PM">03:30 PM (Afternoon)</option>
                    <option value="06:00 PM">06:00 PM (Evening Telehealth)</option>
                  </select>
                </div>
              </div>

              <div className="form-group">
                <label htmlFor="reason">Brief Symptoms / Reason for Visit (Optional)</label>
                <textarea
                  id="reason"
                  rows="2"
                  placeholder="e.g. Routine wellness checkup, mild migraine symptoms..."
                  value={formData.reason}
                  onChange={(e) => setFormData({ ...formData, reason: e.target.value })}
                ></textarea>
              </div>

              <div className="form-disclaimer">
                <Icon name="shield" size={15} />
                <span>Your information is protected under HIPAA and encrypted end-to-end.</span>
              </div>

              <div className="form-actions">
                <button type="button" className="btn btn-secondary" onClick={onClose}>
                  Cancel
                </button>
                <button type="submit" className="btn btn-primary">
                  <Icon name="calendar" size={16} />
                  <span>Confirm Consultation</span>
                </button>
              </div>
            </form>
          </div>
        ) : (
          <div className="modal-content success-state">
            <div className="success-icon-wrap">
              <Icon name="check" size={36} color="#0d9488" />
            </div>
            <h3>Consultation Confirmed!</h3>
            <p className="success-sub">
              Your appointment request has been scheduled in the MediTrust system.
            </p>

            <div className="confirmation-card">
              <div className="conf-item">
                <span>Appointment ID:</span>
                <strong>{confirmationCode}</strong>
              </div>
              <div className="conf-item">
                <span>Patient:</span>
                <strong>{formData.fullName}</strong>
              </div>
              <div className="conf-item">
                <span>Service:</span>
                <strong>{formData.service}</strong>
              </div>
              {formData.doctor && (
                <div className="conf-item">
                  <span>Specialist:</span>
                  <strong>{formData.doctor}</strong>
                </div>
              )}
              <div className="conf-item">
                <span>Scheduled For:</span>
                <strong>{formData.date} at {formData.time}</strong>
              </div>
            </div>

            <p className="conf-instructions">
              A calendar invite and encrypted consultation link have been queued for <strong>{formData.email}</strong>.
            </p>

            <button type="button" className="btn btn-primary btn-block" onClick={handleReset}>
              Done & Return to Homepage
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

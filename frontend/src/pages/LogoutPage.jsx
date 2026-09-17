import { useEffect, useRef } from 'react';
import { Icon } from '../components/Icons';
import { HospitalSkyline } from '../components/HospitalSkyline';

export function LogoutPage({ onNavigate, onLogout, userName }) {
  const hasRun = useRef(false);

  useEffect(() => {
    if (!hasRun.current) {
      hasRun.current = true;
      onLogout();
    }
  }, [onLogout]);

  return (
    <div className="auth-page-wrapper logout-page-wrapper">
      <HospitalSkyline tone="dark" className="logout-skyline" />
      <div className="logout-card">
        <div className="logout-icon-badge">
          <Icon name="badge-check" size={34} />
        </div>
        <span className="logout-status-pill">Session Ended</span>
        <h1 className="logout-title">
          {userName ? `You've been logged out, ${userName}.` : "You've been securely logged out."}
        </h1>
        <p className="logout-subtitle">
          Your MediTrust session has been closed on this device. Your saved hospitals, consultations
          and journey history will be waiting for you the next time you log in.
        </p>

        <div className="logout-actions">
          <button type="button" className="btn btn-primary btn-lg" onClick={() => onNavigate('login')}>
            <Icon name="lock" size={16} />
            <span>Log In Again</span>
          </button>
          <button type="button" className="btn btn-secondary btn-lg" onClick={() => onNavigate('home')}>
            <Icon name="arrow-right" size={16} />
            <span>Return to Home</span>
          </button>
        </div>

        <div className="logout-help-note">
          <Icon name="phone" size={14} />
          <span>Need help? Patient Helpline: (800) 555-0199</span>
        </div>
      </div>
    </div>
  );
}

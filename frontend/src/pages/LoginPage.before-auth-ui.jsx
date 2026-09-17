import { useState } from 'react';
import { Icon } from '../components/Icons';
import { HospitalSkyline } from '../components/HospitalSkyline';
import { useAuth } from '../context/AuthContext';
import { apiError } from '../services/api';

export function LoginPage({ onNavigate }) {
  const { login, register } = useAuth();
  const [mode, setMode] = useState('login');
  const [name, setName] = useState('');
  const [identifier, setIdentifier] = useState('');
  const [password, setPassword] = useState('');
  const [role, setRole] = useState('patient'); // 'patient' | 'caregiver' — PRD 7.1 / 7.2 target users
  const [location, setLocation] = useState('');
  const [consent, setConsent] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault(); setError('');
    if (!identifier.trim() || !password.trim()) { setError('Please fill in all required fields to continue.'); return; }
    if (mode === 'signup' && !consent) { setError('Please confirm consent before continuing.'); return; }
    try {
      if (mode === 'login') await login({ identifier: identifier.trim(), password });
      else await register({ full_name:name.trim(), identifier:identifier.trim(), password, role, city:location.trim() || null, consent });
      onNavigate('home');
    } catch (err) { setError(apiError(err)); }
  };
  const handleGuest = () => onNavigate('home');

  return (
    <div className="auth-page-wrapper">
      <div className="auth-split-card">
        {/* Left brand / trust panel */}
        <div className="auth-brand-panel">
          <HospitalSkyline tone="dark" className="auth-skyline" />
          <div className="auth-brand-content">
            <div className="brand-logo auth-brand-logo">
              <Icon name="logo" size={40} />
              <div className="brand-text">
                <span className="brand-name auth-brand-name">Medi<span>Trust</span></span>
              </div>
            </div>
            <h2 className="auth-brand-title">Right Care. Right Hospital. Right Support.</h2>
            <p className="auth-brand-copy">
              Sign in to track your healthcare journey — saved hospitals, upcoming consultations,
              and follow-ups, all verified and in one trusted place.
            </p>
            <ul className="auth-trust-list">
              <li><Icon name="badge-check" size={16} /><span>MediTrust Verified hospital network</span></li>
              <li><Icon name="shield" size={16} /><span>Your health data stays private &amp; encrypted</span></li>
              <li><Icon name="activity" size={16} /><span>24/7 emergency facility discovery</span></li>
              <li><Icon name="user" size={16} /><span>Family &amp; caregivers can help manage your journey, with your consent</span></li>
            </ul>
          </div>
        </div>

        {/* Right form panel */}
        <div className="auth-form-panel">
          <button type="button" className="back-breadcrumb-btn auth-back-btn" onClick={() => onNavigate('home')}>
            <Icon name="arrow-right" size={16} className="rotate-180" />
            <span>Back to MediTrust</span>
          </button>

          <div className="auth-tabs">
            <button
              type="button"
              className={`auth-tab-btn ${mode === 'login' ? 'active' : ''}`}
              onClick={() => { setMode('login'); setError(''); }}
            >
              Log In
            </button>
            <button
              type="button"
              className={`auth-tab-btn ${mode === 'signup' ? 'active' : ''}`}
              onClick={() => { setMode('signup'); setError(''); }}
            >
              Create Account
            </button>
          </div>

          <h1 className="auth-form-title">
            {mode === 'login' ? 'Welcome back' : 'Start your MediTrust journey'}
          </h1>
          <p className="auth-form-subtitle">
            {mode === 'login'
              ? 'Log in to continue managing your hospital visits and consultations.'
              : 'Create a free account to save hospitals, doctors and your care journey.'}
          </p>

          <form onSubmit={handleSubmit} className="auth-form">
            {mode === 'signup' && (
              <>
                <div className="form-field">
                  <label htmlFor="auth-name">Full Name</label>
                  <input
                    id="auth-name"
                    type="text"
                    placeholder="e.g. Aditi Sharma"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                  />
                </div>

                <div className="form-field">
                  <label>Registering as</label>
                  <div className="role-toggle-group">
                    <button
                      type="button"
                      className={`role-toggle-btn ${role === 'patient' ? 'active' : ''}`}
                      onClick={() => setRole('patient')}
                    >
                      <Icon name="user" size={15} />
                      <span>Patient</span>
                    </button>
                    <button
                      type="button"
                      className={`role-toggle-btn ${role === 'caregiver' ? 'active' : ''}`}
                      onClick={() => setRole('caregiver')}
                    >
                      <Icon name="heart" size={15} />
                      <span>Family / Caregiver</span>
                    </button>
                  </div>
                </div>
              </>
            )}

            <div className="form-field">
              <label htmlFor="auth-id">Email or Mobile Number</label>
              <input
                id="auth-id"
                type="text"
                placeholder="you@example.com or +91 98xxxxxx"
                value={identifier}
                onChange={(e) => setIdentifier(e.target.value)}
              />
            </div>

            <div className="form-field">
              <label htmlFor="auth-pw">Password</label>
              <input
                id="auth-pw"
                type="password"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
            </div>

            {mode === 'signup' && (
              <>
                <div className="form-field">
                  <label htmlFor="auth-location">City / Location <span className="optional-tag">(optional)</span></label>
                  <input
                    id="auth-location"
                    type="text"
                    placeholder="e.g. Pune, Maharashtra"
                    value={location}
                    onChange={(e) => setLocation(e.target.value)}
                  />
                </div>

                <label className="consent-checkbox-row">
                  <input
                    type="checkbox"
                    checked={consent}
                    onChange={(e) => setConsent(e.target.checked)}
                  />
                  <span>
                    I consent to MediTrust collecting my basic profile and, only where necessary, my healthcare
                    information — to help coordinate hospital, doctor and care recommendations for me.
                  </span>
                </label>
              </>
            )}

            {error && (
              <div className="auth-error-note">
                <Icon name="help" size={14} />
                <span>{error}</span>
              </div>
            )}

            <button type="submit" className="btn btn-primary btn-block btn-lg">
              <Icon name="lock" size={16} />
              <span>{mode === 'login' ? 'Log In Securely' : 'Create My Account'}</span>
            </button>
          </form>

          <div className="auth-divider"><span>or</span></div>

          <button type="button" className="btn btn-secondary btn-block" onClick={handleGuest}>
            <Icon name="user" size={16} />
            <span>Continue as Guest</span>
          </button>

          <p className="auth-disclaimer-note">
            Your account is securely authenticated by the MediTrust backend. Guest browsing does not create an account.
          </p>
        </div>
      </div>
    </div>
  );
}

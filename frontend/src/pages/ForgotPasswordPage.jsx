

import { useState } from 'react';
import { Icon } from '../components/Icons';
import { HospitalSkyline } from '../components/HospitalSkyline';
import { api } from '../services/api';

export function ForgotPasswordPage({ onNavigate }) {
  const [identifier, setIdentifier] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (!identifier.trim()) {
      setError(
        'Please enter your username, phone number or email.'
      );
      return;
    }

    try {
      setLoading(true);

      await api.post('/auth/forgot-password', {
        identifier: identifier.trim(),
      });

      // Save identifier so OTP and reset pages can use it
      sessionStorage.setItem(
        'meditrust_reset_identifier',
        identifier.trim()
      );

      onNavigate('otp');
    } catch (err) {
      console.error('Forgot password error:', err);

      const message =
        err?.response?.data?.detail ||
        'Unable to process your request. Please try again.';

      setError(message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-page-wrapper">
      <div className="auth-split-card">

        {/* LEFT SIDE */}
        <div className="auth-brand-panel">
          <HospitalSkyline
            tone="dark"
            className="auth-skyline"
          />

          <div className="auth-brand-content">

            <div className="brand-logo auth-brand-logo">
              <Icon name="logo" size={40} />

              <div className="brand-text">
                <span className="brand-name auth-brand-name">
                  Medi<span>Trust</span>
                </span>
              </div>
            </div>

            <h2 className="auth-brand-title">
              Secure Account Recovery
            </h2>

            <p className="auth-brand-copy">
              Forgot your password? Don't worry. We'll help
              you securely recover your MediTrust account.
            </p>

            <ul className="auth-trust-list">
              <li>
                <Icon name="shield" size={16} />
                <span>Secure account recovery</span>
              </li>

              <li>
                <Icon name="lock" size={16} />
                <span>Your account stays protected</span>
              </li>

              <li>
                <Icon name="badge-check" size={16} />
                <span>Verified recovery process</span>
              </li>
            </ul>

          </div>
        </div>

        {/* RIGHT SIDE */}
        <div className="auth-form-panel">

          <button
            type="button"
            className="back-breadcrumb-btn auth-back-btn"
            onClick={() => onNavigate('login')}
          >
            <Icon
              name="arrow-right"
              size={16}
              className="rotate-180"
            />

            <span>Back to Login</span>
          </button>

          <h1 className="auth-form-title">
            Forgot your password?
          </h1>

          <p className="auth-form-subtitle">
            Enter your username, phone number or email and
            we'll help you verify your account.
          </p>

          <form
            onSubmit={handleSubmit}
            className="auth-form"
          >

            <div className="form-field">
              <label htmlFor="forgot-identifier">
                Username, Phone Number or Email
              </label>

              <input
                id="forgot-identifier"
                type="text"
                placeholder="Enter username, phone number or email"
                value={identifier}
                onChange={(e) =>
                  setIdentifier(e.target.value)
                }
                autoComplete="username"
                disabled={loading}
              />
            </div>

            {error && (
              <div className="auth-error-note">
                <Icon name="help" size={14} />
                <span>{error}</span>
              </div>
            )}

            <button
              type="submit"
              className="btn btn-primary btn-block btn-lg"
              disabled={loading}
            >
              <Icon name="lock" size={16} />

              <span>
                {loading ? 'Sending OTP...' : 'Continue'}
              </span>
            </button>

          </form>

          <div className="auth-divider">
            <span>or</span>
          </div>

          <button
            type="button"
            className="btn btn-secondary btn-block"
            onClick={() => onNavigate('login')}
            disabled={loading}
          >
            <Icon
              name="arrow-right"
              size={16}
              className="rotate-180"
            />

            <span>Back to Login</span>
          </button>

          <p className="auth-disclaimer-note">
            For your security, account recovery requires
            verification.
          </p>

        </div>
      </div>
    </div>
  );
}



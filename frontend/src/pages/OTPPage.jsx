

import { useState } from 'react';
import { Icon } from '../components/Icons';
import { HospitalSkyline } from '../components/HospitalSkyline';
import { api } from '../services/api';

export function OTPPage({ onNavigate }) {
  const [otp, setOtp] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (!otp.trim()) {
      setError('Please enter the OTP.');
      return;
    }

    if (otp.length !== 6) {
      setError('Please enter the 6-digit OTP.');
      return;
    }

    const identifier = sessionStorage.getItem(
      'meditrust_reset_identifier'
    );

    if (!identifier) {
      setError(
        'Recovery session expired. Please start again.'
      );
      return;
    }

    try {
      setLoading(true);

      await api.post('/auth/verify-otp', {
        identifier,
        otp,
      });

      // Remember that OTP verification was successful
      sessionStorage.setItem(
        'meditrust_otp_verified',
        'true'
      );

      onNavigate('reset-password');
    } catch (err) {
      console.error('OTP verification error:', err);

      const message =
        err?.response?.data?.detail ||
        'Invalid or expired OTP. Please try again.';

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
              Verify Your Account
            </h2>

            <p className="auth-brand-copy">
              We've sent a verification code to help
              securely recover your MediTrust account.
            </p>

            <ul className="auth-trust-list">
              <li>
                <Icon name="shield" size={16} />
                <span>Secure verification</span>
              </li>

              <li>
                <Icon name="lock" size={16} />
                <span>Your account stays protected</span>
              </li>

              <li>
                <Icon name="badge-check" size={16} />
                <span>Verified account recovery</span>
              </li>
            </ul>

          </div>
        </div>

        {/* RIGHT SIDE */}
        <div className="auth-form-panel">

          <button
            type="button"
            className="back-breadcrumb-btn auth-back-btn"
            onClick={() => onNavigate('forgot-password')}
            disabled={loading}
          >
            <Icon
              name="arrow-right"
              size={16}
              className="rotate-180"
            />

            <span>Back</span>
          </button>

          <h1 className="auth-form-title">
            Enter verification code
          </h1>

          <p className="auth-form-subtitle">
            Enter the 6-digit OTP sent to your registered
            contact.
          </p>

          <form
            onSubmit={handleSubmit}
            className="auth-form"
          >

            <div className="form-field">
              <label htmlFor="otp">
                Verification Code
              </label>

              <input
                id="otp"
                type="text"
                inputMode="numeric"
                maxLength={6}
                placeholder="Enter 6-digit OTP"
                value={otp}
                onChange={(e) => {
                  const value = e.target.value
                    .replace(/\D/g, '')
                    .slice(0, 6);

                  setOtp(value);
                }}
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
              <Icon name="badge-check" size={16} />

              <span>
                {loading ? 'Verifying...' : 'Verify OTP'}
              </span>
            </button>

          </form>

          <div className="auth-divider">
            <span>or</span>
          </div>

          <button
            type="button"
            className="btn btn-secondary btn-block"
            onClick={() => onNavigate('forgot-password')}
            disabled={loading}
          >
            <span>Resend OTP</span>
          </button>

          <p className="auth-disclaimer-note">
            Never share your verification code with anyone.
          </p>

        </div>
      </div>
    </div>
  );
}


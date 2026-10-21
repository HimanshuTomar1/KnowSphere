import React, { useState, useEffect, useRef } from 'react';
import axios from 'axios';
import KnowSphereLogo from './KnowSphereLogo';

export default function AuthModal({ isOpen, onClose, user, onAuthSuccess, onLogout }) {
  // mode: 'login' | 'register' | 'otp'
  const [mode, setMode] = useState('login');
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    phone: '',
  });

  const [otpDigits, setOtpDigits] = useState(['', '', '', '', '', '']);
  const [receivedOtp, setReceivedOtp] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [successMsg, setSuccessMsg] = useState(null);
  const [resendCooldown, setResendCooldown] = useState(0);

  const otpInputsRef = useRef([]);

  useEffect(() => {
    let timer;
    if (resendCooldown > 0) {
      timer = setInterval(() => setResendCooldown(c => c - 1), 1000);
    }
    return () => clearInterval(timer);
  }, [resendCooldown]);

  if (!isOpen) return null;

  const handleInputChange = e => {
    setFormData(prev => ({ ...prev, [e.target.name]: e.target.value }));
    setError(null);
  };

  // Handle Register
  const handleRegister = async e => {
    e.preventDefault();
    setError(null);
    setSuccessMsg(null);
    setLoading(true);

    try {
      const res = await axios.post('/api/auth/register', {
        name: formData.name,
        email: formData.email,
        password: formData.password,
        phone: formData.phone,
      });

      if (res.data.success) {
        setReceivedOtp(res.data.otp);
        setMode('otp');
        setSuccessMsg(`Registration code sent! Verification OTP: ${res.data.otp}`);
        setResendCooldown(45);
      }
    } catch (err) {
      setError(err.response?.data?.error || 'Registration failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  // Handle Login
  const handleLogin = async e => {
    e.preventDefault();
    setError(null);
    setSuccessMsg(null);
    setLoading(true);

    try {
      const res = await axios.post('/api/auth/login', {
        email: formData.email,
        password: formData.password,
      });

      if (res.data.requiresOtp) {
        setReceivedOtp(res.data.otp);
        setMode('otp');
        setSuccessMsg(`Account needs verification. OTP: ${res.data.otp}`);
        setResendCooldown(45);
      } else if (res.data.success) {
        onAuthSuccess(res.data.user);
        onClose();
      }
    } catch (err) {
      setError(err.response?.data?.error || 'Invalid email or password.');
    } finally {
      setLoading(false);
    }
  };

  // Handle OTP digit changes
  const handleOtpChange = (index, value) => {
    if (value.length > 1) {
      // Handle paste of full 6-digit code
      const pasted = value.replace(/\D/g, '').slice(0, 6);
      if (pasted.length > 0) {
        const next = [...otpDigits];
        for (let i = 0; i < 6; i++) {
          next[i] = pasted[i] || '';
        }
        setOtpDigits(next);
        const focusIdx = Math.min(pasted.length, 5);
        otpInputsRef.current[focusIdx]?.focus();
      }
      return;
    }

    const next = [...otpDigits];
    next[index] = value.replace(/\D/g, '');
    setOtpDigits(next);

    // Auto-advance
    if (value && index < 5) {
      otpInputsRef.current[index + 1]?.focus();
    }
  };

  const handleOtpKeyDown = (index, e) => {
    if (e.key === 'Backspace' && !otpDigits[index] && index > 0) {
      otpInputsRef.current[index - 1]?.focus();
    }
  };

  // Autofill received OTP
  const handleAutofillOtp = () => {
    if (!receivedOtp) return;
    const digits = receivedOtp.toString().split('').slice(0, 6);
    const next = ['', '', '', '', '', ''];
    digits.forEach((d, i) => { next[i] = d; });
    setOtpDigits(next);
  };

  // Verify OTP
  const handleVerifyOtp = async e => {
    if (e) e.preventDefault();
    const fullOtp = otpDigits.join('');
    if (fullOtp.length < 6) {
      setError('Please enter the full 6-digit verification code.');
      return;
    }

    setError(null);
    setLoading(true);

    try {
      const res = await axios.post('/api/auth/verify-otp', {
        email: formData.email,
        otp: fullOtp,
      });

      if (res.data.success) {
        onAuthSuccess(res.data.user);
        onClose();
      }
    } catch (err) {
      setError(err.response?.data?.error || 'Verification failed. Please check the code.');
    } finally {
      setLoading(false);
    }
  };

  // Resend OTP
  const handleResendOtp = async () => {
    if (resendCooldown > 0) return;
    setLoading(true);
    setError(null);

    try {
      const res = await axios.post('/api/auth/send-otp', { email: formData.email });
      if (res.data.success) {
        setReceivedOtp(res.data.otp);
        setSuccessMsg(`New OTP sent! Verification code: ${res.data.otp}`);
        setResendCooldown(45);
      }
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to resend OTP.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-overlay" onClick={onClose}>
      <div className="auth-modal" onClick={e => e.stopPropagation()}>
        {/* Close Button */}
        <button className="auth-close-btn" onClick={onClose} aria-label="Close modal">
          ✕
        </button>

        {/* If user is already logged in, show profile card */}
        {user ? (
          <div style={{ textAlign: 'center', padding: '10px 0' }}>
            <div style={{
              width: 64, height: 64, borderRadius: '50%',
              background: '#EAF3FF',
              border: '1px solid #CCE3FF',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              margin: '0 auto 16px',
            }}>
              <span style={{ fontSize: 28, color: '#fff' }}>👤</span>
            </div>
            <h3 style={{ fontFamily: 'Inter, sans-serif', fontSize: 20, fontWeight: 700, letterSpacing: '-0.02em', color: 'var(--k-text)' }}>
              {user.name}
            </h3>
            <div style={{ fontSize: 13, color: 'var(--k-text3)', marginTop: 4 }}>
              {user.email}
            </div>
            <div style={{
              display: 'inline-flex', alignItems: 'center', gap: 6,
              margin: '12px 0 24px', padding: '4px 12px',
              borderRadius: 99, background: '#F0FDF4',
              color: '#166534', border: '1px solid #86EFAC', fontSize: 12, fontWeight: 600
            }}>
              ✓ Verified KnowSphere Account
            </div>

            <div style={{
              background: 'var(--k-bg2)', border: '1px solid var(--k-border)', borderRadius: 10, padding: 14,
              fontSize: 12, color: 'var(--k-text2)', textAlign: 'left', lineHeight: 1.6, marginBottom: 20
            }}>
              <strong>Offline Library Sync Enabled</strong>
              <div>Your chosen topics, language preferences, and bookmarks will sync across devices when connected.</div>
            </div>

            <button className="btn btn-ghost" style={{ width: '100%' }} onClick={onLogout}>
              Sign Out
            </button>
          </div>
        ) : (
          <>
            {/* Header branding */}
            <div className="auth-header">
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 10, marginBottom: 12 }}>
                <div style={{
                  width: 40, height: 40, borderRadius: 12,
                  background: '#EAF3FF',
                  border: '1px solid #CCE3FF',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                }}>
                  <KnowSphereLogo size={28} color="#ffffff" />
                </div>
                <span style={{ fontFamily: 'Inter, sans-serif', fontSize: 20, fontWeight: 700, letterSpacing: '-0.02em', color: 'var(--k-text)' }}>
                  KnowSphere Account
                </span>
              </div>

              {mode === 'login' && (
                <p style={{ fontSize: 13, color: 'var(--k-text3)' }}>
                  Sign in to sync your offline knowledge library and downloads.
                </p>
              )}
              {mode === 'register' && (
                <p style={{ fontSize: 13, color: 'var(--k-text3)' }}>
                  Create your free KnowSphere profile with instant OTP verification.
                </p>
              )}
              {mode === 'otp' && (
                <p style={{ fontSize: 13, color: 'var(--k-text3)' }}>
                  Enter the 6-digit security code sent to <strong>{formData.email}</strong>
                </p>
              )}
            </div>

            {/* Mode switch tabs (Login vs Register) */}
            {mode !== 'otp' && (
              <div className="auth-tabs">
                <button
                  type="button"
                  className={`auth-tab ${mode === 'login' ? 'active' : ''}`}
                  onClick={() => { setMode('login'); setError(null); setSuccessMsg(null); }}
                >
                  Sign In
                </button>
                <button
                  type="button"
                  className={`auth-tab ${mode === 'register' ? 'active' : ''}`}
                  onClick={() => { setMode('register'); setError(null); setSuccessMsg(null); }}
                >
                  New Registration
                </button>
              </div>
            )}

            {/* Error & Info Banners */}
            {error && (
              <div className="banner err" style={{ marginBottom: 16 }}>
                <span className="banner-ico">⚠️</span>
                <span>{error}</span>
              </div>
            )}

            {/* Live OTP notification box (shows simulated OTP sent back from backend) */}
            {mode === 'otp' && receivedOtp && (
              <div style={{
                background: 'var(--k-bg2)',
                border: '1px dashed var(--k-border)',
                borderRadius: 10,
                padding: '14px 16px',
                marginBottom: 18,
                textAlign: 'left'
              }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 6 }}>
                  <span style={{ fontSize: 11, fontWeight: 700, color: 'var(--k-text2)', textTransform: 'uppercase', letterSpacing: 0.5 }}>
                    📬 Simulated SMS / Email Gateway
                  </span>
                  <span style={{ fontSize: 11, background: '#0071E3', color: '#fff', padding: '2px 8px', borderRadius: 99, fontWeight: 600 }}>
                    OTP Delivered
                  </span>
                </div>
                <div style={{ fontSize: 13, color: 'var(--k-text)', lineHeight: 1.5 }}>
                  Your verification code is: <strong style={{ fontSize: 18, color: '#2563EB', letterSpacing: 2, fontFamily: 'monospace' }}>{receivedOtp}</strong>
                </div>
                <button
                  type="button"
                  onClick={handleAutofillOtp}
                  style={{
                    marginTop: 8, padding: '4px 12px', background: '#fff',
                    border: '1px solid var(--k-border)', borderRadius: 6, color: '#0F172A',
                    fontSize: 11, fontWeight: 600, cursor: 'pointer'
                  }}
                >
                  ⚡ One-Click Autofill Code
                </button>
              </div>
            )}

            {/* ─── LOGIN FORM ────────────────────────────────────────── */}
            {mode === 'login' && (
              <form onSubmit={handleLogin} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
                <div className="field" style={{ marginBottom: 0 }}>
                  <label className="field-label" htmlFor="loginEmail">Email Address</label>
                  <input
                    id="loginEmail"
                    name="email"
                    type="email"
                    required
                    placeholder="e.g. explorer@knowsphere.org"
                    className="field-input"
                    value={formData.email}
                    onChange={handleInputChange}
                  />
                </div>

                <div className="field" style={{ marginBottom: 0 }}>
                  <label className="field-label" htmlFor="loginPassword">Password</label>
                  <input
                    id="loginPassword"
                    name="password"
                    type="password"
                    required
                    placeholder="Enter your password"
                    className="field-input"
                    value={formData.password}
                    onChange={handleInputChange}
                  />
                </div>

                <button
                  type="submit"
                  className="btn btn-primary btn-lg"
                  style={{ width: '100%', marginTop: 8 }}
                  disabled={loading || !formData.email || !formData.password}
                >
                  {loading ? 'Signing in…' : 'Sign In →'}
                </button>

                <div style={{ display: 'flex', justifyContent: 'center', fontSize: 12, color: 'var(--k-text3)', marginTop: 4 }}>
                  <span>Demo account: <strong>explorer@knowsphere.org</strong> / <strong>password123</strong></span>
                </div>
              </form>
            )}

            {/* ─── REGISTER FORM ─────────────────────────────────────── */}
            {mode === 'register' && (
              <form onSubmit={handleRegister} style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                <div className="field" style={{ marginBottom: 0 }}>
                  <label className="field-label" htmlFor="regName">Full Name</label>
                  <input
                    id="regName"
                    name="name"
                    type="text"
                    required
                    placeholder="e.g. Maya Patel"
                    className="field-input"
                    value={formData.name}
                    onChange={handleInputChange}
                  />
                </div>

                <div className="field" style={{ marginBottom: 0 }}>
                  <label className="field-label" htmlFor="regEmail">Email Address</label>
                  <input
                    id="regEmail"
                    name="email"
                    type="email"
                    required
                    placeholder="e.g. maya@example.com"
                    className="field-input"
                    value={formData.email}
                    onChange={handleInputChange}
                  />
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
                  <div className="field" style={{ marginBottom: 0 }}>
                    <label className="field-label" htmlFor="regPhone">Phone (Optional)</label>
                    <input
                      id="regPhone"
                      name="phone"
                      type="tel"
                      placeholder="+1 555-0100"
                      className="field-input"
                      value={formData.phone}
                      onChange={handleInputChange}
                    />
                  </div>

                  <div className="field" style={{ marginBottom: 0 }}>
                    <label className="field-label" htmlFor="regPassword">Password</label>
                    <input
                      id="regPassword"
                      name="password"
                      type="password"
                      required
                      placeholder="At least 6 chars"
                      className="field-input"
                      value={formData.password}
                      onChange={handleInputChange}
                    />
                  </div>
                </div>

                <div className="banner info" style={{ margin: '4px 0', padding: '10px 12px', fontSize: 11 }}>
                  <span className="banner-ico">ℹ️</span>
                  <span>An OTP code will be generated and sent back immediately to verify your identity.</span>
                </div>

                <button
                  type="submit"
                  className="btn btn-primary btn-lg"
                  style={{ width: '100%', marginTop: 6 }}
                  disabled={loading || !formData.name || !formData.email || !formData.password}
                >
                  {loading ? 'Creating Account…' : 'Register & Receive OTP →'}
                </button>
              </form>
            )}

            {/* ─── OTP VERIFICATION FORM ─────────────────────────────── */}
            {mode === 'otp' && (
              <form onSubmit={handleVerifyOtp} style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>
                <div style={{ display: 'flex', justifyContent: 'center', gap: 8, margin: '8px 0' }}>
                  {otpDigits.map((digit, idx) => (
                    <input
                      key={idx}
                      ref={el => (otpInputsRef.current[idx] = el)}
                      type="text"
                      inputMode="numeric"
                      maxLength={1}
                      value={digit}
                      onChange={e => handleOtpChange(idx, e.target.value)}
                      onKeyDown={e => handleOtpKeyDown(idx, e)}
                      style={{
                        width: 48,
                        height: 56,
                        borderRadius: 12,
                        border: '2px solid var(--k-border)',
                        textAlign: 'center',
                        fontSize: 22,
                        fontWeight: 900,
                        fontFamily: 'monospace',
                        color: 'var(--k-blue-dark)',
                        background: '#fff',
                        outline: 'none',
                        transition: 'all 0.2s'
                      }}
                      onFocus={e => {
                        e.target.style.borderColor = 'var(--k-blue)';
                        e.target.style.boxShadow = '0 0 0 3px var(--k-blue-glow)';
                      }}
                      onBlur={e => {
                        e.target.style.borderColor = 'var(--k-border)';
                        e.target.style.boxShadow = 'none';
                      }}
                    />
                  ))}
                </div>

                <button
                  type="submit"
                  className="btn btn-primary btn-lg"
                  style={{ width: '100%' }}
                  disabled={loading || otpDigits.join('').length < 6}
                >
                  {loading ? 'Verifying OTP…' : 'Verify Code & Proceed ✓'}
                </button>

                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: 13, marginTop: 4 }}>
                  <button
                    type="button"
                    className="btn btn-ghost btn-sm"
                    onClick={() => { setMode('register'); setError(null); }}
                  >
                    ← Edit Details
                  </button>

                  <button
                    type="button"
                    onClick={handleResendOtp}
                    disabled={resendCooldown > 0 || loading}
                    style={{
                      background: 'none', border: 'none',
                      color: resendCooldown > 0 ? 'var(--k-text3)' : 'var(--k-blue)',
                      cursor: resendCooldown > 0 ? 'default' : 'pointer',
                      fontSize: 12, fontWeight: 700
                    }}
                  >
                    {resendCooldown > 0 ? `Resend OTP in ${resendCooldown}s` : 'Resend Code'}
                  </button>
                </div>
              </form>
            )}
          </>
        )}
      </div>
    </div>
  );
}

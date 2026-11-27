import { useState, useEffect, useCallback, useRef } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { api } from '../utils/api';

// ── Simple readable CAPTCHA — UPPERCASE + digits, zero ambiguous chars ────────
const CAPTCHA_CHARS = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';

const generateCode = () =>
  Array.from({ length: 6 }, () => CAPTCHA_CHARS[Math.floor(Math.random() * CAPTCHA_CHARS.length)]).join('');

const drawCaptcha = (canvas, code) => {
  if (!canvas) return;
  const ctx = canvas.getContext('2d');
  const W = canvas.width, H = canvas.height;

  // Clean white-ish background
  ctx.clearRect(0, 0, W, H);
  ctx.fillStyle = '#f8faff';
  ctx.fillRect(0, 0, W, H);

  // Light noise dots
  for (let i = 0; i < 40; i++) {
    ctx.beginPath();
    ctx.arc(Math.random() * W, Math.random() * H, Math.random() * 1.2, 0, 2 * Math.PI);
    ctx.fillStyle = `rgba(100,120,180,${0.15 + Math.random() * 0.2})`;
    ctx.fill();
  }

  // 3 light crossing lines
  for (let i = 0; i < 3; i++) {
    ctx.beginPath();
    ctx.moveTo(0, Math.random() * H);
    ctx.lineTo(W, Math.random() * H);
    ctx.strokeStyle = `rgba(100,120,200,0.12)`;
    ctx.lineWidth = 1;
    ctx.stroke();
  }

  // Draw characters — upright, clear, evenly spaced
  const charW = W / code.length;
  code.split('').forEach((ch, i) => {
    ctx.save();
    const x = charW * i + charW / 2;
    const y = H / 2 + 8;
    ctx.translate(x, y);
    ctx.rotate((Math.random() - 0.5) * 0.25); // very slight tilt only
    ctx.font = `bold 22px Arial, sans-serif`;
    ctx.textAlign = 'center';
    const palette = ['#1a3a1a', '#b45309', '#1d4ed8', '#6d28d9', '#0f766e'];
    ctx.fillStyle = palette[i % palette.length];
    ctx.fillText(ch, 0, 0);
    ctx.restore();
  });

  // Border
  ctx.strokeStyle = '#dde3f0';
  ctx.lineWidth = 1;
  ctx.strokeRect(0.5, 0.5, W - 1, H - 1);
};

// ── Component ─────────────────────────────────────────────────────────────────
const Login = () => {
  const navigate  = useNavigate();
  const canvasRef = useRef(null);

  const [role, setRole]     = useState('student');
  const [form, setForm]     = useState({ erp: '', empId: '', email: '', dob: '', password: '' });
  const [captchaCode, setCaptchaCode]   = useState(generateCode);
  const [captchaInput, setCaptchaInput] = useState('');
  const [showPass, setShowPass] = useState(false);
  const [error, setError]   = useState('');
  const [loading, setLoading] = useState(false);

  const refreshCaptcha = useCallback(() => {
    setCaptchaCode(generateCode());
    setCaptchaInput('');
  }, []);

  useEffect(() => { drawCaptcha(canvasRef.current, captchaCode); }, [captchaCode]);

  const selectRole = selectedRole => {
    setRole(selectedRole);
    setForm({ erp: '', empId: '', email: '', dob: '', password: '' });
    setError('');
    refreshCaptcha();
  };

  const set = (f) => (e) => setForm(p => ({ ...p, [f]: e.target.value }));

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (captchaInput.trim().toUpperCase() !== captchaCode) {
      setError('Incorrect CAPTCHA. Please try again.');
      refreshCaptcha();
      return;
    }

    // Build body — frontend uses 'instructor' label but backend role is 'teacher'
    const backendRole = role === 'instructor' ? 'teacher' : role;

    const body =
      role === 'student'    ? { role: backendRole, erpId: form.erp.toUpperCase(), dob: form.dob } :
      role === 'instructor' ? { role: backendRole, empId: form.empId.toUpperCase(), dob: form.dob } :
                              { role: backendRole, email: form.email, password: form.password };

    setLoading(true);
    try {
      const data = await api('/api/auth/login', {
        method: 'POST',
        body: JSON.stringify(body),
      });

      localStorage.setItem('token', data.token);
      // Store the frontend role label (instructor, not teacher)
      const frontendRole = data.user.role === 'teacher' ? 'instructor' : data.user.role;
      localStorage.setItem('role', frontendRole);
      localStorage.setItem('name', data.user.name);
      localStorage.setItem('userId', data.user.id);
      if (data.user.avatar) localStorage.setItem('avatar', data.user.avatar);
      if (data.user.erpId)  localStorage.setItem('erpId', data.user.erpId);
      if (data.user.empId)  localStorage.setItem('empId', data.user.empId);

      if (frontendRole === 'admin')      navigate('/admin/dashboard');
      if (frontendRole === 'instructor') navigate('/instructor/dashboard');
      if (frontendRole === 'student')    navigate('/student/dashboard');
    } catch (err) {
      setError(err.message);
      refreshCaptcha();
    } finally {
      setLoading(false);
    }
  };

  const roles = [
    { key: 'student',    label: 'Student',    icon: '🎓', color: '#7c3aed', light: 'rgba(124,58,237,0.12)' },
    { key: 'instructor', label: 'Instructor', icon: '👨‍🏫', color: '#2563eb', light: 'rgba(37,99,235,0.12)' },
    { key: 'admin',      label: 'Admin',      icon: '🛡️',  color: '#1a3a1a', light: 'rgba(26,58,26,0.12)'  },
  ];
  const active = roles.find(r => r.key === role);

  return (
    <div className="lp-root lp-mounted">

      {/* Background — office image with overlay */}
      <div className="lp-bg">
        <div className="lp-bg-overlay" />
      </div>

      {/* Floating blobs for depth */}
      <div className="lp-blob lp-blob-1" />
      <div className="lp-blob lp-blob-2" />

      {/* Glass card */}
      <div className="lp-card">

        {/* Top accent bar */}
        <div className="lp-accent-bar" style={{ background: active.color }} />

        {/* Header */}
        <div className="lp-header">
          <div className="lp-logo-ring" style={{ borderColor: active.color }}>
            <img src="/Assets/logo.jpg" alt="DBUU" className="lp-logo" />
          </div>
          <h2 className="lp-title">DBUU ERP Portal</h2>
          <p className="lp-subtitle">Sign in to access your dashboard</p>
        </div>

        {/* Role tabs */}
        <div className="lp-tabs">
          {roles.map(r => (
            <button
              key={r.key}
              type="button"
              className={`lp-tab ${role === r.key ? 'lp-tab-active' : ''}`}
              style={role === r.key ? { background: r.color, borderColor: r.color } : {}}
              onClick={() => selectRole(r.key)}
            >
              <span className="lp-tab-icon">{r.icon}</span>
              <span>{r.label}</span>
            </button>
          ))}
        </div>

        {/* Error */}
        {error && (
          <div className="lp-error">
            <span>⚠</span> {error}
          </div>
        )}

        <form onSubmit={handleSubmit} noValidate className="lp-form">

          {role === 'student' && (
            <>
              <div className="lp-field">
                <label>ERP ID</label>
                <div className="lp-input-wrap">
                  <span className="lp-icon">🪪</span>
                  <input type="text" placeholder="e.g. DBUU2024001"
                    value={form.erp} onChange={set('erp')} maxLength={20} required autoComplete="off" />
                </div>
                <span className="lp-hint">University-assigned ERP ID</span>
              </div>
              <div className="lp-field">
                <label>Date of Birth</label>
                <div className="lp-input-wrap">
                  <span className="lp-icon">📅</span>
                  <input type="date" value={form.dob} onChange={set('dob')} required
                    max={new Date().toISOString().split('T')[0]} />
                </div>
                <span className="lp-hint">As per university records</span>
              </div>
            </>
          )}

          {role === 'instructor' && (
            <>
              <div className="lp-field">
                <label>Employee ID</label>
                <div className="lp-input-wrap">
                  <span className="lp-icon">🪪</span>
                  <input type="text" placeholder="e.g. EMP20240001"
                    value={form.empId} onChange={set('empId')} maxLength={20} required autoComplete="off" />
                </div>
                <span className="lp-hint">University-assigned Employee ID</span>
              </div>
              <div className="lp-field">
                <label>Date of Birth</label>
                <div className="lp-input-wrap">
                  <span className="lp-icon">📅</span>
                  <input type="date" value={form.dob} onChange={set('dob')} required
                    max={new Date().toISOString().split('T')[0]} />
                </div>
                <span className="lp-hint">As per university records</span>
              </div>
            </>
          )}

          {role === 'admin' && (
            <>
              <div className="lp-field">
                <label>Admin Email</label>
                <div className="lp-input-wrap">
                  <span className="lp-icon">✉️</span>
                  <input type="email" placeholder="admin@dbuu.edu.in"
                    value={form.email} onChange={set('email')} required autoComplete="off" />
                </div>
              </div>
              <div className="lp-field">
                <label>Password</label>
                <div className="lp-input-wrap">
                  <span className="lp-icon">🔒</span>
                  <input type={showPass ? 'text' : 'password'} placeholder="••••••••"
                    value={form.password} onChange={set('password')} required />
                  <button type="button" className="lp-eye" onClick={() => setShowPass(p => !p)}>
                    {showPass ? '🙈' : '👁️'}
                  </button>
                </div>
              </div>
            </>
          )}

          {/* CAPTCHA */}
          <div className="lp-field">
            <label>Security Code</label>
            <div className="lp-captcha-row">
              <canvas ref={canvasRef} width={180} height={48} className="lp-captcha-canvas" />
              <button type="button" className="lp-captcha-refresh" onClick={refreshCaptcha} title="New code">
                <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                  <path d="M1 4v6h6M23 20v-6h-6"/>
                  <path d="M20.49 9A9 9 0 0 0 5.64 5.64L1 10m22 4l-4.64 4.36A9 9 0 0 1 3.51 15"/>
                </svg>
              </button>
              <input
                type="text"
                className="lp-captcha-input"
                placeholder="Enter code"
                value={captchaInput}
                onChange={e => setCaptchaInput(e.target.value.toUpperCase())}
                maxLength={6}
                autoComplete="off"
                required
              />
            </div>
            <span className="lp-hint">Enter the 6-character code shown · Case insensitive</span>
          </div>

          <button
            type="submit"
            className="lp-submit"
            style={{ background: `linear-gradient(135deg, ${active.color}, ${active.color}dd)` }}
            disabled={loading}
          >
            {loading ? (
              <span className="lp-dots">
                <span /><span /><span />
              </span>
            ) : (
              <span>Sign In as {active.label} →</span>
            )}
          </button>
        </form>

        {role !== 'student' && (
          <p className="lp-footer">
            New here? <Link to="/signup">Create your account</Link>
          </p>
        )}
        {role === 'student' && (
          <p className="lp-footer" style={{ color: 'rgba(255,255,255,0.45)', fontSize: '0.82rem' }}>
            Student accounts are created by the university admin.
          </p>
        )}
      </div>
    </div>
  );
};

export default Login;

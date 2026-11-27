import { useState, useEffect, useCallback, useRef } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { api } from '../utils/api';

// ── Alphanumeric CAPTCHA ─────────────────────────────────────────────────────
const CHARS = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';

const generateCode = () =>
  Array.from({ length: 6 }, () => CHARS[Math.floor(Math.random() * CHARS.length)]).join('');

const drawCaptcha = (canvas, code) => {
  if (!canvas) return;
  const ctx = canvas.getContext('2d');
  const W = canvas.width, H = canvas.height;

  ctx.clearRect(0, 0, W, H);
  // Semi-transparent dark bg to match glassmorphism
  ctx.fillStyle = 'rgba(255,255,255,0.12)';
  ctx.fillRect(0, 0, W, H);

  // Light noise dots
  for (let i = 0; i < 35; i++) {
    ctx.beginPath();
    ctx.arc(Math.random() * W, Math.random() * H, Math.random() * 1.2, 0, 2 * Math.PI);
    ctx.fillStyle = `rgba(255,255,255,${0.1 + Math.random() * 0.2})`;
    ctx.fill();
  }

  // 2 light lines
  for (let i = 0; i < 2; i++) {
    ctx.beginPath();
    ctx.moveTo(0, Math.random() * H);
    ctx.lineTo(W, Math.random() * H);
    ctx.strokeStyle = 'rgba(255,255,255,0.1)';
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
    ctx.rotate((Math.random() - 0.5) * 0.2);
    ctx.font = 'bold 20px Arial, sans-serif';
    ctx.textAlign = 'center';
    const palette = ['#ffffff', '#ffe0a0', '#c8f0ff', '#d4ffd4', '#ffd4d4', '#e8d4ff'];
    ctx.fillStyle = palette[i % palette.length];
    ctx.shadowColor = 'rgba(0,0,0,0.5)';
    ctx.shadowBlur = 2;
    ctx.fillText(ch, 0, 0);
    ctx.restore();
  });

  ctx.strokeStyle = 'rgba(255,255,255,0.2)';
  ctx.lineWidth = 1;
  ctx.strokeRect(0.5, 0.5, W - 1, H - 1);
};

// ── Constants ────────────────────────────────────────────────────────────────
const DEPARTMENTS = [
  'Computer Science & Engineering',
  'Electronics & Communication',
  'Mechanical Engineering',
  'Civil Engineering',
  'Business Administration',
  'Pharmacy',
  'Law',
  'Agriculture',
  'Hotel Management',
  'Architecture',
];

// ── Component ────────────────────────────────────────────────────────────────
const Signup = () => {
  const navigate  = useNavigate();
  const canvasRef = useRef(null);

  const role = 'instructor';
  const [form, setForm]   = useState({ name: '', email: '', mobile: '', department: '', erp: '', empId: '', dob: '' });
  const [captchaCode, setCaptchaCode]   = useState(generateCode);
  const [captchaInput, setCaptchaInput] = useState('');
  const [error, setError]   = useState('');
  const [loading, setLoading] = useState(false);

  const refreshCaptcha = useCallback(() => {
    setCaptchaCode(generateCode());
    setCaptchaInput('');
  }, []);

  useEffect(() => {
    drawCaptcha(canvasRef.current, captchaCode);
  }, [captchaCode]);

  const set = (f) => (e) => setForm(p => ({ ...p, [f]: e.target.value }));

  const validate = () => {
    if (!form.name.trim() || form.name.trim().length < 3) return 'Full name must be at least 3 characters.';
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email))  return 'Enter a valid email address.';
    if (!/^\d{10}$/.test(form.mobile))                    return 'Mobile number must be exactly 10 digits.';
    if (!form.department)                                  return 'Please select a department.';
    if (!form.dob)                                         return 'Date of birth is required.';
    if (role === 'student'    && !/^[A-Za-z0-9]{4,20}$/.test(form.erp))   return 'ERP ID must be 4-20 alphanumeric characters.';
    if (role === 'instructor' && !/^[A-Za-z0-9]{4,20}$/.test(form.empId)) return 'Employee ID must be 4-20 alphanumeric characters.';
    return null;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    const err = validate();
    if (err) { setError(err); return; }

    if (captchaInput.trim().toLowerCase() !== captchaCode.toLowerCase()) {
      setError('Incorrect CAPTCHA. Please try again.');
      refreshCaptcha();
      return;
    }

    // Backend expects role 'teacher', frontend uses 'instructor'
    const backendRole = role === 'instructor' ? 'teacher' : role;

    const body = {
      role: backendRole,
      name: form.name.trim(),
      email: form.email.trim(),
      mobile: form.mobile.trim(),
      department: form.department,
      dob: form.dob,
      ...(role === 'student'    && { erpId: form.erp.toUpperCase() }),
      ...(role === 'instructor' && { empId: form.empId.toUpperCase() }),
    };

    setLoading(true);
    try {
      const data = await api('/api/auth/signup', {
        method: 'POST',
        body: JSON.stringify(body),
      });

      localStorage.setItem('token', data.token);
      const frontendRole = data.user.role === 'teacher' ? 'instructor' : data.user.role;
      localStorage.setItem('role', frontendRole);
      localStorage.setItem('name', data.user.name);
      localStorage.setItem('userId', data.user.id);
      if (data.user.avatar) localStorage.setItem('avatar', data.user.avatar);

      if (frontendRole === 'instructor') navigate('/instructor/dashboard');
      if (frontendRole === 'student')    navigate('/student/dashboard');
    } catch (err) {
      setError(err.message);
      refreshCaptcha();
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="signup-wrapper">
      <div className="signup-overlay">

        {/* ── Left Panel ── */}
        <div className="signup-left">
          <div className="d-flex align-items-center gap-3">
            <img src="/Assets/logo.jpg" alt="DBUU" className="signup-logo" />
            <div>
              <div className="signup-uni-name">Dev Bhoomi Uttarakhand University</div>
              <div className="signup-uni-sub">Dehradun, Uttarakhand</div>
            </div>
          </div>

          <div className="signup-left-center">
            <div className="signup-left-tag">Welcome to DBUU ERP</div>
            <h1 className="signup-left-heading">Empowering<br />Education &<br />Innovation</h1>
            <p className="signup-left-para">
              A unified platform for students, faculty and administration
              to manage academics, attendance, courses and more.
            </p>
          </div>

        </div>

        {/* ── Right Panel ── */}
        <div className="signup-right">
          <div className="signup-form-box">
            <h2 className="fw-bold mb-1" style={{ color: '#fff' }}>Create Account</h2>
            <p className="mb-3" style={{ color: 'rgba(255,255,255,0.65)', fontSize: '0.88rem' }}>
              Register with your university-assigned ID
            </p>

            {/* Role Toggle — instructors only, students are registered by admin */}
            <div className="signup-role-toggle mb-3">
              <button
                type="button"
                className="signup-role-btn active"
                style={{ cursor: 'default' }}
              >
                👨🏫 Instructor
              </button>
            </div>
            <p style={{ color: 'rgba(255,255,255,0.5)', fontSize: '0.82rem', marginBottom: '1rem' }}>
              🎓 Students are registered by the university admin — <a href="/login" style={{ color: '#e07b00' }}>Login here</a>
            </p>

            {error && <div className="signup-alert signup-alert-error">⚠️ {error}</div>}

            <form onSubmit={handleSubmit} noValidate>

              {/* Row 1: EmpID + DOB */}
              <div className="signup-row">
                <div className="signup-field">
                  <label>Employee ID <span className="required">*</span></label>
                  <input type="text" placeholder="e.g. EMP20240001" value={form.empId}
                    onChange={set('empId')} maxLength={20} required autoComplete="off" />
                  <span className="field-hint">University Employee ID</span>
                </div>
                <div className="signup-field">
                  <label>Date of Birth <span className="required">*</span></label>
                  <input type="date" value={form.dob} onChange={set('dob')} required
                    max={new Date().toISOString().split('T')[0]} />
                  <span className="field-hint">🔐 Used as login credential</span>
                </div>
              </div>

              {/* Row 2: Full Name + Email */}
              <div className="signup-row">
                <div className="signup-field">
                  <label>Full Name <span className="required">*</span></label>
                  <input type="text" placeholder="As per records" value={form.name}
                    onChange={set('name')} minLength={3} maxLength={60} required />
                </div>
                <div className="signup-field">
                  <label>Email Address <span className="required">*</span></label>
                  <input type="email" placeholder="your@email.com" value={form.email}
                    onChange={set('email')} required />
                </div>
              </div>

              {/* Row 3: Mobile + Department */}
              <div className="signup-row">
                <div className="signup-field">
                  <label>Mobile <span className="required">*</span></label>
                  <input type="tel" placeholder="10-digit number" value={form.mobile}
                    onChange={set('mobile')} maxLength={10} required />
                </div>
                <div className="signup-field">
                  <label>Department <span className="required">*</span></label>
                  <select value={form.department} onChange={set('department')} required>
                    <option value="">Select department</option>
                    {DEPARTMENTS.map(d => <option key={d} value={d}>{d}</option>)}
                  </select>
                </div>
              </div>

              {/* Row 4: CAPTCHA full width */}
              <div className="signup-field">
                <label>Security Verification <span className="required">*</span></label>
                <div className="signup-captcha-row">
                  <div className="signup-captcha-left">
                    <canvas ref={canvasRef} width={160} height={46} className="captcha-canvas-dark" />
                    <button type="button" className="captcha-reload-dark" onClick={refreshCaptcha} title="Refresh">
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                        <path d="M1 4v6h6M23 20v-6h-6"/>
                        <path d="M20.49 9A9 9 0 0 0 5.64 5.64L1 10m22 4l-4.64 4.36A9 9 0 0 1 3.51 15"/>
                      </svg>
                    </button>
                  </div>
                  <input
                    type="text"
                    className="signup-captcha-input"
                    placeholder="Enter 6 characters"
                    value={captchaInput}
                    onChange={e => setCaptchaInput(e.target.value)}
                    maxLength={6}
                    autoComplete="off"
                    required
                  />
                </div>
              </div>

              <button type="submit" className="signup-submit-btn" disabled={loading}>
                {loading ? 'Registering...' : 'Register as Instructor'}
              </button>
            </form>

            <p className="text-center mt-3 mb-0" style={{ color: 'rgba(255,255,255,0.65)', fontSize: '0.88rem' }}>
              Already registered?{' '}
              <Link to="/login" style={{ color: '#e07b00', fontWeight: 600 }}>Login here</Link>
            </p>
          </div>
        </div>

      </div>
    </div>
  );
};

export default Signup;

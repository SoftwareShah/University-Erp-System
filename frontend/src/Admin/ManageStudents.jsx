import { useState, useEffect, useRef, useCallback } from 'react';
import { Link } from 'react-router-dom';
import DashboardLayout from '../components/DashboardLayout';
import { API_BASE, api } from '../utils/api';
import ProfileAvatar from '../components/ProfileAvatar';

const BASE = API_BASE;

const EMPTY_FORM = {
  name: '', email: '', mobile: '', programId: '', dob: '', admissionDate: '', address: '',
  registrationNo: '', gender: '', bloodGroup: '', college: '', session: '', semester: '1',
  rollNo: '', quota: '', section: '', lateralEntry: 'false', status: 'active', feeCategory: '',
  fatherName: '', fatherMobile: '', fatherEmail: '', motherName: '', motherMobile: '', motherEmail: '',
};

const fieldStyle = { width:'100%', background:'rgba(255,255,255,0.07)', border:'1px solid rgba(255,255,255,0.15)', borderRadius:'8px', padding:'10px 12px', color:'#fff', fontSize:'0.9rem', outline:'none', boxSizing:'border-box' };
const labelStyle = { color:'#ccc', fontSize:'0.83rem', display:'block', marginBottom:'4px' };

// ── Defined OUTSIDE parent so React never remounts it on re-render ────────────
const profileSectionStyle = { border: '1px solid rgba(255,255,255,0.12)', borderRadius: '10px', padding: '1rem', marginBottom: '1rem' };
const profileSectionTitleStyle = { color: '#fff', fontSize: '0.98rem', fontWeight: 700, margin: '0 0 1rem' };
const fieldGridStyle = { display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(190px,1fr))', gap: '0.85rem' };

const TextField = ({ label, field, form, onChange, type = 'text', required = false, maxLength, pattern }) => (
  <div>
    <label style={labelStyle}>{label}{required ? ' *' : ''}</label>
    <input
      type={type}
      name={field}
      value={form[field]}
      onChange={onChange(field)}
      required={required}
      maxLength={maxLength}
      pattern={pattern}
      style={fieldStyle}
    />
  </div>
);

const ProgramSummary = ({ form, programs }) => {
  const program = programs.find(item => item._id === form.programId);
  return (
    <div>
      <label style={labelStyle}>Program</label>
      <input value={program ? `${program.name} — ${program.branch}` : 'Select a program in Student Profile'} readOnly style={fieldStyle} />
    </div>
  );
};

const ProgramField = ({ form, onChange, programs }) => (
  <div>
    <label style={labelStyle}>Program *</label>
    <select name="programId" value={form.programId} onChange={onChange('programId')} required style={{ ...fieldStyle, background: '#2a2f45' }}>
      <option value="">Select academic program</option>
      {programs.map(program => <option key={program._id} value={program._id}>{program.name} — {program.branch}</option>)}
    </select>
    {!programs.length && <small style={{ color: '#fbbf24' }}>Create an academic program before registering students.</small>}
  </div>
);

const StudentForm = ({ form, onChange, programs, modal, avatarPreview, onAvatarClick, error, success, onCancel, submitting, editing }) => (
  <>
    {error   && <div style={{ background:'#ff4d4d22', border:'1px solid #ff4d4d', color:'#ff6b6b', borderRadius:'8px', padding:'0.75rem', marginBottom:'1rem', fontSize:'0.88rem' }}>⚠️ {error}</div>}
    {success && <div style={{ background:'#10b98122', border:'1px solid #10b981', color:'#6ee7b7', borderRadius:'8px', padding:'0.75rem', marginBottom:'1rem', fontSize:'0.88rem' }}>{success}</div>}

    <div style={{ display:'flex', alignItems:'center', gap:'1rem', marginBottom:'1rem' }}>
      {avatarPreview
        ? <img src={avatarPreview} alt="Student profile" style={{ width: '76px', height: '76px', borderRadius: '50%', objectFit: 'cover', border: '2px solid #8b5cf6' }} />
        : <span className="db-avatar-fallback" style={{ width: '76px', height: '76px' }}>{form.name.slice(0, 1).toUpperCase() || '?'}</span>}
      <button type="button" className="db-btn db-btn-outline" onClick={onAvatarClick}>{avatarPreview ? 'Change photo' : 'Upload photo'}</button>
    </div>
    <small style={{ display:'block', color:'#94a3b8', marginTop:'-0.75rem', marginBottom:'1rem' }}>
      JPEG, PNG, GIF, WebP, AVIF, BMP, and TIFF · Maximum 10 MB
    </small>

    <section style={profileSectionStyle}>
      <h3 style={profileSectionTitleStyle}>Student Profile</h3>
      <div style={fieldGridStyle}>
        <div><label style={labelStyle}>Semester</label><input type="number" name="semester" min="1" max="12" value={form.semester} onChange={onChange('semester')} style={fieldStyle} /></div>
        <div><label style={labelStyle}>Admission No. (ERP ID)</label><input value={editing?.erpId || 'Generated after registration'} readOnly style={fieldStyle} /></div>
        <ProgramField form={form} onChange={onChange} programs={programs} />
      </div>
    </section>

    <section style={profileSectionStyle}>
      <h3 style={profileSectionTitleStyle}>Personal Details</h3>
      <div style={fieldGridStyle}>
        <TextField label="Full name" field="name" form={form} onChange={onChange} required maxLength={60} />
        <div><label style={labelStyle}>Admission No. (ERP ID)</label><input value={editing?.erpId || 'Generated after registration'} readOnly style={fieldStyle} /></div>
        <TextField label="Registration No." field="registrationNo" form={form} onChange={onChange} maxLength={50} />
        <div><label style={labelStyle}>Gender</label><select name="gender" value={form.gender} onChange={onChange('gender')} style={{ ...fieldStyle, background: '#2a2f45' }}><option value="">Select</option><option value="female">Female</option><option value="male">Male</option><option value="other">Other</option><option value="prefer_not_to_say">Prefer not to say</option></select></div>
        <div><label style={labelStyle}>Blood Group</label><select name="bloodGroup" value={form.bloodGroup} onChange={onChange('bloodGroup')} style={{ ...fieldStyle, background: '#2a2f45' }}><option value="">Select</option>{['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'].map(group => <option key={group}>{group}</option>)}</select></div>
        <TextField label="Date of birth" field="dob" form={form} onChange={onChange} type="date" required />
      </div>
    </section>

    <section style={profileSectionStyle}>
      <h3 style={profileSectionTitleStyle}>Official Details</h3>
      <div style={fieldGridStyle}>
        <TextField label="College" field="college" form={form} onChange={onChange} maxLength={150} />
        <TextField label="Session" field="session" form={form} onChange={onChange} maxLength={30} />
        <ProgramSummary form={form} programs={programs} />
        <div><label style={labelStyle}>Current semester</label><input value={form.semester} readOnly style={fieldStyle} /></div>
        <TextField label="Roll No." field="rollNo" form={form} onChange={onChange} maxLength={30} />
        <TextField label="Quota" field="quota" form={form} onChange={onChange} maxLength={60} />
        <TextField label="Section" field="section" form={form} onChange={onChange} maxLength={20} />
        <div><label style={labelStyle}>Lateral Entry</label><select name="lateralEntry" value={form.lateralEntry} onChange={onChange('lateralEntry')} style={{ ...fieldStyle, background: '#2a2f45' }}><option value="false">No</option><option value="true">Yes</option></select></div>
        <TextField label="Admission Date" field="admissionDate" form={form} onChange={onChange} type="date" required />
        <div><label style={labelStyle}>Status</label><select name="status" value={form.status} onChange={onChange('status')} style={{ ...fieldStyle, background: '#2a2f45' }}><option value="active">Active</option><option value="inactive">Inactive</option><option value="graduated">Graduated</option><option value="withdrawn">Withdrawn</option></select></div>
        <TextField label="Fee Category" field="feeCategory" form={form} onChange={onChange} maxLength={60} />
      </div>
    </section>

    <section style={profileSectionStyle}>
      <h3 style={profileSectionTitleStyle}>Communication Details</h3>
      <div style={fieldGridStyle}>
        <TextField label="Email" field="email" form={form} onChange={onChange} type="email" required />
        <TextField label="Mobile Number" field="mobile" form={form} onChange={onChange} type="tel" required maxLength={10} pattern="[0-9]{10}" />
        <div style={{ gridColumn: '1 / -1' }}><label style={labelStyle}>Address</label><textarea name="address" value={form.address} onChange={onChange('address')} maxLength={200} rows={2} style={{ ...fieldStyle, resize: 'vertical' }} /></div>
      </div>
    </section>

    <section style={profileSectionStyle}>
      <h3 style={profileSectionTitleStyle}>Father Details</h3>
      <div style={fieldGridStyle}>
        <TextField label="Father name" field="fatherName" form={form} onChange={onChange} required maxLength={100} />
        <TextField label="Mobile number (optional)" field="fatherMobile" form={form} onChange={onChange} type="tel" maxLength={10} pattern="[0-9]{10}" />
        <TextField label="Email (optional)" field="fatherEmail" form={form} onChange={onChange} type="email" />
      </div>
    </section>

    <section style={profileSectionStyle}>
      <h3 style={profileSectionTitleStyle}>Mother Details</h3>
      <div style={fieldGridStyle}>
        <TextField label="Mother name" field="motherName" form={form} onChange={onChange} required maxLength={100} />
        <TextField label="Mobile number (optional)" field="motherMobile" form={form} onChange={onChange} type="tel" maxLength={10} pattern="[0-9]{10}" />
        <TextField label="Email (optional)" field="motherEmail" form={form} onChange={onChange} type="email" />
      </div>
    </section>

    {modal === 'register' && (
      <div style={{ background:'rgba(139,92,246,0.1)', border:'1px solid rgba(139,92,246,0.3)', borderRadius:'8px', padding:'10px 14px', marginBottom:'1.5rem', fontSize:'0.83rem', color:'#c4b5fd' }}>
        🪪 An admission number (ERP ID) is generated after registration.
      </div>
    )}

    <div style={{ display:'flex', gap:'10px' }}>
      <button type="button" onClick={onCancel}
        style={{ flex:1, background:'rgba(255,255,255,0.07)', border:'1px solid rgba(255,255,255,0.15)', color:'#ccc', borderRadius:'8px', padding:'10px', cursor:'pointer' }}>
        Cancel
      </button>
      <button type="submit" disabled={submitting}
        style={{ flex:2, background:'linear-gradient(135deg,#8b5cf6,#7c3aed)', border:'none', color:'#fff', borderRadius:'8px', padding:'10px', fontWeight:600, cursor: submitting ? 'not-allowed':'pointer', opacity: submitting ? 0.7:1 }}>
        {submitting ? 'Saving...' : modal === 'edit' ? 'Save Changes' : 'Register Student'}
      </button>
    </div>
  </>
);

// ── Modal shell ───────────────────────────────────────────────────────────────
const Modal = ({ title, onClose, children }) => (
  <div style={{ position:'fixed', inset:0, background:'rgba(0,0,0,0.65)', zIndex:1000, display:'flex', alignItems:'center', justifyContent:'center', padding:'1rem' }}>
    <div style={{ background:'#1e2235', borderRadius:'12px', padding:'2rem', width:'100%', maxWidth:'980px', maxHeight:'92vh', overflowY:'auto', boxShadow:'0 20px 60px rgba(0,0,0,0.5)' }}>
      <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:'1.5rem' }}>
        <h5 style={{ color:'#fff', margin:0 }}>{title}</h5>
        <button onClick={onClose} style={{ background:'none', border:'none', color:'#aaa', fontSize:'1.4rem', cursor:'pointer' }}>×</button>
      </div>
      {children}
    </div>
  </div>
);

// ── Main component ────────────────────────────────────────────────────────────
const ManageStudents = () => {
  const [students,      setStudents]      = useState([]);
  const [programs,      setPrograms]      = useState([]);
  const [loading,       setLoading]       = useState(true);
  const [search,        setSearch]        = useState('');
  const [modal,         setModal]         = useState(null);   // 'register' | 'edit'
  const [editing,       setEditing]       = useState(null);
  const [form,          setForm]          = useState(EMPTY_FORM);
  const [avatarFile,    setAvatarFile]    = useState(null);
  const [avatarPreview, setAvatarPreview] = useState(null);
  const [submitting,    setSubmitting]    = useState(false);
  const [error,         setError]         = useState('');
  const [success,       setSuccess]       = useState('');
  const fileRef = useRef();

  const fetchStudents = useCallback(async () => {
    try { const d = await api('/api/admin/students'); setStudents(d.data); }
    catch (e) { setError(e.message); }
    finally { setLoading(false); }
  }, []);

  useEffect(() => {
    let active = true;
    api('/api/admin/students')
      .then(data => { if (active) setStudents(data.data); })
      .catch(error => { if (active) setError(error.message); })
      .finally(() => { if (active) setLoading(false); });
    return () => { active = false; };
  }, []);
  useEffect(() => {
    let active = true;
    api('/api/admin/programs')
      .then(data => { if (active) setPrograms(data.data); })
      .catch(error => { if (active) setError(error.message); });
    return () => { active = false; };
  }, []);

  // Stable onChange — does NOT recreate on every render
  const handleChange = useCallback(
    (field) => (e) => setForm(prev => ({
      ...prev,
      [field]: field === 'mobile' ? e.target.value.replace(/\D/g, '').slice(0, 10) : e.target.value,
    })),
    []
  );

  const openRegister = () => {
    setForm({ ...EMPTY_FORM, admissionDate: new Date().toISOString().slice(0, 10) }); setAvatarFile(null); setAvatarPreview(null);
    setError(''); setSuccess(''); setModal('register');
  };

  const openEdit = (s) => {
    setEditing(s);
    setForm({
      name: s.name,
      email: s.email,
      mobile: s.mobile || '',
      programId: s.program?._id || '',
      dob: s.dob || '',
      admissionDate: s.admissionDate || s.createdAt?.slice(0, 10) || '',
      address: s.address || '',
      registrationNo: s.registrationNo || '',
      gender: s.gender || '',
      bloodGroup: s.bloodGroup || '',
      college: s.college || '',
      session: s.session || '',
      semester: String(s.semester || 1),
      rollNo: s.rollNo || '',
      quota: s.quota || '',
      section: s.section || '',
      lateralEntry: String(Boolean(s.lateralEntry)),
      status: s.status || (s.isActive ? 'active' : 'inactive'),
      feeCategory: s.feeCategory || '',
      fatherName: s.fatherName || '',
      fatherMobile: s.fatherMobile || '',
      fatherEmail: s.fatherEmail || '',
      motherName: s.motherName || '',
      motherMobile: s.motherMobile || '',
      motherEmail: s.motherEmail || '',
    });
    setAvatarFile(null);
    setAvatarPreview(s.avatar ? `${BASE}${s.avatar}` : null);
    setError(''); setSuccess(''); setModal('edit');
  };

  const closeModal = () => { setModal(null); setEditing(null); };

  const handleAvatarChange = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    if (file.size > 10 * 1024 * 1024) {
      e.target.value = '';
      setError('Photo must be 10 MB or smaller.');
      return;
    }
    setError('');
    setAvatarFile(file);
    setAvatarPreview(URL.createObjectURL(file));
  };

  const submitForm = async (e) => {
    e.preventDefault();
    setError(''); setSuccess(''); setSubmitting(true);
    const token = localStorage.getItem('token');
    try {
      if (!/^\d{10}$/.test(form.mobile)) {
        throw new Error('Mobile number must be exactly 10 digits.');
      }
      if (!form.programId) {
        throw new Error('Select a course/program and branch.');
      }

      const fd = new FormData();
      Object.entries(form).forEach(([k, v]) => fd.append(k, v));
      if (avatarFile) fd.append('avatar', avatarFile);

      const isEdit = modal === 'edit';
      const url    = isEdit ? `${BASE}/api/admin/students/${editing._id}` : `${BASE}/api/admin/students`;
      const method = isEdit ? 'PUT' : 'POST';

      const res  = await fetch(url, { method, headers: { Authorization: `Bearer ${token}` }, body: fd });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || 'Request failed.');

      setSuccess(isEdit ? '✅ Student updated.' : `✅ Registered! ERP ID: ${data.data.erpId}`);
      fetchStudents();
      if (!isEdit) { setForm(EMPTY_FORM); setAvatarFile(null); setAvatarPreview(null); }
    } catch (e) { setError(e.message); }
    finally { setSubmitting(false); }
  };

  const handleToggle = async id => {
    try {
      const response = await api(`/api/admin/students/${id}/toggle`, { method: 'PATCH' });
      setStudents(prev => prev.map(s => s._id === id ? {
        ...s,
        isActive: response.isActive,
        status: response.isActive ? 'active' : 'inactive',
      } : s));
    } catch (e) { alert(e.message); }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Permanently delete this student?')) return;
    try {
      await api(`/api/admin/students/${id}`, { method: 'DELETE' });
      setStudents(prev => prev.filter(s => s._id !== id));
    } catch (e) { alert(e.message); }
  };

  const filtered = students.filter(s =>
    s.name.toLowerCase().includes(search.toLowerCase()) ||
    s.erpId?.toLowerCase().includes(search.toLowerCase()) ||
    s.email.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <DashboardLayout role="admin">
      <div className="db-page-header">
        <h4 className="db-page-title">Manage Students</h4>
        <p className="db-page-sub">Register, edit, disable or remove students</p>
      </div>

      <div className="db-card">
        <div className="db-card-toolbar">
          <input className="db-search" type="text" placeholder="🔍  Search by name, ERP ID or email..."
            value={search} onChange={e => setSearch(e.target.value)} />
          <button className="db-btn db-btn-primary" onClick={openRegister}>+ Register Student</button>
        </div>

        {loading ? (
          <p style={{ color:'#aaa', padding:'1rem' }}>Loading students...</p>
        ) : (
          <div className="db-table-wrap">
            <table className="db-table">
              <thead>
                <tr><th>#</th><th>Photo</th><th>Name</th><th>ERP ID</th><th>Program</th><th>Branch</th><th>Email</th><th>Status</th><th>Actions</th></tr>
              </thead>
              <tbody>
                {filtered.length === 0 ? (
                  <tr><td colSpan={9} style={{ textAlign:'center', color:'#aaa', padding:'1.5rem' }}>No students found.</td></tr>
                ) : filtered.map((s, i) => (
                  <tr key={s._id}>
                    <td>{i + 1}</td>
                    <td>
                      <ProfileAvatar src={s.avatar ? `${BASE}${s.avatar}` : ''} name={s.name} size={36} style={{ border:'2px solid #8b5cf6' }} />
                    </td>
                    <td><strong>{s.name}</strong></td>
                    <td style={{ fontFamily:'monospace', color:'#8b5cf6', fontWeight:700 }}>{s.erpId}</td>
                    <td>{s.program?.name || '—'}</td>
                    <td>{s.program?.branch || s.department || '—'}</td>
                    <td>{s.email}</td>
                    <td>
                      <span className={`db-status ${s.isActive ? 'db-status-active' : 'db-status-blocked'}`}>
                        {s.isActive ? 'Active' : 'Disabled'}
                      </span>
                    </td>
                    <td className="db-actions-cell">
                      <Link className="db-btn-icon db-btn-edit" title="View student profile" to={`/admin/students/${s._id}`}>↗</Link>
                      <button className="db-btn-icon db-btn-edit" title="Edit" onClick={() => openEdit(s)}>✏️</button>
                      <button className={`db-btn-icon ${s.isActive ? 'db-btn-block' : 'db-btn-edit'}`}
                        title={s.isActive ? 'Disable' : 'Enable'} onClick={() => handleToggle(s._id, s.isActive)}>
                        {s.isActive ? '🚫' : '✅'}
                      </button>
                      <button className="db-btn-icon db-btn-delete" title="Delete" onClick={() => handleDelete(s._id)}>🗑️</button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {modal && (
        <Modal
          title={modal === 'edit' ? `Edit — ${editing?.name}` : 'Register New Student'}
          onClose={closeModal}
        >
          {/* hidden file input lives here so ref stays stable */}
          <input ref={fileRef} type="file" accept="image/*" style={{ display:'none' }} onChange={handleAvatarChange} />
          <form onSubmit={submitForm}>
            <StudentForm
              form={form}
              onChange={handleChange}
              programs={programs}
              modal={modal}
              editing={editing}
              avatarPreview={avatarPreview}
              onAvatarClick={() => fileRef.current.click()}
              error={error}
              success={success}
              onCancel={closeModal}
              submitting={submitting}
            />
          </form>
        </Modal>
      )}
    </DashboardLayout>
  );
};

export default ManageStudents;

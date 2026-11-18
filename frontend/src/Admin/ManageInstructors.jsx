import { useState, useEffect, useRef } from 'react';
import DashboardLayout from '../components/DashboardLayout';
import { API_BASE, api } from '../utils/api';
import ProfileAvatar from '../components/ProfileAvatar';

const BASE = API_BASE;

const fieldStyle = { width:'100%', background:'rgba(255,255,255,0.07)', border:'1px solid rgba(255,255,255,0.15)', borderRadius:'8px', padding:'10px 12px', color:'#fff', fontSize:'0.9rem', outline:'none', boxSizing:'border-box' };
const labelStyle = { color:'#ccc', fontSize:'0.83rem', display:'block', marginBottom:'4px' };

// ── Details Drawer ────────────────────────────────────────────────────────────
const DetailsDrawer = ({ instructor, onClose }) => {
  if (!instructor) return null;
  const avatarSrc = instructor.avatar ? `${BASE}${instructor.avatar}` : '';

  return (
    <div style={{ position:'fixed', inset:0, background:'rgba(0,0,0,0.55)', zIndex:1000, display:'flex', justifyContent:'flex-end' }}>
      <div style={{ width:'360px', background:'#1e2235', height:'100%', overflowY:'auto', padding:'2rem', boxShadow:'-8px 0 40px rgba(0,0,0,0.4)' }}>
        <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:'1.5rem' }}>
          <h5 style={{ color:'#fff', margin:0 }}>Instructor Details</h5>
          <button onClick={onClose} style={{ background:'none', border:'none', color:'#aaa', fontSize:'1.4rem', cursor:'pointer' }}>×</button>
        </div>

        {/* Profile */}
        <div style={{ textAlign:'center', marginBottom:'1.5rem' }}>
          <ProfileAvatar src={avatarSrc} name={instructor.name} size={90} style={{ border:'3px solid #3b82f6', marginBottom:'0.75rem' }} />
          <div style={{ color:'#fff', fontWeight:700, fontSize:'1.05rem' }}>{instructor.name}</div>
          <div style={{ color:'#3b82f6', fontSize:'0.82rem', marginTop:'2px' }}>
            <span style={{ background:'rgba(59,130,246,0.15)', padding:'2px 10px', borderRadius:'20px' }}>Instructor</span>
          </div>
        </div>

        {/* Info rows */}
        {[
          { label:'Employee ID', value: instructor.empId || '—' },
          { label:'Email',       value: instructor.email },
          { label:'Mobile',      value: instructor.mobile || '—' },
          { label:'Department',  value: instructor.department || '—' },
          { label:'Status',      value: instructor.isActive ? '✅ Active' : '🚫 Disabled' },
          { label:'Joined',      value: instructor.createdAt ? new Date(instructor.createdAt).toLocaleDateString('en-IN', { day:'2-digit', month:'short', year:'numeric' }) : '—' },
        ].map(({ label, value }) => (
          <div key={label} style={{ display:'flex', justifyContent:'space-between', padding:'10px 0', borderBottom:'1px solid rgba(255,255,255,0.07)' }}>
            <span style={{ color:'#888', fontSize:'0.83rem' }}>{label}</span>
            <span style={{ color:'#e2e8f0', fontSize:'0.85rem', fontWeight:500, textAlign:'right', maxWidth:'60%' }}>{value}</span>
          </div>
        ))}

        {/* Assigned Courses */}
        {instructor.courses?.length > 0 && (
          <>
            <div style={{ color:'#94a3b8', fontSize:'0.78rem', marginTop:'1.25rem', marginBottom:'0.5rem', textTransform:'uppercase', letterSpacing:'0.05em' }}>Assigned Courses</div>
            {instructor.courses.map(c => (
              <div key={c._id} style={{ background:'rgba(59,130,246,0.08)', border:'1px solid rgba(59,130,246,0.2)', borderRadius:'8px', padding:'8px 12px', marginBottom:'6px' }}>
                <div style={{ color:'#93c5fd', fontWeight:600, fontSize:'0.85rem' }}>{c.name}</div>
                <div style={{ color:'#64748b', fontSize:'0.78rem' }}>{c.code} · Sem {c.semester} · {c.department}</div>
              </div>
            ))}
          </>
        )}

        {instructor.bio && (
          <div style={{ marginTop:'1rem' }}>
            <div style={{ color:'#94a3b8', fontSize:'0.78rem', marginBottom:'4px', textTransform:'uppercase', letterSpacing:'0.05em' }}>Bio</div>
            <p style={{ color:'#cbd5e1', fontSize:'0.85rem', lineHeight:1.6 }}>{instructor.bio}</p>
          </div>
        )}
      </div>
    </div>
  );
};

// ── Edit Modal ────────────────────────────────────────────────────────────────
const EditModal = ({ instructor, branches, onClose, onSaved }) => {
  const [form, setForm] = useState({
    name: instructor.name, email: instructor.email,
    mobile: instructor.mobile || '', department: instructor.department || '', bio: instructor.bio || '',
  });
  const [avatarFile,    setAvatarFile]    = useState(null);
  const [avatarPreview, setAvatarPreview] = useState(instructor.avatar ? `${BASE}${instructor.avatar}` : null);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const fileRef = useRef();

  const set = f => e => setForm(p => ({ ...p, [f]: e.target.value }));

  const handleSubmit = async (e) => {
    e.preventDefault(); setError(''); setSubmitting(true);
    const token = localStorage.getItem('token');
    try {
      const fd = new FormData();
      Object.entries(form).forEach(([k, v]) => v && fd.append(k, v));
      if (avatarFile) fd.append('avatar', avatarFile);

      const res  = await fetch(`${BASE}/api/admin/instructors/${instructor._id}`, { method:'PUT', headers:{ Authorization:`Bearer ${token}` }, body:fd });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || 'Update failed.');
      onSaved(data.data);
    } catch (e) { setError(e.message); }
    finally { setSubmitting(false); }
  };

  return (
    <div style={{ position:'fixed', inset:0, background:'rgba(0,0,0,0.65)', zIndex:1100, display:'flex', alignItems:'center', justifyContent:'center', padding:'1rem' }}>
      <div style={{ background:'#1e2235', borderRadius:'12px', padding:'2rem', width:'100%', maxWidth:'500px', maxHeight:'90vh', overflowY:'auto', boxShadow:'0 20px 60px rgba(0,0,0,0.5)' }}>
        <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:'1.5rem' }}>
          <h5 style={{ color:'#fff', margin:0 }}>Edit Instructor</h5>
          <button onClick={onClose} style={{ background:'none', border:'none', color:'#aaa', fontSize:'1.4rem', cursor:'pointer' }}>×</button>
        </div>

        {error && <div style={{ background:'#ff4d4d22', border:'1px solid #ff4d4d', color:'#ff6b6b', borderRadius:'8px', padding:'0.75rem', marginBottom:'1rem', fontSize:'0.88rem' }}>⚠️ {error}</div>}

        <form onSubmit={handleSubmit}>
          {/* Avatar */}
          <div style={{ display:'flex', flexDirection:'column', alignItems:'center', marginBottom:'1.5rem' }}>
            <ProfileAvatar src={avatarPreview || ''} name={instructor.name} size={80} style={{ border:'3px solid #3b82f6', marginBottom:'0.5rem' }} />
            <button type="button" onClick={() => fileRef.current.click()}
              style={{ background:'rgba(59,130,246,0.15)', border:'1px solid #3b82f6', color:'#3b82f6', borderRadius:'6px', padding:'4px 14px', fontSize:'0.82rem', cursor:'pointer' }}>
              Change Photo
            </button>
            <small style={{ color:'#94a3b8', marginTop:'0.45rem' }}>JPEG, PNG, GIF, WebP, AVIF, BMP, and TIFF · Maximum 10 MB</small>
            <input ref={fileRef} type="file" accept="image/*" style={{ display:'none' }}
              onChange={e => {
                const file = e.target.files[0];
                if (!file) return;
                if (file.size > 10 * 1024 * 1024) {
                  setError('Photo must be 10 MB or smaller.');
                  e.target.value = '';
                  return;
                }
                setError('');
                setAvatarFile(file);
                setAvatarPreview(URL.createObjectURL(file));
              }} />
          </div>

          {[
            { label:'Full Name',  field:'name',   type:'text'  },
            { label:'Email',      field:'email',  type:'email' },
            { label:'Mobile',     field:'mobile', type:'tel'   },
          ].map(({ label, field, type }) => (
            <div key={field} style={{ marginBottom:'1rem' }}>
              <label style={labelStyle}>{label}</label>
              <input type={type} value={form[field]} onChange={set(field)} style={fieldStyle} />
            </div>
          ))}

          <div style={{ marginBottom:'1rem' }}>
            <label style={labelStyle}>Department</label>
            <select value={form.department} onChange={set('department')} style={{ ...fieldStyle, background:'#2a2f45' }}>
              <option value="">Select branch</option>
              {form.department && !branches.includes(form.department) && <option value={form.department}>{form.department}</option>}
              {branches.map(branch => <option key={branch} value={branch}>{branch}</option>)}
            </select>
          </div>

          <div style={{ marginBottom:'1.5rem' }}>
            <label style={labelStyle}>Bio</label>
            <textarea value={form.bio} onChange={set('bio')} rows={3}
              style={{ ...fieldStyle, resize:'vertical' }} placeholder="Short bio..." />
          </div>

          <div style={{ display:'flex', gap:'10px' }}>
            <button type="button" onClick={onClose}
              style={{ flex:1, background:'rgba(255,255,255,0.07)', border:'1px solid rgba(255,255,255,0.15)', color:'#ccc', borderRadius:'8px', padding:'10px', cursor:'pointer' }}>
              Cancel
            </button>
            <button type="submit" disabled={submitting}
              style={{ flex:2, background:'linear-gradient(135deg,#3b82f6,#2563eb)', border:'none', color:'#fff', borderRadius:'8px', padding:'10px', fontWeight:600, cursor: submitting?'not-allowed':'pointer', opacity: submitting?0.7:1 }}>
              {submitting ? 'Saving...' : 'Save Changes'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

const CreateInstructorModal = ({ branches, onClose, onCreated }) => {
  const [form, setForm] = useState({ name: '', email: '', mobile: '', department: '', dob: '' });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const update = field => event => setForm(current => ({
    ...current,
    [field]: field === 'mobile' ? event.target.value.replace(/\D/g, '').slice(0, 10) : event.target.value,
  }));

  const handleSubmit = async event => {
    event.preventDefault();
    setSaving(true);
    setError('');
    try {
      const result = await api('/api/admin/instructors', {
        method: 'POST',
        body: JSON.stringify(form),
      });
      onCreated(result.data);
    } catch (requestError) {
      setError(requestError.message);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div style={{ position:'fixed', inset:0, background:'rgba(0,0,0,0.65)', zIndex:1100, display:'flex', alignItems:'center', justifyContent:'center', padding:'1rem' }}>
      <section role="dialog" aria-modal="true" aria-labelledby="create-instructor-title"
        style={{ background:'#1e2235', borderRadius:'12px', padding:'2rem', width:'100%', maxWidth:'520px', maxHeight:'90vh', overflowY:'auto', boxShadow:'0 20px 60px rgba(0,0,0,0.5)' }}>
        <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:'1.5rem' }}>
          <div>
            <span style={{ color:'#93c5fd', fontSize:'0.72rem', fontWeight:700, letterSpacing:'0.12em' }}>INSTRUCTOR ONBOARDING</span>
            <h2 id="create-instructor-title" style={{ color:'#fff', fontSize:'1.35rem', margin:'0.35rem 0 0' }}>Create instructor account</h2>
          </div>
          <button type="button" aria-label="Close" onClick={onClose}
            style={{ background:'none', border:'none', color:'#aaa', fontSize:'1.5rem', cursor:'pointer' }}>×</button>
        </div>
        {error && <div role="alert" style={{ background:'#ff4d4d22', border:'1px solid #ff4d4d', color:'#ffb4b4', borderRadius:'8px', padding:'0.75rem', marginBottom:'1rem' }}>{error}</div>}
        <form onSubmit={handleSubmit}>
          {[
            { label:'Full name', field:'name', type:'text', props:{ minLength:3, maxLength:60 } },
            { label:'Email address', field:'email', type:'email', props:{ maxLength:254 } },
            { label:'Mobile number', field:'mobile', type:'tel', props:{ inputMode:'numeric', pattern:'[0-9]{10}', maxLength:10, title:'Enter exactly 10 digits.' } },
          ].map(({ label, field, type, props }) => (
            <div key={field} style={{ marginBottom:'1rem' }}>
              <label htmlFor={`instructor-${field}`} style={labelStyle}>{label}</label>
              <input id={`instructor-${field}`} type={type} value={form[field]} onChange={update(field)}
                required style={fieldStyle} {...props} />
            </div>
          ))}
          <div style={{ marginBottom:'1rem' }}>
            <label htmlFor="instructor-branch" style={labelStyle}>Branch</label>
            <select id="instructor-branch" value={form.department} onChange={update('department')}
              required disabled={!branches.length} style={{ ...fieldStyle, background:'#2a2f45' }}>
              <option value="">Select branch</option>
              {branches.map(branch => <option key={branch} value={branch}>{branch}</option>)}
            </select>
          </div>
          <div style={{ marginBottom:'1.5rem' }}>
            <label htmlFor="instructor-dob" style={labelStyle}>Date of birth (login credential)</label>
            <input id="instructor-dob" type="date" value={form.dob} onChange={update('dob')}
              max={new Date().toISOString().slice(0, 10)} required style={fieldStyle} />
          </div>
          <div style={{ background:'rgba(59,130,246,0.1)', color:'#bfdbfe', padding:'0.7rem 0.85rem', borderRadius:'8px', marginBottom:'1rem', fontSize:'0.82rem' }}>
            An employee ID will be generated automatically after the account is created.
          </div>
          <div style={{ display:'flex', gap:'10px' }}>
            <button type="button" onClick={onClose} disabled={saving}
              style={{ flex:1, background:'rgba(255,255,255,0.07)', border:'1px solid rgba(255,255,255,0.15)', color:'#ccc', borderRadius:'8px', padding:'10px', cursor:'pointer' }}>Cancel</button>
            <button type="submit" disabled={saving || !branches.length}
              style={{ flex:2, background:'linear-gradient(135deg,#3b82f6,#2563eb)', border:'none', color:'#fff', borderRadius:'8px', padding:'10px', fontWeight:600, cursor:saving ? 'not-allowed' : 'pointer', opacity:saving ? 0.7 : 1 }}>
              {saving ? 'Creating…' : 'Create account'}
            </button>
          </div>
        </form>
      </section>
    </div>
  );
};

// ── Main Component ────────────────────────────────────────────────────────────
const ManageInstructors = () => {
  const [instructors, setInstructors] = useState([]);
  const [branches, setBranches] = useState([]);
  const [loading,     setLoading]     = useState(true);
  const [search,      setSearch]      = useState('');
  const [detailsFor,  setDetailsFor]  = useState(null); // full instructor object for drawer
  const [editingId,   setEditingId]   = useState(null);
  const [creating,    setCreating]    = useState(false);
  const [createdEmpId, setCreatedEmpId] = useState('');

  useEffect(() => {
    let active = true;
    Promise.all([api('/api/admin/instructors'), api('/api/admin/programs')])
      .then(([instructorResult, programResult]) => {
        if (!active) return;
        setInstructors(instructorResult.data);
        setBranches([...new Set(programResult.data.map(program => program.branch))].sort((a, b) => a.localeCompare(b)));
      })
      .catch(error => { if (active) alert(error.message); })
      .finally(() => { if (active) setLoading(false); });
    return () => { active = false; };
  }, []);

  const openDetails = async (id) => {
    try {
      const d = await api(`/api/admin/instructors/${id}`);
      setDetailsFor(d.data);
    } catch (e) { alert(e.message); }
  };

  const handleToggle = async (id, isActive) => {
    try {
      await api(`/api/admin/instructors/${id}/toggle`, { method:'PATCH' });
      setInstructors(prev => prev.map(i => i._id === id ? { ...i, isActive: !isActive } : i));
      if (detailsFor?._id === id) setDetailsFor(p => ({ ...p, isActive: !isActive }));
    } catch (e) { alert(e.message); }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Permanently delete this instructor?')) return;
    try {
      await api(`/api/admin/instructors/${id}`, { method:'DELETE' });
      setInstructors(prev => prev.filter(i => i._id !== id));
      if (detailsFor?._id === id) setDetailsFor(null);
    } catch (e) { alert(e.message); }
  };

  const handleSaved = (updated) => {
    setInstructors(prev => prev.map(i => i._id === updated._id ? { ...i, ...updated } : i));
    if (detailsFor?._id === updated._id) setDetailsFor(p => ({ ...p, ...updated }));
    setEditingId(null);
  };

  const filtered = instructors.filter(i =>
    i.name.toLowerCase().includes(search.toLowerCase()) ||
    i.empId?.toLowerCase().includes(search.toLowerCase()) ||
    i.email.toLowerCase().includes(search.toLowerCase())
  );

  const editingInstructor = editingId ? instructors.find(i => i._id === editingId) : null;
  const handleCreated = instructor => {
    setInstructors(current => [instructor, ...current]);
    setCreating(false);
    setCreatedEmpId(instructor.empId);
  };

  return (
    <DashboardLayout role="admin">
      <div className="db-page-header">
        <h4 className="db-page-title">Manage Instructors</h4>
        <p className="db-page-sub">Create accounts with generated employee IDs, then manage faculty records and assignments.</p>
      </div>
      {createdEmpId && (
        <div role="status" style={{ color:'#bbf7d0', background:'rgba(74,222,128,0.09)', border:'1px solid rgba(74,222,128,0.24)', borderRadius:'8px', padding:'0.8rem 1rem', marginBottom:'1rem' }}>
          Instructor account created. Employee ID: <strong>{createdEmpId}</strong>. Share the ID and date-of-birth login instructions securely.
          <button type="button" onClick={() => setCreatedEmpId('')} aria-label="Dismiss"
            style={{ float:'right', background:'none', border:0, color:'inherit', cursor:'pointer' }}>×</button>
        </div>
      )}

      <div className="db-card">
        <div className="db-card-toolbar">
          <input className="db-search" type="text" placeholder="🔍  Search by name, Emp ID or email..."
            value={search} onChange={e => setSearch(e.target.value)} />
          <button className="db-btn db-btn-primary" onClick={() => { setCreating(true); setCreatedEmpId(''); }}
            disabled={!branches.length}>+ Add Instructor</button>
        </div>

        {loading ? (
          <p style={{ color:'#aaa', padding:'1rem' }}>Loading instructors...</p>
        ) : (
          <div className="db-table-wrap">
            <table className="db-table">
              <thead>
                <tr><th>#</th><th>Photo</th><th>Name</th><th>Emp ID</th><th>Department</th><th>Email</th><th>Courses</th><th>Status</th><th>Actions</th></tr>
              </thead>
              <tbody>
                {filtered.length === 0 ? (
                  <tr><td colSpan={9} style={{ textAlign:'center', color:'#aaa', padding:'1.5rem' }}>No instructors found.</td></tr>
                ) : filtered.map((ins, i) => (
                  <tr key={ins._id}>
                    <td>{i + 1}</td>
                    <td>
                      <ProfileAvatar src={ins.avatar ? `${BASE}${ins.avatar}` : ''} name={ins.name} size={36} style={{ border:'2px solid #3b82f6' }} />
                    </td>
                    <td>
                      <button onClick={() => openDetails(ins._id)}
                        style={{ background:'none', border:'none', color:'#93c5fd', fontWeight:600, cursor:'pointer', padding:0, textDecoration:'underline', textDecorationStyle:'dotted' }}>
                        {ins.name}
                      </button>
                    </td>
                    <td style={{ fontFamily:'monospace', color:'#3b82f6', fontWeight:700 }}>{ins.empId || '—'}</td>
                    <td>{ins.department || '—'}</td>
                    <td>{ins.email}</td>
                    <td style={{ textAlign:'center' }}>{ins.courseCount ?? 0}</td>
                    <td>
                      <span className={`db-status ${ins.isActive ? 'db-status-active' : 'db-status-blocked'}`}>
                        {ins.isActive ? 'Active' : 'Disabled'}
                      </span>
                    </td>
                    <td className="db-actions-cell">
                      <button className="db-btn-icon db-btn-edit" title="Edit" onClick={() => setEditingId(ins._id)}>✏️</button>
                      <button className={`db-btn-icon ${ins.isActive ? 'db-btn-block' : 'db-btn-edit'}`}
                        title={ins.isActive ? 'Disable' : 'Enable'} onClick={() => handleToggle(ins._id, ins.isActive)}>
                        {ins.isActive ? '🚫' : '✅'}
                      </button>
                      <button className="db-btn-icon db-btn-delete" title="Delete" onClick={() => handleDelete(ins._id)}>🗑️</button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {detailsFor  && <DetailsDrawer instructor={detailsFor} onClose={() => setDetailsFor(null)} />}
      {editingInstructor && <EditModal instructor={editingInstructor} branches={branches} onClose={() => setEditingId(null)} onSaved={handleSaved} />}
      {creating && <CreateInstructorModal branches={branches} onClose={() => setCreating(false)} onCreated={handleCreated} />}
    </DashboardLayout>
  );
};

export default ManageInstructors;

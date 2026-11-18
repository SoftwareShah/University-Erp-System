import { useState, useEffect, useCallback } from 'react';
import DashboardLayout from '../components/DashboardLayout';
import { api } from '../utils/api';

const DAYS = ['Monday','Tuesday','Wednesday','Thursday','Friday','Saturday'];

const dayColors = { Monday:'#3b82f6', Tuesday:'#10b981', Wednesday:'#f59e0b', Thursday:'#8b5cf6', Friday:'#ef4444', Saturday:'#06b6d4' };

const fieldStyle = { width:'100%', background:'rgba(255,255,255,0.07)', border:'1px solid rgba(255,255,255,0.15)', borderRadius:'8px', padding:'9px 12px', color:'#fff', fontSize:'0.88rem', outline:'none', boxSizing:'border-box' };
const labelStyle = { color:'#ccc', fontSize:'0.8rem', display:'block', marginBottom:'3px' };

const EMPTY_FORM = { courseId:'', teacherId:'', day:'Monday', startTime:'09:00', endTime:'10:00', room:'', note:'' };

// ── Log History Panel ─────────────────────────────────────────────────────────
const LogPanel = ({ entryId, onClose }) => {
  const [logs,    setLogs]    = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api(`/api/admin/timetable/${entryId}/log`)
      .then(d => setLogs(d.data))
      .catch(e => console.error(e))
      .finally(() => setLoading(false));
  }, [entryId]);

  return (
    <div style={{ position:'fixed', inset:0, background:'rgba(0,0,0,0.6)', zIndex:1000, display:'flex', justifyContent:'flex-end' }}>
      <div style={{ width:'360px', background:'#1e2235', height:'100%', overflowY:'auto', padding:'2rem', boxShadow:'-8px 0 40px rgba(0,0,0,0.4)' }}>
        <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:'1.5rem' }}>
          <h5 style={{ color:'#fff', margin:0 }}>Change History</h5>
          <button onClick={onClose} style={{ background:'none', border:'none', color:'#aaa', fontSize:'1.4rem', cursor:'pointer' }}>×</button>
        </div>
        {loading ? <p style={{ color:'#aaa' }}>Loading...</p> :
         logs.length === 0 ? <p style={{ color:'#64748b', fontSize:'0.88rem' }}>No changes recorded yet.</p> :
         [...logs].reverse().map((log, i) => (
          <div key={i} style={{ background:'rgba(255,255,255,0.04)', border:'1px solid rgba(255,255,255,0.08)', borderRadius:'8px', padding:'12px', marginBottom:'10px' }}>
            <div style={{ display:'flex', justifyContent:'space-between', marginBottom:'6px' }}>
              <span style={{ color:'#f59e0b', fontSize:'0.78rem', fontWeight:600, textTransform:'uppercase' }}>{log.field}</span>
              <span style={{ color:'#64748b', fontSize:'0.75rem' }}>{new Date(log.changedAt).toLocaleString('en-IN')}</span>
            </div>
            <div style={{ fontSize:'0.83rem', color:'#94a3b8' }}>
              <span style={{ color:'#f87171' }}>{log.oldValue || '—'}</span>
              <span style={{ margin:'0 6px', color:'#64748b' }}>→</span>
              <span style={{ color:'#86efac' }}>{log.newValue || '—'}</span>
            </div>
            {log.changedBy?.name && <div style={{ color:'#64748b', fontSize:'0.75rem', marginTop:'4px' }}>by {log.changedBy.name}</div>}
            {log.note && <div style={{ color:'#94a3b8', fontSize:'0.78rem', marginTop:'4px', fontStyle:'italic' }}>"{log.note}"</div>}
          </div>
        ))}
      </div>
    </div>
  );
};

// ── Add / Edit Modal ──────────────────────────────────────────────────────────
const EntryModal = ({ entry, courses, onClose, onSaved }) => {
  const isEdit = !!entry;
  const [form, setForm] = useState(isEdit ? {
    courseId:  entry.course._id,
    teacherId: entry.teacher._id,
    day:       entry.day,
    startTime: entry.startTime,
    endTime:   entry.endTime,
    room:      entry.room || '',
    note:      '',
  } : EMPTY_FORM);
  const [submitting, setSubmitting] = useState(false);
  const [error,      setError]      = useState('');
  const selectedCourse = courses.find(course => course._id === form.courseId);
  const assignedInstructor = selectedCourse?.teacher;

  // Stable handler — won't recreate on every keystroke
  const handleChange = useCallback((field) => (e) => {
    const value = e.target.value;
    setForm(prev => field === 'courseId'
      ? { ...prev, courseId: value, teacherId: courses.find(course => course._id === value)?.teacher?._id || '' }
      : { ...prev, [field]: value });
  }, [courses]);

  const handleSubmit = async (e) => {
    e.preventDefault(); setError(''); setSubmitting(true);
    try {
      const body = {
        courseId:  form.courseId,
        teacherId: form.teacherId,
        day:       form.day,
        startTime: form.startTime,
        endTime:   form.endTime,
        room:      form.room,
        note:      form.note,
      };
      const url    = isEdit ? `/api/admin/timetable/${entry._id}` : '/api/admin/timetable';
      const method = isEdit ? 'PUT' : 'POST';
      const data   = await api(url, { method, body: JSON.stringify(body) });
      onSaved(data.data, isEdit);
    } catch (e) { setError(e.message); }
    finally { setSubmitting(false); }
  };

  return (
    <div style={{ position:'fixed', inset:0, background:'rgba(0,0,0,0.65)', zIndex:1000, display:'flex', alignItems:'center', justifyContent:'center', padding:'1rem' }}>
      <div style={{ background:'#1e2235', borderRadius:'12px', padding:'2rem', width:'100%', maxWidth:'500px', maxHeight:'90vh', overflowY:'auto', boxShadow:'0 20px 60px rgba(0,0,0,0.5)' }}>
        <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:'1.5rem' }}>
          <h5 style={{ color:'#fff', margin:0 }}>{isEdit ? 'Edit Timetable Entry' : 'Add Timetable Entry'}</h5>
          <button onClick={onClose} style={{ background:'none', border:'none', color:'#aaa', fontSize:'1.4rem', cursor:'pointer' }}>×</button>
        </div>

        {error && (
          <div style={{ background:'#ff4d4d22', border:'1px solid #ff4d4d', color:'#ff6b6b', borderRadius:'8px', padding:'0.75rem', marginBottom:'1rem', fontSize:'0.88rem' }}>
            ⚠️ {error}
          </div>
        )}

        {isEdit && (
          <div style={{ background:'rgba(59,130,246,0.1)', border:'1px solid rgba(59,130,246,0.25)', borderRadius:'8px', padding:'10px 14px', marginBottom:'1rem', fontSize:'0.82rem', color:'#bfdbfe' }}>
            The instructor is controlled by the course assignment. Change it in Manage Courses after removing this course’s timetable entries.
          </div>
        )}
        {!assignedInstructor && (
          <div style={{ background:'rgba(245,158,11,0.1)', border:'1px solid rgba(245,158,11,0.3)', borderRadius:'8px', padding:'10px 14px', marginBottom:'1rem', fontSize:'0.82rem', color:'#fcd34d' }}>
            Assign an instructor to this course in Manage Courses before adding its timetable entry.
          </div>
        )}

        <form onSubmit={handleSubmit}>
          <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:'12px', marginBottom:'12px' }}>
            <div>
              <label style={labelStyle}>Course *</label>
              <select value={form.courseId} onChange={handleChange('courseId')} required style={{ ...fieldStyle, background:'#2a2f45' }}>
                <option value="">Select course</option>
                {courses.map(c => <option key={c._id} value={c._id}>{c.name} ({c.code})</option>)}
              </select>
            </div>
            <div>
              <label style={labelStyle}>Instructor *</label>
              <select value={form.teacherId} required disabled={!assignedInstructor} style={{ ...fieldStyle, background:'#2a2f45' }}>
                <option value="">Select instructor</option>
                {assignedInstructor && <option value={assignedInstructor._id}>{assignedInstructor.name}</option>}
              </select>
            </div>
            <div>
              <label style={labelStyle}>Day *</label>
              <select value={form.day} onChange={handleChange('day')} style={{ ...fieldStyle, background:'#2a2f45' }}>
                {DAYS.map(d => <option key={d} value={d}>{d}</option>)}
              </select>
            </div>
            <div>
              <label style={labelStyle}>Room</label>
              <input type="text" placeholder="e.g. A101" value={form.room} onChange={handleChange('room')} style={fieldStyle} />
            </div>
            <div>
              <label style={labelStyle}>Start Time *</label>
              <input type="time" value={form.startTime} onChange={handleChange('startTime')} required style={fieldStyle} />
            </div>
            <div>
              <label style={labelStyle}>End Time *</label>
              <input type="time" value={form.endTime} onChange={handleChange('endTime')} required style={fieldStyle} />
            </div>
          </div>

          {isEdit && (
            <div style={{ marginBottom:'1.5rem' }}>
              <label style={labelStyle}>Reason for change (optional)</label>
              <input type="text" placeholder="e.g. Teacher on leave, room change..." value={form.note} onChange={handleChange('note')} style={fieldStyle} />
            </div>
          )}

          <div style={{ display:'flex', gap:'10px', marginTop:'0.5rem' }}>
            <button type="button" onClick={onClose}
              style={{ flex:1, background:'rgba(255,255,255,0.07)', border:'1px solid rgba(255,255,255,0.15)', color:'#ccc', borderRadius:'8px', padding:'10px', cursor:'pointer' }}>
              Cancel
            </button>
            <button type="submit" disabled={submitting}
              style={{ flex:2, background:'linear-gradient(135deg,#f59e0b,#d97706)', border:'none', color:'#fff', borderRadius:'8px', padding:'10px', fontWeight:600, cursor: submitting ? 'not-allowed':'pointer', opacity: submitting ? 0.7:1 }}>
              {submitting ? 'Saving...' : isEdit ? 'Save Changes' : 'Add Entry'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

// ── Main Component ────────────────────────────────────────────────────────────
const PostTimetable = () => {
  const [entries,     setEntries]     = useState([]);
  const [courses,     setCourses]     = useState([]);
  const [loading,     setLoading]     = useState(true);
  const [loadError,   setLoadError]   = useState('');
  const [filterDay,   setFilterDay]   = useState('All');
  const [modal,       setModal]       = useState(null); // null | 'add' | entry-object
  const [logEntryId,  setLogEntryId]  = useState(null);

  useEffect(() => {
    let active = true;
    Promise.all([
        api('/api/admin/timetable'),
        api('/api/admin/courses'),
    ]).then(([timetableResult, courseResult]) => {
      if (!active) return;
      setEntries(timetableResult.data);
      setCourses(courseResult.data);
    }).catch(error => {
      if (active) setLoadError(error.message);
    }).finally(() => {
      if (active) setLoading(false);
    });
    return () => { active = false; };
  }, []);

  const handleSaved = (saved, isEdit) => {
    if (isEdit) setEntries(prev => prev.map(e => e._id === saved._id ? saved : e));
    else        setEntries(prev => [saved, ...prev]);
    setModal(null);
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Delete this timetable entry?')) return;
    try {
      await api(`/api/admin/timetable/${id}`, { method:'DELETE' });
      setEntries(prev => prev.filter(e => e._id !== id));
    } catch (e) { alert(e.message); }
  };

  const filtered = filterDay === 'All' ? entries : entries.filter(e => e.day === filterDay);

  const grouped = DAYS.reduce((acc, d) => {
    const dayEntries = filtered.filter(e => e.day === d);
    if (dayEntries.length) acc[d] = dayEntries;
    return acc;
  }, {});

  return (
    <DashboardLayout role="admin">
      <div className="db-page-header">
        <h4 className="db-page-title">Timetable Management</h4>
        <p className="db-page-sub">Schedule courses, prevent instructor or room conflicts, and review change history.</p>
      </div>
      {loadError && (
        <div role="alert" style={{ color:'#fecaca', background:'rgba(248,113,113,0.1)', padding:'0.8rem 1rem', borderRadius:'8px', marginBottom:'1rem' }}>
          Could not load timetable data: {loadError}
        </div>
      )}

      {/* Toolbar */}
      <div style={{ display:'flex', gap:'10px', flexWrap:'wrap', marginBottom:'1.5rem', alignItems:'center' }}>
        <div style={{ display:'flex', gap:'6px', flexWrap:'wrap', flex:1 }}>
          {['All', ...DAYS].map(d => (
            <button key={d} onClick={() => setFilterDay(d)}
              style={{ padding:'6px 14px', borderRadius:'20px', border:'none', cursor:'pointer', fontSize:'0.82rem', fontWeight:600,
                background: filterDay === d ? (dayColors[d] || '#6366f1') : 'rgba(255,255,255,0.07)',
                color: filterDay === d ? '#fff' : '#94a3b8' }}>
              {d}
            </button>
          ))}
        </div>
        <button className="db-btn db-btn-primary" onClick={() => setModal('add')}>+ Add Entry</button>
      </div>

      {loading ? (
        <p style={{ color:'#aaa' }}>Loading timetable...</p>
      ) : Object.keys(grouped).length === 0 ? (
        <div style={{ textAlign:'center', color:'#64748b', padding:'3rem' }}>No timetable entries found.</div>
      ) : (
        Object.entries(grouped).map(([day, dayEntries]) => (
          <div key={day} className="db-card" style={{ marginBottom:'1.25rem' }}>
            <div style={{ display:'flex', alignItems:'center', gap:'10px', marginBottom:'1rem' }}>
              <span style={{ background: dayColors[day], color:'#fff', padding:'4px 14px', borderRadius:'20px', fontWeight:700, fontSize:'0.85rem' }}>{day}</span>
              <span style={{ color:'#64748b', fontSize:'0.82rem' }}>{dayEntries.length} class{dayEntries.length !== 1 ? 'es' : ''}</span>
            </div>
            <div className="db-table-wrap">
              <table className="db-table">
                <thead>
                  <tr><th>Time</th><th>Course</th><th>Code</th><th>Instructor</th><th>Room</th><th>Actions</th></tr>
                </thead>
                <tbody>
                  {dayEntries.map(e => (
                    <tr key={e._id}>
                      <td style={{ whiteSpace:'nowrap', color:'#94a3b8' }}>{e.startTime} – {e.endTime}</td>
                      <td><strong style={{ color:'#e2e8f0' }}>{e.course?.name}</strong></td>
                      <td style={{ fontFamily:'monospace', color:'#f59e0b', fontSize:'0.82rem' }}>{e.course?.code}</td>
                      <td style={{ color:'#93c5fd' }}>{e.teacher?.name}</td>
                      <td>{e.room || '—'}</td>
                      <td className="db-actions-cell">
                        <button className="db-btn-icon db-btn-edit" title="Edit / Reassign" onClick={() => setModal(e)}>✏️</button>
                        <button title="Change History" onClick={() => setLogEntryId(e._id)}
                          style={{ background:'rgba(99,102,241,0.15)', border:'1px solid rgba(99,102,241,0.3)', color:'#a5b4fc', borderRadius:'6px', padding:'4px 8px', cursor:'pointer', fontSize:'0.8rem' }}>
                          📋
                        </button>
                        <button className="db-btn-icon db-btn-delete" title="Delete" onClick={() => handleDelete(e._id)}>🗑️</button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        ))
      )}

      {modal && (
        <EntryModal
          entry={modal === 'add' ? null : modal}
          courses={courses}
          onClose={() => setModal(null)}
          onSaved={handleSaved}
        />
      )}

      {logEntryId && <LogPanel entryId={logEntryId} onClose={() => setLogEntryId(null)} />}
    </DashboardLayout>
  );
};

export default PostTimetable;

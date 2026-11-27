import { useState, useEffect } from 'react';
import DashboardLayout from '../components/DashboardLayout';
import { api } from '../utils/api';

const DAYS = ['Monday','Tuesday','Wednesday','Thursday','Friday','Saturday'];
const dayColors = { Monday:'#3b82f6', Tuesday:'#10b981', Wednesday:'#f59e0b', Thursday:'#8b5cf6', Friday:'#ef4444', Saturday:'#06b6d4' };

const ViewTimetable = ({ role = 'student' }) => {
  const [entries,  setEntries]  = useState([]);
  const [loading,  setLoading]  = useState(true);
  const [error,    setError]    = useState('');

  useEffect(() => {
    api(`/api/${role === 'instructor' ? 'teacher' : 'student'}/timetable`)
      .then(d => setEntries(d.data))
      .catch(e => setError(e.message))
      .finally(() => setLoading(false));
  }, [role]);

  // Group by day
  const grouped = DAYS.reduce((acc, d) => {
    const dayEntries = entries.filter(e => e.day === d);
    if (dayEntries.length) acc[d] = dayEntries;
    return acc;
  }, {});

  return (
    <DashboardLayout role={role}>
      <div className="db-page-header">
        <h4 className="db-page-title">My Timetable</h4>
        <p className="db-page-sub">{role === 'instructor' ? 'Your assigned weekly teaching schedule' : 'Weekly class schedule for your department'}</p>
      </div>

      {loading && <p style={{ color:'#aaa' }}>Loading timetable...</p>}
      {error   && <p style={{ color:'#f87171' }}>⚠️ {error}</p>}

      {!loading && !error && Object.keys(grouped).length === 0 && (
        <div style={{ textAlign:'center', color:'#64748b', padding:'3rem' }}>No timetable entries found for your department.</div>
      )}

      <div className="db-timetable-grid">
        {Object.entries(grouped).map(([day, classes]) => (
          <div className="db-tt-day-card" key={day}>
            <div className="db-tt-day-header" style={{ background: dayColors[day] }}>{day}</div>
            <div className="db-tt-classes">
              {classes.map((c, i) => (
                <div className="db-tt-class" key={i}>
                  <div className="db-tt-time">{c.startTime} – {c.endTime}</div>
                  <div className="db-tt-course">{c.course?.name}</div>
                  <div className="db-tt-meta">{c.teacher?.name}{c.room ? ` · ${c.room}` : ''}</div>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </DashboardLayout>
  );
};

export default ViewTimetable;

import { useCallback } from 'react';
import { Link } from 'react-router-dom';
import DashboardLayout from '../components/DashboardLayout';
import { api } from '../utils/api';
import useLiveResource from '../hooks/useLiveResource';
import './live-dashboard.css';

const InstructorDashboard = () => {
  const name = localStorage.getItem('name') || 'Instructor';
  const load = useCallback(async () => (await api('/api/teacher/dashboard')).data, []);
  const { data, loading, error, lastUpdated, refresh } = useLiveResource(load);
  const stats = data ? [
    { label: 'Assigned courses', value: data.courses.length, icon: '📚', color: '#2563eb', note: 'Current assignments' },
    { label: 'Students in branches', value: data.totalStudents, icon: '🎓', color: '#059669', note: 'Active enrollments' },
    { label: 'Assignments', value: data.assignments, icon: '📝', color: '#d97706', note: 'Uploaded by you' },
    { label: 'Attendance · 7 days', value: data.attendanceRate == null ? '—' : `${data.attendanceRate}%`, icon: '✅', color: '#7c3aed', note: data.attendanceRecords ? `${data.attendanceRecords} marked records` : 'No attendance recorded' },
  ] : [];

  return (
    <DashboardLayout role="instructor">
      <div className="live-page">
        <div className="live-page-header">
          <div><p className="live-eyebrow">INSTRUCTOR OVERVIEW</p><h1 className="db-page-title">Welcome back, {name}</h1><p className="db-page-sub">Your teaching activity, course assignments and attendance at a glance.</p></div>
          <div className="live-refresh-wrap"><span className="live-updated"><span className={`live-indicator ${error ? 'is-warning' : ''}`} />{lastUpdated ? `Updated ${lastUpdated.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}` : 'Connecting to live data'}</span><button className="live-refresh-button" type="button" onClick={refresh} disabled={loading}>↻ Refresh</button></div>
        </div>
        {error && <div className="live-alert" role="alert">{data ? `Refresh failed: ${error}. Showing the last loaded data.` : error}</div>}
        <div className="live-stats-grid">
          {loading && !data ? Array.from({ length: 4 }, (_, index) => <div className="live-stat-card live-skeleton" key={index} />) : stats.map(stat => (
            <div className="live-stat-card" key={stat.label}><div className="live-stat-top"><span className="live-stat-icon" style={{ color: stat.color, background: `${stat.color}14` }}>{stat.icon}</span><span className="live-stat-note">{stat.note}</span></div><strong className="live-stat-value">{Number.isFinite(stat.value) ? stat.value.toLocaleString() : stat.value}</strong><span className="live-stat-label">{stat.label}</span></div>
          ))}
        </div>
        <div className="live-dashboard-grid">
          <section className="live-panel">
            <div className="live-panel-heading"><div><h2>My courses</h2><p>Courses currently assigned to your account</p></div></div>
            {data?.courses.length ? <div className="live-list">
              {data.courses.map(course => <div className="live-list-row" key={course._id}><span className="live-list-icon">📘</span><div><strong>{course.name}</strong><small>{course.code} · {course.department} · Semester {course.semester}</small></div></div>)}
            </div> : <div className="live-empty">{loading ? 'Loading assigned courses…' : 'No courses are currently assigned to you.'}</div>}
          </section>
          <section className="live-panel">
            <div className="live-panel-heading"><div><h2>Today’s classes</h2><p>Your timetable for today</p></div><Link to="/instructor/timetable">Timetable <span aria-hidden="true">→</span></Link></div>
            {data?.todayClasses.length ? <div className="live-list">
              {data.todayClasses.map((entry, index) => <div className="live-list-row" key={`${entry.course?._id || entry.startTime}-${index}`}><span className="live-class-time">{entry.startTime}</span><div><strong>{entry.course?.name || 'Course'}</strong><small>{entry.course?.code || '—'} · {entry.endTime}</small></div></div>)}
            </div> : <div className="live-empty">{loading ? 'Loading timetable…' : 'No classes are listed for today.'}</div>}
          </section>
        </div>
        <div className="live-action-strip"><Link to="/instructor/attendance">✅ Mark attendance</Link><Link to="/instructor/assignments">📝 Manage assignments</Link><Link to="/instructor/marks">📊 Upload marks</Link></div>
      </div>
    </DashboardLayout>
  );
};

export default InstructorDashboard;

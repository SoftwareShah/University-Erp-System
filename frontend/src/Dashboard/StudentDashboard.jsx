import { useCallback } from 'react';
import { Link } from 'react-router-dom';
import DashboardLayout from '../components/DashboardLayout';
import { api } from '../utils/api';
import useLiveResource from '../hooks/useLiveResource';
import './live-dashboard.css';

const StudentDashboard = () => {
  const name = localStorage.getItem('name') || 'Student';
  const erpId = localStorage.getItem('erpId') || '';
  const load = useCallback(async () => {
    const [coursesResponse, attendanceResponse, assignmentResponse, marksResponse] = await Promise.all([
      api('/api/student/courses'),
      api('/api/student/attendance'),
      api('/api/student/assignments'),
      api('/api/student/marks'),
    ]);
    return {
      courses: coursesResponse.data || [],
      attendance: attendanceResponse.data || [],
      assignments: assignmentResponse.data || [],
      marks: marksResponse.data || [],
    };
  }, []);
  const { data, loading, error, lastUpdated, refresh } = useLiveResource(load);
  const today = new Date().toISOString().slice(0, 10);
  const dueAssignments = data?.assignments.filter(assignment => assignment.dueDate >= today) || [];
  const attendanceTotal = data?.attendance.reduce((total, item) => total + item.total, 0) || 0;
  const attendancePresent = data?.attendance.reduce((total, item) => total + item.present, 0) || 0;
  const attendanceRate = attendanceTotal ? Math.round((attendancePresent / attendanceTotal) * 100) : null;
  const marksTotals = (data?.marks || []).flatMap(group => group.exams).reduce((totals, exam) => ({
    marks: totals.marks + exam.marks,
    maxMarks: totals.maxMarks + exam.maxMarks,
  }), { marks: 0, maxMarks: 0 });
  const gradeAverage = marksTotals.maxMarks ? `${Math.round((marksTotals.marks / marksTotals.maxMarks) * 100)}%` : '—';
  const stats = data ? [
    { label: 'Enrolled courses', value: data.courses.length, icon: '📚', color: '#2563eb', note: 'In your branch' },
    { label: 'Attendance', value: attendanceRate == null ? '—' : `${attendanceRate}%`, icon: '✅', color: '#059669', note: `${attendanceTotal} marked classes` },
    { label: 'Upcoming assignments', value: dueAssignments.length, icon: '📝', color: '#d97706', note: 'Based on due dates' },
    { label: 'Marks average', value: gradeAverage, icon: '📊', color: '#7c3aed', note: marksTotals.maxMarks ? `${marksTotals.marks} / ${marksTotals.maxMarks} marks` : 'No marks recorded yet' },
  ] : [];

  return (
    <DashboardLayout role="student">
      <div className="live-page">
        <div className="live-page-header">
          <div><p className="live-eyebrow">STUDENT OVERVIEW {erpId ? `· ${erpId}` : ''}</p><h1 className="db-page-title">Welcome back, {name}</h1><p className="db-page-sub">Your latest academic information, loaded from your student records.</p></div>
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
            <div className="live-panel-heading"><div><h2>Course attendance</h2><p>Your recorded attendance by course</p></div><Link to="/student/attendance">Details <span aria-hidden="true">→</span></Link></div>
            {data?.attendance.length ? <div className="live-course-attendance">
              {data.attendance.map(item => <div className="live-course-row" key={item.course.id}><div className="live-course-title"><strong>{item.course.name}</strong><span>{item.course.code} · {item.present} of {item.total} attended</span></div><div className="live-course-bar-wrap"><div className="live-course-bar"><span style={{ width: `${item.percentage}%` }} /></div><small>{item.percentage}%</small></div></div>)}
            </div> : <div className="live-empty">{loading ? 'Loading attendance…' : 'No attendance records have been submitted yet.'}</div>}
          </section>
          <section className="live-panel">
            <div className="live-panel-heading"><div><h2>Upcoming assignments</h2><p>Current assignments ordered by due date</p></div><Link to="/student/assignments">All assignments <span aria-hidden="true">→</span></Link></div>
            {dueAssignments.length ? <div className="live-list">
              {dueAssignments.slice(0, 6).map(assignment => <div className="live-list-row" key={assignment._id}><span className="live-list-icon">📝</span><div><strong>{assignment.title}</strong><small>{assignment.course?.name || 'Course'} · Due {assignment.dueDate}</small></div></div>)}
            </div> : <div className="live-empty">{loading ? 'Loading assignments…' : 'No upcoming assignments.'}</div>}
          </section>
        </div>
        <div className="live-action-strip"><Link to="/student/courses">📚 My courses</Link><Link to="/student/timetable">🗓️ View timetable</Link><Link to="/student/marks">📊 View marks</Link></div>
      </div>
    </DashboardLayout>
  );
};

export default StudentDashboard;

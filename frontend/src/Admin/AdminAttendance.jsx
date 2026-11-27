import { useCallback } from 'react';
import DashboardLayout from '../components/DashboardLayout';
import { api } from '../utils/api';
import useLiveResource from '../hooks/useLiveResource';
import '../Dashboard/live-dashboard.css';

const AdminAttendance = () => {
  const load = useCallback(async () => (await api('/api/admin/dashboard')).data, []);
  const { data, loading, error, lastUpdated, refresh } = useLiveResource(load);
  const courses = data?.attendanceByCourse || [];
  const recordedCourses = courses.filter(course => course.total > 0);

  return (
    <DashboardLayout role="admin">
      <div className="live-page">
        <div className="live-page-header">
          <div>
            <p className="live-eyebrow">ACADEMIC PERFORMANCE</p>
            <h1 className="db-page-title">Attendance reports</h1>
            <p className="db-page-sub">Live attendance records for the most recent 30 days, grouped by course.</p>
          </div>
          <div className="live-refresh-wrap">
            <span className="live-updated"><span className={`live-indicator ${error ? 'is-warning' : ''}`} />{lastUpdated ? `Updated ${lastUpdated.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}` : 'Connecting to live data'}</span>
            <button className="live-refresh-button" type="button" onClick={refresh} disabled={loading}>↻ Refresh</button>
          </div>
        </div>
        {error && <div className="live-alert" role="alert">{data ? `Refresh failed: ${error}. Showing the last loaded data.` : error}</div>}
        <div className="live-stats-grid live-report-stats">
          <div className="live-stat-card"><span className="live-stat-icon" style={{ color: '#2563eb', background: '#2563eb14' }}>📚</span><strong className="live-stat-value">{data?.stats.courses ?? '—'}</strong><span className="live-stat-label">Courses tracked</span></div>
          <div className="live-stat-card"><span className="live-stat-icon" style={{ color: '#059669', background: '#05966914' }}>✅</span><strong className="live-stat-value">{data?.stats.attendanceRate == null ? '—' : `${data.stats.attendanceRate}%`}</strong><span className="live-stat-label">Overall · last 7 days</span></div>
          <div className="live-stat-card"><span className="live-stat-icon" style={{ color: '#d97706', background: '#d9770614' }}>📝</span><strong className="live-stat-value">{data?.stats.attendanceRecords?.toLocaleString() ?? '—'}</strong><span className="live-stat-label">Records · last 7 days</span></div>
          <div className="live-stat-card"><span className="live-stat-icon" style={{ color: '#dc2626', background: '#dc262614' }}>−</span><strong className="live-stat-value">{data?.stats.absentRecords?.toLocaleString() ?? '—'}</strong><span className="live-stat-label">Absent · last 7 days</span></div>
        </div>
        <section className="live-panel live-attendance-report">
          <div className="live-panel-heading"><div><h2>Course attendance</h2><p>Present and late records count as attended; courses without recorded attendance are shown as no data.</p></div></div>
          {loading && !data ? <div className="live-empty">Loading attendance data…</div> : recordedCourses.length ? (
            <div className="live-course-attendance">
              {recordedCourses.map(course => (
                <div className="live-course-row" key={course._id}>
                  <div className="live-course-title"><strong>{course.name}</strong><span>{course.code} · {course.department}</span></div>
                  <div className="live-course-bar-wrap"><div className="live-course-bar"><span style={{ width: `${course.attendanceRate}%` }} /></div><small>{course.attendanceRate}%</small></div>
                  <div className="live-course-counts"><span>{course.attended.toLocaleString()} attended</span><span>{course.absent.toLocaleString()} absent</span><span>{course.total.toLocaleString()} total records</span></div>
                </div>
              ))}
            </div>
          ) : <div className="live-empty">{data ? 'No attendance records were submitted in the last 30 days.' : 'No attendance data available.'}</div>}
        </section>
      </div>
    </DashboardLayout>
  );
};

export default AdminAttendance;

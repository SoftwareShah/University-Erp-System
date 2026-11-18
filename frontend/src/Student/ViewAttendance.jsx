import { useCallback } from 'react';
import DashboardLayout from '../components/DashboardLayout';
import { api } from '../utils/api';
import useLiveResource from '../hooks/useLiveResource';

const ViewAttendance = () => {
  const load = useCallback(async () => {
    const response = await api('/api/student/attendance');
    return response.data || [];
  }, []);
  const { data, loading, error, refresh } = useLiveResource(load);
  const courses = data || [];
  const total = courses.reduce((sum, course) => sum + course.total, 0);
  const present = courses.reduce((sum, course) => sum + course.present, 0);
  const presentOnly = courses.reduce((sum, course) => sum + (course.presentOnly ?? course.present - (course.late || 0)), 0);
  const absent = courses.reduce((sum, course) => sum + course.absent, 0);
  const score = Math.min(100, Math.max(0, Math.round((presentOnly - absent) * 0.2 * 10) / 10));
  const overallRate = total ? Math.round((present / total) * 1000) / 10 : 0;
  const belowThreshold = courses.filter(course => course.total && course.percentage < 75).length;

  return (
    <DashboardLayout role="student">
      <div className="db-page-header">
        <h1 className="db-page-title">My Attendance</h1>
        <p className="db-page-sub">Lecture-wise records and course attendance summary</p>
      </div>

      {error && <div className="live-alert" role="alert">{error}</div>}
      <div className="attendance-overview">
        <section className="db-card attendance-gauge-card" aria-label="Attendance score">
          <div
            className="attendance-gauge"
            role="img"
            aria-label={`Attendance score ${score.toFixed(1)} percent`}
            style={{ background: `conic-gradient(#2563eb ${score * 3.6}deg, #e2e8f0 ${score * 3.6}deg)` }}
          >
            <div className="attendance-gauge-center">
              <strong>{score.toFixed(1)}%</strong>
              <span>Attendance score</span>
            </div>
          </div>
          <div className="attendance-gauge-copy">
            <h2>Lecture score</h2>
            <p>Starts at 0%; each present lecture adds 0.2 points and each absent lecture subtracts 0.2 points. Late lectures do not change the score; the range is capped at 0–100%.</p>
          </div>
        </section>

        <div className="db-stats-grid attendance-summary">
          <div className="db-stat-card">
            <div><div className="db-stat-value">{loading && !data ? '—' : `${overallRate}%`}</div><div className="db-stat-label">Actual attendance ratio</div></div>
          </div>
          <div className="db-stat-card">
            <div><div className="db-stat-value">{loading && !data ? '—' : total}</div><div className="db-stat-label">Marked lectures</div></div>
          </div>
          <div className="db-stat-card">
            <div><div className="db-stat-value">{loading && !data ? '—' : belowThreshold}</div><div className="db-stat-label">Courses below 75%</div></div>
          </div>
        </div>
      </div>

      <div className="db-card">
        <div className="db-card-toolbar">
          <h2 className="db-card-title">Course breakdown</h2>
          <button className="db-btn db-btn-sm db-btn-outline" type="button" onClick={refresh} disabled={loading}>Refresh</button>
        </div>
        {loading && !data ? <p className="live-empty">Loading attendance records…</p> : courses.length ? (
          <div className="db-table-wrap">
            <table className="db-table">
              <thead>
                <tr><th>Course</th><th>Code</th><th>Marked lectures</th><th>Present / late</th><th>Absent</th><th>Actual ratio</th><th>Status</th></tr>
              </thead>
              <tbody>
                {courses.map(course => (
                  <tr key={course.course.id}>
                    <td><strong>{course.course.name}</strong></td>
                    <td><span className="db-code-badge">{course.course.code}</span></td>
                    <td>{course.total}</td>
                    <td>{course.present}</td>
                    <td>{course.absent}</td>
                    <td>
                      <div className="db-progress-wrap">
                        <div className="db-progress-bar" style={{
                          width: `${course.percentage}%`,
                          background: course.percentage >= 75 ? '#10b981' : '#ef4444',
                        }} />
                        <span>{course.percentage}%</span>
                      </div>
                    </td>
                    <td>
                      <span className={`db-status ${course.percentage >= 75 ? 'db-status-active' : 'db-status-blocked'}`}>
                        {course.total ? (course.percentage >= 75 ? 'Good' : 'Low') : 'No records'}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : <p className="live-empty">No attendance records have been submitted yet.</p>}
      </div>
    </DashboardLayout>
  );
};

export default ViewAttendance;

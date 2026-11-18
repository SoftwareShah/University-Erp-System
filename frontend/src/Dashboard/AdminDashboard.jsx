import { useCallback } from 'react';
import { Link } from 'react-router-dom';
import DashboardLayout from '../components/DashboardLayout';
import './live-dashboard.css';
import { api } from '../utils/api';
import useLiveResource from '../hooks/useLiveResource';

const quickLinks = [
  { label: 'Student Directory', icon: '🗂️', path: '/admin/student-directory' },
  { label: 'Manage Students', icon: '🎓', path: '/admin/students' },
  { label: 'Programs & Branches', icon: '🏛️', path: '/admin/programs' },
  { label: 'Manage Instructors', icon: '👨🏫', path: '/admin/instructors' },
  { label: 'Manage Courses', icon: '📚', path: '/admin/courses' },
  { label: 'Attendance Reports', icon: '✅', path: '/admin/attendance' },
];

const statCards = stats => [
  { label: 'Enrolled students', value: stats.totalStudents, note: `${stats.activeStudents} active`, icon: '🎓', color: '#2563eb' },
  { label: 'Instructors', value: stats.instructors, note: `${stats.activeInstructors} active`, icon: '👨🏫', color: '#059669' },
  { label: 'Courses', value: stats.courses, note: 'Current course records', icon: '📚', color: '#d97706' },
  { label: 'Attendance · 7 days', value: stats.attendanceRate == null ? '—' : `${stats.attendanceRate}%`, note: stats.attendanceRecords ? `${stats.attendanceRecords.toLocaleString()} marked records` : 'No attendance recorded', icon: '✅', color: '#7c3aed' },
];

const formatDate = value => new Date(`${value}T00:00:00`).toLocaleDateString(undefined, { weekday: 'short' });

const AdminDashboard = () => {
  const name = localStorage.getItem('name') || 'Administrator';
  const load = useCallback(async () => (await api('/api/admin/dashboard')).data, []);
  const { data, loading, error, lastUpdated, refresh } = useLiveResource(load);
  const stats = data?.stats;
  const cards = stats ? statCards(stats) : [];
  const maxBranchCount = Math.max(1, ...(data?.enrollmentByBranch || []).map(branch => branch.students));

  return (
    <DashboardLayout role="admin">
      <div className="live-page">
        <div className="live-page-header">
          <div>
            <p className="live-eyebrow">UNIVERSITY OVERVIEW</p>
            <h1 className="db-page-title">Welcome back, {name}</h1>
            <p className="db-page-sub">Live enrollment and academic activity across your university.</p>
          </div>
          <div className="live-refresh-wrap">
            <span className="live-updated">
              <span className={`live-indicator ${error ? 'is-warning' : ''}`} />
              {lastUpdated ? `Updated ${lastUpdated.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}` : 'Connecting to live data'}
            </span>
            <button className="live-refresh-button" type="button" onClick={refresh} disabled={loading} aria-label="Refresh dashboard data">
              <span className={loading ? 'live-spinning' : ''}>↻</span> Refresh
            </button>
          </div>
        </div>

        {error && <div className="live-alert" role="alert">{data ? `Refresh failed: ${error}. Showing the last loaded data.` : error}</div>}

        <div className="live-stats-grid">
          {loading && !stats
            ? Array.from({ length: 4 }, (_, index) => <div className="live-stat-card live-skeleton" key={index} />)
            : cards.map(card => (
              <div className="live-stat-card" key={card.label}>
                <div className="live-stat-top">
                  <span className="live-stat-icon" style={{ color: card.color, background: `${card.color}14` }}>{card.icon}</span>
                  <span className="live-stat-note">{card.note}</span>
                </div>
                <strong className="live-stat-value">{Number.isFinite(card.value) ? card.value.toLocaleString() : card.value}</strong>
                <span className="live-stat-label">{card.label}</span>
              </div>
            ))}
        </div>

        {stats && (
          <div className="live-supporting-stats">
            <span><strong>{stats.programs}</strong> academic programs</span>
            <span><strong>{stats.assignments}</strong> assignments</span>
            <span><strong>{stats.marks}</strong> mark records</span>
            <span><strong>{stats.newStudentsThisMonth}</strong> new enrollments this month</span>
          </div>
        )}

        <div className="live-dashboard-grid">
          <section className="live-panel">
            <div className="live-panel-heading">
              <div><h2>Enrollment by branch</h2><p>Current student records, grouped by branch</p></div>
              <Link to="/admin/student-directory">View students <span aria-hidden="true">→</span></Link>
            </div>
            {data?.enrollmentByBranch?.length ? (
              <div className="live-branch-list">
                {data.enrollmentByBranch.map(branch => (
                  <div className="live-branch-row" key={branch.branch}>
                    <div className="live-branch-label"><span>{branch.branch}</span><strong>{branch.students.toLocaleString()}</strong></div>
                    <div className="live-progress-track" role="img" aria-label={`${branch.students} students in ${branch.branch}`}>
                      <span style={{ width: `${Math.max(3, (branch.students / maxBranchCount) * 100)}%` }} />
                    </div>
                    <span className="live-branch-active">{branch.activeStudents} active</span>
                  </div>
                ))}
              </div>
            ) : loading ? <div className="live-empty">Loading branch enrollment…</div> : <div className="live-empty">No student enrollment data yet.</div>}
          </section>

          <section className="live-panel">
            <div className="live-panel-heading">
              <div><h2>Attendance trend</h2><p>Present and late records over the last 7 days</p></div>
              <Link to="/admin/attendance">View report <span aria-hidden="true">→</span></Link>
            </div>
            {data?.attendanceTrend && (
              <div className="live-trend">
                <div className="live-trend-chart" aria-label="Seven day attendance trend">
                  {data.attendanceTrend.map(day => {
                    const rate = day.total ? Math.round((day.attended / day.total) * 100) : 0;
                    return (
                      <div className="live-trend-column" key={day.date} title={`${day.date}: ${day.total ? `${rate}% attendance` : 'No records'}`}>
                        <div className="live-trend-bar"><span style={{ height: `${day.total ? Math.max(rate, 4) : 2}%` }} /></div>
                        <span className="live-trend-value">{day.total ? `${rate}%` : '—'}</span>
                        <span className="live-trend-day">{formatDate(day.date)}</span>
                      </div>
                    );
                  })}
                </div>
                <div className="live-trend-legend"><span /> Attended, including late arrivals <strong>{stats?.attendanceRate == null ? 'No records' : `${stats.attendanceRate}% overall`}</strong></div>
              </div>
            )}
          </section>

          <section className="live-panel live-enrollment-panel">
            <div className="live-panel-heading">
              <div><h2>Recent enrollments</h2><p>Latest student accounts added to the system</p></div>
              <Link to="/admin/students">Manage <span aria-hidden="true">→</span></Link>
            </div>
            {data?.recentEnrollments?.length ? (
              <div className="live-table-wrap">
                <table className="live-table">
                  <thead><tr><th>Student</th><th>ERP ID</th><th>Branch / program</th><th>Added</th></tr></thead>
                  <tbody>
                    {data.recentEnrollments.map(student => (
                      <tr key={student._id}>
                        <td><Link to={`/admin/students/${student._id}`}>{student.name}</Link></td>
                        <td>{student.erpId || '—'}</td>
                        <td>{student.program?.name || student.department || 'Unassigned'}</td>
                        <td>{student.admissionDate || new Date(student.createdAt).toLocaleDateString()}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : <div className="live-empty">{loading ? 'Loading recent enrollments…' : 'No student enrollments yet.'}</div>}
          </section>
        </div>

        <section className="live-quick-actions">
          <div className="live-panel-heading"><div><h2>Quick actions</h2><p>Go directly to common administration tasks</p></div></div>
          <div className="live-actions-grid">
            {quickLinks.map(item => <Link to={item.path} className="live-action-link" key={item.path}><span>{item.icon}</span>{item.label}<b aria-hidden="true">→</b></Link>)}
          </div>
        </section>
      </div>
    </DashboardLayout>
  );
};

export default AdminDashboard;

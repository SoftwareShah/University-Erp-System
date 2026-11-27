import { useCallback } from 'react';
import DashboardLayout from '../components/DashboardLayout';
import { api } from '../utils/api';
import useLiveResource from '../hooks/useLiveResource';

const ViewAssignments = () => {
  const load = useCallback(async () => {
    const response = await api('/api/student/assignments');
    return response.data || [];
  }, []);
  const { data, loading, error, refresh } = useLiveResource(load);
  const assignments = data || [];
  const today = new Date().toISOString().slice(0, 10);

  return (
    <DashboardLayout role="student">
      <div className="db-page-header">
        <h1 className="db-page-title">My Assignments</h1>
        <p className="db-page-sub">Assignments published for your courses</p>
      </div>
      {error && <div className="live-alert" role="alert">{error}</div>}
      <div className="db-card">
        <div className="db-card-toolbar">
          <h2 className="db-card-title">Course assignments</h2>
          <button className="db-btn db-btn-sm db-btn-outline" type="button" onClick={refresh} disabled={loading}>Refresh</button>
        </div>
        {loading && !data ? <p className="live-empty">Loading assignments…</p> : assignments.length ? (
          <div className="db-table-wrap">
            <table className="db-table">
              <thead><tr><th>Assignment</th><th>Course</th><th>Instructor</th><th>Due date</th><th>Status</th></tr></thead>
              <tbody>
                {assignments.map(assignment => {
                  const overdue = assignment.dueDate < today;
                  return (
                    <tr key={assignment._id}>
                      <td><strong>{assignment.title}</strong>{assignment.description && <div className="assignment-description">{assignment.description}</div>}</td>
                      <td>{assignment.course?.name || '—'}{assignment.course?.code ? ` (${assignment.course.code})` : ''}</td>
                      <td>{assignment.teacher?.name || '—'}</td>
                      <td>{assignment.dueDate}</td>
                      <td><span className={`db-status ${overdue ? 'db-status-blocked' : 'db-status-active'}`}>{overdue ? 'Past due' : 'Upcoming'}</span></td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        ) : <p className="live-empty">No assignments have been published for your courses.</p>}
      </div>
    </DashboardLayout>
  );
};

export default ViewAssignments;

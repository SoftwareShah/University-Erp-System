import { useCallback } from 'react';
import DashboardLayout from '../components/DashboardLayout';
import { api } from '../utils/api';
import useLiveResource from '../hooks/useLiveResource';

const ViewMarks = () => {
  const load = useCallback(async () => {
    const response = await api('/api/student/marks');
    return response.data || [];
  }, []);
  const { data, loading, error, refresh } = useLiveResource(load);
  const groups = data || [];

  return (
    <DashboardLayout role="student">
      <div className="db-page-header">
        <h1 className="db-page-title">My Marks</h1>
        <p className="db-page-sub">Course-wise marks and grades from your academic records</p>
      </div>
      {error && <div className="live-alert" role="alert">{error}</div>}
      <div className="db-card">
        <div className="db-card-toolbar">
          <h2 className="db-card-title">Assessment results</h2>
          <button className="db-btn db-btn-sm db-btn-outline" type="button" onClick={refresh} disabled={loading}>Refresh</button>
        </div>
        {loading && !data ? <p className="live-empty">Loading marks…</p> : groups.length ? (
          <div className="db-table-wrap">
            <table className="db-table">
              <thead><tr><th>Course</th><th>Code</th><th>Assessment</th><th>Marks</th><th>Grade</th></tr></thead>
              <tbody>
                {groups.flatMap(group => group.exams.map((exam, index) => (
                  <tr key={`${group.code}-${exam.examType}`}>
                    {index === 0 && <td rowSpan={group.exams.length}><strong>{group.course}</strong></td>}
                    {index === 0 && <td rowSpan={group.exams.length}><span className="db-code-badge">{group.code}</span></td>}
                    <td>{exam.examType}</td>
                    <td>{exam.marks} / {exam.maxMarks}</td>
                    <td><span className="db-grade-badge">{exam.grade}</span></td>
                  </tr>
                )))}
              </tbody>
            </table>
          </div>
        ) : <p className="live-empty">No marks have been recorded yet.</p>}
      </div>
    </DashboardLayout>
  );
};

export default ViewMarks;

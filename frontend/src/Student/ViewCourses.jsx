import { useCallback } from 'react';
import DashboardLayout from '../components/DashboardLayout';
import { api } from '../utils/api';
import useLiveResource from '../hooks/useLiveResource';

const ViewCourses = ({ role = 'student' }) => {
  const load = useCallback(async () => {
    const response = await api(`/api/${role === 'instructor' ? 'teacher' : 'student'}/courses`);
    return response.data || [];
  }, [role]);
  const { data, loading, error, refresh } = useLiveResource(load);
  const courses = data || [];

  return (
    <DashboardLayout role={role}>
      <div className="db-page-header">
        <h1 className="db-page-title">My Courses</h1>
        <p className="db-page-sub">{role === 'instructor' ? 'Courses assigned to you' : 'Courses available in your academic branch'}</p>
      </div>
      {error && <div className="live-alert" role="alert">{error}</div>}
      <div className="db-card">
        <div className="db-card-toolbar">
          <h2 className="db-card-title">Course records</h2>
          <button className="db-btn db-btn-sm db-btn-outline" type="button" onClick={refresh} disabled={loading}>Refresh</button>
        </div>
        {loading && !data ? <p className="live-empty">Loading courses…</p> : courses.length ? (
          <div className="db-table-wrap">
            <table className="db-table">
              <thead><tr><th>Course</th><th>Code</th><th>Department</th><th>Semester</th><th>Instructor</th></tr></thead>
              <tbody>
                {courses.map(course => (
                  <tr key={course._id}>
                    <td><strong>{course.name}</strong></td>
                    <td><span className="db-code-badge">{course.code}</span></td>
                    <td>{course.department}</td>
                    <td>{course.semester}</td>
                    <td>{course.teacher?.name || (role === 'instructor' ? 'Assigned to you' : 'Not assigned')}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : <p className="live-empty">No courses are currently available.</p>}
      </div>
    </DashboardLayout>
  );
};

export default ViewCourses;

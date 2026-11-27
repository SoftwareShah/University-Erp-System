import { useEffect, useState } from 'react';
import DashboardLayout from '../components/DashboardLayout';
import { api } from '../utils/api';

const todayKey = () => {
  const now = new Date();
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;
};

const MarkAttendance = () => {
  const [courses, setCourses] = useState([]);
  const [students, setStudents] = useState([]);
  const [records, setRecords] = useState({});
  const [courseId, setCourseId] = useState('');
  const [date, setDate] = useState(todayKey);
  const [period, setPeriod] = useState('1');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  useEffect(() => {
    let active = true;
    api('/api/teacher/courses')
      .then(response => {
        if (!active) return;
        const courseList = response.data || [];
        setCourses(courseList);
        setCourseId(courseList[0]?._id || '');
        if (!courseList.length) setLoading(false);
      })
      .catch(requestError => {
        if (!active) return;
        setError(requestError.message);
        setLoading(false);
      });
    return () => { active = false; };
  }, []);

  useEffect(() => {
    if (!courseId) return undefined;
    let active = true;
    Promise.all([
      api(`/api/teacher/courses/${courseId}/students`),
      api(`/api/teacher/attendance/${courseId}`),
    ]).then(([studentResponse, attendanceResponse]) => {
      if (!active) return;
      const studentList = studentResponse.data || [];
      const previous = (attendanceResponse.data || []).find(entry => entry.date === date && entry.period === Number(period));
      const previousStatuses = Object.fromEntries((previous?.records || []).map(record => [
        record.student?._id || record.student,
        record.status,
      ]));
      setStudents(studentList);
      setRecords(previousStatuses);
    }).catch(requestError => {
      if (active) setError(requestError.message);
    }).finally(() => {
      if (active) setLoading(false);
    });
    return () => { active = false; };
  }, [courseId, date, period]);

  const setAll = status => setRecords(Object.fromEntries(students.map(student => [student._id, status])));
  const presentCount = Object.values(records).filter(status => status === 'present' || status === 'late').length;
  const complete = students.length > 0 && students.every(student => records[student._id]);

  const submit = async event => {
    event.preventDefault();
    setError('');
    setSuccess('');
    if (!complete) {
      setError('Select a status for every student before submitting attendance.');
      return;
    }
    setSaving(true);
    try {
      await api('/api/teacher/attendance', {
        method: 'POST',
        body: JSON.stringify({
          courseId,
          date,
          period: Number(period),
          records: students.map(student => ({ studentId: student._id, status: records[student._id] })),
        }),
      });
      setSuccess('Attendance saved.');
    } catch (requestError) {
      setError(requestError.message);
    } finally {
      setSaving(false);
    }
  };

  return (
    <DashboardLayout role="instructor">
      <div className="db-page-header">
        <h1 className="db-page-title">Mark Attendance</h1>
        <p className="db-page-sub">Record or update attendance for a course lecture</p>
      </div>
      {error && <div className="live-alert" role="alert">{error}</div>}
      {success && <div className="live-alert live-success" role="status">{success}</div>}
      <form onSubmit={submit}>
        <div className="db-card mb-4">
          <div className="db-form-grid">
            <div className="db-form-group">
              <label htmlFor="attendance-course">Course</label>
              <select id="attendance-course" className="db-input" value={courseId} onChange={event => { setCourseId(event.target.value); setStudents([]); setRecords({}); setLoading(Boolean(event.target.value)); setError(''); }} required>
                <option value="">Select a course</option>
                {courses.map(course => <option key={course._id} value={course._id}>{course.name} — {course.code}</option>)}
              </select>
            </div>
            <div className="db-form-group">
              <label htmlFor="attendance-date">Date</label>
              <input id="attendance-date" type="date" className="db-input" value={date} onChange={event => { setDate(event.target.value); setLoading(Boolean(courseId)); setError(''); }} required />
            </div>
            <div className="db-form-group">
              <label htmlFor="attendance-period">Lecture period</label>
              <select id="attendance-period" className="db-input" value={period} onChange={event => { setPeriod(event.target.value); setLoading(Boolean(courseId)); setError(''); }}>
                {Array.from({ length: 8 }, (_, index) => <option key={index + 1} value={index + 1}>Period {index + 1}</option>)}
              </select>
            </div>
          </div>
        </div>

        <div className="db-card">
          <div className="db-card-toolbar">
            <h2 className="db-card-title">Students — {presentCount}/{students.length} present or late</h2>
            <div className="d-flex gap-2">
              <button className="db-btn db-btn-sm db-btn-success" type="button" onClick={() => setAll('present')} disabled={!students.length}>All Present</button>
              <button className="db-btn db-btn-sm db-btn-danger" type="button" onClick={() => setAll('absent')} disabled={!students.length}>All Absent</button>
            </div>
          </div>
          {loading ? <p className="live-empty">Loading course and attendance records…</p> : !courseId ? <p className="live-empty">No courses are assigned to your account.</p> : students.length ? (
            <>
              <div className="db-table-wrap">
                <table className="db-table">
                  <thead><tr><th>#</th><th>Name</th><th>ERP ID</th><th>Attendance status</th></tr></thead>
                  <tbody>
                    {students.map((student, index) => (
                      <tr key={student._id}>
                        <td>{index + 1}</td>
                        <td><strong>{student.name}</strong></td>
                        <td>{student.erpId}</td>
                        <td>
                          <select
                            className="db-input"
                            aria-label={`Attendance status for ${student.name}`}
                            value={records[student._id] || ''}
                            onChange={event => setRecords(current => ({ ...current, [student._id]: event.target.value }))}
                            required
                          >
                            <option value="" disabled>Select status</option>
                            <option value="present">Present</option>
                            <option value="absent">Absent</option>
                            <option value="late">Late</option>
                          </select>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              <div className="mt-3">
                <button className="db-btn db-btn-primary" type="submit" disabled={saving || loading || !complete}>
                  {saving ? 'Saving…' : 'Save Attendance'}
                </button>
              </div>
            </>
          ) : <p className="live-empty">No students are enrolled in this course branch.</p>}
        </div>
      </form>
    </DashboardLayout>
  );
};

export default MarkAttendance;

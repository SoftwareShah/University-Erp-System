import { useEffect, useState } from 'react';
import DashboardLayout from '../components/DashboardLayout';
import { api } from '../utils/api';

const blankForm = { studentId: '', examType: 'internal', marks: '', maxMarks: '100' };

const UploadMarks = () => {
  const [courses, setCourses] = useState([]);
  const [students, setStudents] = useState([]);
  const [marks, setMarks] = useState([]);
  const [courseId, setCourseId] = useState('');
  const [form, setForm] = useState(blankForm);
  const [editingId, setEditingId] = useState('');
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
      api(`/api/teacher/marks/${courseId}`),
    ]).then(([studentResponse, marksResponse]) => {
      if (!active) return;
      setStudents(studentResponse.data || []);
      setMarks(marksResponse.data || []);
    }).catch(requestError => {
      if (active) setError(requestError.message);
    }).finally(() => {
      if (active) setLoading(false);
    });
    return () => { active = false; };
  }, [courseId]);

  const refreshRecords = async () => {
    const [studentResponse, marksResponse] = await Promise.all([
      api(`/api/teacher/courses/${courseId}/students`),
      api(`/api/teacher/marks/${courseId}`),
    ]);
    setStudents(studentResponse.data || []);
    setMarks(marksResponse.data || []);
  };

  const updateField = event => setForm(current => ({ ...current, [event.target.name]: event.target.value }));

  const resetForm = () => {
    setEditingId('');
    setForm(blankForm);
  };

  const submit = async event => {
    event.preventDefault();
    setError('');
    setSuccess('');
    setSaving(true);
    try {
      await api('/api/teacher/marks', {
        method: 'POST',
        body: JSON.stringify({
          courseId,
          studentId: form.studentId,
          examType: form.examType,
          marks: Number(form.marks),
          maxMarks: Number(form.maxMarks),
        }),
      });
      await refreshRecords();
      setSuccess(editingId ? 'Marks updated.' : 'Marks saved.');
      resetForm();
    } catch (requestError) {
      setError(requestError.message);
    } finally {
      setSaving(false);
    }
  };

  const editRecord = record => {
    setEditingId(record._id);
    setForm({
      studentId: record.student?._id || '',
      examType: record.examType,
      marks: String(record.marks),
      maxMarks: String(record.maxMarks),
    });
    setError('');
    setSuccess('');
  };

  const deleteRecord = async record => {
    const studentName = record.student?.name || 'this student';
    if (!window.confirm(`Delete marks for ${studentName} (${record.examType})?`)) return;
    setError('');
    setSuccess('');
    try {
      await api(`/api/teacher/marks/${record._id}`, { method: 'DELETE' });
      await refreshRecords();
      if (editingId === record._id) resetForm();
      setSuccess('Marks record deleted.');
    } catch (requestError) {
      setError(requestError.message);
    }
  };

  return (
    <DashboardLayout role="instructor">
      <div className="db-page-header">
        <h1 className="db-page-title">Manage Marks</h1>
        <p className="db-page-sub">Create, update, and remove assessment marks for your students</p>
      </div>
      {error && <div className="live-alert" role="alert">{error}</div>}
      {success && <div className="live-alert live-success" role="status">{success}</div>}
      <div className="db-card mb-4">
        <div className="db-form-grid mb-4">
          <div className="db-form-group">
            <label htmlFor="marks-course">Course</label>
            <select id="marks-course" className="db-input" value={courseId} onChange={event => { setCourseId(event.target.value); setStudents([]); setMarks([]); resetForm(); setLoading(Boolean(event.target.value)); setError(''); }} required>
              <option value="">Select a course</option>
              {courses.map(course => <option key={course._id} value={course._id}>{course.name} — {course.code}</option>)}
            </select>
          </div>
        </div>
        <form onSubmit={submit}>
          <div className="db-form-grid mb-4">
            <div className="db-form-group">
              <label htmlFor="marks-student">Student</label>
              <select id="marks-student" name="studentId" className="db-input" value={form.studentId} onChange={updateField} required>
                <option value="">Select a student</option>
                {students.map(student => <option key={student._id} value={student._id}>{student.name} — {student.erpId}</option>)}
              </select>
            </div>
            <div className="db-form-group">
              <label htmlFor="marks-exam-type">Assessment type</label>
              <select id="marks-exam-type" name="examType" className="db-input" value={form.examType} onChange={updateField}>
                <option value="internal">Internal</option>
                <option value="midterm">Midterm</option>
                <option value="final">Final</option>
              </select>
            </div>
            <div className="db-form-group">
              <label htmlFor="marks-max">Maximum marks</label>
              <input id="marks-max" name="maxMarks" type="number" className="db-input" value={form.maxMarks} onChange={updateField} min="1" max="100" required />
            </div>
            <div className="db-form-group">
              <label htmlFor="marks-value">Marks obtained</label>
              <input id="marks-value" name="marks" type="number" className="db-input" value={form.marks} onChange={updateField} min="0" max={form.maxMarks || 100} required />
            </div>
          </div>
          <div className="d-flex gap-2">
            <button className="db-btn db-btn-primary" type="submit" disabled={saving || loading || !courseId || !students.length}>
              {saving ? 'Saving…' : editingId ? 'Update Marks' : 'Save Marks'}
            </button>
            {editingId && <button className="db-btn db-btn-outline" type="button" onClick={resetForm}>Cancel</button>}
          </div>
        </form>
        {!loading && !courses.length && <p className="live-empty">You need an assigned course before entering marks.</p>}
      </div>

      <div className="db-card">
        <h2 className="db-card-title">Recorded marks</h2>
        {loading ? <p className="live-empty">Loading course records…</p> : marks.length ? (
          <div className="db-table-wrap">
            <table className="db-table">
              <thead><tr><th>Student</th><th>ERP ID</th><th>Assessment</th><th>Marks</th><th>Actions</th></tr></thead>
              <tbody>
                {marks.map(record => (
                  <tr key={record._id}>
                    <td><strong>{record.student?.name || 'Student record unavailable'}</strong></td>
                    <td>{record.student?.erpId || '—'}</td>
                    <td>{record.examType}</td>
                    <td>{record.marks} / {record.maxMarks}</td>
                    <td className="db-actions-cell">
                      <button className="db-btn db-btn-sm db-btn-outline" type="button" onClick={() => editRecord(record)}>Edit</button>
                      <button className="db-btn db-btn-sm db-btn-danger" type="button" onClick={() => deleteRecord(record)}>Delete</button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : <p className="live-empty">No marks have been recorded for this course.</p>}
      </div>
    </DashboardLayout>
  );
};

export default UploadMarks;

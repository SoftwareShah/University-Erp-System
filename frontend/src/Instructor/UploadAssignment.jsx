import { useCallback, useEffect, useState } from 'react';
import DashboardLayout from '../components/DashboardLayout';
import { api } from '../utils/api';

const blankForm = { courseId: '', title: '', dueDate: '', description: '' };

const UploadAssignment = () => {
  const [courses, setCourses] = useState([]);
  const [assignments, setAssignments] = useState([]);
  const [form, setForm] = useState(blankForm);
  const [editingId, setEditingId] = useState('');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const loadAssignments = useCallback(async () => {
    const response = await api('/api/teacher/assignments');
    setAssignments(response.data || []);
  }, []);

  useEffect(() => {
    let active = true;
    Promise.all([api('/api/teacher/courses'), api('/api/teacher/assignments')])
      .then(([courseResponse, assignmentResponse]) => {
        if (!active) return;
        const courseList = courseResponse.data || [];
        setCourses(courseList);
        setForm(current => ({ ...current, courseId: courseList[0]?._id || '' }));
        setAssignments(assignmentResponse.data || []);
      })
      .catch(requestError => { if (active) setError(requestError.message); })
      .finally(() => { if (active) setLoading(false); });
    return () => { active = false; };
  }, []);

  const updateField = event => setForm(current => ({ ...current, [event.target.name]: event.target.value }));

  const resetForm = () => {
    setEditingId('');
    setForm({ ...blankForm, courseId: courses[0]?._id || '' });
  };

  const submit = async event => {
    event.preventDefault();
    setError('');
    setSuccess('');
    setSaving(true);
    try {
      await api(editingId ? `/api/teacher/assignments/${editingId}` : '/api/teacher/assignments', {
        method: editingId ? 'PUT' : 'POST',
        body: JSON.stringify({
          courseId: form.courseId,
          title: form.title.trim(),
          dueDate: form.dueDate,
          description: form.description.trim(),
        }),
      });
      await loadAssignments();
      setSuccess(editingId ? 'Assignment updated.' : 'Assignment published.');
      resetForm();
    } catch (requestError) {
      setError(requestError.message);
    } finally {
      setSaving(false);
    }
  };

  const editAssignment = assignment => {
    setEditingId(assignment._id);
    setForm({
      courseId: assignment.course?._id || '',
      title: assignment.title,
      dueDate: assignment.dueDate,
      description: assignment.description || '',
    });
    setError('');
    setSuccess('');
  };

  const deleteAssignment = async assignment => {
    if (!window.confirm(`Delete "${assignment.title}"?`)) return;
    setError('');
    setSuccess('');
    try {
      await api(`/api/teacher/assignments/${assignment._id}`, { method: 'DELETE' });
      await loadAssignments();
      if (editingId === assignment._id) resetForm();
      setSuccess('Assignment deleted.');
    } catch (requestError) {
      setError(requestError.message);
    }
  };

  return (
    <DashboardLayout role="instructor">
      <div className="db-page-header">
        <h1 className="db-page-title">Assignments</h1>
        <p className="db-page-sub">Publish and manage assignments for your assigned courses</p>
      </div>
      {error && <div className="live-alert" role="alert">{error}</div>}
      {success && <div className="live-alert live-success" role="status">{success}</div>}
      <form className="db-card mb-4" onSubmit={submit}>
        <h2 className="db-card-title">{editingId ? 'Edit assignment' : 'Publish assignment'}</h2>
        <div className="db-form-grid">
          <div className="db-form-group" style={{ gridColumn: '1 / -1' }}>
            <label htmlFor="assignment-title">Title</label>
            <input id="assignment-title" name="title" type="text" className="db-input" value={form.title} onChange={updateField} minLength={3} maxLength={100} required />
          </div>
          <div className="db-form-group">
            <label htmlFor="assignment-course">Course</label>
            <select id="assignment-course" name="courseId" className="db-input" value={form.courseId} onChange={updateField} required>
              <option value="">Select a course</option>
              {courses.map(course => <option key={course._id} value={course._id}>{course.name} — {course.code}</option>)}
            </select>
          </div>
          <div className="db-form-group">
            <label htmlFor="assignment-due-date">Due date</label>
            <input id="assignment-due-date" name="dueDate" type="date" className="db-input" value={form.dueDate} onChange={updateField} required />
          </div>
          <div className="db-form-group" style={{ gridColumn: '1 / -1' }}>
            <label htmlFor="assignment-description">Description</label>
            <textarea id="assignment-description" name="description" className="db-input" rows="3" value={form.description} onChange={updateField} maxLength={500} />
          </div>
        </div>
        <div className="d-flex gap-2 mt-3">
          <button className="db-btn db-btn-primary" type="submit" disabled={saving || !courses.length}>
            {saving ? 'Saving…' : editingId ? 'Save Changes' : 'Publish Assignment'}
          </button>
          {editingId && <button className="db-btn db-btn-outline" type="button" onClick={resetForm}>Cancel</button>}
        </div>
        {!loading && !courses.length && <p className="live-empty">You need an assigned course before publishing assignments.</p>}
      </form>

      <div className="db-card">
        <h2 className="db-card-title">My assignments</h2>
        {loading ? <p className="live-empty">Loading assignments…</p> : assignments.length ? (
          <div className="db-table-wrap">
            <table className="db-table">
              <thead><tr><th>Title</th><th>Course</th><th>Due date</th><th>Actions</th></tr></thead>
              <tbody>
                {assignments.map(assignment => (
                  <tr key={assignment._id}>
                    <td><strong>{assignment.title}</strong></td>
                    <td>{assignment.course?.name || '—'}{assignment.course?.code ? ` (${assignment.course.code})` : ''}</td>
                    <td>{assignment.dueDate}</td>
                    <td className="db-actions-cell">
                      <button className="db-btn db-btn-sm db-btn-outline" type="button" onClick={() => editAssignment(assignment)}>Edit</button>
                      <button className="db-btn db-btn-sm db-btn-danger" type="button" onClick={() => deleteAssignment(assignment)}>Delete</button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : <p className="live-empty">No assignments have been published yet.</p>}
      </div>
    </DashboardLayout>
  );
};

export default UploadAssignment;

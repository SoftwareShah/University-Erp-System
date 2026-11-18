import { useEffect, useMemo, useState } from 'react';
import DashboardLayout from '../components/DashboardLayout';
import { api } from '../utils/api';
import './ManageCourses.css';

const EMPTY_FORM = { name: '', code: '', department: '', semester: '1', teacherId: '' };

const CourseModal = ({ course, branches, instructors, onClose, onSaved }) => {
  const [form, setForm] = useState(course ? {
    name: course.name,
    code: course.code,
    department: course.department,
    semester: String(course.semester),
    teacherId: course.teacher?._id || '',
  } : { ...EMPTY_FORM, department: branches[0] || '' });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  const update = field => event => setForm(current => ({ ...current, [field]: event.target.value }));

  const handleSubmit = async event => {
    event.preventDefault();
    setSaving(true);
    setError('');
    try {
      const payload = { ...form, semester: Number(form.semester) };
      const result = await api(course ? `/api/admin/courses/${course._id}` : '/api/admin/courses', {
        method: course ? 'PUT' : 'POST',
        body: JSON.stringify(payload),
      });
      onSaved(result.data);
    } catch (requestError) {
      setError(requestError.message);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="course-modal-backdrop" role="presentation" onMouseDown={event => {
      if (event.target === event.currentTarget && !saving) onClose();
    }}>
      <section className="course-modal" role="dialog" aria-modal="true" aria-labelledby="course-modal-title">
        <header className="course-modal-header">
          <div>
            <span className="course-eyebrow">ACADEMIC SETUP</span>
            <h2 id="course-modal-title">{course ? 'Edit course' : 'Create a course'}</h2>
          </div>
          <button className="course-icon-button" type="button" aria-label="Close" onClick={onClose}>×</button>
        </header>
        {error && <div className="course-alert" role="alert">{error}</div>}
        <form onSubmit={handleSubmit} className="course-form">
          <label>
            <span>Course name</span>
            <input value={form.name} onChange={update('name')} minLength={2} maxLength={100} required />
          </label>
          <label>
            <span>Course code</span>
            <input value={form.code} onChange={update('code')} minLength={2} maxLength={20}
              pattern="[A-Za-z0-9-]{2,20}" title="Use 2–20 letters, numbers, or hyphens." required />
          </label>
          <label>
            <span>Branch</span>
            <select value={form.department} onChange={update('department')} required>
              <option value="" disabled>Select branch</option>
              {branches.map(branch => <option key={branch} value={branch}>{branch}</option>)}
            </select>
          </label>
          <label>
            <span>Semester</span>
            <select value={form.semester} onChange={update('semester')} required>
              {Array.from({ length: 8 }, (_, index) => index + 1).map(semester =>
                <option key={semester} value={semester}>Semester {semester}</option>
              )}
            </select>
          </label>
          <label className="course-form-full">
            <span>Instructor <small>(optional)</small></span>
            <select value={form.teacherId} onChange={update('teacherId')}>
              <option value="">Unassigned</option>
              {instructors.filter(instructor => instructor.isActive || course?.teacher?._id === instructor._id).map(instructor =>
                <option key={instructor._id} value={instructor._id}>
                  {instructor.name} · {instructor.empId}{instructor.isActive ? '' : ' (inactive)'}
                </option>
              )}
            </select>
          </label>
          <footer className="course-form-actions">
            <button type="button" className="course-secondary-button" onClick={onClose} disabled={saving}>Cancel</button>
            <button type="submit" className="course-primary-button" disabled={saving || !branches.length}>
              {saving ? 'Saving…' : course ? 'Save changes' : 'Create course'}
            </button>
          </footer>
        </form>
      </section>
    </div>
  );
};

const ManageCourses = () => {
  const [courses, setCourses] = useState([]);
  const [programs, setPrograms] = useState([]);
  const [instructors, setInstructors] = useState([]);
  const [query, setQuery] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');
  const [modalCourse, setModalCourse] = useState(null);
  const [modalOpen, setModalOpen] = useState(false);

  useEffect(() => {
    let active = true;
    Promise.all([
        api('/api/admin/courses'),
        api('/api/admin/programs'),
        api('/api/admin/instructors'),
    ]).then(([courseResult, programResult, instructorResult]) => {
      if (!active) return;
      setCourses(courseResult.data);
      setPrograms(programResult.data);
      setInstructors(instructorResult.data);
    }).catch(requestError => {
      if (active) setError(requestError.message);
    }).finally(() => {
      if (active) setLoading(false);
    });
    return () => { active = false; };
  }, []);

  const branches = useMemo(
    () => [...new Set(programs.map(program => program.branch))].sort((a, b) => a.localeCompare(b)),
    [programs]
  );
  const filteredCourses = useMemo(() => {
    const value = query.trim().toLowerCase();
    if (!value) return courses;
    return courses.filter(course =>
      [course.name, course.code, course.department, course.teacher?.name]
        .some(field => field?.toLowerCase().includes(value))
    );
  }, [courses, query]);

  const saveCourse = course => {
    setCourses(current => {
      const exists = current.some(item => item._id === course._id);
      return exists
        ? current.map(item => item._id === course._id ? course : item)
        : [...current, course].sort((a, b) => a.name.localeCompare(b.name));
    });
    setModalOpen(false);
    setModalCourse(null);
    setNotice('Course saved successfully.');
  };

  const deleteCourse = async course => {
    if (!window.confirm(`Delete ${course.name} (${course.code})? Courses with academic records cannot be deleted.`)) return;
    setError('');
    setNotice('');
    try {
      await api(`/api/admin/courses/${course._id}`, { method: 'DELETE' });
      setCourses(current => current.filter(item => item._id !== course._id));
      setNotice('Course deleted.');
    } catch (requestError) {
      setError(requestError.message);
    }
  };

  return (
    <DashboardLayout role="admin">
      <div className="course-admin-page">
        <header className="course-page-heading">
          <div>
            <span className="course-eyebrow">ACADEMIC MANAGEMENT</span>
            <h1>Manage courses</h1>
            <p>Create courses, assign branches and instructors, and maintain the course catalogue.</p>
          </div>
          <button className="course-primary-button" onClick={() => {
            setModalCourse(null);
            setModalOpen(true);
            setError('');
            setNotice('');
          }} disabled={!branches.length}>＋ Create course</button>
        </header>

        {error && <div className="course-alert" role="alert">{error}</div>}
        {notice && <div className="course-notice" role="status">{notice}</div>}
        {!branches.length && !loading && (
          <div className="course-alert" role="status">
            Add a branch in Programs &amp; Branches before creating courses.
          </div>
        )}

        <section className="course-list-panel">
          <div className="course-list-toolbar">
            <div>
              <h2>Course catalogue</h2>
              <p>{courses.length} course{courses.length === 1 ? '' : 's'} · {branches.length} branch{branches.length === 1 ? '' : 'es'}</p>
            </div>
            <label className="course-search">
              <span className="sr-only">Search courses</span>
              <input value={query} onChange={event => setQuery(event.target.value)} placeholder="Search name, code, branch…" />
            </label>
          </div>

          {loading ? (
            <div className="course-empty">Loading course catalogue…</div>
          ) : filteredCourses.length === 0 ? (
            <div className="course-empty">{courses.length ? 'No courses match your search.' : 'No courses yet. Create your first course to get started.'}</div>
          ) : (
            <div className="course-table-wrap">
              <table className="course-table">
                <thead>
                  <tr><th>Course</th><th>Branch</th><th>Semester</th><th>Instructor</th><th>Actions</th></tr>
                </thead>
                <tbody>
                  {filteredCourses.map(course => (
                    <tr key={course._id}>
                      <td><strong>{course.name}</strong><span className="course-code">{course.code}</span></td>
                      <td>{course.department}</td>
                      <td>Semester {course.semester}</td>
                      <td>{course.teacher?.name || <span className="course-unassigned">Unassigned</span>}</td>
                      <td className="course-actions">
                        <button type="button" className="course-secondary-button" onClick={() => {
                          setModalCourse(course);
                          setModalOpen(true);
                          setError('');
                          setNotice('');
                        }}>Edit</button>
                        <button type="button" className="course-delete-button" onClick={() => deleteCourse(course)}>Delete</button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </section>
      </div>
      {modalOpen && (
        <CourseModal
          course={modalCourse}
          branches={branches}
          instructors={instructors}
          onClose={() => { setModalOpen(false); setModalCourse(null); }}
          onSaved={saveCourse}
        />
      )}
    </DashboardLayout>
  );
};

export default ManageCourses;

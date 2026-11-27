import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import DashboardLayout from '../components/DashboardLayout';
import { API_BASE, api } from '../utils/api';
import ProfileAvatar from '../components/ProfileAvatar';
import './student-admin.css';

const BASE = API_BASE;

const StudentDirectory = () => {
  const [students, setStudents] = useState([]);
  const [search, setSearch] = useState('');
  const [selectedBranch, setSelectedBranch] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    api('/api/admin/students')
      .then(result => setStudents(result.data))
      .catch(requestError => setError(requestError.message))
      .finally(() => setLoading(false));
  }, []);

  const filteredStudents = useMemo(() => {
    const query = search.trim().toLowerCase();
    if (!query) return students;
    return students.filter(student =>
      [student.name, student.erpId, student.email, student.department, student.program?.name]
        .some(value => value?.toLowerCase().includes(query))
    );
  }, [students, search]);

  const branches = useMemo(() => {
    const grouped = new Map();
    filteredStudents.forEach(student => {
      const branch = student.program?.branch || student.department || 'Branch not assigned';
      if (!grouped.has(branch)) grouped.set(branch, []);
      grouped.get(branch).push(student);
    });
    return [...grouped.entries()].sort(([a], [b]) => a.localeCompare(b));
  }, [filteredStudents]);

  return (
    <DashboardLayout role="admin">
      <div className="student-admin-page">
        <header className="student-admin-heading">
          <div>
            <span className="student-admin-eyebrow">STUDENT RECORDS</span>
            <h1>Student directory</h1>
            <p>Browse students by branch, then open an individual academic profile.</p>
          </div>
          <div className="student-admin-heading-icon" aria-hidden="true">⌕</div>
        </header>

        <section className="directory-toolbar">
          <div>
            <strong>{students.length}</strong>
            <span> registered students</span>
          </div>
          <label className="directory-search">
            <span aria-hidden="true">⌕</span>
            <input value={search} onChange={event => { setSearch(event.target.value); setSelectedBranch(''); }}
              placeholder="Search name, ERP ID, program…" aria-label="Search students" />
          </label>
        </section>

        {error && <div className="student-admin-alert student-admin-alert-error" role="alert">{error}</div>}
        {loading ? (
          <div className="student-admin-panel student-admin-empty">Loading student records…</div>
        ) : branches.length === 0 ? (
          <div className="student-admin-panel student-admin-empty">
            {search ? 'No students match your search.' : 'No student records have been added yet.'}
          </div>
        ) : (
          <div className="branch-directory">
            {branches.map(([branch, branchStudents]) => {
              const expanded = selectedBranch === branch;
              return (
                <section className={`branch-card${expanded ? ' branch-card-expanded' : ''}`} key={branch}>
                  <button className="branch-card-header" type="button"
                    onClick={() => setSelectedBranch(expanded ? '' : branch)}
                    aria-expanded={expanded}>
                    <span className="branch-card-symbol" aria-hidden="true">⌂</span>
                    <span className="branch-card-title">
                      <strong>{branch}</strong>
                      <small>{branchStudents.length} student{branchStudents.length === 1 ? '' : 's'}</small>
                    </span>
                    <span className="branch-card-chevron" aria-hidden="true">{expanded ? '−' : '+'}</span>
                  </button>
                  {expanded && (
                    <div className="branch-student-list">
                      {branchStudents.map(student => (
                        <Link className="branch-student-row" to={`/admin/students/${student._id}`} key={student._id}>
                          <ProfileAvatar src={student.avatar ? `${BASE}${student.avatar}` : ''} name={student.name} size={38} />
                          <span className="branch-student-copy">
                            <strong>{student.name}</strong>
                            <small>{student.program?.name || 'Program not recorded'} · {student.erpId || 'No ERP ID'}</small>
                          </span>
                          <span className="branch-student-open">View profile →</span>
                        </Link>
                      ))}
                    </div>
                  )}
                </section>
              );
            })}
          </div>
        )}
      </div>
    </DashboardLayout>
  );
};

export default StudentDirectory;

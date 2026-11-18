import { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import DashboardLayout from '../components/DashboardLayout';
import { API_BASE, api } from '../utils/api';
import ProfileAvatar from '../components/ProfileAvatar';
import './student-admin.css';

const BASE = API_BASE;

const formatDate = value => {
  if (!value) return 'Not provided';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return 'Not provided';
  return date.toLocaleDateString('en-IN', { day: '2-digit', month: 'long', year: 'numeric' });
};

const valueAt = (source, key) => key.split('.').reduce((value, part) => value?.[part], source);
const details = [
  ['Student Profile', [['Semester', 'semester'], ['Admission No. (ERP ID)', 'erpId'], ['Program', 'program.name']]],
  ['Personal Details', [['Admission No. (ERP ID)', 'erpId'], ['Registration No.', 'registrationNo'], ['Gender', 'gender'], ['Blood Group', 'bloodGroup'], ['Date of Birth', 'dob']]],
  ['Official Details', [['College', 'college'], ['Session', 'session'], ['Program', 'program.name'], ['Current Semester', 'semester'], ['Roll No.', 'rollNo'], ['Quota', 'quota'], ['Section', 'section'], ['Lateral Entry', 'lateralEntry'], ['Admission Date', 'admissionDate'], ['Status', 'status'], ['Fee Category', 'feeCategory']]],
  ['Communication Details', [['Email', 'email'], ['Mobile Number', 'mobile'], ['Address', 'address']]],
  ['Father Details', [['Name', 'fatherName'], ['Mobile Number', 'fatherMobile'], ['Email', 'fatherEmail']]],
  ['Mother Details', [['Name', 'motherName'], ['Mobile Number', 'motherMobile'], ['Email', 'motherEmail']]],
];

const formatValue = (student, key) => {
  const value = valueAt(student, key);
  if (value === undefined || value === null || value === '') return 'Not provided';
  if (key === 'dob' || key === 'admissionDate') return formatDate(value);
  if (key === 'lateralEntry') return value ? 'Yes' : 'No';
  return String(value);
};

const StudentDetails = () => {
  const { id } = useParams();
  const [student, setStudent] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    let active = true;
    api(`/api/admin/students/${id}`)
      .then(result => { if (active) setStudent(result.data); })
      .catch(requestError => { if (active) setError(requestError.message); })
      .finally(() => { if (active) setLoading(false); });
    return () => { active = false; };
  }, [id]);

  return (
    <DashboardLayout role="admin">
      <div className="student-admin-page student-profile-page">
        <Link className="student-profile-back" to="/admin/student-directory">← Back to student directory</Link>

        {loading ? (
          <section className="student-admin-panel student-admin-empty">Loading student profile…</section>
        ) : error ? (
          <div className="student-admin-alert student-admin-alert-error" role="alert">{error}</div>
        ) : student && (
          <>
            <section className="student-profile-hero">
              <div className="student-profile-avatar-wrap">
                <ProfileAvatar src={student.avatar ? `${BASE}${student.avatar}` : ''} name={student.name} size={104} />
              </div>
              <div className="student-profile-identity">
                <span className="student-admin-eyebrow">STUDENT PROFILE</span>
                <h1>{student.name}</h1>
                <p>{student.program?.name || 'Academic program not recorded'} · {student.program?.branch || student.department || 'Branch not assigned'}</p>
                <span className={`student-profile-status${student.isActive ? ' is-active' : ''}`}>
                  <i /> {student.isActive ? 'Active student' : 'Account disabled'}
                </span>
              </div>
              <div className="student-profile-erp">
                <span>ERP ID</span>
                <strong>{student.erpId || '—'}</strong>
              </div>
            </section>

            <section className="student-profile-summary">
              <article><span>Course / program</span><strong>{student.program?.name || 'Not recorded'}</strong></article>
              <article><span>Branch</span><strong>{student.program?.branch || student.department || 'Not assigned'}</strong></article>
              <article><span>Admission date</span><strong>{formatDate(student.admissionDate || student.createdAt)}</strong></article>
            </section>

            <div className="student-profile-sections">
              {details.map(([title, fields]) => (
                <section className="student-admin-panel student-profile-info" key={title}>
                  <div className="student-admin-panel-heading"><div><h2>{title}</h2></div></div>
                  <dl className="student-profile-grid">
                    {fields.map(([label, key]) => (
                      <div key={key}><dt>{label}</dt><dd>{formatValue(student, key)}</dd></div>
                    ))}
                    {title === 'Student Profile' && <div><dt>Branch</dt><dd>{student.program?.branch || student.department || 'Not assigned'}</dd></div>}
                  </dl>
                </section>
              ))}
            </div>

            <div className="student-profile-actions">
              <Link to="/admin/students">Edit student profile in Student Management</Link>
            </div>
          </>
        )}
      </div>
    </DashboardLayout>
  );
};

export default StudentDetails;

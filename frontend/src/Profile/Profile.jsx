import { useEffect, useState } from 'react';
import DashboardLayout from '../components/DashboardLayout';
import { API_BASE, api } from '../utils/api';

const apiPathByRole = {
  admin: '/api/admin',
  instructor: '/api/teacher',
  student: '/api/student',
};

const profileSections = [
  {
    title: 'Student Profile',
    fields: [
      ['Semester', 'semester'],
      ['Admission No. (ERP ID)', 'erpId'],
      ['Program', 'program.name'],
    ],
  },
  {
    title: 'Personal Details',
    fields: [
      ['Admission No. (ERP ID)', 'erpId'],
      ['Registration No.', 'registrationNo'],
      ['Gender', 'gender'],
      ['Blood Group', 'bloodGroup'],
      ['Date of Birth', 'dob'],
    ],
  },
  {
    title: 'Official Details',
    fields: [
      ['College', 'college'],
      ['Session', 'session'],
      ['Program', 'program.name'],
      ['Current Semester', 'semester'],
      ['Roll No.', 'rollNo'],
      ['Quota', 'quota'],
      ['Section', 'section'],
      ['Lateral Entry', 'lateralEntry'],
      ['Admission Date', 'admissionDate'],
      ['Status', 'status'],
      ['Fee Category', 'feeCategory'],
    ],
  },
  {
    title: 'Communication Details',
    fields: [
      ['Email', 'email'],
      ['Mobile Number', 'mobile'],
      ['Address', 'address'],
    ],
  },
  {
    title: 'Father Details',
    fields: [
      ['Name', 'fatherName'],
      ['Mobile Number', 'fatherMobile'],
      ['Email', 'fatherEmail'],
    ],
  },
  {
    title: 'Mother Details',
    fields: [
      ['Name', 'motherName'],
      ['Mobile Number', 'motherMobile'],
      ['Email', 'motherEmail'],
    ],
  },
];

const readField = (source, path) => path.split('.').reduce((value, key) => value?.[key], source);
const displayValue = (value, path) => {
  if (value === undefined || value === null || value === '') return 'Not provided';
  if (path === 'lateralEntry') return value ? 'Yes' : 'No';
  return String(value);
};

const Profile = ({ role }) => {
  const apiPath = apiPathByRole[role];
  const [profile, setProfile] = useState(null);
  const [form, setForm] = useState({ name: '', mobile: '', department: '', bio: '', address: '' });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [avatarFailed, setAvatarFailed] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  useEffect(() => {
    let active = true;
    api(`${apiPath}/profile`)
      .then(response => {
        if (!active) return;
        const data = response.data;
        setProfile(data);
        setForm({
          name: data.name || '',
          mobile: data.mobile || '',
          department: data.department || '',
          bio: data.bio || '',
          address: data.address || '',
        });
      })
      .catch(requestError => { if (active) setError(requestError.message); })
      .finally(() => { if (active) setLoading(false); });
    return () => { active = false; };
  }, [apiPath]);

  const updateField = event => setForm(current => ({ ...current, [event.target.name]: event.target.value }));

  const saveProfile = async event => {
    event.preventDefault();
    setError('');
    setSuccess('');
    setSaving(true);
    try {
      const payload = { ...form };
      if (role === 'student' || !payload.department.trim()) delete payload.department;
      if (!payload.mobile.trim()) delete payload.mobile;
      const response = await api(`${apiPath}/profile`, {
        method: 'PUT',
        body: JSON.stringify(payload),
      });
      setProfile(response.data);
      setForm(current => ({ ...current, name: response.data.name }));
      localStorage.setItem('name', response.data.name);
      setSuccess('Profile updated.');
    } catch (requestError) {
      setError(requestError.message);
    } finally {
      setSaving(false);
    }
  };

  const uploadAvatar = async event => {
    const file = event.target.files?.[0];
    event.target.value = '';
    if (!file) return;
    setError('');
    setSuccess('');
    const body = new FormData();
    body.append('avatar', file);
    try {
      const response = await api(`${apiPath}/profile/avatar`, { method: 'POST', body });
      const avatar = response.avatar;
      setProfile(current => ({ ...current, avatar }));
      setAvatarFailed(false);
      localStorage.setItem('avatar', avatar);
      setSuccess('Profile photo updated.');
    } catch (requestError) {
      setError(requestError.message);
    }
  };

  const deleteAvatar = async () => {
    setError('');
    setSuccess('');
    try {
      await api(`${apiPath}/profile/avatar`, { method: 'DELETE' });
      setProfile(current => ({ ...current, avatar: null }));
      setAvatarFailed(false);
      localStorage.removeItem('avatar');
      setSuccess('Profile photo removed.');
    } catch (requestError) {
      setError(requestError.message);
    }
  };

  const avatarUrl = profile?.avatar && !avatarFailed
    ? (profile.avatar.startsWith('http') ? profile.avatar : `${API_BASE}${profile.avatar}`)
    : '';

  return (
    <DashboardLayout role={role}>
      <div className="db-page-header">
        <h1 className="db-page-title">My Profile</h1>
        <p className="db-page-sub">{role === 'student' ? 'Official student record. Profile changes are managed by an administrator.' : 'Manage your contact details and profile photo'}</p>
      </div>
      {error && <div className="live-alert" role="alert">{error}</div>}
      {success && <div className="live-alert live-success" role="status">{success}</div>}
      {loading ? <div className="db-card"><p className="live-empty">Loading profile…</p></div> : profile && (
        <div className="profile-grid">
          <section className="db-card profile-photo-card">
            {avatarUrl
              ? <img className="profile-photo" src={avatarUrl} alt={`${profile.name}'s profile`} onError={() => setAvatarFailed(true)} />
              : <div className="profile-photo profile-initials" aria-label={`No profile photo for ${profile.name}`}>{profile.name?.slice(0, 1).toUpperCase()}</div>}
            <h2>{profile.name}</h2>
            <p>{profile.role === 'teacher' ? 'Instructor' : profile.role}</p>
            {role !== 'student' && <>
              <label className="db-btn db-btn-primary profile-upload-button">
                Upload photo
                <input type="file" accept="image/jpeg,image/png,image/webp,image/gif" onChange={uploadAvatar} hidden />
              </label>
              {profile.avatar && <button className="db-btn db-btn-outline" type="button" onClick={deleteAvatar}>Remove photo</button>}
            </>}
          </section>

          {role === 'student' ? (
            <div className="student-profile-sections">
              {profileSections.map(section => (
                <section className="db-card student-profile-section" key={section.title}>
                  <h2 className="db-card-title">{section.title}</h2>
                  <dl className="student-profile-grid">
                    {section.fields.map(([label, field]) => (
                      <div key={field}>
                        <dt>{label}</dt>
                        <dd>{displayValue(readField(profile, field), field)}</dd>
                      </div>
                    ))}
                  </dl>
                </section>
              ))}
            </div>
          ) : (
            <form className="db-card profile-form" onSubmit={saveProfile}>
              <h2 className="db-card-title">Personal details</h2>
              <div className="db-form-grid">
                <div className="db-form-group">
                  <label htmlFor="profile-name">Name</label>
                  <input id="profile-name" name="name" type="text" className="db-input" value={form.name} onChange={updateField} minLength={3} maxLength={60} required />
                </div>
                <div className="db-form-group">
                  <label htmlFor="profile-email">Email</label>
                  <input id="profile-email" type="email" className="db-input" value={profile.email || ''} readOnly />
                </div>
                <div className="db-form-group">
                  <label htmlFor="profile-mobile">Mobile</label>
                  <input id="profile-mobile" name="mobile" type="tel" className="db-input" value={form.mobile} onChange={updateField} pattern="[0-9]{10}" maxLength={10} />
                </div>
                <div className="db-form-group">
                  <label htmlFor="profile-department">Department</label>
                  <input id="profile-department" name="department" type="text" className="db-input" value={form.department} onChange={updateField} maxLength={100} />
                </div>
                <div className="db-form-group profile-full-width">
                  <label htmlFor="profile-bio">Bio</label>
                  <textarea id="profile-bio" name="bio" className="db-input" rows="3" value={form.bio} onChange={updateField} maxLength={300} />
                </div>
                <div className="db-form-group profile-full-width">
                  <label htmlFor="profile-address">Address</label>
                  <textarea id="profile-address" name="address" className="db-input" rows="3" value={form.address} onChange={updateField} maxLength={200} />
                </div>
              </div>
              <button className="db-btn db-btn-primary mt-3" type="submit" disabled={saving}>
                {saving ? 'Saving…' : 'Save profile'}
              </button>
            </form>
          )}
        </div>
      )}
    </DashboardLayout>
  );
};

export default Profile;

import { useEffect, useState } from 'react';
import DashboardLayout from '../components/DashboardLayout';
import { api } from '../utils/api';
import './student-admin.css';

const ManagePrograms = () => {
  const [programs, setPrograms] = useState([]);
  const [name, setName] = useState('');
  const [branch, setBranch] = useState('');
  const [erpPrefix, setErpPrefix] = useState('');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  useEffect(() => {
    let active = true;
    api('/api/admin/programs')
      .then(result => {
        if (!active) return;
        setPrograms(result.data);
        setError('');
      })
      .catch(requestError => {
        if (active) setError(requestError.message);
      })
      .finally(() => {
        if (active) setLoading(false);
      });
    return () => { active = false; };
  }, []);

  const handleSubmit = async (event) => {
    event.preventDefault();
    setError('');
    setSuccess('');
    setSaving(true);
    try {
      const result = await api('/api/admin/programs', {
        method: 'POST',
        body: JSON.stringify({ name, branch, erpPrefix }),
      });
      setPrograms(current => [...current, result.data].sort((a, b) =>
        a.branch.localeCompare(b.branch) || a.name.localeCompare(b.name)
      ));
      setName('');
      setBranch('');
      setErpPrefix('');
      setSuccess('Academic program added. It is now available when registering students.');
    } catch (requestError) {
      setError(requestError.message);
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (program) => {
    if (!window.confirm(`Delete ${program.name} — ${program.branch}?`)) return;
    setError('');
    setSuccess('');
    try {
      await api(`/api/admin/programs/${program._id}`, { method: 'DELETE' });
      setPrograms(current => current.filter(item => item._id !== program._id));
      setSuccess('Academic program deleted.');
    } catch (requestError) {
      setError(requestError.message);
    }
  };

  return (
    <DashboardLayout role="admin">
      <div className="student-admin-page">
        <header className="student-admin-heading">
          <div>
            <span className="student-admin-eyebrow">ACADEMIC SETUP</span>
            <h1>Programs &amp; Branches</h1>
            <p>Add new courses and branches here. They become available in student registration.</p>
          </div>
          <div className="student-admin-heading-icon" aria-hidden="true">⌂</div>
        </header>

        {error && <div className="student-admin-alert student-admin-alert-error" role="alert">{error}</div>}
        {success && <div className="student-admin-alert student-admin-alert-success" role="status">{success}</div>}

        <section className="student-admin-panel program-create-panel">
          <div className="student-admin-panel-heading">
            <div>
              <h2>Add an academic program</h2>
              <p>For example, “B.Tech” in “Computer Science &amp; Engineering”.</p>
            </div>
            <span className="student-admin-panel-icon" aria-hidden="true">＋</span>
          </div>
          <form className="program-create-form" onSubmit={handleSubmit}>
            <label>
              <span>Course / program name</span>
              <input value={name} onChange={event => setName(event.target.value)} required minLength={2} maxLength={100} placeholder="e.g. B.Tech" />
            </label>
            <label>
              <span>Branch name</span>
              <input value={branch} onChange={event => setBranch(event.target.value)} required minLength={2} maxLength={100} placeholder="e.g. Computer Science & Engineering" />
            </label>
            <label>
              <span>ERP ID prefix</span>
              <input value={erpPrefix} onChange={event => setErpPrefix(event.target.value.toUpperCase().replace(/[^A-Z0-9]/g, '').slice(0, 10))}
                required minLength={2} maxLength={10} pattern="[A-Z0-9]{2,10}" placeholder="e.g. BTCSE" title="Use 2–10 letters or digits." />
            </label>
            <button type="submit" disabled={saving}>
              {saving ? 'Adding…' : 'Add program'}
            </button>
          </form>
        </section>

        <section className="student-admin-panel">
          <div className="student-admin-panel-heading">
            <div>
              <h2>Available programs</h2>
              <p>{programs.length} program{programs.length === 1 ? '' : 's'} across your branches</p>
            </div>
            <span className="program-count">{programs.length}</span>
          </div>

          {loading ? (
            <p className="student-admin-empty">Loading academic programs…</p>
          ) : programs.length === 0 ? (
            <div className="student-admin-empty">
              No programs have been added yet. Add a course and branch above before registering students.
            </div>
          ) : (
            <div className="program-list">
              {programs.map(program => (
                <article className="program-row" key={program._id}>
                  <div className="program-row-mark" aria-hidden="true">⌂</div>
                  <div className="program-row-copy">
                    <strong>{program.name}</strong>
                    <span>{program.branch}</span>
                  </div>
                  <span className="program-prefix">{program.erpPrefix}</span>
                  <button type="button" className="program-delete-button" onClick={() => handleDelete(program)}>
                    Remove
                  </button>
                </article>
              ))}
            </div>
          )}
        </section>
      </div>
    </DashboardLayout>
  );
};

export default ManagePrograms;

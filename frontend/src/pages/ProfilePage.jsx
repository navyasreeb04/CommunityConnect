import { useState } from 'react';
import { useAuth } from '../context/AuthContext';

function ProfilePage() {
  const { user, updateProfile } = useAuth();
  const [form, setForm] = useState({
    full_name: user?.full_name || '',
    email: user?.email || '',
    bio: user?.bio || '',
  });
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);

  const handleChange = (event) => {
    setForm((current) => ({ ...current, [event.target.name]: event.target.value }));
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setSaving(true);
    setError('');
    setMessage('');

    try {
      await updateProfile(form);
      setMessage('Profile details updated successfully.');
    } catch (requestError) {
      setError(requestError.response?.data?.detail || 'Unable to update your profile right now.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="page-stack">
      <section className="hero-card">
        <div>
          <p className="eyebrow">Profile settings</p>
          <h1>Manage your account details from one professional workspace.</h1>
          <p className="muted-text">
            Update your public name, contact email, and profile summary shown across the platform.
          </p>
        </div>
        <div className="hero-badge-grid">
          <div className="mini-badge">
            <div>
              <strong>Profile ID</strong>
              <p className="muted-text">CC-{user?.id}</p>
            </div>
          </div>
          <div className="mini-badge">
            <div>
              <strong>Role</strong>
              <p className="muted-text">{user?.role}</p>
            </div>
          </div>
        </div>
      </section>

      <section className="panel wide-panel">
        <form className="stack-form" onSubmit={handleSubmit}>
          <label>
            Full name
            <input name="full_name" value={form.full_name} onChange={handleChange} required />
          </label>
          <label>
            Email address
            <input name="email" type="email" value={form.email} onChange={handleChange} required />
          </label>
          <label>
            Profile summary
            <textarea name="bio" rows="5" value={form.bio} onChange={handleChange} />
          </label>
          {message ? <p className="success-text">{message}</p> : null}
          {error ? <p className="error-text">{error}</p> : null}
          <div className="button-row">
            <button type="submit" className="button primary-button" disabled={saving}>
              {saving ? 'Saving changes...' : 'Save profile'}
            </button>
          </div>
        </form>
      </section>
    </div>
  );
}

export default ProfilePage;

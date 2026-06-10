import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import AuthShowcase from '../components/AuthShowcase';
import { useAuth } from '../context/AuthContext';

function RegisterPage() {
  const { register } = useAuth();
  const navigate = useNavigate();
  const [role, setRole] = useState('user');
  const [form, setForm] = useState({
    full_name: '',
    email: '',
    password: '',
    bio: '',
    admin_passcode: '',
  });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleChange = (event) => {
    setForm((current) => ({ ...current, [event.target.name]: event.target.value }));
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setLoading(true);
    setError('');

    try {
      const user = await register({ ...form, role, admin_passcode: role === 'admin' ? form.admin_passcode : null });
      navigate(user.role === 'admin' ? '/admin' : '/dashboard', { replace: true });
    } catch (requestError) {
      setError(requestError.response?.data?.detail || 'Unable to create your account.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-shell">
      <AuthShowcase />

      <section className="auth-card">
        <p className="eyebrow">Account creation</p>
        <h2>Create a secure CommunityConnect account</h2>
        <p className="muted-text">User accounts are open. Admin accounts require the setup passcode.</p>

        <div className="role-switch">
          <button
            type="button"
            className={`role-switch-button ${role === 'user' ? 'active' : ''}`}
            onClick={() => setRole('user')}
          >
            User account
          </button>
          <button
            type="button"
            className={`role-switch-button ${role === 'admin' ? 'active' : ''}`}
            onClick={() => setRole('admin')}
          >
            Admin account
          </button>
        </div>

        <form className="stack-form" onSubmit={handleSubmit}>
          <label>
            Full name
            <input name="full_name" value={form.full_name} onChange={handleChange} required />
          </label>
          <label>
            Email
            <input name="email" type="email" value={form.email} onChange={handleChange} required />
          </label>
          <label>
            Password
            <input name="password" type="password" value={form.password} onChange={handleChange} required />
          </label>
          <label>
            Profile summary
            <textarea name="bio" value={form.bio} onChange={handleChange} rows="4" />
          </label>
          {role === 'admin' ? (
            <label>
              Admin passcode
              <input
                name="admin_passcode"
                type="password"
                value={form.admin_passcode}
                onChange={handleChange}
                required
              />
            </label>
          ) : null}
          {error ? <p className="error-text">{error}</p> : null}
          <button type="submit" className="button primary-button" disabled={loading}>
            {loading ? 'Creating account...' : role === 'admin' ? 'Create admin account' : 'Create user account'}
          </button>
        </form>

        <p className="muted-text">
          Already registered? <Link to="/login">Sign in</Link>
        </p>
      </section>
    </div>
  );
}

export default RegisterPage;

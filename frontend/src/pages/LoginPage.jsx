import { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import AuthShowcase from '../components/AuthShowcase';
import { useAuth } from '../context/AuthContext';

function LoginPage() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [role, setRole] = useState('user');
  const [form, setForm] = useState({ email: '', password: '' });
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
      const user = await login({ email: form.email, password: form.password, role });
      const destination = location.state?.from?.pathname || (user.role === 'admin' ? '/admin' : '/dashboard');
      navigate(destination, { replace: true });
    } catch (requestError) {
      setError(requestError.response?.data?.detail || 'Unable to sign in right now.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-shell">
      <AuthShowcase />

      <section className="auth-card">
        <p className="eyebrow">Secure access</p>
        <h2>Sign in to your workspace</h2>
        <p className="muted-text">Choose your account type before continuing.</p>

        <div className="role-switch">
          <button
            type="button"
            className={`role-switch-button ${role === 'user' ? 'active' : ''}`}
            onClick={() => setRole('user')}
          >
            User sign in
          </button>
          <button
            type="button"
            className={`role-switch-button ${role === 'admin' ? 'active' : ''}`}
            onClick={() => setRole('admin')}
          >
            Admin sign in
          </button>
        </div>

        <form className="stack-form" onSubmit={handleSubmit}>
          <label>
            Email
            <input name="email" type="email" value={form.email} onChange={handleChange} required />
          </label>
          <label>
            Password
            <input name="password" type="password" value={form.password} onChange={handleChange} required />
          </label>
          {error ? <p className="error-text">{error}</p> : null}
          <button type="submit" className="button primary-button" disabled={loading}>
            {loading ? 'Signing in...' : role === 'admin' ? 'Login as admin' : 'Login as user'}
          </button>
        </form>
        <p className="muted-text">
          Need a new account? <Link to="/register">Create one here</Link>
        </p>
      </section>
    </div>
  );
}

export default LoginPage;

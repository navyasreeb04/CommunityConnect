import { NavLink, Outlet, useNavigate } from 'react-router-dom';
import { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import NotificationBell from './NotificationBell';

const mainLinks = [
  { to: '/dashboard', label: 'Dashboard' },
  { to: '/communities', label: 'Communities' },
  { to: '/feed', label: 'Discussions' },
  { to: '/events', label: 'Events' },
  { to: '/feedback', label: 'Feedback' },
];

function Shell() {
  const { user, isAdmin, logout } = useAuth();
  const navigate = useNavigate();
  const [menuOpen, setMenuOpen] = useState(false);

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <div className="app-shell">
      <header className="navbar">
        <div className="brand-lockup">
          <div className="brand-mark">CC</div>
          <div>
            <p className="eyebrow">CommunityConnect</p>
            {/* <h1 className="brand-title">Technical communities, curated with focus.</h1> */}
          </div>
        </div>

        <nav className="navbar-links">
          {mainLinks.map((link) => (
            <NavLink
              key={link.to}
              to={link.to}
              className={({ isActive }) => `navbar-link ${isActive ? 'active' : ''}`}
            >
              {link.label}
            </NavLink>
          ))}
          {isAdmin ? (
            <NavLink to="/admin" className={({ isActive }) => `navbar-link admin-link ${isActive ? 'active' : ''}`}>
              Admin
            </NavLink>
          ) : null}
        </nav>

        <div className="topbar-actions">
          <NotificationBell user={user} />
          <div className="profile-menu">
            <button type="button" className="profile-trigger" onClick={() => setMenuOpen((current) => !current)}>
              <div className="avatar-circle">{user?.full_name?.slice(0, 1) || 'U'}</div>
              <div className="profile-trigger-copy">
                <strong>{user?.full_name && user?.full_name.length > 10 ? user?.full_name.slice(0, 10) + '...' : user?.full_name}</strong>
                <span>{user?.role}</span>
              </div>
            </button>

            {menuOpen ? (
              <div className="profile-dropdown">
                <div className="profile-summary">
                  <div className="avatar-circle large-avatar">{user?.full_name?.slice(0, 1) || 'U'}</div>
                  <div>
                    <strong>{user?.full_name && user?.full_name.length > 20 ? user?.full_name.slice(0, 15) + '...' : user?.full_name}</strong>
                    <p className="muted-text"> {user?.email.length > 20 ? user?.email.slice(0, 15) + '...' : user?.email}</p>
                    <p className="muted-text">Profile ID: CC-{user?.id}</p>
                  </div>
                </div>
                <div className="dropdown-actions">
                  <button type="button" className="dropdown-link" onClick={() => navigate('/profile')}>
                    Profile settings
                  </button>
                  {isAdmin ? (
                    <button type="button" className="dropdown-link" onClick={() => navigate('/admin')}>
                      Admin workspace
                    </button>
                  ) : null}
                  <button type="button" className="dropdown-link danger-link" onClick={handleLogout}>
                    Logout
                  </button>
                </div>
              </div>
            ) : null}
          </div>
        </div>
      </header>

      <main className="page-shell">
        <Outlet />
      </main>
    </div>
  );
}

export default Shell;

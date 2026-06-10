import { Navigate, Route, Routes } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import ProtectedRoute from './components/ProtectedRoute';
import Shell from './components/Shell';
import LoginPage from './pages/LoginPage';
import RegisterPage from './pages/RegisterPage';
import DashboardWorkspacePage from './pages/DashboardWorkspacePage';
import CommunitiesWorkspacePage from './pages/CommunitiesWorkspacePage';
import FeedWorkspacePage from './pages/FeedWorkspacePage';
import EventsWorkspacePage from './pages/EventsWorkspacePage';
import FeedbackWorkspacePage from './pages/FeedbackWorkspacePage';
import AdminWorkspacePage from './pages/AdminWorkspacePage';
import ProfilePage from './pages/ProfilePage';

function App() {
  return (
    <AuthProvider>
      <Routes>
        <Route path="/login" element={<LoginPage />} />
        <Route path="/register" element={<RegisterPage />} />

        <Route element={<ProtectedRoute />}>
          <Route element={<Shell />}>
            <Route path="/" element={<Navigate to="/dashboard" replace />} />
            <Route path="/dashboard" element={<DashboardWorkspacePage />} />
            <Route path="/communities" element={<CommunitiesWorkspacePage />} />
            <Route path="/feed" element={<FeedWorkspacePage />} />
            <Route path="/discussion" element={<FeedWorkspacePage />} />
            <Route path="/events" element={<EventsWorkspacePage />} />
            <Route path="/feedback" element={<FeedbackWorkspacePage />} />
            <Route path="/profile" element={<ProfilePage />} />
          </Route>
        </Route>

        <Route element={<ProtectedRoute adminOnly />}>
          <Route element={<Shell />}>
            <Route path="/admin" element={<AdminWorkspacePage />} />
          </Route>
        </Route>

        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </AuthProvider>
  );
}

export default App;

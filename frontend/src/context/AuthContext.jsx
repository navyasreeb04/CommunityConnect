import { createContext, useContext, useEffect, useState } from 'react';
import api from '../services/api';

const AuthContext = createContext(null);

function saveSession(accessToken, user) {
  localStorage.setItem('cc_token', accessToken);
  localStorage.setItem('cc_user', JSON.stringify(user));
}

function clearSession() {
  localStorage.removeItem('cc_token');
  localStorage.removeItem('cc_user');
}

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    const storedUser = localStorage.getItem('cc_user');
    if (storedUser) {
      setUser(JSON.parse(storedUser));
    }
    setReady(true);
  }, []);

  const login = async ({ email, password, role }) => {
    const { data } = await api.post('/auth/login', { email, password, role });
    saveSession(data.access_token, data.user);
    setUser(data.user);
    return data.user;
  };

  const register = async (payload) => {
    const { data } = await api.post('/auth/register', payload);
    saveSession(data.access_token, data.user);
    setUser(data.user);
    return data.user;
  };

  const updateProfile = async (payload) => {
    const { data } = await api.put('/auth/me', payload);
    localStorage.setItem('cc_user', JSON.stringify(data));
    setUser(data);
    return data;
  };

  const logout = () => {
    clearSession();
    setUser(null);
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        ready,
        isAdmin: user?.role === 'admin',
        login,
        register,
        updateProfile,
        logout,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}

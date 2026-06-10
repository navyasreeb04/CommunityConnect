import { useEffect, useMemo, useState } from 'react';
import api from '../services/api';

function buildWebSocketUrl(userId) {
  const apiBase = import.meta.env.VITE_API_URL || 'http://127.0.0.1:8000/api';
  const baseUrl = new URL(apiBase);
  baseUrl.protocol = baseUrl.protocol === 'https:' ? 'wss:' : 'ws:';
  baseUrl.pathname = `/ws/notifications/${userId}`;
  return baseUrl.toString();
}

export function useNotifications(user) {
  const [notifications, setNotifications] = useState([]);

  const unreadCount = useMemo(
    () => notifications.filter((notification) => !notification.is_read).length,
    [notifications],
  );

  useEffect(() => {
    if (!user?.id) {
      return;
    }

    const loadNotifications = async () => {
      const { data } = await api.get('/notifications');
      setNotifications(data);
    };

    loadNotifications();
  }, [user?.id]);

  useEffect(() => {
    if (!user?.id) {
      return;
    }

    const socket = new WebSocket(buildWebSocketUrl(user.id));

    socket.onopen = () => {
      // WebSocket communication: send a small keepalive so the backend receive loop stays open.
      socket.send('connected');
    };

    socket.onmessage = (event) => {
      const notification = JSON.parse(event.data);
      setNotifications((current) => [notification, ...current]);
    };

    return () => socket.close();
  }, [user?.id]);

  const markAsRead = async (notificationId) => {
    const { data } = await api.put(`/notifications/${notificationId}/read`);
    setNotifications((current) => current.map((item) => (item.id === notificationId ? data : item)));
  };

  return { notifications, unreadCount, markAsRead };
}

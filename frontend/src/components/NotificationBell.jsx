import { useState } from 'react';
import { useNotifications } from '../hooks/useNotifications';

function NotificationBell({ user }) {
  const [open, setOpen] = useState(false);
  const { notifications, unreadCount, markAsRead } = useNotifications(user);

  return (
    <div className="notification-menu">
      <button type="button" className="notification-trigger" onClick={() => setOpen((current) => !current)}>
        <span aria-hidden="true">🔔</span>
        {unreadCount ? <span className="notification-count">{unreadCount}</span> : null}
      </button>

      {open ? (
        <div className="notification-dropdown">
          <div className="panel-header">
            <div>
              <p className="eyebrow">Notifications</p>
              <h2>Updates</h2>
            </div>
          </div>
          <div className="list-stack">
            {notifications.length ? (
              notifications.map((notification) => (
                <div key={notification.id} className="notification-row">
                  <div>
                    <strong>{notification.message}</strong>
                    <p className="muted-text">{new Date(notification.created_at).toLocaleString()}</p>
                  </div>
                  {!notification.is_read ? (
                    <button type="button" className="button text-button" onClick={() => markAsRead(notification.id)}>
                      Mark read
                    </button>
                  ) : null}
                </div>
              ))
            ) : (
              <p className="muted-text">No notifications yet.</p>
            )}
          </div>
        </div>
      ) : null}
    </div>
  );
}

export default NotificationBell;

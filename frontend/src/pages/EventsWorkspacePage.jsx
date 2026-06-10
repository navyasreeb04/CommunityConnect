import { useEffect, useState } from 'react';
import api from '../services/api';
import { buildGoogleCalendarLink, formatRemainingTime, isEventEnded } from '../utils/eventUtils';

const reminderChoices = [
  { label: '1 week before', value: 10080 },
  { label: '1 day before', value: 1440 },
  { label: '1 hour before', value: 60 },
];

function EventsWorkspacePage() {
  const [events, setEvents] = useState([]);
  const [reminderDrafts, setReminderDrafts] = useState({});
  const [message, setMessage] = useState('');
  const [clockTick, setClockTick] = useState(Date.now());

  const loadEvents = async () => {
    const { data } = await api.get('/events');
    setEvents(data);
    setReminderDrafts(
      Object.fromEntries(
        data.map((event) => [event.id, event.reminder_offsets.length ? event.reminder_offsets : [10080, 1440, 60]]),
      ),
    );
  };

  useEffect(() => {
    loadEvents();
  }, []);

  useEffect(() => {
    // Countdown logic: tick once per minute so all event countdown labels stay fresh.
    const timer = window.setInterval(() => setClockTick(Date.now()), 60000);
    return () => window.clearInterval(timer);
  }, []);

  const toggleReminder = (eventId, value) => {
    setReminderDrafts((current) => {
      const currentValues = current[eventId] || [];
      const nextValues = currentValues.includes(value)
        ? currentValues.filter((item) => item !== value)
        : [...currentValues, value].sort((left, right) => right - left);
      return { ...current, [eventId]: nextValues };
    });
  };

  const handleRegister = async (eventId) => {
    await api.post(`/events/${eventId}/register`, {
      reminder_offsets: reminderDrafts[eventId]?.length ? reminderDrafts[eventId] : [1440],
    });
    setMessage('Registration completed.');
    loadEvents();
  };

  const handleUnregister = async (eventId) => {
    await api.delete(`/events/${eventId}/register`);
    setMessage('Registration cancelled.');
    loadEvents();
  };

  return (
    <div className="page-stack">
      <section className="hero-card">
        <div>
          <p className="eyebrow">Events</p>
          <h1>Manage hackathons, workshops, and key deadlines with confidence.</h1>
          <p className="muted-text">
            Register once, choose reminder timing, and keep every important opportunity visible.
          </p>
        </div>
        {message ? <span className="pill success-pill">{message}</span> : null}
      </section>

      <section className="content-stack">
        {events.map((event) => (
          <article key={event.id} className="panel">
            <div className="panel-header">
              <div>
                <p className="eyebrow">{event.event_type}</p>
                <h2>{event.title}</h2>
                <p className="muted-text">
                  {event.location} · {new Date(event.start_time).toLocaleString()}
                </p>
              </div>
              <div className="badge-row">
                {event.community_name ? <span className="pill">{event.community_name}</span> : null}
                <span className="pill warm-pill">{event.registration_count} registered</span>
              </div>
            </div>

            <p>{event.description}</p>
            <p className="muted-text">
              Registration closes on {new Date(event.registration_deadline).toLocaleString()}
            </p>
            <p className="muted-text">Starts in {formatRemainingTime(event.start_time, clockTick)}</p>

            <div className="checkbox-grid">
              {reminderChoices.map((choice) => (
                <label key={choice.value} className="check-card">
                  <input
                    type="checkbox"
                    checked={(reminderDrafts[event.id] || []).includes(choice.value)}
                    onChange={() => toggleReminder(event.id, choice.value)}
                  />
                  <span>{choice.label}</span>
                </label>
              ))}
            </div>

            <div className="button-row">
              {isEventEnded(event.end_time) ? (
                <button type="button" className="button ghost-button" disabled>
                  Event Ended
                </button>
              ) : event.is_registered ? (
                <button type="button" className="button ghost-button" onClick={() => handleUnregister(event.id)}>
                  Cancel
                </button>
              ) : (
                <button type="button" className="button primary-button" onClick={() => handleRegister(event.id)}>
                  Register
                </button>
              )}
              <a
                className="button ghost-button"
                href={buildGoogleCalendarLink(event)}
                target="_blank"
                rel="noreferrer"
              >
                Add to Calendar
              </a>
            </div>
          </article>
        ))}
      </section>
    </div>
  );
}

export default EventsWorkspacePage;

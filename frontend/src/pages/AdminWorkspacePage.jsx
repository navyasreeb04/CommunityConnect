import { useEffect, useState } from 'react';
import AdminAnalyticsDashboard from '../components/AdminAnalyticsDashboard';
import api from '../services/api';

const emptyCommunity = {
  name: '',
  slug: '',
  description: '',
  color: '#d97706',
};

const emptyEvent = {
  title: '',
  description: '',
  location: '',
  event_type: 'Hackathon',
  start_time: '',
  end_time: '',
  registration_deadline: '',
  community_id: '',
};

function AdminWorkspacePage() {
  const [analytics, setAnalytics] = useState({
    overview: [],
    popular_communities: [],
    active_users: [],
    event_participation: [],
    feedback_summary: [],
    user_growth: [],
    community_engagement: [],
    community_distribution: [],
    activity_trends: [],
    fastest_growing_community: null,
    most_active_community: null,
  });
  const [communities, setCommunities] = useState([]);
  const [events, setEvents] = useState([]);
  const [feedbackItems, setFeedbackItems] = useState([]);
  const [communityForm, setCommunityForm] = useState(emptyCommunity);
  const [eventForm, setEventForm] = useState(emptyEvent);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');

  const loadAdminData = async () => {
    try {
      const [analyticsResponse, communitiesResponse, eventsResponse, feedbackResponse] = await Promise.all([
        api.get('/analytics/admin'),
        api.get('/communities'),
        api.get('/events'),
        api.get('/feedback'),
      ]);

      setAnalytics(analyticsResponse.data);
      setCommunities(communitiesResponse.data);
      setEvents(eventsResponse.data);
      setFeedbackItems(feedbackResponse.data);
      setError('');
    } catch (requestError) {
      setError(requestError.response?.data?.detail || 'Unable to load the admin workspace.');
    }
  };

  useEffect(() => {
    // State is refreshed from the API on mount and every 45 seconds for live dashboard demos.
    loadAdminData();
    const refreshTimer = window.setInterval(loadAdminData, 45000);
    return () => window.clearInterval(refreshTimer);
  }, []);

  const handleCreateCommunity = async (event) => {
    event.preventDefault();
    try {
      await api.post('/communities', communityForm);
      setCommunityForm(emptyCommunity);
      setMessage('Community created.');
      setError('');
      loadAdminData();
    } catch (requestError) {
      setError(requestError.response?.data?.detail || 'Unable to create community.');
    }
  };

  const handleCommunityEdit = async (community) => {
    try {
      await api.put(`/communities/${community.id}`, {
        name: community.name,
        slug: community.slug,
        description: community.description,
        color: community.color,
      });
      setMessage('Community updated.');
      setError('');
      loadAdminData();
    } catch (requestError) {
      setError(requestError.response?.data?.detail || 'Unable to update community.');
    }
  };

  const handleCreateEvent = async (event) => {
    event.preventDefault();
    try {
      await api.post('/events', {
        ...eventForm,
        community_id: eventForm.community_id ? Number(eventForm.community_id) : null,
      });
      setEventForm(emptyEvent);
      setMessage('Event created.');
      setError('');
      loadAdminData();
    } catch (requestError) {
      setError(requestError.response?.data?.detail || 'Unable to create event.');
    }
  };

  const handleEventEdit = async (item) => {
    try {
      await api.put(`/events/${item.id}`, {
        title: item.title,
        description: item.description,
        location: item.location,
        event_type: item.event_type,
        start_time: item.start_time,
        end_time: item.end_time,
        registration_deadline: item.registration_deadline,
        community_id: item.community_id,
      });
      setMessage('Event updated.');
      setError('');
      loadAdminData();
    } catch (requestError) {
      setError(requestError.response?.data?.detail || 'Unable to update event.');
    }
  };

  const handleFeedbackStatus = async (feedbackId, status) => {
    try {
      await api.put(`/feedback/${feedbackId}`, { status });
      setMessage('Feedback status updated.');
      setError('');
      loadAdminData();
    } catch (requestError) {
      setError(requestError.response?.data?.detail || 'Unable to update feedback.');
    }
  };

  return (
    <div className="page-stack">
      <section className="hero-card admin-hero">
        <div>
          <p className="eyebrow">Admin workspace</p>
          <h1>Manage operations, moderation, and engagement from a single control center.</h1>
          <p className="muted-text">
            Review platform health, publish communities and events, and keep product feedback flowing into action.
          </p>
        </div>
        {message ? <span className="pill success-pill">{message}</span> : null}
      </section>

      {error ? (
        <section className="panel">
          <p className="error-text">{error}</p>
        </section>
      ) : null}

      <AdminAnalyticsDashboard analytics={analytics} />

      <section className="two-column-grid">
        <article className="panel">
          <div className="panel-header">
            <div>
              <p className="eyebrow">Popular communities</p>
              <h2>Membership leaders</h2>
            </div>
          </div>
          <div className="list-stack">
            {analytics.popular_communities.map((item) => (
              <div key={item.label} className="list-row">
                <div>
                  <strong>{item.label}</strong>
                  <p className="muted-text">{item.meta}</p>
                </div>
                <span className="pill">{item.value}</span>
              </div>
            ))}
          </div>
        </article>

        <article className="panel">
          <div className="panel-header">
            <div>
              <p className="eyebrow">Feedback summary</p>
              <h2>Product signal snapshot</h2>
            </div>
          </div>
          <div className="list-stack">
            {analytics.feedback_summary.map((item) => (
              <div key={item.label} className="list-row">
                <div>
                  <strong>{item.label}</strong>
                  <p className="muted-text">{item.meta}</p>
                </div>
                <span className="pill warm-pill">{item.value}</span>
              </div>
            ))}
          </div>
        </article>
      </section>
      
      <section className="three-column-grid">
        <article className="panel">
          <div className="panel-header">
            <div>
              <p className="eyebrow">Create community</p>
              <h2>Launch a new domain</h2>
            </div>
          </div>
          <form className="stack-form" onSubmit={handleCreateCommunity}>
            <input
              placeholder="Community name"
              value={communityForm.name}
              onChange={(event) => setCommunityForm((current) => ({ ...current, name: event.target.value }))}
              required
            />
            <input
              placeholder="Slug"
              value={communityForm.slug}
              onChange={(event) => setCommunityForm((current) => ({ ...current, slug: event.target.value }))}
              required
            />
            <textarea
              placeholder="Description"
              rows="4"
              value={communityForm.description}
              onChange={(event) => setCommunityForm((current) => ({ ...current, description: event.target.value }))}
              required
            />
            <input
              type="color"
              value={communityForm.color}
              onChange={(event) => setCommunityForm((current) => ({ ...current, color: event.target.value }))}
            />
            <button type="submit" className="button primary-button">
              Add community
            </button>
          </form>
        </article>

        <article className="panel">
          <div className="panel-header">
            <div>
              <p className="eyebrow">Create event</p>
              <h2>Publish an opportunity</h2>
            </div>
          </div>
          <form className="stack-form" onSubmit={handleCreateEvent}>
            <input
              placeholder="Event title"
              value={eventForm.title}
              onChange={(event) => setEventForm((current) => ({ ...current, title: event.target.value }))}
              required
            />
            <textarea
              placeholder="Description"
              rows="4"
              value={eventForm.description}
              onChange={(event) => setEventForm((current) => ({ ...current, description: event.target.value }))}
              required
            />
            <input
              placeholder="Location"
              value={eventForm.location}
              onChange={(event) => setEventForm((current) => ({ ...current, location: event.target.value }))}
              required
            />
            <input
              placeholder="Type"
              value={eventForm.event_type}
              onChange={(event) => setEventForm((current) => ({ ...current, event_type: event.target.value }))}
              required
            />
            <select
              value={eventForm.community_id}
              onChange={(event) => setEventForm((current) => ({ ...current, community_id: event.target.value }))}
            >
              <option value="">No linked community</option>
              {communities.map((community) => (
                <option key={community.id} value={community.id}>
                  {community.name}
                </option>
              ))}
            </select>
            <input
              type="datetime-local"
              value={eventForm.start_time}
              onChange={(event) => setEventForm((current) => ({ ...current, start_time: event.target.value }))}
              required
            />
            <input
              type="datetime-local"
              value={eventForm.end_time}
              onChange={(event) => setEventForm((current) => ({ ...current, end_time: event.target.value }))}
              required
            />
            <input
              type="datetime-local"
              value={eventForm.registration_deadline}
              onChange={(event) =>
                setEventForm((current) => ({ ...current, registration_deadline: event.target.value }))
              }
              required
            />
            <button type="submit" className="button primary-button">
              Publish event
            </button>
          </form>
        </article>

        <article className="panel">
          <div className="panel-header">
            <div>
              <p className="eyebrow">Operational activity</p>
              <h2>Top contributors</h2>
            </div>
          </div>
          <p className="muted-text">
            Monitor the most active contributors and keep the platform aligned with current community activity.
          </p>
          <div className="list-stack">
            {analytics.active_users.map((item) => (
              <div key={item.label} className="list-row">
                <div>
                  <strong>{item.label}</strong>
                  <p className="muted-text">{item.meta}</p>
                </div>
                <span className="pill">{item.value}</span>
              </div>
            ))}
          </div>
        </article>
      </section>

      <section className="two-column-grid">
        <article className="panel">
          <div className="panel-header">
            <div>
              <p className="eyebrow">Manage communities</p>
              <h2>Refine live configuration</h2>
            </div>
          </div>
          <div className="content-stack">
            {communities.map((community) => (
              <div key={community.id} className="editor-card">
                <input
                  value={community.name}
                  onChange={(event) =>
                    setCommunities((current) =>
                      current.map((item) => (item.id === community.id ? { ...item, name: event.target.value } : item)),
                    )
                  }
                />
                <input
                  value={community.slug}
                  onChange={(event) =>
                    setCommunities((current) =>
                      current.map((item) => (item.id === community.id ? { ...item, slug: event.target.value } : item)),
                    )
                  }
                />
                <textarea
                  rows="3"
                  value={community.description}
                  onChange={(event) =>
                    setCommunities((current) =>
                      current.map((item) =>
                        item.id === community.id ? { ...item, description: event.target.value } : item,
                      ),
                    )
                  }
                />
                <button type="button" className="button ghost-button" onClick={() => handleCommunityEdit(community)}>
                  Save community
                </button>
              </div>
            ))}
          </div>
        </article>

        <article className="panel">
          <div className="panel-header">
            <div>
              <p className="eyebrow">Manage events</p>
              <h2>Update schedules quickly</h2>
            </div>
          </div>
          <div className="content-stack">
            {events.map((eventItem) => (
              <div key={eventItem.id} className="editor-card">
                <input
                  value={eventItem.title}
                  onChange={(event) =>
                    setEvents((current) =>
                      current.map((item) => (item.id === eventItem.id ? { ...item, title: event.target.value } : item)),
                    )
                  }
                />
                <textarea
                  rows="3"
                  value={eventItem.description}
                  onChange={(event) =>
                    setEvents((current) =>
                      current.map((item) =>
                        item.id === eventItem.id ? { ...item, description: event.target.value } : item,
                      ),
                    )
                  }
                />
                <input
                  value={eventItem.location}
                  onChange={(event) =>
                    setEvents((current) =>
                      current.map((item) => (item.id === eventItem.id ? { ...item, location: event.target.value } : item)),
                    )
                  }
                />
                <button type="button" className="button ghost-button" onClick={() => handleEventEdit(eventItem)}>
                  Save event
                </button>
              </div>
            ))}
          </div>
        </article>
      </section>

      <section className="panel">
        <div className="panel-header">
          <div>
            <p className="eyebrow">Feedback queue</p>
            <h2>Review incoming product requests</h2>
          </div>
        </div>
        <div className="content-stack">
          {feedbackItems.map((item) => (
            <div key={item.id} className="editor-card">
              <div className="badge-row">
                <span className="pill">{item.category}</span>
                <span className="pill warm-pill">{item.rating}/5</span>
                <span className="pill muted-pill">{item.status}</span>
              </div>
              <strong>{item.user_name}</strong>
              <p className="muted-text">{item.message}</p>
              <div className="button-row">
                <button type="button" className="button ghost-button" onClick={() => handleFeedbackStatus(item.id, 'new')}>
                  Mark new
                </button>
                <button
                  type="button"
                  className="button ghost-button"
                  onClick={() => handleFeedbackStatus(item.id, 'in-review')}
                >
                  In review
                </button>
                <button
                  type="button"
                  className="button primary-button"
                  onClick={() => handleFeedbackStatus(item.id, 'resolved')}
                >
                  Resolve
                </button>
              </div>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}

export default AdminWorkspacePage;

import { useEffect, useState } from 'react';
import StatCard from '../components/StatCard';
import api from '../services/api';

function DashboardPage() {
  const [analytics, setAnalytics] = useState({ overview: [], trending_communities: [], top_posts: [] });
  const [subscriptions, setSubscriptions] = useState([]);
  const [reminders, setReminders] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadDashboard = async () => {
      try {
        const [analyticsResponse, subscriptionsResponse, remindersResponse] = await Promise.all([
          api.get('/analytics/user'),
          api.get('/communities/subscriptions'),
          api.get('/events/reminders/upcoming'),
        ]);
        setAnalytics(analyticsResponse.data);
        setSubscriptions(subscriptionsResponse.data);
        setReminders(remindersResponse.data);
      } finally {
        setLoading(false);
      }
    };

    loadDashboard();
  }, []);

  if (loading) {
    return <section className="panel">Loading your dashboard...</section>;
  }

  return (
    <div className="page-stack">
      <section className="hero-card">
        <div>
          <p className="eyebrow">User dashboard</p>
          <h1>See what matters first, not what shouts the loudest.</h1>
          <p className="muted-text">
            CommunityConnect ranks your world by interest priorities, event registrations, and actual learning value.
          </p>
        </div>
        <div className="hero-badge-grid">
          {subscriptions.slice(0, 3).map((community) => (
            <div key={community.id} className="mini-badge">
              <span className="color-dot" style={{ background: community.color }} />
              <div>
                <strong>{community.name}</strong>
                <p className="muted-text">Priority {community.subscription_priority}</p>
              </div>
            </div>
          ))}
        </div>
      </section>

      <section className="stats-grid">
        {analytics.overview.map((item) => (
          <StatCard key={item.label} label={item.label} value={item.value} description={item.description} />
        ))}
      </section>

      <section className="two-column-grid">
        <article className="panel">
          <div className="panel-header">
            <div>
              <p className="eyebrow">Trending communities</p>
              <h2>Where the best conversations are happening</h2>
            </div>
          </div>
          <div className="list-stack">
            {analytics.trending_communities.map((item) => (
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
              <p className="eyebrow">Upcoming reminders</p>
              <h2>Your next deadlines</h2>
            </div>
          </div>
          <div className="list-stack">
            {reminders.length ? (
              reminders.map((item) => (
                <div key={`${item.event_id}-${item.trigger_offset_minutes}`} className="list-row">
                  <div>
                    <strong>{item.event_title}</strong>
                    <p className="muted-text">
                      {item.location} · {item.minutes_until_event} minutes left
                    </p>
                  </div>
                  <span className="pill warm-pill">{item.trigger_offset_minutes} min reminder</span>
                </div>
              ))
            ) : (
              <p className="muted-text">Register for events to start seeing reminder slots here.</p>
            )}
          </div>
        </article>
      </section>

      <section className="panel">
        <div className="panel-header">
          <div>
            <p className="eyebrow">Top posts</p>
            <h2>Conversation starters worth revisiting</h2>
          </div>
        </div>
        <div className="list-stack">
          {analytics.top_posts.map((item) => (
            <div key={item.label} className="list-row">
              <div>
                <strong>{item.label}</strong>
                <p className="muted-text">{item.meta}</p>
              </div>
              <span className="pill">{item.value}</span>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}

export default DashboardPage;

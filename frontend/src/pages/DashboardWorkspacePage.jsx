import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import StatCard from '../components/StatCard';
import UserInsightsDashboard from '../components/UserInsightsDashboard';
import api from '../services/api';
import { formatRemainingTime } from '../utils/eventUtils';

function DashboardWorkspacePage() {
  const navigate = useNavigate();
  const [analytics, setAnalytics] = useState({
    overview: [],
    trending_communities: [],
    top_posts: [],
    community_members: [],
    popular_posts: [],
  });
  const [subscriptions, setSubscriptions] = useState([]);
  const [reminders, setReminders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [, setCountdownTick] = useState(Date.now());

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

    // Load immediately, then refresh every 45 seconds so chart cards stay dynamic during demos.
    loadDashboard();
    const refreshTimer = window.setInterval(loadDashboard, 45000);
    return () => window.clearInterval(refreshTimer);
  }, []);

  useEffect(() => {
    // Reminder countdowns need a minute-based rerender so the Xd Xh Xm label stays current.
    const countdownTimer = window.setInterval(() => setCountdownTick(Date.now()), 60000);
    return () => window.clearInterval(countdownTimer);
  }, []);

  if (loading) {
    return <section className="panel">Loading your dashboard...</section>;
  }

  return (
    <div className="page-stack">
      <section className="hero-card">
        <div>
          <p className="eyebrow">Overview</p>
          <h1>Your technical priorities, event commitments, and most relevant conversations.</h1>
          <p className="muted-text">
            CommunityConnect keeps focus on the communities, deadlines, and discussions that matter most to your work.
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

      <UserInsightsDashboard analytics={analytics} />

      <section className="two-column-grid">
        <article className="panel">
          <div className="panel-header">
            <div>
              <p className="eyebrow">Trending communities</p>
              <h2>Where momentum is building</h2>
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
              <h2>Deadlines that need attention</h2>
            </div>
          </div>
          <div className="list-stack">
            {reminders.length ? (
              reminders.map((item) => (
                <div key={`${item.event_id}-${item.trigger_offset_minutes}`} className="list-row">
                  <div>
                    <strong>{item.event_title}</strong>
                    <p className="muted-text">
                      {item.location} - {formatRemainingTime(item.start_time)}
                    </p>
                  </div>
                  {/* <span className="pill warm-pill">{item.trigger_offset_minutes} min reminder</span> */}
                </div>
              ))
            ) : (
              <p className="muted-text">Your reminder queue will appear here once you register for events.</p>
            )}
          </div>
        </article>
      </section>

      <section className="panel">
        <div className="panel-header">
          <div>
            <p className="eyebrow">Top posts</p>
            <h2>Conversations worth revisiting</h2>
          </div>
        </div>
        <div className="list-stack">
          {analytics.popular_posts.map((post) => (
            <div key={post.id} className="list-row">
              <div>
                <button
                  type="button"
                  className="text-button discussion-link"
                  onClick={() => navigate(`/discussion?postId=${post.id}`)}
                >
                  {post.title}
                </button>
                <p className="muted-text">{post.community} engagement</p>
              </div>
              <span className="pill">{post.engagement}</span>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}

export default DashboardWorkspacePage;

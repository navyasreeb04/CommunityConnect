import { useEffect, useState } from 'react';
import api from '../services/api';

function CommunitiesPage() {
  const [communities, setCommunities] = useState([]);
  const [priorityDrafts, setPriorityDrafts] = useState({});
  const [message, setMessage] = useState('');

  const loadCommunities = async () => {
    const { data } = await api.get('/communities');
    setCommunities(data);
    setPriorityDrafts(
      Object.fromEntries(data.map((community) => [community.id, community.subscription_priority || 3])),
    );
  };

  useEffect(() => {
    loadCommunities();
  }, []);

  const handleJoin = async (communityId) => {
    await api.post(`/communities/subscriptions/${communityId}`, {
      priority: Number(priorityDrafts[communityId] || 3),
    });
    setMessage('Community joined and priority saved.');
    loadCommunities();
  };

  const handleUpdatePriority = async (communityId) => {
    await api.put(`/communities/subscriptions/${communityId}`, {
      priority: Number(priorityDrafts[communityId] || 3),
    });
    setMessage('Priority updated.');
    loadCommunities();
  };

  const handleLeave = async (communityId) => {
    await api.delete(`/communities/subscriptions/${communityId}`);
    setMessage('Community removed from your list.');
    loadCommunities();
  };

  return (
    <div className="page-stack">
      <section className="hero-card">
        <div>
          <p className="eyebrow">Step 1: choose interests</p>
          <h1>Communities power the feed, reminders, and analytics.</h1>
          <p className="muted-text">
            In database terms, this page manages a many-to-many relationship through `user_communities` plus a custom
            priority field.
          </p>
        </div>
        {message ? <span className="pill success-pill">{message}</span> : null}
      </section>

      <section className="community-grid">
        {communities.map((community) => (
          <article key={community.id} className="panel community-card">
            <div className="community-header">
              <span className="color-dot large-dot" style={{ background: community.color }} />
              <div>
                <p className="eyebrow">{community.slug}</p>
                <h2>{community.name}</h2>
              </div>
            </div>
            <p className="muted-text">{community.description}</p>
            <label>
              Priority
              <select
                value={priorityDrafts[community.id] || 3}
                onChange={(event) =>
                  setPriorityDrafts((current) => ({ ...current, [community.id]: event.target.value }))
                }
              >
                <option value="1">1 - Highest</option>
                <option value="2">2 - Strong</option>
                <option value="3">3 - Balanced</option>
                <option value="4">4 - Casual</option>
                <option value="5">5 - Lowest</option>
              </select>
            </label>
            <div className="button-row">
              {community.is_subscribed ? (
                <>
                  <button type="button" className="button primary-button" onClick={() => handleUpdatePriority(community.id)}>
                    Save priority
                  </button>
                  <button type="button" className="button ghost-button" onClick={() => handleLeave(community.id)}>
                    Leave
                  </button>
                </>
              ) : (
                <button type="button" className="button primary-button" onClick={() => handleJoin(community.id)}>
                  Join community
                </button>
              )}
            </div>
          </article>
        ))}
      </section>
    </div>
  );
}

export default CommunitiesPage;

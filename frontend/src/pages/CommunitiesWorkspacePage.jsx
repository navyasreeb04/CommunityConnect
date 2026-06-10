import { useEffect, useState } from 'react';
import api from '../services/api';

function CommunitiesWorkspacePage() {
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
    setMessage('Community added to your profile.');
    loadCommunities();
  };

  const handleUpdatePriority = async (communityId) => {
    await api.put(`/communities/subscriptions/${communityId}`, {
      priority: Number(priorityDrafts[communityId] || 3),
    });
    setMessage('Priority updated successfully.');
    loadCommunities();
  };

  const handleLeave = async (communityId) => {
    await api.delete(`/communities/subscriptions/${communityId}`);
    setMessage('Community removed from your profile.');
    loadCommunities();
  };

  return (
    <div className="page-stack">
      <section className="hero-card">
        <div>
          <p className="eyebrow">Communities</p>
          <h1>Choose the domains that should shape your feed and notifications.</h1>
          <p className="muted-text">
            Join technical communities, set priority levels, and make sure the platform reflects your current focus.
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
                <option value="3">3 - Standard</option>
                <option value="4">4 - Lower</option>
                <option value="5">5 - Minimal</option>
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
                  Join
                </button>
              )}
            </div>
          </article>
        ))}
      </section>
    </div>
  );
}

export default CommunitiesWorkspacePage;

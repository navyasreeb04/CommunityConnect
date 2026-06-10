import { useEffect, useState } from 'react';
import { useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import api from '../services/api';

const initialPost = {
  title: '',
  content: '',
  community_id: '',
};

function FeedWorkspacePage() {
  const { isAdmin } = useAuth();
  const location = useLocation();
  // Query param usage: read postId from /discussion?postId=<id> so the page knows which post to focus.
  const focusedPostId = new URLSearchParams(location.search).get('postId');
  const [communities, setCommunities] = useState([]);
  const [feed, setFeed] = useState([]);
  const [filterCommunityId, setFilterCommunityId] = useState('');
  const [postForm, setPostForm] = useState(initialPost);
  const [commentDrafts, setCommentDrafts] = useState({});
  const [message, setMessage] = useState('');

  const loadFeed = async (communityId = filterCommunityId) => {
    const [communitiesResponse, feedResponse] = await Promise.all([
      api.get('/communities'),
      api.get('/posts/feed', { params: communityId ? { community_id: communityId } : {} }),
    ]);
    setCommunities(communitiesResponse.data);
    setFeed(feedResponse.data);
    if (!postForm.community_id && communitiesResponse.data.length) {
      setPostForm((current) => ({ ...current, community_id: communitiesResponse.data[0].id }));
    }
  };

  useEffect(() => {
    loadFeed();
  }, []);

  useEffect(() => {
    loadFeed(filterCommunityId);
  }, [filterCommunityId]);

  useEffect(() => {
    if (!focusedPostId || !feed.length) {
      return;
    }

    // Scroll logic: run after posts render so the target DOM node exists before smooth scrolling to it.
    const frameId = window.requestAnimationFrame(() => {
      const element = document.getElementById(`post-${focusedPostId}`);
      if (element) {
        element.scrollIntoView({ behavior: 'smooth' });
      }
    });

    return () => window.cancelAnimationFrame(frameId);
  }, [focusedPostId, feed]);

  const handleCreatePost = async (event) => {
    event.preventDefault();
    await api.post('/posts', { ...postForm, community_id: Number(postForm.community_id) });
    setPostForm((current) => ({ ...initialPost, community_id: current.community_id }));
    setMessage('Discussion published.');
    loadFeed();
  };

  const handleLikeToggle = async (post) => {
    if (post.liked_by_me) {
      await api.delete(`/posts/${post.id}/like`);
    } else {
      await api.post(`/posts/${post.id}/like`);
    }
    loadFeed();
  };

  const handleDeletePost = async (postId) => {
    await api.delete(`/posts/${postId}`);
    setMessage('Post removed.');
    loadFeed();
  };

  const handleAddComment = async (postId) => {
    const content = commentDrafts[postId];
    if (!content) {
      return;
    }
    await api.post(`/posts/${postId}/comments`, { content });
    setCommentDrafts((current) => ({ ...current, [postId]: '' }));
    loadFeed();
  };

  const handleDeleteComment = async (commentId) => {
    await api.delete(`/posts/comments/${commentId}`);
    loadFeed();
  };

  return (
    <div className="page-stack">
      <section className="two-column-grid">
        <article className="panel">
          <div className="panel-header">
            <div>
              <p className="eyebrow">Publish</p>
              <h2>Create updates for your communities</h2>
            </div>
            {message ? <span className="pill success-pill">{message}</span> : null}
          </div>
          <form className="stack-form" onSubmit={handleCreatePost}>
            <label>
              Community
              <select
                value={postForm.community_id}
                onChange={(event) => setPostForm((current) => ({ ...current, community_id: event.target.value }))}
                required
              >
                <option value="">Select a community</option>
                {communities.map((community) => (
                  <option key={community.id} value={community.id}>
                    {community.name}
                  </option>
                ))}
              </select>
            </label>
            <label>
              Title
              <input
                value={postForm.title}
                onChange={(event) => setPostForm((current) => ({ ...current, title: event.target.value }))}
                required
              />
            </label>
            <label>
              Update
              <textarea
                rows="5"
                value={postForm.content}
                onChange={(event) => setPostForm((current) => ({ ...current, content: event.target.value }))}
                required
              />
            </label>
            <button type="submit" className="button primary-button">
              Publish
            </button>
          </form>
        </article>

        <article className="panel">
          <div className="panel-header">
            <div>
              <p className="eyebrow">Priority feed</p>
              <h2>Relevant discussions surface first</h2>
            </div>
          </div>
          <label>
            Filter by community
            <select value={filterCommunityId} onChange={(event) => setFilterCommunityId(event.target.value)}>
              <option value="">All communities</option>
              {communities.map((community) => (
                <option key={community.id} value={community.id}>
                  {community.name}
                </option>
              ))}
            </select>
          </label>
          <p className="muted-text">
            Discussions are ordered by your joined communities, selected priority level, freshness, and engagement.
          </p>
        </article>
      </section>

      <section className="content-stack">
        {feed.map((post) => (
          // Post anchor: each discussion item gets a stable id so query-param navigation can target it.
          <article key={post.id} id={`post-${post.id}`} className="panel post-card">
            <div className="post-header">
              <div>
                <div className="badge-row">
                  <span className="pill">{post.community_name}</span>
                  {post.is_joined_community ? (
                    <span className="pill warm-pill">Priority {post.priority}</span>
                  ) : (
                    <span className="pill muted-pill">Open network</span>
                  )}
                </div>
                <h2>{post.title}</h2>
                <p className="muted-text">
                  {post.author_name} · {new Date(post.created_at).toLocaleString()}
                </p>
              </div>
              {isAdmin ? (
                <button type="button" className="button ghost-button" onClick={() => handleDeletePost(post.id)}>
                  Remove post
                </button>
              ) : null}
            </div>
            <p>{post.content}</p>

            <div className="button-row">
              <button type="button" className="button primary-button" onClick={() => handleLikeToggle(post)}>
                {post.liked_by_me ? 'Unlike' : 'Like'} ({post.like_count})
              </button>
              <span className="muted-text">{post.comment_count} comments</span>
            </div>

            <div className="comment-block">
              {post.comments.map((comment) => (
                <div key={comment.id} className="comment-row">
                  <div>
                    <strong>{comment.author_name}</strong>
                    <p className="muted-text">{comment.content}</p>
                  </div>
                  {isAdmin ? (
                    <button
                      type="button"
                      className="button text-button"
                      onClick={() => handleDeleteComment(comment.id)}
                    >
                      Delete
                    </button>
                  ) : null}
                </div>
              ))}

              <div className="inline-form">
                <input
                  placeholder="Add a comment"
                  value={commentDrafts[post.id] || ''}
                  onChange={(event) =>
                    setCommentDrafts((current) => ({ ...current, [post.id]: event.target.value }))
                  }
                />
                <button type="button" className="button ghost-button" onClick={() => handleAddComment(post.id)}>
                  Comment
                </button>
              </div>
            </div>
          </article>
        ))}
      </section>
    </div>
  );
}

export default FeedWorkspacePage;

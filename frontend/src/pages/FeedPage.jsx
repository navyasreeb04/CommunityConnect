import { useEffect, useState } from 'react';
import { useAuth } from '../context/AuthContext';
import api from '../services/api';

const initialPost = {
  title: '',
  content: '',
  community_id: '',
};

function FeedPage() {
  const { isAdmin } = useAuth();
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

  const handleCreatePost = async (event) => {
    event.preventDefault();
    await api.post('/posts', { ...postForm, community_id: Number(postForm.community_id) });
    setPostForm((current) => ({ ...initialPost, community_id: current.community_id }));
    setMessage('Post published.');
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
              <p className="eyebrow">Step 2: create content</p>
              <h2>Share learning, wins, and opportunities</h2>
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
              Post content
              <textarea
                rows="5"
                value={postForm.content}
                onChange={(event) => setPostForm((current) => ({ ...current, content: event.target.value }))}
                required
              />
            </label>
            <button type="submit" className="button primary-button">
              Publish post
            </button>
          </form>
        </article>

        <article className="panel">
          <div className="panel-header">
            <div>
              <p className="eyebrow">Priority feed</p>
              <h2>Posts from your key communities rise first</h2>
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
            The backend sorts by joined communities first, then your stored priority, then recency and engagement.
          </p>
        </article>
      </section>

      <section className="content-stack">
        {feed.map((post) => (
          <article key={post.id} className="panel post-card">
            <div className="post-header">
              <div>
                <div className="badge-row">
                  <span className="pill">{post.community_name}</span>
                  {post.is_joined_community ? (
                    <span className="pill warm-pill">Priority {post.priority}</span>
                  ) : (
                    <span className="pill muted-pill">Not joined</span>
                  )}
                </div>
                <h2>{post.title}</h2>
                <p className="muted-text">
                  {post.author_name} · {new Date(post.created_at).toLocaleString()}
                </p>
              </div>
              {isAdmin ? (
                <button type="button" className="button ghost-button" onClick={() => handleDeletePost(post.id)}>
                  Delete post
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
                      Remove
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

export default FeedPage;

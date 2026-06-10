import { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import api from '../services/api';

function FeedbackWorkspacePage() {
  const { isAdmin } = useAuth();
  const [form, setForm] = useState({
    rating: 5,
    category: 'Feature Request',
    message: '',
  });
  const [message, setMessage] = useState('');

  const handleSubmit = async (event) => {
    event.preventDefault();
    await api.post('/feedback', { ...form, rating: Number(form.rating) });
    setForm({ rating: 5, category: 'Feature Request', message: '' });
    setMessage('Feedback submitted successfully.');
  };

  return (
    <div className="page-stack">
      <section className="hero-card">
        <div>
          <p className="eyebrow">Feedback</p>
          <h1>Share product feedback directly with the operations team.</h1>
          <p className="muted-text">
            Suggest improvements, flag issues, or highlight opportunities to keep the platform evolving in the right direction.
          </p>
        </div>
        {isAdmin ? <span className="pill warm-pill">Feedback review is available in the admin workspace</span> : null}
      </section>

      <section className="panel">
        <form className="stack-form" onSubmit={handleSubmit}>
          <label>
            Rating
            <select value={form.rating} onChange={(event) => setForm((current) => ({ ...current, rating: event.target.value }))}>
              <option value="5">5 - Excellent</option>
              <option value="4">4 - Good</option>
              <option value="3">3 - Average</option>
              <option value="2">2 - Needs improvement</option>
              <option value="1">1 - Poor</option>
            </select>
          </label>
          <label>
            Category
            <select
              value={form.category}
              onChange={(event) => setForm((current) => ({ ...current, category: event.target.value }))}
            >
              <option value="Feature Request">Feature Request</option>
              <option value="Bug Report">Bug Report</option>
              <option value="UI Feedback">UI Feedback</option>
              <option value="General Suggestion">General Suggestion</option>
            </select>
          </label>
          <label>
            Feedback message
            <textarea
              rows="6"
              value={form.message}
              onChange={(event) => setForm((current) => ({ ...current, message: event.target.value }))}
              required
            />
          </label>
          {message ? <p className="success-text">{message}</p> : null}
          <button type="submit" className="button primary-button">
            Submit feedback
          </button>
        </form>
      </section>
    </div>
  );
}

export default FeedbackWorkspacePage;

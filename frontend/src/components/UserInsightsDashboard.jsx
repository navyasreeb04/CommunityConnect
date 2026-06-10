import {
  Bar,
  BarChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import { useNavigate } from 'react-router-dom';

function UserInsightsDashboard({ analytics }) {
  const navigate = useNavigate();

  return (
    <section className="two-column-grid">
      <article className="panel">
        <div className="panel-header">
          <div>
            <p className="eyebrow">Community size</p>
            <h2>Members in each community</h2>
          </div>
        </div>
        <div className="chart-box compact-chart">
          <ResponsiveContainer width="100%" height={260}>
            <BarChart data={analytics.community_members}>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(120, 87, 35, 0.14)" />
              <XAxis dataKey="community" stroke="#7b6247" tick={{ fontSize: 12 }} />
              <YAxis stroke="#7b6247" allowDecimals={false} />
              <Tooltip />
              {/* The API sends member counts already grouped by community for a lightweight user view. */}
              <Bar dataKey="members" fill="#f59e0b" radius={[8, 8, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </article>

      <article className="panel">
        <div className="panel-header">
          <div>
            <p className="eyebrow">Popular posts</p>
            <h2>Most discussed right now</h2>
          </div>
        </div>
        <div className="list-stack">
          {analytics.popular_posts.map((post) => (
            <div key={`${post.title}-${post.community}`} className="list-row">
              <div>
                <button
                  type="button"
                  className="text-button discussion-link"
                  onClick={() => navigate(`/discussion?postId=${post.id}`)}
                >
                  {post.title}
                </button>
                <p className="muted-text">{post.community}</p>
              </div>
              <span className="pill warm-pill">{post.engagement}</span>
            </div>
          ))}
        </div>
      </article>
    </section>
  );
}

export default UserInsightsDashboard;

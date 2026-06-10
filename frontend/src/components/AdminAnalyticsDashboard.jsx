import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Legend,
  Line,
  LineChart,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import StatCard from './StatCard';

const CHART_COLORS = ['#ea580c', '#f59e0b', '#facc15', '#c2410c', '#b45309', '#92400e', '#d97706'];

function ChartPanel({ eyebrow, title, children, wide = false }) {
  return (
    <article className={`panel analytics-panel ${wide ? 'analytics-panel-wide' : ''}`}>
      <div className="panel-header">
        <div>
          <p className="eyebrow">{eyebrow}</p>
          <h2>{title}</h2>
        </div>
      </div>
      <div className="chart-box">{children}</div>
    </article>
  );
}

function AdminAnalyticsDashboard({ analytics }) {
  const latestActivity = analytics.activity_trends?.at(-1);

  return (
    <section className="analytics-stack">
      <section className="stats-grid">
        {analytics.overview.map((item) => (
          <StatCard key={item.label} label={item.label} value={item.value} description={item.description} />
        ))}
      </section>

      <section className="analytics-kpi-row">
        {analytics.fastest_growing_community ? (
          <div className="mini-badge">
            <span className="analytics-signal-dot" />
            <div>
              <strong>{analytics.fastest_growing_community.label}</strong>
              <p className="muted-text">{analytics.fastest_growing_community.value} new members in 30 days</p>
            </div>
          </div>
        ) : null}
        {analytics.most_active_community ? (
          <div className="mini-badge">
            <span className="analytics-signal-dot warm-dot" />
            <div>
              <strong>{analytics.most_active_community.label}</strong>
              <p className="muted-text">{analytics.most_active_community.value} engagement actions</p>
            </div>
          </div>
        ) : null}
        {latestActivity ? (
          <div className="mini-badge">
            <span className="analytics-signal-dot gold-dot" />
            <div>
              <strong>{latestActivity.active_users} active users</strong>
              <p className="muted-text">{latestActivity.month} activity snapshot</p>
            </div>
          </div>
        ) : null}
      </section>

      <section className="analytics-grid">
        <ChartPanel eyebrow="User growth" title="Monthly signups and active users" wide>
          <ResponsiveContainer width="100%" height={320}>
            <LineChart data={analytics.user_growth}>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(120, 87, 35, 0.14)" />
              <XAxis dataKey="month" stroke="#7b6247" />
              <YAxis stroke="#7b6247" allowDecimals={false} />
              <Tooltip />
              <Legend />
              {/* Chart data is already normalized by the API, so the UI only maps keys to series. */}
              <Line type="monotone" dataKey="signups" stroke="#ea580c" strokeWidth={3} dot={{ r: 4 }} />
              <Line type="monotone" dataKey="active_users" name="active users" stroke="#f59e0b" strokeWidth={3} />
            </LineChart>
          </ResponsiveContainer>
        </ChartPanel>

        <ChartPanel eyebrow="Engagement" title="Posts, likes, and comments by community" wide>
          <ResponsiveContainer width="100%" height={320}>
            <BarChart data={analytics.community_engagement}>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(120, 87, 35, 0.14)" />
              <XAxis dataKey="community" stroke="#7b6247" tick={{ fontSize: 12 }} />
              <YAxis stroke="#7b6247" allowDecimals={false} />
              <Tooltip />
              <Legend />
              <Bar dataKey="posts" stackId="engagement" fill="#ea580c" radius={[6, 6, 0, 0]} />
              <Bar dataKey="likes" stackId="engagement" fill="#f59e0b" />
              <Bar dataKey="comments" stackId="engagement" fill="#facc15" />
            </BarChart>
          </ResponsiveContainer>
        </ChartPanel>

        <ChartPanel eyebrow="Distribution" title="Members by community">
          <ResponsiveContainer width="100%" height={310}>
            <PieChart>
              <Pie
                data={analytics.community_distribution}
                dataKey="members"
                nameKey="community"
                innerRadius={58}
                outerRadius={102}
                paddingAngle={2}
              >
                {analytics.community_distribution.map((entry, index) => (
                  <Cell key={entry.community} fill={CHART_COLORS[index % CHART_COLORS.length]} />
                ))}
              </Pie>
              <Tooltip />
              <Legend />
            </PieChart>
          </ResponsiveContainer>
        </ChartPanel>

        <ChartPanel eyebrow="Activity" title="Login activity trends">
          <ResponsiveContainer width="100%" height={310}>
            <AreaChart data={analytics.activity_trends}>
              <defs>
                <linearGradient id="loginFill" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#f59e0b" stopOpacity={0.42} />
                  <stop offset="95%" stopColor="#f59e0b" stopOpacity={0.04} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(120, 87, 35, 0.14)" />
              <XAxis dataKey="month" stroke="#7b6247" />
              <YAxis stroke="#7b6247" allowDecimals={false} />
              <Tooltip />
              <Area type="monotone" dataKey="logins" stroke="#d97706" fill="url(#loginFill)" strokeWidth={3} />
            </AreaChart>
          </ResponsiveContainer>
        </ChartPanel>
      </section>
    </section>
  );
}

export default AdminAnalyticsDashboard;

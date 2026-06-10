function StatCard({ label, value, description }) {
  return (
    <article className="stat-card">
      <p className="eyebrow">{label}</p>
      <h3>{value}</h3>
      <p className="muted-text">{description}</p>
    </article>
  );
}

export default StatCard;

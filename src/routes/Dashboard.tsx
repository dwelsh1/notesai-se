import { useDashboardData } from '../state/dashboardData'

export function Dashboard() {
  const { recent, favorites, stats } = useDashboardData()

  return (
    <section>
      <h1 data-testid="dashboard-title">Dashboard</h1>
      <div className="dashboard-grid">
        <div className="dashboard-card" data-testid="dashboard-stats">
          <h2>Stats</h2>
          <p>Total pages: {stats.totalPages}</p>
          <p>Favorites: {stats.favorites}</p>
          <p>Trashed: {stats.trashed}</p>
          <p>Open tabs: {stats.openTabs}</p>
        </div>
        <div className="dashboard-card" data-testid="dashboard-recent">
          <h2>Recent</h2>
          {recent.length === 0 ? (
            <p>No recent pages yet.</p>
          ) : (
            <ul>
              {recent.map((page) => (
                <li key={page.id}>{page.title}</li>
              ))}
            </ul>
          )}
        </div>
        <div className="dashboard-card" data-testid="dashboard-favorites">
          <h2>Favorites</h2>
          {favorites.length === 0 ? (
            <p>No favorites yet.</p>
          ) : (
            <ul>
              {favorites.map((page) => (
                <li key={page.id}>{page.title}</li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </section>
  )
}

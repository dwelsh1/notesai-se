import { NavLink } from 'react-router-dom'

export function Sidebar() {
  return (
    <aside className="sidebar" data-testid="sidebar">
      <div className="sidebar__brand">NotesAI SE</div>
      <nav className="sidebar__nav">
        <NavLink to="/" end>
          Dashboard
        </NavLink>
        <NavLink to="/settings">Settings</NavLink>
      </nav>
      <div className="sidebar__section">
        <div className="sidebar__section-title">Pages</div>
        <div className="sidebar__empty" data-testid="sidebar-empty">
          No pages yet
        </div>
      </div>
    </aside>
  )
}

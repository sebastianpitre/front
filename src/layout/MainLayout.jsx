import { Outlet, NavLink } from "react-router-dom"

/**
 * Shell with top navigation and main content area.
 * NavLink keeps active section visible for the user.
 */
export default function MainLayout() {
  return (
    <div className="main-layout">
      <header className="main-header">
        <NavLink to="/" className="main-brand" end>
          Intercursos
        </NavLink>
        <nav className="main-nav" aria-label="Primary">
          <NavLink to="/" end>
            Dashboard
          </NavLink>
          <NavLink to="/teams">Teams</NavLink>
          <NavLink to="/players">Players</NavLink>
          <NavLink to="/matches">Matches</NavLink>
          <NavLink to="/standings">Standings</NavLink>
        </nav>
      </header>
      <main className="main-content">
        <Outlet />
      </main>
    </div>
  )
}

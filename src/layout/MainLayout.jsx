import { Outlet, NavLink, useNavigate } from "react-router-dom"
import { AUTH_DISABLED } from "../config.js"
import { useAuth } from "../context/AuthContext.jsx"

/**
 * Shell with top navigation and main content area.
 * NavLink keeps active section visible for the user.
 */
export default function MainLayout() {
  const { logout } = useAuth()
  const navigate = useNavigate()

  function handleLogout() {
    logout()
    navigate("/login", { replace: true })
  }

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
        {!AUTH_DISABLED ? (
          <div className="main-header-actions">
            <button
              type="button"
              className="btn btn-small"
              onClick={handleLogout}
            >
              Salir
            </button>
          </div>
        ) : null}
      </header>
      <main className="main-content">
        <Outlet />
      </main>
    </div>
  )
}

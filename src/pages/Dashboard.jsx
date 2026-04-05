import { Link } from "react-router-dom"

const LINKS = [
  { to: "/teams", label: "Teams", hint: "Create and browse squads" },
  { to: "/players", label: "Players", hint: "Roster and photos" },
  { to: "/matches", label: "Matches", hint: "Schedule and open live view" },
  { to: "/standings", label: "Standings", hint: "Points table by category" },
]

/**
 * Entry hub: large buttons routing to each major section.
 */
export default function Dashboard() {
  return (
    <div className="page dashboard-page">
      <h1>Dashboard</h1>
      <p className="page-lead">
        School tournament console — manage teams, players, fixtures, and live
        events.
      </p>
      <div className="dashboard-grid">
        {LINKS.map(({ to, label, hint }) => (
          <Link key={to} to={to} className="dashboard-card">
            <span className="dashboard-card-title">{label}</span>
            <span className="dashboard-card-hint">{hint}</span>
          </Link>
        ))}
      </div>
    </div>
  )
}

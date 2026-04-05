/**
 * Compact summary of one match with navigation into the live view.
 */
export default function MatchCard({ match, onOpenMatch }) {
  const localName = match.team_local?.name ?? `Team #${match.team_local_id}`
  const visitorName =
    match.team_visitor?.name ?? `Team #${match.team_visitor_id}`

  return (
    <article className="match-card">
      <div className="match-card-teams">
        <span className="match-card-team match-card-team--local">
          {localName}
        </span>
        <span className="match-card-score" aria-live="polite">
          {match.goals_local ?? 0} — {match.goals_visitor ?? 0}
        </span>
        <span className="match-card-team match-card-team--visitor">
          {visitorName}
        </span>
      </div>
      <div className="match-card-meta">
        <span className="match-card-status">{match.status}</span>
        <button
          type="button"
          className="btn btn-primary"
          onClick={() => onOpenMatch(match.id)}
        >
          Open Match
        </button>
      </div>
    </article>
  )
}

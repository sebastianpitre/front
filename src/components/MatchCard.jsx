/**
 * Compact summary of one match with navigation into the live view.
 */
function formatScheduled(iso) {
  if (!iso) return null
  try {
    return new Date(iso).toLocaleString(undefined, {
      dateStyle: "medium",
      timeStyle: "short",
    })
  } catch {
    return iso
  }
}

export default function MatchCard({ match, onOpenMatch, onEdit, onDelete }) {
  const localName = match.team_local?.name ?? `Team #${match.team_local_id}`
  const visitorName =
    match.team_visitor?.name ?? `Team #${match.team_visitor_id}`
  const when = formatScheduled(match.scheduled_at)
  const label = match.title?.trim() || `Partido #${match.id}`

  return (
    <article className="match-card">
      <div className="match-card-title-row">
        <h3 className="match-card-heading">{label}</h3>
        {when ? <span className="match-card-when muted small">{when}</span> : null}
      </div>
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
        <div className="match-card-buttons">
          {onEdit ? (
            <button
              type="button"
              className="btn btn-small"
              onClick={() => onEdit(match)}
            >
              Editar
            </button>
          ) : null}
          {onDelete ? (
            <button
              type="button"
              className="btn btn-small"
              onClick={() => onDelete(match)}
            >
              Borrar
            </button>
          ) : null}
          <button
            type="button"
            className="btn btn-primary"
            onClick={() => onOpenMatch(match.id)}
          >
            Open Match
          </button>
        </div>
      </div>
    </article>
  )
}

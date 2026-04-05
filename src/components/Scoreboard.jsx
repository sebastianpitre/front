/**
 * Live header: two team names and numeric score (from match or derived).
 */
export default function Scoreboard({
  teamLocalName,
  teamVisitorName,
  goalsLocal,
  goalsVisitor,
}) {
  return (
    <div className="scoreboard">
      <div className="scoreboard-team scoreboard-team--local">
        <span className="scoreboard-name">{teamLocalName}</span>
      </div>
      <div className="scoreboard-center" aria-live="polite">
        <span className="scoreboard-goals">{goalsLocal ?? 0}</span>
        <span className="scoreboard-sep">—</span>
        <span className="scoreboard-goals">{goalsVisitor ?? 0}</span>
      </div>
      <div className="scoreboard-team scoreboard-team--visitor">
        <span className="scoreboard-name">{teamVisitorName}</span>
      </div>
    </div>
  )
}

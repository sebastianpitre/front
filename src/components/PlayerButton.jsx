const PLACEHOLDER =
  "data:image/svg+xml," +
  encodeURIComponent(
    '<svg xmlns="http://www.w3.org/2000/svg" width="64" height="64" viewBox="0 0 64 64"><rect fill="#ccc" width="64" height="64"/><text x="50%" y="50%" dominant-baseline="middle" text-anchor="middle" fill="#666" font-size="10">?</text></svg>'
  )

/**
 * Circular photo + name; used on the pitch and in picker lists.
 * @param {{ yellow?: number, red?: boolean }} [cardStats] — cards in this match only
 */
export default function PlayerButton({
  player,
  onClick,
  className = "",
  disabled = false,
  cardStats,
}) {
  const src = player?.photo_url?.trim() ? player.photo_url : PLACEHOLDER
  const y = cardStats?.yellow ?? 0
  const hasRed = Boolean(cardStats?.red)
  const showCards = y > 0 || hasRed

  return (
    <button
      type="button"
      className={hasRed || y > 1 ? `player-button null ${className}`.trim() : `player-button ${className}`}
      onClick={() => onClick?.(player)}
      disabled={disabled}
    >
      {showCards ? (
        <span className="player-button-badges " aria-hidden style={{position:"absolute", right:"0px", bottom:"-10px"}}>
          {y > 0 && !hasRed ? (
            <span
              className="player-button-badge player-button-badge--yellow"
              title={
                y === 1 ? "1 tarjeta amarilla" : `${y} tarjetas amarillas`
              }
            >
              🟨{y > 1 ? y : ""}
            </span>
          ) : null}
          {hasRed ? (
            <span
              className="player-button-badge player-button-badge--red"
              title="Tarjeta roja"
            >
              🟥
            </span>
          ) : null}
        </span>
      ) : null}
      <span className="player-button-photo-wrap">
        <img
          className="player-button-photo"
          src={src}
          alt=""
          loading="lazy"
          onError={(e) => {
            e.currentTarget.src = PLACEHOLDER
          }}
        />
      </span>
      <span className="player-button-name">{player?.name ?? "—"}</span>
    </button>
  )
}

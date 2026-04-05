import { useCallback, useEffect, useMemo, useState } from "react"
import { Link, useParams } from "react-router-dom"
import api from "../services/api.js"
import Modal from "../components/Modal.jsx"
import PlayerButton from "../components/PlayerButton.jsx"
import Scoreboard from "../components/Scoreboard.jsx"
import {
  normalizePitchSlot,
  SLOT_STYLE_LOCAL,
  SLOT_STYLE_VISITOR,
} from "../utils/pitchLayout.js"

/**
 * Live control: pitch with starters, event modals, team goal shortcuts,
 * substitution (out + in) + lineup swap on field, scoreboard, polling.
 */
export default function LiveMatch() {
  const { id: matchId } = useParams()
  const [match, setMatch] = useState(null)
  const [lineup, setLineup] = useState([])
  const [events, setEvents] = useState([])
  const [playersById, setPlayersById] = useState({})
  const [error, setError] = useState("")
  const [modal, setModal] = useState({
    open: false,
    /** 'actions' | 'goalTeam' | 'sub' | 'goalPick' */
    mode: "actions",
    player: null,
    goalTeamId: null,
  })

  const loadCore = useCallback(async () => {
    if (!matchId) return
    setError("")
    try {
      const [mRes, lRes, eRes] = await Promise.all([
        api.get(`/matches/${matchId}`),
        api.get(`/matches/${matchId}/lineup`),
        api.get(`/matches/${matchId}/events`),
      ])
      setMatch(mRes.data)
      setLineup(Array.isArray(lRes.data) ? lRes.data : [])
      setEvents(Array.isArray(eRes.data) ? eRes.data : [])

      const localTid = mRes.data.team_local_id
      const visitorTid = mRes.data.team_visitor_id
      const [pLoc, pVis] = await Promise.all([
        api.get("/players", { params: { team_id: localTid } }),
        api.get("/players", { params: { team_id: visitorTid } }),
      ])
      const map = {}
      ;[...(pLoc.data || []), ...(pVis.data || [])].forEach((p) => {
        map[p.id] = p
      })
      setPlayersById(map)
    } catch (e) {
      setError(e.response?.data?.error || e.message || "Failed to load match")
    }
  }, [matchId])

  useEffect(() => {
    loadCore()
  }, [loadCore])

  // Poll match + lineup + events so score, cards, subs and pitch stay in sync.
  useEffect(() => {
    if (!matchId) return
    const t = setInterval(async () => {
      try {
        const [mRes, lRes, eRes] = await Promise.all([
          api.get(`/matches/${matchId}`),
          api.get(`/matches/${matchId}/lineup`),
          api.get(`/matches/${matchId}/events`),
        ])
        setMatch(mRes.data)
        setLineup(Array.isArray(lRes.data) ? lRes.data : [])
        setEvents(Array.isArray(eRes.data) ? eRes.data : [])
      } catch {
        /* keep last good state */
      }
    }, 5000)
    return () => clearInterval(t)
  }, [matchId])

  const closeModal = () =>
    setModal({
      open: false,
      mode: "actions",
      player: null,
      goalTeamId: null,
    })

  const refreshAfterEvent = useCallback(async () => {
    await loadCore()
  }, [loadCore])

  const matchLocked = match?.status === "finished"

  async function sendEvent(payload) {
    await api.post(`/matches/${matchId}/events`, payload)
    await refreshAfterEvent()
  }

  /** Starters on pitch: slot + small vertical stack if same position. */
  const pitchSlots = useMemo(() => {
    if (!match) return { local: [], visitor: [] }
    const localId = match.team_local_id
    const visitorId = match.team_visitor_id
    const perSlotCount = { local: {}, visitor: {} }
    let localDefOrd = 0
    let visitorDefOrd = 0

    function pushSide(entry, side) {
      const raw = (entry.position || "")
        .toString()
        .toLowerCase()
        .replace(/[_\s]+/g, "")
      let defOrd = 0
      if (raw === "def" || raw === "cb" || raw === "defensa") {
        defOrd = side === "local" ? localDefOrd++ : visitorDefOrd++
      }
      const slot = normalizePitchSlot(entry.position, defOrd)
      const styles = side === "local" ? SLOT_STYLE_LOCAL : SLOT_STYLE_VISITOR
      const base = styles[slot] || styles.midfielder
      const idx = perSlotCount[side][slot] ?? 0
      perSlotCount[side][slot] = idx + 1
      const offset = idx * 90
      const player = playersById[entry.player_id] || {
        id: entry.player_id,
        name: `Player #${entry.player_id}`,
        photo_url: "",
      }
      return {
        entry,
        player,
        style: {
          left: base.left,
          top: `calc(${base.top} + ${offset}px)`,
        },
      }
    }

    const starters = lineup.filter((r) => r.starter)
    const local = starters
      .filter((r) => r.team_id === localId)
      .map((e) => pushSide(e, "local"))
    const visitor = starters
      .filter((r) => r.team_id === visitorId)
      .map((e) => pushSide(e, "visitor"))
    return { local, visitor }
  }, [lineup, match, playersById])

  const benchByTeam = useMemo(() => {
    const benches = {}
    lineup
      .filter((r) => !r.starter)
      .forEach((r) => {
        if (!benches[r.team_id]) benches[r.team_id] = []
        benches[r.team_id].push(r)
      })
    return benches
  }, [lineup])

  const cardsByPlayerId = useMemo(() => {
    const map = {}
    for (const ev of events) {
      if (ev.player_id == null) continue
      if (!map[ev.player_id]) map[ev.player_id] = { yellow: 0, red: false }
      if (ev.event_type === "yellow_card") map[ev.player_id].yellow += 1
      if (ev.event_type === "red_card") map[ev.player_id].red = true
    }
    return map
  }, [events])

  function openPlayerActions(player, teamIdFromLineup) {
    if (matchLocked) return
    const p = playersById[player.id] || player
    setModal({
      open: true,
      mode: "actions",
      player: { ...p, _teamId: teamIdFromLineup },
      goalTeamId: null,
    })
  }

  async function onAction(eventType) {
    if (matchLocked) return
    const pl = modal.player
    if (!pl?._teamId) return
    if (eventType === "substitution") {
      setModal((m) => ({ ...m, mode: "sub" }))
      return
    }
    try {
      await sendEvent({
        player_id: pl.id,
        team_id: pl._teamId,
        event_type: eventType,
      })
      closeModal()
    } catch (e) {
      setError(e.response?.data?.error || e.message || "Event failed")
    }
  }

  async function onSubPick(benchEntry) {
    if (matchLocked) return
    const outPlayer = modal.player
    if (!outPlayer?._teamId) return
    const teamId = outPlayer._teamId
    const outId = outPlayer.id
    const inId = benchEntry.player_id

    const outEntry = lineup.find(
      (r) => r.player_id === outId && r.team_id === teamId && r.starter
    )
    if (!outEntry) {
      setError("Ese jugador no está como titular en el campo.")
      return
    }
    const newPosition = outEntry.position

    const newEntries = lineup.map((r) => {
      const row = {
        player_id: r.player_id,
        team_id: r.team_id,
        position: r.position,
        starter: r.starter,
      }
      if (r.player_id === outId && r.team_id === teamId) {
        return { ...row, starter: false }
      }
      if (r.player_id === inId && r.team_id === teamId) {
        return { ...row, starter: true, position: newPosition }
      }
      return row
    })

    try {
      setError("")
      await api.post(`/matches/${matchId}/events`, {
        player_id: outId,
        team_id: teamId,
        event_type: "substitution_out",
      })
      await api.post(`/matches/${matchId}/events`, {
        player_id: inId,
        team_id: teamId,
        event_type: "substitution_in",
      })
      await api.post(`/matches/${matchId}/lineup`, { entries: newEntries })
      await loadCore()
      closeModal()
    } catch (e) {
      setError(e.response?.data?.error || e.message || "Error en el cambio")
    }
  }

  function openGoalForTeam(teamId) {
    if (matchLocked) return
    setModal({
      open: true,
      mode: "goalTeam",
      player: null,
      goalTeamId: teamId,
    })
  }

  /** All squad members eligible as scorer (API requires player on that team). */
  const squadForGoalTeam = useMemo(() => {
    if (!modal.goalTeamId) return []
    return Object.values(playersById).filter(
      (p) => p.team_id === modal.goalTeamId
    )
  }, [modal.goalTeamId, playersById])

  async function onPickScorer(p) {
    if (matchLocked || !modal.goalTeamId) return
    try {
      await sendEvent({
        player_id: p.id,
        team_id: modal.goalTeamId,
        event_type: "goal",
      })
      closeModal()
    } catch (e) {
      setError(e.response?.data?.error || e.message || "Goal failed")
    }
  }

  async function finishMatch() {
    if (!matchId || matchLocked) return
    try {
      setError("")
      await api.patch(`/matches/${matchId}`, { status: "finished" })
      await loadCore()
    } catch (e) {
      setError(e.response?.data?.error || e.message || "No se pudo finalizar")
    }
  }

  const localName = match?.team_local?.name ?? "Team A"
  const visitorName = match?.team_visitor?.name ?? "Team B"

  const cardsSummary = useMemo(() => {
    const y = { local: 0, visitor: 0 }
    const r = { local: 0, visitor: 0 }
    if (!match) return { y, r }
    for (const ev of events) {
      const side =
        ev.team_id === match.team_local_id
          ? "local"
          : ev.team_id === match.team_visitor_id
            ? "visitor"
            : null
      if (!side) continue
      if (ev.event_type === "yellow_card") y[side]++
      if (ev.event_type === "red_card") r[side]++
    }
    return { y, r }
  }, [events, match])

  return (
    <div className="page live-match-page">
      <p className="breadcrumb">
        <Link to="/matches">← Matches</Link>
      </p>
      <h1>Live match #{matchId}</h1>

      {error ? <p className="msg msg-error">{error}</p> : null}

      {match ? (
        <>
          <Scoreboard
            teamLocalName={localName}
            teamVisitorName={visitorName}
            goalsLocal={match.goals_local}
            goalsVisitor={match.goals_visitor}
          />
          <div className="live-meta">
            <span>Estado: {match.status}</span>
            <span>
              Tarjetas — {localName}: 🟨 {cardsSummary.y.local} 🟥{" "}
              {cardsSummary.r.local} · {visitorName}: 🟨{" "}
              {cardsSummary.y.visitor} 🟥 {cardsSummary.r.visitor}
            </span>
          </div>

          <div className="live-actions-row" style={{justifyContent:"center"}}>
            
            {matchLocked ? (
              <h2 className="" style={{ textAlign: "center", margin: "0 auto", paddingBottom: "10px" }}>Partido cerrado — no se registran más eventos.</h2>
            ) : 
            <button
              type="button"
              className="btn btn-primary"
              disabled={matchLocked}
              onClick={finishMatch}
              style={{marginBottom:"10px"}}
            >
              Finalizar partido
            </button>
            }
          </div>

          {!matchLocked ? (
          <div className="goal-shortcuts">
            <button
              type="button"
              className="btn btn-goal btn-goal-a"
              disabled={matchLocked}
              onClick={() => openGoalForTeam(match.team_local_id)}
            >
              GOL — equipo local
            </button>
            <button
              type="button"
              className="btn btn-goal btn-goal-b"
              disabled={matchLocked}
              onClick={() => openGoalForTeam(match.team_visitor_id)}
            >
              GOL — visitante
            </button>
          </div>
          ): 
          <div className=""></div>
          }

          <div className="pitch" aria-label="Campo de fútbol">
            <div className="pitch-half-line" />
            <div className="pitch-arc-local" />
            {!matchLocked ? (

            <img className="pitch-balon" src="/balon.png" alt="Balón" />
          ) : 
          <img className="pitch-balon-stop" src="/balon.png" alt="Balón" />
          
          }
            <div className="pitch-arc-visitor" />
            <div className="pitch-center-circle" />
            {pitchSlots.local.map(({ player, entry, style }) => (
              <div
                key={`l-${entry.id}`}
                className="pitch-player-wrap pitch-player-wrap--local "
                style={{
                  left: style.left,
                  top: style.top,
                }}
              >
                <PlayerButton
                  player={player}
                  disabled={matchLocked}
                  cardStats={cardsByPlayerId[player.id]}
                  onClick={() => openPlayerActions(player, entry.team_id)}
                />
              </div>
            ))}
            {pitchSlots.visitor.map(({ player, entry, style }) => (
              <div
                key={`v-${entry.id}`}
                className="pitch-player-wrap pitch-player-wrap--visitor"
                style={{
                  left: style.left,
                  top: style.top,
                }}
              >
                <PlayerButton
                  player={player}
                  disabled={matchLocked}
                  cardStats={cardsByPlayerId[player.id]}
                  onClick={() => openPlayerActions(player, entry.team_id)}
                />
              </div>
            ))}
          </div>

          <div className="suplentes-row">
            <div className="suplentes-col text-center">
              <h3 className="suplentes-title">Suplentes — {localName}</h3>
              <div className="suplentes-list">
                {(benchByTeam[match.team_local_id] || []).map((be) => {
                  const p = playersById[be.player_id] || {
                    id: be.player_id,
                    name: `Player #${be.player_id}`,
                    photo_url: "",
                  }
                  return (
                    <PlayerButton
                      key={be.id}
                      player={p}
                      disabled={matchLocked}
                      cardStats={cardsByPlayerId[p.id]}
                      // onClick={() => openPlayerActions(p, be.team_id)}
                    />
                  )
                })}
                {!(benchByTeam[match.team_local_id] || []).length && (
                  <p className="muted">Sin suplentes.</p>
                )}
              </div>
            </div>

            <div className="suplentes-col">
              <h3 className="suplentes-title">Suplentes — {visitorName}</h3>
              <div className="suplentes-list">
                {(benchByTeam[match.team_visitor_id] || []).map((be) => {
                  const p = playersById[be.player_id] || {
                    id: be.player_id,
                    name: `Player #${be.player_id}`,
                    photo_url: "",
                  }
                  return (
                    <PlayerButton
                      key={be.id}
                      player={p}
                      disabled={matchLocked}
                      cardStats={cardsByPlayerId[p.id]}
                      // onClick={() => openPlayerActions(p, be.team_id)}
                    />
                  )
                })}
                {!(benchByTeam[match.team_visitor_id] || []).length && (
                  <p className="muted">Sin suplentes.</p>
                )}
              </div>
            </div>
          </div>

          <section className="panel panel--tight">
            <h2 className="panel-title">Eventos recientes</h2>
            <ul className="event-feed">
              {[...events].reverse().map((ev) => {
                const pname =
                  playersById[ev.player_id]?.name || `#${ev.player_id}`
                return (
                  <li key={ev.id}>
                    <code>{ev.event_type}</code> — {pname}{" "}
                    {ev.minute != null ? `(${ev.minute}′)` : ""}
                  </li>
                )
              })}
            </ul>
            {events.length === 0 ? (
              <p className="muted">Sin eventos todavía.</p>
            ) : null}
          </section>
        </>
      ) : (
        !error && <p className="msg">Loading match…</p>
      )}

      <Modal
        open={modal.open && modal.mode === "actions"}
        title={modal.player?.name}
        onClose={closeModal}
      >
        <p className="muted">Elige una acción para este jugador.</p>
        <div className="modal-actions">
          <button
            type="button"
            className="btn btn-primary"
            disabled={matchLocked}
            onClick={() => onAction("goal")}
          >
            Gol
          </button>
          <button
            type="button"
            className="btn"
            disabled={matchLocked}
            onClick={() => onAction("yellow_card")}
          >
            Tarjeta amarilla
          </button>
          <button
            type="button"
            className="btn"
            disabled={matchLocked}
            onClick={() => onAction("red_card")}
          >
            Tarjeta roja
          </button>
          <button
            type="button"
            className="btn"
            disabled={matchLocked}
            onClick={() => onAction("substitution")}
          >
            Cambio
          </button>
        </div>
      </Modal>

      <Modal
        open={modal.open && modal.mode === "sub"}
        title="Cambio — elige el jugador que entra"
        onClose={closeModal}
      >
        <p className="muted">Suplentes de este equipo.</p>
        <div className="modal-player-grid">
          {(benchByTeam[modal.player?._teamId] || []).map((be) => {
            const p = playersById[be.player_id] || {
              id: be.player_id,
              name: `Player #${be.player_id}`,
              photo_url: "",
            }
            return (
              <PlayerButton
                key={be.id}
                player={p}
                disabled={matchLocked}
                cardStats={cardsByPlayerId[p.id]}
                onClick={() => onSubPick(be)}
              />
            )
          })}
        </div>
        {!(benchByTeam[modal.player?._teamId] || []).length ? (
          <p className="muted">No hay suplentes en la alineación.</p>
        ) : null}
      </Modal>

      <Modal
        open={modal.open && modal.mode === "goalTeam"}
        title="Goleador"
        onClose={closeModal}
      >
        <p className="muted">Quién ha marcado.</p>
        <div className="modal-player-grid">
          {squadForGoalTeam.map((p) => (
            <PlayerButton
              key={p.id}
              player={p}
              disabled={matchLocked}
              onClick={() => onPickScorer(p)}
            />
          ))}
        </div>
      </Modal>
    </div>
  )
}

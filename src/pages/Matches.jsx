import { useCallback, useEffect, useMemo, useState } from "react"
import { useNavigate } from "react-router-dom"
import api from "../services/api.js"
import MatchCard from "../components/MatchCard.jsx"
import Modal from "../components/Modal.jsx"

function scheduledLocalToIso(localStr) {
  if (!localStr?.trim()) return null
  const d = new Date(localStr)
  if (Number.isNaN(d.getTime())) return null
  return d.toISOString()
}

function isoToDatetimeLocal(iso) {
  if (!iso) return ""
  const d = new Date(iso)
  if (Number.isNaN(d.getTime())) return ""
  const pad = (n) => String(n).padStart(2, "0")
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`
}

const PITCH_POSITIONS = [
  { value: "GK", label: "Portero" },
  { value: "DL", label: "Defensa izq." },
  { value: "DR", label: "Defensa dcha." },
  { value: "MID", label: "Medio" },
  { value: "FW", label: "Delantero" },
]

function defaultDraftForPlayers(players) {
  const sorted = [...players].sort((a, b) => a.id - b.id)
  const order = ["GK", "DL", "DR", "MID", "MID", "FW", "FW"]
  const d = {}
  sorted.forEach((p, i) => {
    if (i < order.length) {
      d[p.id] = { starter: true, position: order[i] }
    } else {
      d[p.id] = { starter: false, position: "BENCH" }
    }
  })
  return d
}

/**
 * Match list + create form with full lineup (titulares, posición en campo, suplentes).
 */
export default function Matches() {
  const navigate = useNavigate()
  const [matches, setMatches] = useState([])
  const [teams, setTeams] = useState([])
  const [localId, setLocalId] = useState("")
  const [visitorId, setVisitorId] = useState("")
  const [localPlayers, setLocalPlayers] = useState([])
  const [visitorPlayers, setVisitorPlayers] = useState([])
  const [draft, setDraft] = useState({})
  const [error, setError] = useState("")
  const [loading, setLoading] = useState(true)
  const [matchTitle, setMatchTitle] = useState("")
  const [matchScheduledLocal, setMatchScheduledLocal] = useState("")
  const [editingMatch, setEditingMatch] = useState(null)
  const [editTitle, setEditTitle] = useState("")
  const [editScheduledLocal, setEditScheduledLocal] = useState("")

  const loadMatches = useCallback(async () => {
    setError("")
    try {
      const { data } = await api.get("/matches")
      setMatches(Array.isArray(data) ? data : [])
    } catch (e) {
      setError(e.response?.data?.error || e.message || "Failed to load matches")
    }
  }, [])

  const localTeam = useMemo(
    () => teams.find((t) => t.id === Number(localId)),
    [teams, localId]
  )

  const visitorOptions = useMemo(() => {
    if (!localTeam)
      return teams.filter((t) => String(t.id) !== String(localId))
    return teams.filter(
      (t) =>
        t.id !== localTeam.id && t.category_id === localTeam.category_id
    )
  }, [teams, localTeam, localId])

  useEffect(() => {
    let cancelled = false
    ;(async () => {
      try {
        const { data } = await api.get("/teams")
        const list = Array.isArray(data) ? data : []
        if (!cancelled) {
          setTeams(list)
          if (list.length >= 2) {
            const first = list[0]
            const second =
              list.find(
                (t) =>
                  t.id !== first.id && t.category_id === first.category_id
              ) || list[1]
            setLocalId(String(first.id))
            setVisitorId(String(second.id))
          } else if (list.length === 1) {
            setLocalId(String(list[0].id))
          }
        }
      } catch (e) {
        if (!cancelled)
          setError(e.response?.data?.error || e.message || "Failed to load teams")
      } finally {
        if (!cancelled) setLoading(false)
      }
    })()
    return () => {
      cancelled = true
    }
  }, [])

  useEffect(() => {
    if (!visitorOptions.length) return
    const ok = visitorOptions.some((t) => String(t.id) === visitorId)
    if (!ok) setVisitorId(String(visitorOptions[0].id))
  }, [visitorOptions, visitorId])

  useEffect(() => {
    loadMatches()
  }, [loadMatches])

  useEffect(() => {
    if (!localId || !visitorId || localId === visitorId) {
      setLocalPlayers([])
      setVisitorPlayers([])
      return
    }
    let cancelled = false
    ;(async () => {
      try {
        const [lr, vr] = await Promise.all([
          api.get("/players", { params: { team_id: localId } }),
          api.get("/players", { params: { team_id: visitorId } }),
        ])
        if (cancelled) return
        setLocalPlayers(Array.isArray(lr.data) ? lr.data : [])
        setVisitorPlayers(Array.isArray(vr.data) ? vr.data : [])
      } catch (e) {
        if (!cancelled)
          setError(
            e.response?.data?.error || e.message || "Error cargando jugadores"
          )
      }
    })()
    return () => {
      cancelled = true
    }
  }, [localId, visitorId])

  useEffect(() => {
    if (!localPlayers.length || !visitorPlayers.length) {
      setDraft({})
      return
    }
    setDraft({
      ...defaultDraftForPlayers(localPlayers),
      ...defaultDraftForPlayers(visitorPlayers),
    })
  }, [localId, visitorId, localPlayers, visitorPlayers])

  async function handleCreate(e) {
    e.preventDefault()
    setError("")
    if (!localId || !visitorId || localId === visitorId) {
      setError("Elige dos equipos distintos de la misma categoría.")
      return
    }
    if (!localTeam || !visitorOptions.some((t) => String(t.id) === visitorId)) {
      setError("Los equipos deben ser de la misma categoría.")
      return
    }
    if (!localPlayers.length || !visitorPlayers.length) {
      setError("Ambos equipos deben tener jugadores.")
      return
    }
    const lid = Number(localId)
    const vid = Number(visitorId)
    // Merge draft with defaults so a race (draft aún vacío) no envía filas incompletas.
    const mergedDraft = {
      ...defaultDraftForPlayers(localPlayers),
      ...defaultDraftForPlayers(visitorPlayers),
      ...draft,
    }
    const entries = []

    for (const p of localPlayers) {
      const row = mergedDraft[p.id]
      if (!row) {
        setError(`Falta la fila de alineación para ${p.name}.`)
        return
      }
      entries.push({
        player_id: Number(p.id),
        team_id: lid,
        position: row.starter ? row.position : "BENCH",
        starter: Boolean(row.starter),
      })
    }
    for (const p of visitorPlayers) {
      const row = mergedDraft[p.id]
      if (!row) {
        setError(`Falta la fila de alineación para ${p.name}.`)
        return
      }
      entries.push({
        player_id: Number(p.id),
        team_id: vid,
        position: row.starter ? row.position : "BENCH",
        starter: Boolean(row.starter),
      })
    }

    const lStarters = entries.filter((x) => x.team_id === lid && x.starter)
      .length
    const vStarters = entries.filter((x) => x.team_id === vid && x.starter)
      .length
    if (lStarters < 1 || vStarters < 1) {
      setError("Cada equipo necesita al menos un titular.")
      return
    }

    try {
      const scheduledIso = scheduledLocalToIso(matchScheduledLocal)
      const body = {
        team_local_id: lid,
        team_visitor_id: vid,
      }
      const t = matchTitle.trim()
      if (t) body.title = t
      if (scheduledIso) body.scheduled_at = scheduledIso
      // 1) Crear partido. 2) Alineación vía POST /lineup (persistencia fiable en BD).
      const { data: created } = await api.post("/matches", body)
      await api.post(`/matches/${created.id}/lineup`, { entries })
      setMatchTitle("")
      setMatchScheduledLocal("")
      await loadMatches()
    } catch (err) {
      setError(
        err.response?.data?.error || err.message || "No se pudo crear el partido"
      )
    }
  }

  function renderLineupTable(teamLabel, players) {
    if (!players.length) {
      return <p className="muted">Sin jugadores en este equipo.</p>
    }
    return (
      <table className="lineup-table">
        <thead>
          <tr>
            <th>Jugador</th>
            <th>Titular</th>
            <th>Posición en campo</th>
          </tr>
        </thead>
        <tbody>
          {players.map((p) => {
            const row = draft[p.id] || {
              starter: false,
              position: "BENCH",
            }
            return (
              <tr key={p.id}>
                <td>{p.name}</td>
                <td>
                  <input
                    type="checkbox"
                    checked={row.starter}
                    onChange={(e) => {
                      const starter = e.target.checked
                      setDraft((d) => {
                        const cur = d[p.id] || {
                          starter: false,
                          position: "BENCH",
                        }
                        return {
                          ...d,
                          [p.id]: {
                            ...cur,
                            starter,
                            position: starter
                              ? cur.position === "BENCH"
                                ? "MID"
                                : cur.position
                              : "BENCH",
                          },
                        }
                      })
                    }}
                  />
                </td>
                <td>
                  {row.starter ? (
                    <select
                      className="field-control lineup-table-select"
                      value={row.position}
                      onChange={(e) =>
                        setDraft((d) => ({
                          ...d,
                          [p.id]: {
                            ...(d[p.id] || { starter: true, position: "MID" }),
                            position: e.target.value,
                          },
                        }))
                      }
                    >
                      {PITCH_POSITIONS.map((opt) => (
                        <option key={opt.value} value={opt.value}>
                          {opt.label}
                        </option>
                      ))}
                    </select>
                  ) : (
                    <span className="muted">Banquillo</span>
                  )}
                </td>
              </tr>
            )
          })}
        </tbody>
      </table>
    )
  }

  function openEditMatch(m) {
    setEditingMatch(m)
    setEditTitle(m.title || "")
    setEditScheduledLocal(isoToDatetimeLocal(m.scheduled_at))
  }

  async function handleSaveMatchEdit(e) {
    e.preventDefault()
    if (!editingMatch) return
    setError("")
    try {
      const scheduledIso = scheduledLocalToIso(editScheduledLocal)
      await api.patch(`/matches/${editingMatch.id}`, {
        title: editTitle.trim() || null,
        scheduled_at: scheduledIso,
      })
      setEditingMatch(null)
      await loadMatches()
    } catch (err) {
      setError(
        err.response?.data?.error || err.message || "No se pudo actualizar"
      )
    }
  }

  async function handleDeleteMatch(m) {
    if (
      !window.confirm(
        `¿Eliminar «${m.title?.trim() || `partido #${m.id}`}»? Se borrarán eventos y alineación.`
      )
    )
      return
    setError("")
    try {
      await api.delete(`/matches/${m.id}`)
      if (editingMatch?.id === m.id) setEditingMatch(null)
      await loadMatches()
    } catch (err) {
      setError(
        err.response?.data?.error || err.message || "No se pudo eliminar"
      )
    }
  }

  return (
    <div className="page">
      <h1>Partidos</h1>

      <Modal
        open={Boolean(editingMatch)}
        title={editingMatch ? "Editar partido" : ""}
        onClose={() => setEditingMatch(null)}
      >
        {editingMatch ? (
          <form className="form-stack" onSubmit={handleSaveMatchEdit}>
            <label className="field-label">
              Nombre del partido
              <input
                className="field-control"
                value={editTitle}
                onChange={(e) => setEditTitle(e.target.value)}
                placeholder="Ej. Semifinal A"
              />
            </label>
            <label className="field-label">
              Día y hora
              <input
                className="field-control"
                type="datetime-local"
                value={editScheduledLocal}
                onChange={(e) => setEditScheduledLocal(e.target.value)}
              />
            </label>
            <p className="muted small">
              Deja la fecha vacía para quitar la hora programada.
            </p>
            <div className="form-row">
              <button type="submit" className="btn btn-primary">
                Guardar
              </button>
              <button
                type="button"
                className="btn"
                onClick={() => setEditingMatch(null)}
              >
                Cancelar
              </button>
            </div>
          </form>
        ) : null}
      </Modal>

      <section className="panel">
        <h2 className="panel-title">Nuevo partido</h2>
        <form onSubmit={handleCreate}>
          <div className="form-row form-row--wrap">
            <label className="field-label">
              Nombre del partido (opcional)
              <input
                className="field-control"
                value={matchTitle}
                onChange={(e) => setMatchTitle(e.target.value)}
                placeholder="Ej. Final categoría B"
              />
            </label>
            <label className="field-label">
              Día y hora (opcional)
              <input
                className="field-control"
                type="datetime-local"
                value={matchScheduledLocal}
                onChange={(e) => setMatchScheduledLocal(e.target.value)}
              />
            </label>
          </div>
          <div className="form-row form-row--wrap">
            <label className="field-label">
              Equipo local
              <select
                className="field-control"
                value={localId}
                onChange={(e) => setLocalId(e.target.value)}
              >
                {teams.map((t) => (
                  <option key={t.id} value={t.id}>
                    {t.name} (cat. {t.category_id})
                  </option>
                ))}
              </select>
            </label>
            <label className="field-label">
              Equipo visitante (misma categoría)
              <select
                className="field-control"
                value={visitorId}
                onChange={(e) => setVisitorId(e.target.value)}
                disabled={!visitorOptions.length}
              >
                {visitorOptions.map((t) => (
                  <option key={t.id} value={t.id}>
                    {t.name}
                  </option>
                ))}
              </select>
            </label>
          </div>

          {localId &&
          visitorId &&
          localId !== visitorId &&
          localPlayers.length > 0 &&
          visitorPlayers.length > 0 ? (
            <div className="lineup-builder">
              <h3 className="lineup-builder-title">Alineación inicial</h3>
              <p className="muted small">
                Marca titulares y posición (portero, defensas, medio, delantero).
                El resto queda como suplente; en el partido en vivo podrás hacer
                cambios heredando la posición del jugador que sale.
              </p>
              <div className="lineup-builder-grid">
                <div>
                  <h4 className="lineup-team-heading">
                    {localTeam?.name ?? "Local"}
                  </h4>
                  {renderLineupTable("local", localPlayers)}
                </div>
                <div>
                  <h4 className="lineup-team-heading">
                    {teams.find((t) => t.id === Number(visitorId))?.name ??
                      "Visitante"}
                  </h4>
                  {renderLineupTable("visitor", visitorPlayers)}
                </div>
              </div>
            </div>
          ) : null}

          <div className="form-row" style={{ marginTop: "1rem" }}>
            <button type="submit" className="btn btn-primary">
              Crear partido con esta alineación
            </button>
          </div>
        </form>
      </section>

      {error ? <p className="msg msg-error">{error}</p> : null}
      {loading ? <p className="msg">Cargando…</p> : null}

      <section className="panel">
        <h2 className="panel-title">Calendario</h2>
        <div className="match-card-list">
          {matches.map((m) => (
            <MatchCard
              key={m.id}
              match={m}
              onOpenMatch={(id) => navigate(`/match/${id}`)}
              onEdit={openEditMatch}
              onDelete={handleDeleteMatch}
            />
          ))}
        </div>
        {!loading && matches.length === 0 ? (
          <p className="muted">No hay partidos.</p>
        ) : null}
      </section>
    </div>
  )
}

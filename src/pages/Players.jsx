import { useCallback, useEffect, useState } from "react"
import api from "../services/api.js"

const PLACEHOLDER =
  "data:image/svg+xml," +
  encodeURIComponent(
    '<svg xmlns="http://www.w3.org/2000/svg" width="48" height="48" viewBox="0 0 48 48"><rect fill="#ddd" width="48" height="48"/></svg>'
  )

/**
 * Player list with thumbnail preview and create form (name, photo URL, team).
 */
export default function Players() {
  const [players, setPlayers] = useState([])
  const [teams, setTeams] = useState([])
  const [filterTeamId, setFilterTeamId] = useState("")
  const [name, setName] = useState("")
  const [photoUrl, setPhotoUrl] = useState("")
  const [teamId, setTeamId] = useState("")
  const [error, setError] = useState("")
  const [loading, setLoading] = useState(true)

  const loadTeams = useCallback(async () => {
    const { data } = await api.get("/teams")
    const list = Array.isArray(data) ? data : []
    setTeams(list)
    if (list.length && !teamId) setTeamId(String(list[0].id))
  }, [teamId])

  const loadPlayers = useCallback(async () => {
    setError("")
    try {
      const params = {}
      if (filterTeamId) params.team_id = Number(filterTeamId)
      const { data } = await api.get("/players", { params })
      setPlayers(Array.isArray(data) ? data : [])
    } catch (e) {
      setError(e.response?.data?.error || e.message || "Failed to load players")
    }
  }, [filterTeamId])

  useEffect(() => {
    let cancelled = false
    ;(async () => {
      try {
        await loadTeams()
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
  }, [loadTeams])

  useEffect(() => {
    loadPlayers()
  }, [loadPlayers])

  async function handleCreate(e) {
    e.preventDefault()
    setError("")
    if (!name.trim() || !teamId) {
      setError("Name and team are required.")
      return
    }
    try {
      const body = {
        name: name.trim(),
        team_id: Number(teamId),
      }
      if (photoUrl.trim()) body.photo_url = photoUrl.trim()
      await api.post("/players", body)
      setName("")
      setPhotoUrl("")
      await loadPlayers()
    } catch (err) {
      setError(
        err.response?.data?.error || err.message || "Could not create player"
      )
    }
  }

  return (
    <div className="page">
      <h1>Players</h1>

      <section className="panel">
        <h2 className="panel-title">Filter by team</h2>
        <select
          className="field-control field-control--inline"
          value={filterTeamId}
          onChange={(e) => setFilterTeamId(e.target.value)}
        >
          <option value="">All teams</option>
          {teams.map((t) => (
            <option key={t.id} value={t.id}>
              {t.name}
            </option>
          ))}
        </select>
      </section>

      <section className="panel">
        <h2 className="panel-title">New player</h2>
        <form className="form-stack" onSubmit={handleCreate}>
          <label className="field-label">
            name
            <input
              className="field-control"
              value={name}
              onChange={(e) => setName(e.target.value)}
            />
          </label>
          <label className="field-label">
            photo_url
            <input
              className="field-control"
              value={photoUrl}
              onChange={(e) => setPhotoUrl(e.target.value)}
              placeholder="https://…"
            />
          </label>
          <label className="field-label">
            team_id
            <select
              className="field-control"
              value={teamId}
              onChange={(e) => setTeamId(e.target.value)}
            >
              {teams.map((t) => (
                <option key={t.id} value={t.id}>
                  {t.name} ({t.id})
                </option>
              ))}
            </select>
          </label>
          <button type="submit" className="btn btn-primary">
            Create
          </button>
        </form>
      </section>

      {error ? <p className="msg msg-error">{error}</p> : null}
      {loading ? <p className="msg">Loading…</p> : null}

      <section className="panel">
        <h2 className="panel-title">Roster</h2>

        <div className="row">
            {players.map((p) => (
          <div className="col-4">

            <dic key={p.id} className="card m-1 p-3 text-center bg-dark panel">
              <img
                className="player-list-photo "
                src={p.photo_url?.trim() ? p.photo_url : PLACEHOLDER}
                alt=""
                onError={(e) => {
                  e.currentTarget.src = PLACEHOLDER
                }}
              />
              <div className="player-list-text">
                <strong>{p.name}</strong>
                <span className="muted">team #{p.team_id}</span>
              </div>
            </dic>
        </div>

          ))}
        </div>
        <ul className="player-list">
          
        </ul>
        {!loading && players.length === 0 ? (
          <p className="muted">No players yet.</p>
        ) : null}
      </section>
    </div>
  )
}

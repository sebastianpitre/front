import { useCallback, useEffect, useState } from "react"
import api from "../services/api.js"
import Modal from "../components/Modal.jsx"

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
  const [editing, setEditing] = useState(null)
  const [editName, setEditName] = useState("")
  const [editPhotoUrl, setEditPhotoUrl] = useState("")
  const [editTeamId, setEditTeamId] = useState("")
const [openCreate, setOpenCreate] = useState(false)

  const defaultPhotos = [
  "https://publish.realmadrid.com/content/dam/portals/realmadrid-com/es-es/sports/football/3kq9cckrnlogidldtdie2fkbl/players/thibaut-courtois/assets/COURTOIS_550x650_SinParche.png",
  "https://img.uefa.com/imgml/TP/players/1/2026/cutoff/97923.webp",
  "https://backend.liverpoolfc.com/sites/default/files/styles/lg/public/2025-08/virgil-van-dijk-2526-bodyshot_eb62918c7334e39f7ba555d572aa7975.png?itok=gxhxmIe8",
  "https://img.uefa.com/imgml/TP/players/1/2026/cutoff/250058220.webp",
  "https://static.wikia.nocookie.net/liverpoolfc/images/4/4b/TAA2024.png/revision/latest?cb=20240830094039",
  "https://img.fcbayern.com/image/upload/f_auto/q_auto/t_cms-6x9-seo/v1656615722/cms/public/images/fcbayern-com/players/spielerportraits/ganzkoerper/alphonso_davies.png",
  "https://img.uefa.com/imgml/TP/players/1/2026/cutoff/250082664.webp",
  "https://img.uefa.com/imgml/TP/players/1/2026/cutoff/250181610.webp",
  "https://publish.realmadrid.com/content/dam/portals/realmadrid-com/es-es/sports/football/3kq9cckrnlogidldtdie2fkbl/players/jude-bellingham/assets/BELLINGHAM_EQUIPO_CARITA_380x501_SinParche.png",
  "https://crystalpng.com/wp-content/uploads/2025/02/Kevin-De-Bruyne-png-02.png",
  "https://img.uefa.com/imgml/TP/players/1/2026/cutoff/250121533.webp",
  "https://img.uefa.com/imgml/TP/players/1/2026/cutoff/250076574.webp",
  "https://img.uefa.com/imgml/TP/players/1/2026/cutoff/250103758.webp",
  "https://www.cariverplate.com.ar/imagenes/jugadores/2025-07/1640-653x667.png",
  "https://png.pngtree.com/png-vector/20250728/ourmid/pngtree-messi-argentina-high-energy-action-dynamic-pose-vibrant-colors-intense-lighting-png-image_16885439.webp",
  "https://images-wixmp-ed30a86b8c4ca887773594c2.wixmp.com/f/acb5cb15-636b-4bd5-a06e-a62420c5fb7f/db6kv6o-ad89c20a-b626-416d-87be-84c50f504566.png/v1/fill/w_600,h_1170/cristiano_ronaldo_png_by_kooyooss_db6kv6o-fullview.png?token=eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9.eyJzdWIiOiJ1cm46YXBwOjdlMGQxODg5ODIyNjQzNzNhNWYwZDQxNWVhMGQyNmUwIiwiaXNzIjoidXJuOmFwcDo3ZTBkMTg4OTgyMjY0MzczYTVmMGQ0MTVlYTBkMjZlMCIsIm9iaiI6W1t7ImhlaWdodCI6Ijw9MTE3MCIsInBhdGgiOiIvZi9hY2I1Y2IxNS02MzZiLTRiZDUtYTA2ZS1hNjI0MjBjNWZiN2YvZGI2a3Y2by1hZDg5YzIwYS1iNjI2LTQxNmQtODdiZS04NGM1MGY1MDQ1NjYucG5nIiwid2lkdGgiOiI8PTYwMCJ9XV0sImF1ZCI6WyJ1cm46c2VydmljZTppbWFnZS5vcGVyYXRpb25zIl19.tLT1OITrSPU1NCOIX3lVapdHFwipIhrjVz3aiiixSBM",

];


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

  function openEdit(p) {
    setEditing(p)
    setEditName(p.name)
    setEditPhotoUrl(p.photo_url || "")
    setEditTeamId(String(p.team_id))
  }

  async function handleSaveEdit(e) {
    e.preventDefault()
    if (!editing) return
    setError("")
    try {
      const body = {
        name: editName.trim(),
        team_id: Number(editTeamId),
      }
      body.photo_url = editPhotoUrl.trim() || null
      await api.patch(`/players/${editing.id}`, body)
      setEditing(null)
      await loadPlayers()
    } catch (err) {
      setError(
        err.response?.data?.error || err.message || "No se pudo guardar el jugador"
      )
    }
  }

  async function handleDelete(p) {
    if (
      !window.confirm(
        `¿Eliminar a «${p.name}»? Se quitará de alineaciones y eventos.`
      )
    )
      return
    setError("")
    try {
      await api.delete(`/players/${p.id}`)
      await loadPlayers()
    } catch (err) {
      setError(
        err.response?.data?.error || err.message || "No se pudo eliminar"
      )
    }
  }

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
      setOpenCreate(false)
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

      <Modal
        open={Boolean(editing)}
        title={editing ? `Editar: ${editing.name}` : ""}
        onClose={() => setEditing(null)}
      >
        {editing ? (
          <form className="form-stack" onSubmit={handleSaveEdit}>
            <label className="field-label">
              Nombre
              <input
                className="field-control"
                value={editName}
                onChange={(e) => setEditName(e.target.value)}
              />
            </label>
            <label className="field-label">
              Foto (URL)
              <input
                className="field-control"
                value={editPhotoUrl}
                onChange={(e) => setEditPhotoUrl(e.target.value)}
                placeholder="https://…"
              />
            </label>
            <label className="field-label">
              Equipo
              <select
                className="field-control"
                value={editTeamId}
                onChange={(e) => setEditTeamId(e.target.value)}
              >
                {teams.map((t) => (
                  <option key={t.id} value={t.id}>
                    {t.name}
                  </option>
                ))}
              </select>
            </label>
            <div className="form-row">
              <button type="submit" className="btn btn-primary">
                Guardar
              </button>
              <button
                type="button"
                className="btn"
                onClick={() => setEditing(null)}
              >
                Cancelar
              </button>
            </div>
          </form>
        ) : null}
      </Modal>

      <section className="panel">
        <h2 className="panel-title">Filter by team</h2>
        <select
          className="field-control field-control--inline"
          value={filterTeamId}
          onChange={(e) => setFilterTeamId(e.target.value)}
          style={{MaxWidth:"10px"}}
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
        <h2 className="panel-title">Players</h2>

        <button
          className="btn btn-primary"
          onClick={() => setOpenCreate(true)}
        >
          + New Player
        </button>
      </section>

      <Modal
        open={openCreate}
        title="New Player"
        onClose={() => setOpenCreate(false)}
      >
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

          <div className="players-grid">
            {defaultPhotos.map((url) => (
              <div className="player-box" key={url}>
                <img
                  src={url}
                  alt=""
                  className={`photo-option ${photoUrl === url ? "active" : ""}`}
                  onClick={() => setPhotoUrl(url)}
                />
              </div>
            ))}
          </div>

          <label className="field-label">
            team
            <select
              className="field-control"
              value={teamId}
              onChange={(e) => setTeamId(e.target.value)}
            >
              {teams.map((t) => (
                <option key={t.id} value={t.id}>
                  {t.name}
                </option>
              ))}
            </select>
          </label>

          <div className="form-row">
            <button type="submit" className="btn btn-primary">
              Create
            </button>

            <button
              type="button"
              className="btn"
              onClick={() => setOpenCreate(false)}
            >
              Cancel
            </button>
          </div>
        </form>
      </Modal>

      {error ? <p className="msg msg-error">{error}</p> : null}
      {loading ? <p className="msg">Loading…</p> : null}

      <section className="panel">
        <h2 className="panel-title">Roster</h2>

        <div className="row">
          {players.map((p) => (
            <div key={p.id} className="col-6 col-sm-4 col-md-4 col-lg-3">
              <div className="card m-1 p-3 text-center bg-dark panel player-card-tile">
                <div
                  className="player-list-photo"
                  style={{
                    backgroundImage: `url(${p.photo_url?.trim() ? p.photo_url : PLACEHOLDER})`,
                    backgroundSize: "cover",
                    backgroundPosition: "top",
                    backgroundRepeat: "no-repeat"
                  }}
                />

                <div className="player-list-text">
                <strong>{p.name}</strong>
                <span className="muted">
                {teams.find(t => t.id === p.team_id)?.name || "Sin equipo"} 🚩
                </span>
              </div>

                <div className="table-actions player-card-actions">
                  <button
                    type="button"
                    className="btn btn-small"
                    onClick={() => openEdit(p)}
                  >
                    Editar
                  </button>
                  <button
                    type="button"
                    className="btn btn-small"
                    onClick={() => handleDelete(p)}
                  >
                    Borrar
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
        <ul className="player-list" />
        {!loading && players.length === 0 ? (
          <p className="muted">No players yet.</p>
        ) : null}
      </section>
    </div>
  )
}

import { useCallback, useEffect, useMemo, useState } from "react"
import api from "../services/api.js"
import TeamTable from "../components/TeamTable.jsx"

/**
 * Builds wins / draws / losses from finished matches where both clubs are in the category.
 */
function computeWdl(teamIds, finishedMatches) {
  const wdl = {}
  teamIds.forEach((id) => {
    wdl[id] = { wins: 0, draws: 0, losses: 0 }
  })
  for (const m of finishedMatches) {
    if (!teamIds.has(m.team_local_id) || !teamIds.has(m.team_visitor_id)) {
      continue
    }
    const gl = m.goals_local ?? 0
    const gv = m.goals_visitor ?? 0
    const L = m.team_local_id
    const V = m.team_visitor_id
    if (gl > gv) {
      wdl[L].wins += 1
      wdl[V].losses += 1
    } else if (gl < gv) {
      wdl[V].wins += 1
      wdl[L].losses += 1
    } else {
      wdl[L].draws += 1
      wdl[V].draws += 1
    }
  }
  return wdl
}

/**
 * Standings from GET /standings (requires category_id); W/D/L merged from finished fixtures.
 */
export default function Standings() {
  const [categories, setCategories] = useState([])
  const [categoryId, setCategoryId] = useState("")
  const [rows, setRows] = useState([])
  const [error, setError] = useState("")
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    let cancelled = false
    ;(async () => {
      try {
        const { data } = await api.get("/categories")
        if (cancelled) return
        const list = Array.isArray(data) ? data : []
        setCategories(list)
        if (list.length) {
          setCategoryId((prev) => prev || String(list[0].id))
        }
      } catch (e) {
        if (!cancelled)
          setError(
            e.response?.data?.error || e.message || "Failed to load categories"
          )
      }
    })()
    return () => {
      cancelled = true
    }
  }, [])

  const loadStandings = useCallback(async () => {
    if (!categoryId) return
    setLoading(true)
    setError("")
    try {
      const cid = Number(categoryId)
      const [standRes, teamsRes, matchRes] = await Promise.all([
        api.get("/standings", { params: { category_id: cid } }),
        api.get("/teams", { params: { category_id: cid } }),
        api.get("/matches", { params: { status: "finished" } }),
      ])
      const standings = Array.isArray(standRes.data) ? standRes.data : []
      const teams = Array.isArray(teamsRes.data) ? teamsRes.data : []
      const teamIds = new Set(teams.map((t) => t.id))
      const finished = Array.isArray(matchRes.data) ? matchRes.data : []
      const wdl = computeWdl(teamIds, finished)

      const merged = standings.map((r) => ({
        ...r,
        wins: wdl[r.team_id]?.wins ?? 0,
        draws: wdl[r.team_id]?.draws ?? 0,
        losses: wdl[r.team_id]?.losses ?? 0,
      }))
      setRows(merged)
    } catch (e) {
      setError(
        e.response?.data?.error ||
          e.message ||
          "Failed to load standings (is category_id valid?)"
      )
      setRows([])
    } finally {
      setLoading(false)
    }
  }, [categoryId])

  useEffect(() => {
    loadStandings()
  }, [loadStandings])

  const columns = useMemo(
    () => [
      { key: "position", label: "#" },
      { key: "team_name", label: "Team" },
      { key: "played", label: "MP" },
      { key: "wins", label: "W" },
      { key: "draws", label: "D" },
      { key: "losses", label: "L" },
      { key: "goals_for", label: "GF" },
      { key: "goals_against", label: "GA" },
      { key: "points", label: "Pts" },
    ],
    []
  )

  return (
    <div className="page">
      <h1>Standings</h1>
      <section className="panel">
        <h2 className="panel-title">Category</h2>
        <label className="field-label">
          Filter by category
          <select
            className="field-control field-control--inline"
            value={categoryId}
            onChange={(e) => setCategoryId(e.target.value)}
          >
            {categories.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name}
              </option>
            ))}
          </select>
        </label>
        <p className="muted small">
          The API requires <code>category_id</code> for /standings; W/D/L are
          derived from finished matches in this category.
        </p>
      </section>

      {error ? <p className="msg msg-error">{error}</p> : null}
      {loading ? <p className="msg">Loading…</p> : null}

      <section className="panel">
        <h2 className="panel-title">Table</h2>
        {!categoryId && categories.length === 0 ? (
          <p className="muted">Create a category in the API first.</p>
        ) : null}
        <TeamTable columns={columns} rows={rows} rowKey={(r) => r.team_id} />
      </section>
    </div>
  )
}

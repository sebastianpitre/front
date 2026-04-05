import { useCallback, useEffect, useState } from "react"
import api from "../services/api.js"
import TeamTable from "../components/TeamTable.jsx"

/**
 * Lists teams and creates new ones tied to a category.
 */
export default function Teams() {
  const [teams, setTeams] = useState([])
  const [categories, setCategories] = useState([])
  const [filterCategoryId, setFilterCategoryId] = useState("")
  const [name, setName] = useState("")
  const [categoryId, setCategoryId] = useState("")
  const [error, setError] = useState("")
  const [loading, setLoading] = useState(true)

  const loadTeams = useCallback(async () => {
    setError("")
    try {
      const params = {}
      if (filterCategoryId) params.category_id = Number(filterCategoryId)
      const { data } = await api.get("/teams", { params })
      setTeams(Array.isArray(data) ? data : [])
    } catch (e) {
      setError(e.response?.data?.error || e.message || "Failed to load teams")
    }
  }, [filterCategoryId])

  useEffect(() => {
    let cancelled = false
    ;(async () => {
      try {
        const { data } = await api.get("/categories")
        if (!cancelled) {
          const list = Array.isArray(data) ? data : []
          setCategories(list)
          if (list.length) {
            setCategoryId((prev) => prev || String(list[0].id))
          }
        }
      } catch (e) {
        if (!cancelled)
          setError(
            e.response?.data?.error || e.message || "Failed to load categories"
          )
      } finally {
        if (!cancelled) setLoading(false)
      }
    })()
    return () => {
      cancelled = true
    }
  }, [])

  useEffect(() => {
    loadTeams()
  }, [loadTeams])

  async function handleCreate(e) {
    e.preventDefault()
    setError("")
    if (!name.trim() || !categoryId) {
      setError("Name and category are required.")
      return
    }
    try {
      await api.post("/teams", {
        name: name.trim(),
        category_id: Number(categoryId),
      })
      setName("")
      await loadTeams()
    } catch (err) {
      setError(
        err.response?.data?.error || err.message || "Could not create team"
      )
    }
  }

  const columns = [
    { key: "id", label: "ID" },
    { key: "name", label: "Name" },
    { key: "category_id", label: "Category ID" },
  ]

  return (
    <div className="page">
      <h1>Teams</h1>

      <section className="panel">
        <h2 className="panel-title">Filter</h2>
        <label className="field-label">
          Category
          <select
            className="field-control"
            value={filterCategoryId}
            onChange={(e) => setFilterCategoryId(e.target.value)}
          >
            <option value="">All categories</option>
            {categories.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name}
              </option>
            ))}
          </select>
        </label>
      </section>

      <section className="panel">
        <h2 className="panel-title">New team</h2>
        <form className="form-row" onSubmit={handleCreate}>
          <label className="field-label">
            Name
            <input
              className="field-control"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. 3º A"
            />
          </label>
          <label className="field-label">
            category_id
            <select
              className="field-control"
              value={categoryId}
              onChange={(e) => setCategoryId(e.target.value)}
            >
              {categories.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name} ({c.id})
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
        <h2 className="panel-title">All teams</h2>
        <TeamTable columns={columns} rows={teams} rowKey={(r) => r.id} />
      </section>
    </div>
  )
}

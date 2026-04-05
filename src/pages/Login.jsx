import { useEffect, useState } from "react"
import { useLocation, useNavigate } from "react-router-dom"
import api from "../services/api.js"
import { AUTH_DISABLED } from "../config.js"
import { useAuth } from "../context/AuthContext.jsx"

export default function Login() {
  const { setToken, isAuthenticated } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()
  const from = location.state?.from?.pathname || "/"

  const [password, setPassword] = useState("")
  const [error, setError] = useState("")

  useEffect(() => {
    if (AUTH_DISABLED || isAuthenticated) {
      navigate(from, { replace: true })
    }
  }, [isAuthenticated, from, navigate])

  if (AUTH_DISABLED || isAuthenticated) {
    return null
  }

  async function handleSubmit(e) {
    e.preventDefault()
    setError("")
    try {
      const { data } = await api.post("/auth/login", { password })
      if (data?.token) setToken(data.token)
      navigate(from, { replace: true })
    } catch (err) {
      const msg =
        err.response?.data?.error ||
        err.message ||
        "No se pudo iniciar sesión"
      setError(msg)
    }
  }

  return (
    <div className="page login-page">
      <div className="panel login-panel">
        <h1 className="login-title">Intercursos</h1>
        <p className="muted small">
          Introduce la contraseña de administración para acceder al panel.
        </p>
        <form className="form-stack" onSubmit={handleSubmit}>
          <label className="field-label">
            Contraseña
            <input
              className="field-control"
              type="password"
              autoComplete="current-password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
          </label>
          {error ? <p className="msg msg-error">{error}</p> : null}
          <button type="submit" className="btn btn-primary">
            Entrar
          </button>
        </form>
      </div>
    </div>
  )
}

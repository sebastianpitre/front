import { Navigate, Outlet, useLocation } from "react-router-dom"
import { AUTH_DISABLED } from "../config.js"
import { useAuth } from "../context/AuthContext.jsx"

export default function ProtectedRoute() {
  const { isAuthenticated } = useAuth()
  const location = useLocation()

  if (AUTH_DISABLED) return <Outlet />

  if (!isAuthenticated) {
    return <Navigate to="/login" replace state={{ from: location }} />
  }

  return <Outlet />
}

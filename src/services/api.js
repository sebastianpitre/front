import axios from "axios"
import { AUTH_DISABLED, TOKEN_STORAGE_KEY } from "../config.js"

/**
 * Shared Axios instance for the Flask REST API.
 * All paths are relative to the base URL (e.g. get("/teams")).
 */
const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || "http://localhost:5000",
  headers: {
    "Content-Type": "application/json",
  },
})

api.interceptors.request.use((config) => {
  if (AUTH_DISABLED) return config
  const t = localStorage.getItem(TOKEN_STORAGE_KEY)
  if (t) {
    config.headers.Authorization = `Bearer ${t}`
  }
  return config
})

api.interceptors.response.use(
  (res) => res,
  (err) => {
    if (AUTH_DISABLED) return Promise.reject(err)
    if (err.response?.status === 401) {
      const url = String(err.config?.url || "")
      if (!url.includes("/auth/login")) {
        localStorage.removeItem(TOKEN_STORAGE_KEY)
        if (!window.location.pathname.startsWith("/login")) {
          window.location.assign("/login")
        }
      }
    }
    return Promise.reject(err)
  }
)

export default api

/* eslint-disable react-refresh/only-export-components -- provider + useAuth hook */
import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useState,
} from "react"
import { AUTH_DISABLED, TOKEN_STORAGE_KEY } from "../config.js"

const AuthContext = createContext(null)

export function AuthProvider({ children }) {
  const [token, setTokenState] = useState(() =>
    AUTH_DISABLED ? "disabled" : localStorage.getItem(TOKEN_STORAGE_KEY) || ""
  )

  const setToken = useCallback((t) => {
    if (AUTH_DISABLED) {
      setTokenState("disabled")
      return
    }
    setTokenState(t)
    if (t) localStorage.setItem(TOKEN_STORAGE_KEY, t)
    else localStorage.removeItem(TOKEN_STORAGE_KEY)
  }, [])

  const logout = useCallback(() => {
    if (AUTH_DISABLED) return
    setTokenState("")
    localStorage.removeItem(TOKEN_STORAGE_KEY)
  }, [])

  const value = useMemo(
    () => ({
      token,
      setToken,
      logout,
      isAuthenticated: AUTH_DISABLED || Boolean(token),
    }),
    [token, setToken, logout]
  )

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error("useAuth must be used within AuthProvider")
  return ctx
}

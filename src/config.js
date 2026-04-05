/** When "1", skip login UI and do not send Bearer (pair with backend DISABLE_AUTH=1). */
export const AUTH_DISABLED = import.meta.env.VITE_DISABLE_AUTH === "1"

export const TOKEN_STORAGE_KEY = "intercursos_token"

import axios from "axios"

/**
 * Shared Axios instance for the Flask REST API.
 * All paths are relative to the base URL (e.g. get("/teams")).
 */
const api = axios.create({
  baseURL: "http://localhost:5000",
  headers: {
    "Content-Type": "application/json",
  },
})

export default api

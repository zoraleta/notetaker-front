import axios from 'axios'

export const http = axios.create({
  baseURL: import.meta.env.VITE_API_URL,
})

http.interceptors.request.use((config) => {
  const token = localStorage.getItem('token')
  if (token) {
    config.headers.Authorization = `Bearer ${token}`
  }
  return config
})

http.interceptors.response.use(
  (res) => res,
  (err) => {
    if (err.response?.status === 401) {
      localStorage.removeItem('token')
      const from = encodeURIComponent(window.location.pathname)
      window.location.href = `/login?from=${from}`
    }
    return Promise.reject(err)
  },
)

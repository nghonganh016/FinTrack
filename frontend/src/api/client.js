import axios from 'axios'

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL
    || `http://${window.location.hostname}:3001/api`,
})

api.interceptors.request.use((cfg) => {
  const token = localStorage.getItem('fintrack_token')
  if (token) cfg.headers.Authorization = `Bearer ${token}`
  return cfg
})

api.interceptors.response.use(
  (r) => r,
  (err) => {
    if (err.response?.status === 401) {
      localStorage.removeItem('fintrack_token')
      localStorage.removeItem('fintrack_user')
      window.location.href = '/login'
    }
    return Promise.reject(err)
  }
)

export default api

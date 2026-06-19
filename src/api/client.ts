import axios from 'axios'

const API_URL = import.meta.env.VITE_API_URL ?? 'https://nexo-backend-production-311b.up.railway.app/api/v1'

export const api = axios.create({
  baseURL: API_URL,
  withCredentials: false,
})

api.interceptors.request.use((config) => {
  const token = localStorage.getItem('nexo_admin_token')
  if (token) config.headers.Authorization = `Bearer ${token}`
  return config
})

api.interceptors.response.use(
  (res) => res,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('nexo_admin_token')
      window.location.href = '/login'
    }
    return Promise.reject(error)
  }
)

// Auth
export const authApi = {
  login: (email: string, password: string) =>
    api.post('/auth/login', { email, password }),
}

// Admin
export const adminApi = {
  getStats: () => api.get('/admin/stats'),
  getUsers: (params?: Record<string, string>) =>
    api.get('/admin/users', { params }),
  getUser: (id: string) => api.get(`/admin/users/${id}`),
  blockUser: (id: string, reason: string) =>
    api.patch(`/admin/users/${id}/block`, { reason }),
  unblockUser: (id: string) => api.patch(`/admin/users/${id}/unblock`),
  deleteUser: (id: string) => api.delete(`/admin/users/${id}`),
  getPendingPhotos: (params?: Record<string, string>) =>
    api.get('/admin/photos/pending', { params }),
  approvePhoto: (id: string) => api.patch(`/admin/photos/${id}/approve`),
  deletePhoto: (id: string) => api.delete(`/admin/photos/${id}`),
  getReports: (params?: Record<string, string>) =>
    api.get('/admin/reports', { params }),
  updateReport: (id: string, data: { status: string; adminNote?: string }) =>
    api.patch(`/admin/reports/${id}`, data),
}

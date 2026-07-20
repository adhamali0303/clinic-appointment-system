// frontend/src/api/apiClient.ts
import axios from 'axios'
import { useAuthStore } from '../store/authStore'

export const apiClient = axios.create({
  baseURL: 'http://localhost:8080',
})

apiClient.interceptors.request.use((config) => {
  const token = useAuthStore.getState().token
  if (token) {
    config.headers.Authorization = `Bearer ${token}`
  }
  return config
})

apiClient.interceptors.response.use(
  (response) => response,
  (error) => {
    const hadToken = useAuthStore.getState().token !== null
    const onLoginPage = window.location.pathname === '/login'
    if (error.response?.status === 403 && hadToken && !onLoginPage) {
      useAuthStore.getState().logout()
      window.location.href = '/login'
    }
    return Promise.reject(error)
  },
)

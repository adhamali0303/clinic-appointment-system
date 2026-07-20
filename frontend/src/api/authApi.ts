// frontend/src/api/authApi.ts
import { apiClient } from './apiClient'
import type { Role } from '../store/authStore'

export interface AuthResponse {
  token: string
  email: string
  role: Role
}

export const authApi = {
  login: async (email: string, password: string): Promise<AuthResponse> => {
    const { data } = await apiClient.post<AuthResponse>('/api/v1/auth/login', {
      email,
      password,
    })
    return data
  },

  register: async (
    name: string,
    email: string,
    password: string,
    role: Role,
  ): Promise<AuthResponse> => {
    const { data } = await apiClient.post<AuthResponse>('/api/v1/auth/register', {
      name,
      email,
      password,
      role,
    })
    return data
  },
}

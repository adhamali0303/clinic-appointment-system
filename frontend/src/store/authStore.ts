// frontend/src/store/authStore.ts
import { create } from 'zustand'
import { persist } from 'zustand/middleware'

export type Role = 'ADMIN' | 'RECEPTIONIST' | 'DOCTOR'

interface AuthData {
  token: string
  email: string
  role: Role
}

interface AuthState {
  token: string | null
  email: string | null
  role: Role | null
  setAuth: (auth: AuthData) => void
  logout: () => void
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      token: null,
      email: null,
      role: null,
      setAuth: ({ token, email, role }) => set({ token, email, role }),
      logout: () => set({ token: null, email: null, role: null }),
    }),
    { name: 'clinic-auth' },
  ),
)

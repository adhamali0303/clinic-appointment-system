// frontend/src/pages/LoginPage.tsx
import { useState, type FormEvent } from 'react'
import { useNavigate } from 'react-router-dom'
import axios from 'axios'
import { authApi } from '../api/authApi'
import { useAuthStore, type Role } from '../store/authStore'
import { Avatar } from '../components/Avatar'

interface DemoAccount {
  name: string
  email: string
  role: Role
}

const DEMO_ACCOUNTS: DemoAccount[] = [
  { name: 'Amara Okafor', email: 'admin@medclinique.com', role: 'ADMIN' },
  { name: 'Priya Nandan', email: 'reception@medclinique.com', role: 'RECEPTIONIST' },
  { name: 'Dr. Sarah Chen', email: 'doctor@medclinique.com', role: 'DOCTOR' },
]

const roleBadgeClasses: Record<Role, string> = {
  ADMIN: 'bg-navy-50 text-navy-600',
  RECEPTIONIST: 'bg-teal-50 text-teal-700',
  DOCTOR: 'bg-emerald-50 text-emerald-700',
}

export function LoginPage() {
  const navigate = useNavigate()
  const setAuth = useAuthStore((s) => s.setAuth)

  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [submitting, setSubmitting] = useState(false)

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault()
    setError(null)
    setSubmitting(true)
    try {
      const result = await authApi.login(email, password)
      setAuth(result)
      navigate('/dashboard')
    } catch (err) {
      if (axios.isAxiosError(err) && (err.response?.status === 400 || err.response?.status === 403)) {
        setError('Invalid email or password. Please try again.')
      } else {
        setError('Something went wrong. Please try again later.')
      }
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="flex min-h-screen">
      <div className="relative hidden w-1/2 flex-col justify-between overflow-hidden bg-gradient-to-br from-navy-800 via-navy-700 to-teal-600 p-12 text-white lg:flex">
        <div className="flex items-center gap-2">
          <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-teal-400/90 text-lg font-bold text-navy-900">
            M
          </div>
          <span className="text-xl font-semibold tracking-tight">MedClinique</span>
        </div>

        <div className="max-w-md">
          <h1 className="text-4xl font-semibold leading-tight tracking-tight">
            Streamlined clinic care, beautifully organized.
          </h1>
          <p className="mt-4 text-navy-100">
            Role-aware scheduling for doctors, receptionists, and admins — one calendar, always in
            sync.
          </p>
        </div>

        <div className="flex gap-3 text-sm text-navy-200">
          <span className="rounded-full bg-white/10 px-3 py-1">Doctors</span>
          <span className="rounded-full bg-white/10 px-3 py-1">Patients</span>
          <span className="rounded-full bg-white/10 px-3 py-1">Appointments</span>
        </div>
      </div>

      <div className="flex w-full flex-col items-center justify-center bg-white px-6 py-12 lg:w-1/2">
        <div className="w-full max-w-sm">
          <h2 className="text-2xl font-semibold text-gray-900">Welcome back</h2>
          <p className="mt-1 text-sm text-gray-500">Sign in to your MedClinique account</p>

          <form onSubmit={handleSubmit} className="mt-8 space-y-4">
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-gray-700">
                Email
              </label>
              <input
                id="email"
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="mt-1 w-full rounded-lg border border-gray-200 px-3 py-2 text-sm focus:border-teal-500 focus:outline-none focus:ring-1 focus:ring-teal-500"
                placeholder="you@example.com"
              />
            </div>
            <div>
              <label htmlFor="password" className="block text-sm font-medium text-gray-700">
                Password
              </label>
              <input
                id="password"
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="mt-1 w-full rounded-lg border border-gray-200 px-3 py-2 text-sm focus:border-teal-500 focus:outline-none focus:ring-1 focus:ring-teal-500"
                placeholder="••••••••"
              />
            </div>

            {error && (
              <div className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">{error}</div>
            )}

            <button
              type="submit"
              disabled={submitting}
              className="w-full rounded-lg bg-teal-500 px-4 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-teal-600 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {submitting ? 'Signing in…' : 'Sign in'}
            </button>
          </form>

          <div className="my-6 flex items-center gap-3">
            <div className="h-px flex-1 bg-gray-100" />
            <span className="text-xs font-medium tracking-wide text-gray-400">DEMO ACCOUNTS</span>
            <div className="h-px flex-1 bg-gray-100" />
          </div>

          <div className="space-y-2">
            {DEMO_ACCOUNTS.map((account) => (
              <button
                key={account.email}
                type="button"
                onClick={() => setEmail(account.email)}
                className="flex w-full items-center gap-3 rounded-lg border border-gray-100 px-3 py-2 text-left transition-colors hover:border-teal-200 hover:bg-teal-50/50"
              >
                <Avatar name={account.name} size="sm" />
                <div className="min-w-0 flex-1">
                  <div className="truncate text-sm font-medium text-gray-800">{account.name}</div>
                  <div className="truncate text-xs text-gray-500">{account.email}</div>
                </div>
                <span
                  className={`shrink-0 rounded-full px-2 py-0.5 text-xs font-semibold ${roleBadgeClasses[account.role]}`}
                >
                  {account.role}
                </span>
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}

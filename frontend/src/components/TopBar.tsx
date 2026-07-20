// frontend/src/components/TopBar.tsx
import { useNavigate } from 'react-router-dom'
import { useAuthStore } from '../store/authStore'
import { Avatar } from './Avatar'
import { displayNameFromEmail } from '../lib/format'

export function TopBar() {
  const navigate = useNavigate()
  const email = useAuthStore((s) => s.email)
  const role = useAuthStore((s) => s.role)
  const logout = useAuthStore((s) => s.logout)

  // The auth store/login response only ever carries an email, never a display
  // name, so this is always a derived guess - skip the label when it just
  // reproduces the role word (e.g. "doctor@..." -> "Doctor" next to "DOCTOR").
  const derivedName = email ? displayNameFromEmail(email) : null
  const name = derivedName ?? 'User'
  const showName = Boolean(derivedName && (!role || derivedName.toUpperCase() !== role))

  const handleLogout = () => {
    logout()
    navigate('/login')
  }

  return (
    <header className="flex h-16 shrink-0 items-center justify-between border-b border-gray-100 bg-white px-6">
      <div />
      <div className="flex items-center gap-5">
        <div className="flex items-center gap-3">
          <Avatar name={name} size="sm" />
          {showName && <span className="text-sm font-medium text-gray-800">{name}</span>}
          {role && (
            <span className="inline-flex items-center rounded-full bg-navy-50 px-2.5 py-0.5 text-xs font-semibold text-navy-600">
              {role}
            </span>
          )}
        </div>
        <button
          type="button"
          onClick={handleLogout}
          className="rounded-lg border border-gray-200 px-3 py-1.5 text-sm font-medium text-gray-600 transition-colors hover:bg-gray-50"
        >
          Log out
        </button>
      </div>
    </header>
  )
}

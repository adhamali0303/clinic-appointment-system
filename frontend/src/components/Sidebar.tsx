// frontend/src/components/Sidebar.tsx
import { NavLink } from 'react-router-dom'
import { useAuthStore } from '../store/authStore'

const baseNavItems = [
  { to: '/dashboard', label: 'Dashboard' },
  { to: '/appointments', label: 'Appointments' },
]

const staffOnlyNavItems = [
  { to: '/patients', label: 'Patients' },
  { to: '/appointments/book', label: 'Book Appointment' },
]

const adminOnlyNavItems = [
  { to: '/doctors', label: 'Doctors' },
  { to: '/audit-log', label: 'Audit Log' },
]

export function Sidebar() {
  const role = useAuthStore((s) => s.role)
  const navItems =
    role === 'DOCTOR'
      ? baseNavItems
      : role === 'ADMIN'
        ? [...baseNavItems, ...staffOnlyNavItems, ...adminOnlyNavItems]
        : [...baseNavItems, ...staffOnlyNavItems]

  return (
    <aside className="flex h-screen w-60 shrink-0 flex-col bg-navy-700 text-white">
      <div className="flex items-center gap-2 px-6 py-6">
        <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-teal-500 text-sm font-bold">
          M
        </div>
        <span className="text-lg font-semibold tracking-tight">MedClinique</span>
      </div>
      <nav className="flex-1 space-y-1 px-3">
        {navItems.map((item) => (
          <NavLink
            key={item.to}
            to={item.to}
            end={item.to === '/appointments'}
            className={({ isActive }) =>
              `flex items-center rounded-lg px-3 py-2 text-sm font-medium transition-colors ${
                isActive
                  ? 'bg-teal-500 text-white'
                  : 'text-navy-200 hover:bg-navy-600 hover:text-white'
              }`
            }
          >
            {item.label}
          </NavLink>
        ))}
      </nav>
      <div className="px-6 py-4 text-xs text-navy-300">v0.1.0</div>
    </aside>
  )
}

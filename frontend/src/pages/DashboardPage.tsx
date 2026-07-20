// frontend/src/pages/DashboardPage.tsx
import { useQuery } from '@tanstack/react-query'
import { useNavigate } from 'react-router-dom'
import { useAuthStore } from '../store/authStore'
import { doctorsApi } from '../api/doctorsApi'
import { patientsApi } from '../api/patientsApi'
import { appointmentsApi, type AppointmentResponseDto } from '../api/appointmentsApi'
import { auditLogApi } from '../api/auditLogApi'
import { Card } from '../components/Card'
import { StatCard } from '../components/StatCard'
import { StatusBadge } from '../components/StatusBadge'
import { getActionTag } from '../lib/auditLog'
import {
  displayNameFromEmail,
  formatDateLong,
  formatDateTime,
  formatTime,
  getTimeOfDayGreeting,
  toDateInputValue,
} from '../lib/format'

function DoctorDashboard() {
  const today = new Date()
  const todayStr = toDateInputValue(today)
  const weekEnd = new Date(today)
  weekEnd.setDate(weekEnd.getDate() + 7)
  const weekEndStr = toDateInputValue(weekEnd)

  const { data: patients } = useQuery({ queryKey: ['patients'], queryFn: patientsApi.getAll })

  const { data: todayAppointments } = useQuery({
    queryKey: ['appointments', 'today', todayStr],
    queryFn: () => appointmentsApi.search({ startDate: todayStr, endDate: todayStr }),
  })

  const { data: upcomingAppointments } = useQuery({
    queryKey: ['appointments', 'upcoming', todayStr, weekEndStr],
    queryFn: () => appointmentsApi.search({ startDate: todayStr, endDate: weekEndStr }),
  })

  const activeToday = (todayAppointments ?? []).filter((a) => a.status !== 'CANCELED')
  const todayPatientCount = new Set(activeToday.map((a) => a.patientId)).size

  const activeUpcoming = (upcomingAppointments ?? []).filter((a) => a.status !== 'CANCELED')

  const patientName = (patientId: number) =>
    patients?.find((p) => p.id === patientId)?.name ?? `Patient #${patientId}`

  const sortedUpcoming = [...activeUpcoming].sort(
    (a, b) => new Date(a.appointmentDateTime).getTime() - new Date(b.appointmentDateTime).getTime(),
  )

  return (
    <div>
      <h1 className="text-2xl font-semibold text-gray-900">My Schedule</h1>
      <p className="mt-1 text-sm text-gray-500">{formatDateLong(today)}</p>

      <div className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-2">
        <StatCard label="Today's Patients" value={todayPatientCount} />
        <StatCard label="Upcoming" value={activeUpcoming.length} subtext="Next 7 days" />
      </div>

      <div className="mt-8">
        <h2 className="text-lg font-semibold text-gray-900">Upcoming Appointments</h2>
        <Card className="mt-3 p-0">
          {sortedUpcoming.length === 0 ? (
            <div className="p-6 text-sm text-gray-500">No upcoming appointments.</div>
          ) : (
            <ul className="divide-y divide-gray-100">
              {sortedUpcoming.map((appt: AppointmentResponseDto) => (
                <li key={appt.id} className="flex items-center justify-between px-6 py-4">
                  <div className="flex items-center gap-4">
                    <span className="w-20 shrink-0 text-sm font-medium text-gray-700">
                      {formatTime(appt.appointmentDateTime)}
                    </span>
                    <span className="text-sm text-gray-900">{patientName(appt.patientId)}</span>
                  </div>
                  <StatusBadge status={appt.status} />
                </li>
              ))}
            </ul>
          )}
        </Card>
      </div>
    </div>
  )
}

function StaffDashboard() {
  const navigate = useNavigate()
  const role = useAuthStore((s) => s.role)
  const email = useAuthStore((s) => s.email)
  const name = email ? displayNameFromEmail(email) : 'there'
  const today = new Date()
  const todayStr = toDateInputValue(today)

  const { data: todayAppointments } = useQuery({
    queryKey: ['appointments', 'today', todayStr],
    queryFn: () => appointmentsApi.search({ startDate: todayStr, endDate: todayStr }),
  })

  const { data: patients } = useQuery({ queryKey: ['patients'], queryFn: patientsApi.getAll })
  const { data: doctors } = useQuery({ queryKey: ['doctors'], queryFn: doctorsApi.getAll })

  // Active-doctor count and Recent Activity are ADMIN-only additions -
  // RECEPTIONIST keeps the original 3-card layout with no audit log access.
  const { data: recentActivity } = useQuery({
    queryKey: ['audit-logs', 'recent'],
    queryFn: () => auditLogApi.getAll({ limit: 5 }),
    enabled: role === 'ADMIN',
  })

  const todaysAppts = todayAppointments ?? []
  const cancellationsToday = todaysAppts.filter((a) => a.status === 'CANCELED')
  const activeDoctors = (doctors ?? []).filter((d) => d.status === 'ACTIVE')

  const patientName = (patientId: number) =>
    patients?.find((p) => p.id === patientId)?.name ?? `Patient #${patientId}`

  const doctorInfo = (doctorId: number) => {
    const doctor = doctors?.find((d) => d.id === doctorId)
    return doctor ? `${doctor.name} · ${doctor.specialty}` : `Doctor #${doctorId}`
  }

  const sortedToday = [...todaysAppts].sort(
    (a, b) => new Date(a.appointmentDateTime).getTime() - new Date(b.appointmentDateTime).getTime(),
  )

  const statsGridClass =
    role === 'ADMIN'
      ? 'mt-6 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4'
      : 'mt-6 grid grid-cols-1 gap-4 sm:grid-cols-3'

  return (
    <div>
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-gray-900">
            {getTimeOfDayGreeting()}, {name}
          </h1>
          <p className="mt-1 text-sm text-gray-500">{formatDateLong(today)}</p>
        </div>
        <button
          type="button"
          onClick={() => navigate('/appointments/book')}
          className="rounded-lg bg-teal-500 px-4 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-teal-600"
        >
          Book Appointment
        </button>
      </div>

      <div className={statsGridClass}>
        <StatCard label="Today's Appts" value={todaysAppts.length} />
        <StatCard label="Cancellations" value={cancellationsToday.length} />
        <StatCard label="Patients" value={patients?.length ?? 0} />
        {role === 'ADMIN' && (
          <StatCard
            label="Active Doctors"
            value={activeDoctors.length}
            subtext={`of ${doctors?.length ?? 0} total`}
          />
        )}
      </div>

      <div className="mt-8">
        <h2 className="text-lg font-semibold text-gray-900">Today's Appointments</h2>
        <Card className="mt-3 p-0">
          {sortedToday.length === 0 ? (
            <div className="p-6 text-sm text-gray-500">No appointments today.</div>
          ) : (
            <ul className="divide-y divide-gray-100">
              {sortedToday.map((appt) => (
                <li key={appt.id} className="flex items-center justify-between px-6 py-4">
                  <div className="flex items-center gap-4">
                    <span className="w-20 shrink-0 text-sm font-medium text-gray-700">
                      {formatTime(appt.appointmentDateTime)}
                    </span>
                    <div>
                      <div className="text-sm font-medium text-gray-900">
                        {patientName(appt.patientId)}
                      </div>
                      <div className="text-xs text-gray-500">{doctorInfo(appt.doctorId)}</div>
                    </div>
                  </div>
                  <StatusBadge status={appt.status} />
                </li>
              ))}
            </ul>
          )}
        </Card>
      </div>

      {role === 'ADMIN' && (
        <div className="mt-8">
          <h2 className="text-lg font-semibold text-gray-900">Recent Activity</h2>
          <Card className="mt-3 p-0">
            {(recentActivity ?? []).length === 0 ? (
              <div className="p-6 text-sm text-gray-500">No recent activity.</div>
            ) : (
              <ul className="divide-y divide-gray-100">
                {(recentActivity ?? []).map((entry) => {
                  const tag = getActionTag(entry.action)
                  return (
                    <li key={entry.id} className="px-6 py-4">
                      <div className="flex items-center gap-2">
                        <span
                          className={`inline-flex shrink-0 items-center rounded-full px-2 py-0.5 text-xs font-semibold ${tag.className}`}
                        >
                          {tag.label}
                        </span>
                        <span className="truncate text-sm text-gray-900">{entry.details}</span>
                      </div>
                      <div className="mt-1 text-xs text-gray-500">
                        {entry.performedBy} · {formatDateTime(entry.timestamp)}
                      </div>
                    </li>
                  )
                })}
              </ul>
            )}
          </Card>
        </div>
      )}
    </div>
  )
}

export function DashboardPage() {
  const role = useAuthStore((s) => s.role)

  if (role === 'DOCTOR') {
    return <DoctorDashboard />
  }

  return <StaffDashboard />
}

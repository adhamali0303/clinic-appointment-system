// frontend/src/pages/AppointmentsPage.tsx
import { useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import {
  appointmentsApi,
  type AppointmentResponseDto,
  type AppointmentSearchParams,
  type AppointmentStatus,
} from '../api/appointmentsApi'
import { doctorsApi, type DoctorResponse } from '../api/doctorsApi'
import { patientsApi, type PatientResponse } from '../api/patientsApi'
import { useAuthStore } from '../store/authStore'
import { Card } from '../components/Card'
import { Avatar } from '../components/Avatar'
import { StatusBadge, STATUS_CONFIG } from '../components/StatusBadge'
import { Toast } from '../components/Toast'
import { BookingWizard } from '../components/booking/BookingWizard'
import { addMinutesToTime, formatDateLong, formatTime, splitDateTime } from '../lib/format'

export function AppointmentsPage() {
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const role = useAuthStore((s) => s.role)
  const email = useAuthStore((s) => s.email)

  const [statusFilter, setStatusFilter] = useState('')
  const [dateFilter, setDateFilter] = useState('')
  const [doctorFilter, setDoctorFilter] = useState('')

  const [cancelTarget, setCancelTarget] = useState<AppointmentResponseDto | null>(null)
  const [cancelling, setCancelling] = useState(false)
  const [cancelError, setCancelError] = useState<string | null>(null)

  const [rescheduleTarget, setRescheduleTarget] = useState<AppointmentResponseDto | null>(null)
  const [toastMessage, setToastMessage] = useState<string | null>(null)

  const { data: doctors } = useQuery({ queryKey: ['doctors'], queryFn: doctorsApi.getAll })
  const { data: patients } = useQuery({ queryKey: ['patients'], queryFn: patientsApi.getAll })

  const searchParams = useMemo(() => {
    const params: AppointmentSearchParams = {}
    if (statusFilter) params.status = statusFilter as AppointmentStatus
    if (dateFilter) {
      params.startDate = dateFilter
      params.endDate = dateFilter
    }
    // DOCTOR is always auto-scoped server-side to their own appointments
    // (per BACKEND_CONTEXT.md) - never send doctorId for that role.
    if (role !== 'DOCTOR' && doctorFilter) params.doctorId = Number(doctorFilter)
    return params
  }, [statusFilter, dateFilter, doctorFilter, role])

  const {
    data: appointments,
    isLoading,
    isError,
  } = useQuery({
    queryKey: ['appointments', searchParams],
    queryFn: () => appointmentsApi.search(searchParams),
  })

  const doctorById = useMemo(() => {
    const map = new Map<number, DoctorResponse>()
    for (const d of doctors ?? []) map.set(d.id, d)
    return map
  }, [doctors])

  const patientById = useMemo(() => {
    const map = new Map<number, PatientResponse>()
    for (const p of patients ?? []) map.set(p.id, p)
    return map
  }, [patients])

  // Defensive double-check: the backend already forces a DOCTOR caller's
  // results to their own appointments, but action links should never render
  // for a row that somehow doesn't belong to this doctor.
  const ownDoctorId = useMemo(() => {
    if (role !== 'DOCTOR') return null
    return doctors?.find((d) => d.email === email)?.id ?? null
  }, [role, email, doctors])

  const rows = appointments ?? []
  const heading = role === 'DOCTOR' ? 'My Appointments' : 'All Appointments'
  const hasFilters = Boolean(statusFilter || dateFilter || doctorFilter)

  const invalidateAppointments = () => queryClient.invalidateQueries({ queryKey: ['appointments'] })

  const handleCancelConfirm = async () => {
    if (!cancelTarget) return
    setCancelling(true)
    setCancelError(null)
    try {
      await appointmentsApi.cancel(cancelTarget.id)
      await invalidateAppointments()
      setToastMessage('Appointment cancelled')
      setCancelTarget(null)
    } catch {
      setCancelError('Could not cancel this appointment. Please try again.')
    } finally {
      setCancelling(false)
    }
  }

  const handleRescheduleDone = async () => {
    await invalidateAppointments()
    setToastMessage('Appointment rescheduled')
    setRescheduleTarget(null)
  }

  const rescheduleDoctor = rescheduleTarget ? doctorById.get(rescheduleTarget.doctorId) : undefined
  const reschedulePatient = rescheduleTarget ? patientById.get(rescheduleTarget.patientId) : undefined
  const rescheduleParts = rescheduleTarget ? splitDateTime(rescheduleTarget.appointmentDateTime) : null

  return (
    <div>
      {toastMessage && <Toast message={toastMessage} onClose={() => setToastMessage(null)} />}

      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-gray-900">{heading}</h1>
          <p className="mt-1 text-sm text-gray-500">
            {isLoading ? 'Loading…' : `${rows.length} appointment${rows.length === 1 ? '' : 's'}`}
          </p>
        </div>
        <button
          type="button"
          onClick={() => navigate('/appointments/book')}
          className="rounded-lg bg-teal-500 px-4 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-teal-600"
        >
          New Appointment
        </button>
      </div>

      <Card className="mt-6 p-0">
        <div className="flex flex-wrap items-center gap-3 border-b border-gray-100 p-4">
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="rounded-lg border border-gray-200 px-3 py-2 text-sm focus:border-teal-500 focus:outline-none focus:ring-1 focus:ring-teal-500"
          >
            <option value="">All Statuses</option>
            {(Object.keys(STATUS_CONFIG) as AppointmentStatus[]).map((status) => (
              <option key={status} value={status}>
                {STATUS_CONFIG[status].label}
              </option>
            ))}
          </select>

          <input
            type="date"
            value={dateFilter}
            onChange={(e) => setDateFilter(e.target.value)}
            className="rounded-lg border border-gray-200 px-3 py-2 text-sm focus:border-teal-500 focus:outline-none focus:ring-1 focus:ring-teal-500"
          />

          {role !== 'DOCTOR' && (
            <select
              value={doctorFilter}
              onChange={(e) => setDoctorFilter(e.target.value)}
              className="rounded-lg border border-gray-200 px-3 py-2 text-sm focus:border-teal-500 focus:outline-none focus:ring-1 focus:ring-teal-500"
            >
              <option value="">All Doctors</option>
              {(doctors ?? []).map((doctor) => (
                <option key={doctor.id} value={doctor.id}>
                  {doctor.name}
                </option>
              ))}
            </select>
          )}

          {hasFilters && (
            <button
              type="button"
              onClick={() => {
                setStatusFilter('')
                setDateFilter('')
                setDoctorFilter('')
              }}
              className="text-sm font-medium text-gray-500 hover:text-gray-700"
            >
              Clear filters
            </button>
          )}
        </div>

        {isLoading && (
          <div className="space-y-3 p-6">
            {[0, 1, 2].map((i) => (
              <div key={i} className="h-12 animate-pulse rounded-lg bg-gray-100" />
            ))}
          </div>
        )}

        {isError && (
          <p className="p-6 text-sm text-red-600">Could not load appointments. Please try again.</p>
        )}

        {!isLoading && !isError && rows.length === 0 && (
          <p className="p-6 text-sm text-gray-500">No appointments found.</p>
        )}

        {!isLoading && !isError && rows.length > 0 && (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead>
                <tr className="border-b border-gray-100 text-xs font-medium uppercase tracking-wide text-gray-400">
                  <th className="px-6 py-3">Patient</th>
                  {role !== 'DOCTOR' && <th className="px-6 py-3">Doctor</th>}
                  <th className="px-6 py-3">Date</th>
                  <th className="px-6 py-3">Time</th>
                  <th className="px-6 py-3">Status</th>
                  <th className="px-6 py-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {rows.map((appt) => {
                  const patient = patientById.get(appt.patientId)
                  const doctor = doctorById.get(appt.doctorId)
                  const { date } = splitDateTime(appt.appointmentDateTime)
                  const canAct =
                    appt.status === 'SCHEDULED' && (role !== 'DOCTOR' || appt.doctorId === ownDoctorId)

                  return (
                    <tr key={appt.id}>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          <Avatar name={patient?.name ?? `Patient #${appt.patientId}`} size="sm" />
                          <span className="font-medium text-gray-900">
                            {patient?.name ?? `Patient #${appt.patientId}`}
                          </span>
                        </div>
                      </td>
                      {role !== 'DOCTOR' && (
                        <td className="px-6 py-4 text-gray-600">
                          {doctor?.name ?? `Doctor #${appt.doctorId}`}
                        </td>
                      )}
                      <td className="px-6 py-4 text-gray-600">
                        {formatDateLong(new Date(`${date}T00:00:00`))}
                      </td>
                      <td className="px-6 py-4 text-gray-600">{formatTime(appt.appointmentDateTime)}</td>
                      <td className="px-6 py-4">
                        <StatusBadge status={appt.status} />
                      </td>
                      <td className="px-6 py-4 text-right">
                        {canAct && (
                          <div className="flex justify-end gap-4">
                            <button
                              type="button"
                              onClick={() => setRescheduleTarget(appt)}
                              className="text-sm font-medium text-teal-600 hover:text-teal-700"
                            >
                              Reschedule
                            </button>
                            <button
                              type="button"
                              onClick={() => setCancelTarget(appt)}
                              className="text-sm font-medium text-red-600 hover:text-red-700"
                            >
                              Cancel
                            </button>
                          </div>
                        )}
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        )}
      </Card>

      {cancelTarget && (
        <div className="fixed inset-0 z-40 flex items-center justify-center bg-black/30 px-4">
          <div className="w-full max-w-sm rounded-xl bg-white p-6 shadow-lg">
            <h3 className="text-lg font-semibold text-gray-900">Cancel appointment?</h3>
            <p className="mt-2 text-sm text-gray-500">
              Are you sure you want to cancel this appointment?
            </p>
            {cancelError && <p className="mt-2 text-sm text-red-600">{cancelError}</p>}
            <div className="mt-6 flex justify-end gap-2">
              <button
                type="button"
                onClick={() => {
                  setCancelTarget(null)
                  setCancelError(null)
                }}
                className="rounded-lg border border-gray-200 px-4 py-2 text-sm font-medium text-gray-600 hover:bg-gray-50"
              >
                Keep Appointment
              </button>
              <button
                type="button"
                onClick={handleCancelConfirm}
                disabled={cancelling}
                className="rounded-lg bg-red-600 px-4 py-2 text-sm font-semibold text-white hover:bg-red-700 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {cancelling ? 'Cancelling…' : 'Cancel Appointment'}
              </button>
            </div>
          </div>
        </div>
      )}

      {rescheduleTarget && rescheduleDoctor && reschedulePatient && rescheduleParts && (
        <div className="fixed inset-0 z-40 flex items-center justify-center bg-black/30 px-4 py-8">
          <div className="max-h-full w-full max-w-2xl overflow-y-auto rounded-xl bg-white p-6 shadow-lg">
            <div className="flex justify-end">
              <button
                type="button"
                onClick={() => setRescheduleTarget(null)}
                className="text-gray-400 hover:text-gray-600"
                aria-label="Close"
              >
                ✕
              </button>
            </div>
            <BookingWizard
              mode="reschedule"
              appointmentId={rescheduleTarget.id}
              init={{
                doctor: rescheduleDoctor,
                patient: reschedulePatient,
                date: rescheduleParts.date,
                slot: {
                  startTime: rescheduleParts.time,
                  endTime: addMinutesToTime(rescheduleParts.time, 30),
                },
              }}
              onDone={handleRescheduleDone}
            />
          </div>
        </div>
      )}
    </div>
  )
}

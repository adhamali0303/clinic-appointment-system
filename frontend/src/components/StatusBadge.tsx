// frontend/src/components/StatusBadge.tsx
import type { AppointmentStatus } from '../api/appointmentsApi'

export const STATUS_CONFIG: Record<AppointmentStatus, { label: string; className: string }> = {
  SCHEDULED: {
    label: 'Booked',
    className: 'bg-emerald-50 text-emerald-700 ring-emerald-600/20',
  },
  COMPLETED: {
    label: 'Completed',
    className: 'bg-gray-100 text-gray-600 ring-gray-500/20',
  },
  CANCELED: {
    label: 'Cancelled',
    className: 'bg-red-50 text-red-700 ring-red-600/20',
  },
}

export function StatusBadge({ status }: { status: AppointmentStatus }) {
  const config = STATUS_CONFIG[status]
  return (
    <span
      className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ring-1 ring-inset ${config.className}`}
    >
      {config.label}
    </span>
  )
}

// frontend/src/components/booking/ConfirmStep.tsx
import type { DoctorResponse, TimeSlotResponse } from '../../api/doctorsApi'
import type { PatientResponse } from '../../api/patientsApi'
import { Card } from '../Card'
import { formatDateLong, formatTime } from '../../lib/format'

interface ConfirmStepProps {
  doctor: DoctorResponse
  patient: PatientResponse
  date: string
  slot: TimeSlotResponse
  notes: string
  onNotesChange: (notes: string) => void
  conflictError: boolean
  errorMessage: string | null
  onBackToSlots: () => void
}

export function ConfirmStep({
  doctor,
  patient,
  date,
  slot,
  notes,
  onNotesChange,
  conflictError,
  errorMessage,
  onBackToSlots,
}: ConfirmStepProps) {
  return (
    <div>
      <Card className="bg-gray-50">
        <dl className="space-y-3 text-sm">
          <div className="flex justify-between gap-4">
            <dt className="text-gray-500">Doctor</dt>
            <dd className="text-right font-medium text-gray-900">
              {doctor.name} · {doctor.specialty}
            </dd>
          </div>
          <div className="flex justify-between gap-4">
            <dt className="text-gray-500">Patient</dt>
            <dd className="text-right font-medium text-gray-900">{patient.name}</dd>
          </div>
          <div className="flex justify-between gap-4">
            <dt className="text-gray-500">Date</dt>
            <dd className="text-right font-medium text-gray-900">
              {formatDateLong(new Date(`${date}T00:00:00`))}
            </dd>
          </div>
          <div className="flex justify-between gap-4">
            <dt className="text-gray-500">Time</dt>
            <dd className="text-right font-medium text-gray-900">
              {formatTime(`${date}T${slot.startTime}`)}
            </dd>
          </div>
        </dl>
      </Card>

      <div className="mt-4">
        <label htmlFor="notes" className="block text-sm font-medium text-gray-700">
          Notes (optional)
        </label>
        {/* AppointmentRequestDto has no notes field per BACKEND_CONTEXT.md - this
            textarea is UI-only for now and is never sent with the booking request. */}
        <textarea
          id="notes"
          value={notes}
          onChange={(e) => onNotesChange(e.target.value)}
          rows={3}
          placeholder="Anything the doctor should know before the visit…"
          className="mt-1 w-full rounded-lg border border-gray-200 px-3 py-2 text-sm focus:border-teal-500 focus:outline-none focus:ring-1 focus:ring-teal-500"
        />
      </div>

      {conflictError && (
        <div className="mt-4 rounded-lg bg-red-50 px-4 py-3 text-sm text-red-700">
          This slot was just booked — please choose another.{' '}
          <button type="button" onClick={onBackToSlots} className="font-semibold underline">
            Choose another slot
          </button>
        </div>
      )}

      {errorMessage && !conflictError && (
        <div className="mt-4 rounded-lg bg-red-50 px-4 py-3 text-sm text-red-700">{errorMessage}</div>
      )}
    </div>
  )
}

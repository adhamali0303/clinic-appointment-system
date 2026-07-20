// frontend/src/components/booking/SlotStep.tsx
import { useQuery } from '@tanstack/react-query'
import { doctorsApi, type TimeSlotResponse } from '../../api/doctorsApi'
import { formatTime } from '../../lib/format'

interface SlotStepProps {
  doctorId: number
  doctorName: string
  date: string
  selectedSlot: TimeSlotResponse | null
  onSelect: (slot: TimeSlotResponse) => void
}

export function SlotStep({ doctorId, doctorName, date, selectedSlot, onSelect }: SlotStepProps) {
  // Free slots only - the endpoint already subtracts booked appointments
  // server-side, so there is no "Booked" state to render here.
  const {
    data: slots,
    isLoading,
    isError,
  } = useQuery({
    queryKey: ['doctor-availability-slots', doctorId, date],
    queryFn: () => doctorsApi.getAvailability(doctorId, date),
  })

  const dateLabel = new Date(`${date}T00:00:00`).toLocaleDateString(undefined, {
    weekday: 'long',
    month: 'long',
    day: 'numeric',
  })

  return (
    <div>
      <p className="text-sm text-gray-500">
        {dateLabel} · {doctorName}
      </p>

      <div className="mt-3 flex items-center gap-4 text-xs text-gray-500">
        <span className="flex items-center gap-1.5">
          <span className="h-3 w-3 rounded border border-gray-200 bg-white" /> Available
        </span>
        <span className="flex items-center gap-1.5">
          <span className="h-3 w-3 rounded bg-teal-500" /> Selected
        </span>
      </div>

      {isLoading && <p className="mt-6 text-sm text-gray-500">Loading time slots…</p>}
      {isError && (
        <p className="mt-6 text-sm text-red-600">Could not load time slots. Please try again.</p>
      )}
      {!isLoading && !isError && (slots ?? []).length === 0 && (
        <p className="mt-6 text-sm text-gray-500">No open slots left on this date.</p>
      )}

      <div className="mt-4 grid grid-cols-4 gap-2">
        {(slots ?? []).map((slot) => {
          const isSelected = selectedSlot?.startTime === slot.startTime
          return (
            <button
              key={slot.startTime}
              type="button"
              onClick={() => onSelect(slot)}
              className={`rounded-lg border px-3 py-2 text-sm font-medium transition-colors ${
                isSelected
                  ? 'border-teal-500 bg-teal-500 text-white'
                  : 'border-gray-200 text-gray-700 hover:border-teal-300 hover:bg-teal-50/50'
              }`}
            >
              {formatTime(`${date}T${slot.startTime}`)}
            </button>
          )
        })}
      </div>
    </div>
  )
}

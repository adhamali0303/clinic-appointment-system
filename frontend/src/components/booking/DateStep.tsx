// frontend/src/components/booking/DateStep.tsx
import { useMemo, useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { availabilityApi } from '../../api/availabilityApi'
import { toDateInputValue } from '../../lib/format'

interface DateStepProps {
  doctorId: number
  selectedDate: string | null
  onSelect: (date: string) => void
}

const WEEKDAY_LABELS = ['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa']

function buildCalendarGrid(year: number, month: number): Date[] {
  const firstOfMonth = new Date(year, month, 1)
  const startOffset = firstOfMonth.getDay()
  const gridStart = new Date(year, month, 1 - startOffset)

  return Array.from({ length: 42 }, (_, i) => {
    const d = new Date(gridStart)
    d.setDate(gridStart.getDate() + i)
    return d
  })
}

export function DateStep({ doctorId, selectedDate, onSelect }: DateStepProps) {
  const today = useMemo(() => new Date(), [])
  const [viewYear, setViewYear] = useState(today.getFullYear())
  const [viewMonth, setViewMonth] = useState(today.getMonth())

  // GET /availabilities has no doctorId query param (per BACKEND_CONTEXT.md),
  // so we fetch everything once and filter client-side below.
  const {
    data: availabilities,
    isLoading,
    isError,
  } = useQuery({
    queryKey: ['availabilities'],
    queryFn: availabilityApi.getAll,
  })

  const availableDates = useMemo(() => {
    const set = new Set<string>()
    for (const a of availabilities ?? []) {
      if (a.doctorId === doctorId) set.add(a.date)
    }
    return set
  }, [availabilities, doctorId])

  const hasAnyAvailability = availableDates.size > 0
  const todayStr = toDateInputValue(today)
  const grid = useMemo(() => buildCalendarGrid(viewYear, viewMonth), [viewYear, viewMonth])

  const goPrevMonth = () => {
    const d = new Date(viewYear, viewMonth - 1, 1)
    setViewYear(d.getFullYear())
    setViewMonth(d.getMonth())
  }

  const goNextMonth = () => {
    const d = new Date(viewYear, viewMonth + 1, 1)
    setViewYear(d.getFullYear())
    setViewMonth(d.getMonth())
  }

  if (isLoading) {
    return <p className="text-sm text-gray-500">Loading availability…</p>
  }

  if (isError) {
    return <p className="text-sm text-red-600">Could not load availability. Please try again.</p>
  }

  if (!hasAnyAvailability) {
    return (
      <div className="rounded-lg border border-gray-100 bg-gray-50 px-6 py-10 text-center">
        <p className="text-sm font-medium text-gray-700">No availability on record for this doctor.</p>
        <p className="mt-1 text-xs text-gray-500">Choose a different doctor or check back later.</p>
      </div>
    )
  }

  const monthLabel = new Date(viewYear, viewMonth, 1).toLocaleDateString(undefined, {
    month: 'long',
    year: 'numeric',
  })

  return (
    <div>
      <div className="flex items-center justify-between">
        <button
          type="button"
          onClick={goPrevMonth}
          className="rounded-lg px-3 py-1.5 text-sm text-gray-500 hover:bg-gray-50"
          aria-label="Previous month"
        >
          ‹ Prev
        </button>
        <span className="text-sm font-semibold text-gray-900">{monthLabel}</span>
        <button
          type="button"
          onClick={goNextMonth}
          className="rounded-lg px-3 py-1.5 text-sm text-gray-500 hover:bg-gray-50"
          aria-label="Next month"
        >
          Next ›
        </button>
      </div>

      <div className="mt-4 grid grid-cols-7 gap-1 text-center text-xs font-medium text-gray-400">
        {WEEKDAY_LABELS.map((label) => (
          <div key={label} className="py-1">
            {label}
          </div>
        ))}
      </div>

      <div className="mt-1 grid grid-cols-7 gap-1">
        {grid.map((day) => {
          const dateStr = toDateInputValue(day)
          const inCurrentMonth = day.getMonth() === viewMonth
          const isAvailable = inCurrentMonth && availableDates.has(dateStr)
          const isSelected = isAvailable && selectedDate === dateStr
          const isToday = inCurrentMonth && dateStr === todayStr

          return (
            <button
              key={dateStr}
              type="button"
              disabled={!isAvailable}
              onClick={() => onSelect(dateStr)}
              className={`aspect-square rounded-lg text-sm transition-colors ${
                !inCurrentMonth
                  ? 'text-transparent'
                  : isSelected
                    ? 'bg-teal-500 font-semibold text-white'
                    : isAvailable
                      ? `text-gray-800 hover:bg-teal-50 ${isToday ? 'ring-1 ring-inset ring-teal-300' : ''}`
                      : 'cursor-not-allowed text-gray-300'
              }`}
            >
              {day.getDate()}
            </button>
          )
        })}
      </div>
    </div>
  )
}

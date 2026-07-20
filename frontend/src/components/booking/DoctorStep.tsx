// frontend/src/components/booking/DoctorStep.tsx
import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { doctorsApi, type DoctorResponse } from '../../api/doctorsApi'
import { Avatar } from '../Avatar'

interface DoctorStepProps {
  selectedDoctor: DoctorResponse | null
  onSelect: (doctor: DoctorResponse) => void
}

export function DoctorStep({ selectedDoctor, onSelect }: DoctorStepProps) {
  const [search, setSearch] = useState('')

  const {
    data: doctors,
    isLoading,
    isError,
  } = useQuery({
    queryKey: ['doctors'],
    queryFn: doctorsApi.getAll,
  })

  const filtered = (doctors ?? []).filter((doctor) => {
    const q = search.trim().toLowerCase()
    if (!q) return true
    return doctor.name.toLowerCase().includes(q) || doctor.specialty.toLowerCase().includes(q)
  })

  return (
    <div>
      <input
        type="text"
        value={search}
        onChange={(e) => setSearch(e.target.value)}
        placeholder="Search by name or specialty…"
        className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm focus:border-teal-500 focus:outline-none focus:ring-1 focus:ring-teal-500"
      />

      {isLoading && <p className="mt-6 text-sm text-gray-500">Loading doctors…</p>}
      {isError && (
        <p className="mt-6 text-sm text-red-600">Could not load doctors. Please try again.</p>
      )}
      {!isLoading && !isError && filtered.length === 0 && (
        <p className="mt-6 text-sm text-gray-500">No doctors match your search.</p>
      )}

      <div className="mt-4 grid grid-cols-2 gap-3">
        {filtered.map((doctor) => {
          const isSelected = selectedDoctor?.id === doctor.id
          return (
            <button
              key={doctor.id}
              type="button"
              onClick={() => onSelect(doctor)}
              className={`flex items-center gap-3 rounded-lg border-2 px-4 py-3 text-left transition-colors ${
                isSelected
                  ? 'border-teal-400 bg-teal-50/60'
                  : 'border-gray-100 hover:border-teal-200 hover:bg-teal-50/30'
              }`}
            >
              <Avatar name={doctor.name} size="md" />
              <div className="min-w-0">
                <div className="truncate text-sm font-semibold text-gray-900">{doctor.name}</div>
                <div className="truncate text-xs text-gray-500">{doctor.specialty}</div>
              </div>
            </button>
          )
        })}
      </div>
    </div>
  )
}

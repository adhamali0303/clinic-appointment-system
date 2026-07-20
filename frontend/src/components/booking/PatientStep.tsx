// frontend/src/components/booking/PatientStep.tsx
import { useState } from 'react'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { patientsApi, type PatientResponse } from '../../api/patientsApi'
import { Avatar } from '../Avatar'
import { PatientFormModal } from '../PatientFormModal'

interface PatientStepProps {
  selectedPatient: PatientResponse | null
  onSelect: (patient: PatientResponse) => void
}

export function PatientStep({ selectedPatient, onSelect }: PatientStepProps) {
  const queryClient = useQueryClient()
  const [search, setSearch] = useState('')
  const [showForm, setShowForm] = useState(false)

  const {
    data: patients,
    isLoading,
    isError,
  } = useQuery({
    queryKey: ['patients'],
    queryFn: patientsApi.getAll,
  })

  const filtered = (patients ?? []).filter((patient) => {
    const q = search.trim().toLowerCase()
    if (!q) return true
    return patient.name.toLowerCase().includes(q) || (patient.email ?? '').toLowerCase().includes(q)
  })

  const handleCreated = async (patient: PatientResponse) => {
    await queryClient.invalidateQueries({ queryKey: ['patients'] })
    onSelect(patient)
    setShowForm(false)
  }

  return (
    <div>
      <div className="flex items-center gap-3">
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search patients…"
          className="flex-1 rounded-lg border border-gray-200 px-3 py-2 text-sm focus:border-teal-500 focus:outline-none focus:ring-1 focus:ring-teal-500"
        />
        <button
          type="button"
          onClick={() => setShowForm(true)}
          className="shrink-0 rounded-lg border border-teal-200 bg-teal-50 px-3 py-2 text-sm font-semibold text-teal-700 hover:bg-teal-100"
        >
          New Patient
        </button>
      </div>

      {isLoading && <p className="mt-6 text-sm text-gray-500">Loading patients…</p>}
      {isError && (
        <p className="mt-6 text-sm text-red-600">Could not load patients. Please try again.</p>
      )}
      {!isLoading && !isError && filtered.length === 0 && (
        <p className="mt-6 text-sm text-gray-500">No patients match your search.</p>
      )}

      <ul className="mt-4 divide-y divide-gray-100 rounded-lg border border-gray-100">
        {filtered.map((patient) => {
          const isSelected = selectedPatient?.id === patient.id
          return (
            <li key={patient.id}>
              <button
                type="button"
                onClick={() => onSelect(patient)}
                className={`flex w-full items-center gap-3 border-2 px-4 py-3 text-left transition-colors ${
                  isSelected ? 'border-teal-400 bg-teal-50/50' : 'border-transparent hover:bg-gray-50'
                }`}
              >
                <Avatar name={patient.name} size="sm" />
                <div className="min-w-0 flex-1">
                  <div className="truncate text-sm font-medium text-gray-900">{patient.name}</div>
                  <div className="truncate text-xs text-gray-500">{patient.email ?? patient.phone}</div>
                </div>
                {isSelected && (
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    viewBox="0 0 20 20"
                    fill="currentColor"
                    className="h-5 w-5 shrink-0 text-teal-600"
                  >
                    <path
                      fillRule="evenodd"
                      d="M16.704 4.153a.75.75 0 01.143 1.052l-8 10.5a.75.75 0 01-1.127.075l-4.5-4.5a.75.75 0 011.06-1.06l3.894 3.893 7.48-9.817a.75.75 0 011.05-.143z"
                      clipRule="evenodd"
                    />
                  </svg>
                )}
              </button>
            </li>
          )
        })}
      </ul>

      {showForm && (
        <PatientFormModal mode="create" onClose={() => setShowForm(false)} onSaved={handleCreated} />
      )}
    </div>
  )
}

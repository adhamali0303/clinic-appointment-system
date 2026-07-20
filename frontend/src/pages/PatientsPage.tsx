// frontend/src/pages/PatientsPage.tsx
import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { patientsApi, type PatientResponse } from '../api/patientsApi'
import { Card } from '../components/Card'
import { Avatar } from '../components/Avatar'
import { PatientFormModal } from '../components/PatientFormModal'

export function PatientsPage() {
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const [search, setSearch] = useState('')
  const [formMode, setFormMode] = useState<'create' | 'edit' | null>(null)
  const [editingPatient, setEditingPatient] = useState<PatientResponse | null>(null)

  const {
    data: patients,
    isLoading,
    isError,
  } = useQuery({ queryKey: ['patients'], queryFn: patientsApi.getAll })

  const rows = patients ?? []
  const filtered = rows.filter((patient) => {
    const q = search.trim().toLowerCase()
    if (!q) return true
    return (
      patient.name.toLowerCase().includes(q) ||
      (patient.email ?? '').toLowerCase().includes(q) ||
      patient.phone.toLowerCase().includes(q)
    )
  })

  const handleSaved = async () => {
    await queryClient.invalidateQueries({ queryKey: ['patients'] })
    setFormMode(null)
    setEditingPatient(null)
  }

  return (
    <div>
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-gray-900">Patients</h1>
          <p className="mt-1 text-sm text-gray-500">
            {isLoading
              ? 'Loading…'
              : `${rows.length} registered patient${rows.length === 1 ? '' : 's'}`}
          </p>
        </div>
        <button
          type="button"
          onClick={() => setFormMode('create')}
          className="rounded-lg bg-teal-500 px-4 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-teal-600"
        >
          Add Patient
        </button>
      </div>

      <Card className="mt-6 p-0">
        <div className="border-b border-gray-100 p-4">
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by name, email, or phone…"
            className="w-full max-w-sm rounded-lg border border-gray-200 px-3 py-2 text-sm focus:border-teal-500 focus:outline-none focus:ring-1 focus:ring-teal-500"
          />
        </div>

        {isLoading && (
          <div className="space-y-3 p-6">
            {[0, 1, 2].map((i) => (
              <div key={i} className="h-12 animate-pulse rounded-lg bg-gray-100" />
            ))}
          </div>
        )}

        {isError && (
          <p className="p-6 text-sm text-red-600">Could not load patients. Please try again.</p>
        )}

        {!isLoading && !isError && filtered.length === 0 && (
          <p className="p-6 text-sm text-gray-500">No patients found.</p>
        )}

        {!isLoading && !isError && filtered.length > 0 && (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead>
                <tr className="border-b border-gray-100 text-xs font-medium uppercase tracking-wide text-gray-400">
                  <th className="px-6 py-3">Patient</th>
                  <th className="px-6 py-3">Phone</th>
                  <th className="px-6 py-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {filtered.map((patient) => (
                  <tr key={patient.id}>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <Avatar name={patient.name} size="sm" />
                        <div className="min-w-0">
                          <div className="font-medium text-gray-900">{patient.name}</div>
                          {patient.email && (
                            <div className="truncate text-xs text-gray-500">{patient.email}</div>
                          )}
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-gray-600">{patient.phone}</td>
                    <td className="px-6 py-4 text-right">
                      <div className="flex justify-end gap-4">
                        <button
                          type="button"
                          onClick={() => navigate(`/appointments/book?patientId=${patient.id}`)}
                          className="text-sm font-medium text-teal-600 hover:text-teal-700"
                        >
                          Book
                        </button>
                        <button
                          type="button"
                          onClick={() => {
                            setEditingPatient(patient)
                            setFormMode('edit')
                          }}
                          className="text-sm font-medium text-gray-600 hover:text-gray-800"
                        >
                          Edit
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>

      {formMode === 'create' && (
        <PatientFormModal mode="create" onClose={() => setFormMode(null)} onSaved={handleSaved} />
      )}

      {formMode === 'edit' && editingPatient && (
        <PatientFormModal
          mode="edit"
          patient={editingPatient}
          onClose={() => {
            setFormMode(null)
            setEditingPatient(null)
          }}
          onSaved={handleSaved}
        />
      )}
    </div>
  )
}

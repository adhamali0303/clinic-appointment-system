// frontend/src/pages/DoctorsPage.tsx
import { useState } from 'react'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { doctorsApi, type DoctorResponse } from '../api/doctorsApi'
import { Card } from '../components/Card'
import { Avatar } from '../components/Avatar'

interface DoctorFormState {
  userId: string
  specialty: string
}

const emptyForm: DoctorFormState = { userId: '', specialty: '' }

export function DoctorsPage() {
  const queryClient = useQueryClient()
  const [search, setSearch] = useState('')

  const [formMode, setFormMode] = useState<'create' | 'edit' | null>(null)
  const [editingDoctor, setEditingDoctor] = useState<DoctorResponse | null>(null)
  const [form, setForm] = useState<DoctorFormState>(emptyForm)
  const [formError, setFormError] = useState<string | null>(null)
  const [saving, setSaving] = useState(false)

  const [statusTarget, setStatusTarget] = useState<DoctorResponse | null>(null)
  const [statusUpdating, setStatusUpdating] = useState(false)

  const {
    data: doctors,
    isLoading,
    isError,
  } = useQuery({ queryKey: ['doctors'], queryFn: doctorsApi.getAll })

  const rows = doctors ?? []
  const activeCount = rows.filter((d) => d.status === 'ACTIVE').length

  const filtered = rows.filter((doctor) => {
    const q = search.trim().toLowerCase()
    if (!q) return true
    return doctor.name.toLowerCase().includes(q) || doctor.specialty.toLowerCase().includes(q)
  })

  const openCreate = () => {
    setForm(emptyForm)
    setFormError(null)
    setFormMode('create')
  }

  const openEdit = (doctor: DoctorResponse) => {
    setEditingDoctor(doctor)
    setForm({ userId: String(doctor.userId), specialty: doctor.specialty })
    setFormError(null)
    setFormMode('edit')
  }

  const closeForm = () => {
    setFormMode(null)
    setEditingDoctor(null)
    setForm(emptyForm)
    setFormError(null)
  }

  const invalidateDoctors = () => queryClient.invalidateQueries({ queryKey: ['doctors'] })

  const handleSaveForm = async () => {
    setFormError(null)
    const userId = Number(form.userId)
    if (!form.userId.trim() || Number.isNaN(userId) || !form.specialty.trim()) {
      setFormError('A valid numeric User ID and a specialty are required.')
      return
    }
    setSaving(true)
    try {
      if (formMode === 'edit' && editingDoctor) {
        await doctorsApi.update(editingDoctor.id, userId, form.specialty.trim())
      } else {
        await doctorsApi.create(userId, form.specialty.trim())
      }
      await invalidateDoctors()
      closeForm()
    } catch {
      setFormError('Could not save this doctor. Confirm the User ID exists and try again.')
    } finally {
      setSaving(false)
    }
  }

  const handleStatusClick = async (doctor: DoctorResponse) => {
    if (doctor.status === 'ACTIVE') {
      setStatusTarget(doctor)
      return
    }
    setStatusUpdating(true)
    try {
      await doctorsApi.updateStatus(doctor.id, 'ACTIVE')
      await invalidateDoctors()
    } finally {
      setStatusUpdating(false)
    }
  }

  const confirmDeactivate = async () => {
    if (!statusTarget) return
    setStatusUpdating(true)
    try {
      await doctorsApi.updateStatus(statusTarget.id, 'INACTIVE')
      await invalidateDoctors()
      setStatusTarget(null)
    } finally {
      setStatusUpdating(false)
    }
  }

  return (
    <div>
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-gray-900">Doctors</h1>
          <p className="mt-1 text-sm text-gray-500">
            {isLoading ? 'Loading…' : `${activeCount} active · ${rows.length} total`}
          </p>
        </div>
        <button
          type="button"
          onClick={openCreate}
          className="rounded-lg bg-teal-500 px-4 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-teal-600"
        >
          Add Doctor
        </button>
      </div>

      <Card className="mt-6 p-0">
        <div className="border-b border-gray-100 p-4">
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by name or specialty…"
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
          <p className="p-6 text-sm text-red-600">Could not load doctors. Please try again.</p>
        )}

        {!isLoading && !isError && filtered.length === 0 && (
          <p className="p-6 text-sm text-gray-500">No doctors found.</p>
        )}

        {!isLoading && !isError && filtered.length > 0 && (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead>
                <tr className="border-b border-gray-100 text-xs font-medium uppercase tracking-wide text-gray-400">
                  <th className="px-6 py-3">Doctor</th>
                  <th className="px-6 py-3">Specialty</th>
                  <th className="px-6 py-3">Status</th>
                  <th className="px-6 py-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {filtered.map((doctor) => (
                  <tr key={doctor.id}>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <Avatar name={doctor.name} size="sm" />
                        <div className="min-w-0">
                          <div className="font-medium text-gray-900">{doctor.name}</div>
                          <div className="truncate text-xs text-gray-500">{doctor.email}</div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-gray-600">{doctor.specialty}</td>
                    <td className="px-6 py-4">
                      <button
                        type="button"
                        onClick={() => handleStatusClick(doctor)}
                        disabled={statusUpdating}
                        className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ring-1 ring-inset transition-opacity hover:opacity-75 disabled:cursor-not-allowed disabled:opacity-50 ${
                          doctor.status === 'ACTIVE'
                            ? 'bg-emerald-50 text-emerald-700 ring-emerald-600/20'
                            : 'bg-gray-100 text-gray-600 ring-gray-500/20'
                        }`}
                      >
                        {doctor.status === 'ACTIVE' ? 'Active' : 'Inactive'}
                      </button>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <button
                        type="button"
                        onClick={() => openEdit(doctor)}
                        className="text-sm font-medium text-teal-600 hover:text-teal-700"
                      >
                        Edit
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>

      {formMode && (
        <div className="fixed inset-0 z-40 flex items-center justify-center bg-black/30 px-4">
          <div className="w-full max-w-sm rounded-xl bg-white p-6 shadow-lg">
            <h3 className="text-lg font-semibold text-gray-900">
              {formMode === 'edit' ? 'Edit Doctor' : 'Add Doctor'}
            </h3>

            <div className="mt-4 space-y-3">
              <div>
                <label htmlFor="doctor-user-id" className="block text-sm font-medium text-gray-700">
                  User ID
                </label>
                <input
                  id="doctor-user-id"
                  type="number"
                  value={form.userId}
                  onChange={(e) => setForm((f) => ({ ...f, userId: e.target.value }))}
                  className="mt-1 w-full rounded-lg border border-gray-200 px-3 py-2 text-sm focus:border-teal-500 focus:outline-none focus:ring-1 focus:ring-teal-500"
                  placeholder="Numeric id of an existing User account"
                />
                <p className="mt-1 text-xs text-gray-400">
                  There's currently no lookup by role - enter the id of an existing User account
                  directly (ideally one with the DOCTOR role).
                </p>
              </div>
              <div>
                <label htmlFor="doctor-specialty" className="block text-sm font-medium text-gray-700">
                  Specialty
                </label>
                <input
                  id="doctor-specialty"
                  type="text"
                  value={form.specialty}
                  onChange={(e) => setForm((f) => ({ ...f, specialty: e.target.value }))}
                  className="mt-1 w-full rounded-lg border border-gray-200 px-3 py-2 text-sm focus:border-teal-500 focus:outline-none focus:ring-1 focus:ring-teal-500"
                />
              </div>

              {formError && <p className="text-sm text-red-600">{formError}</p>}
            </div>

            <div className="mt-6 flex justify-end gap-2">
              <button
                type="button"
                onClick={closeForm}
                className="rounded-lg border border-gray-200 px-4 py-2 text-sm font-medium text-gray-600 hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleSaveForm}
                disabled={saving}
                className="rounded-lg bg-teal-500 px-4 py-2 text-sm font-semibold text-white hover:bg-teal-600 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {saving ? 'Saving…' : formMode === 'edit' ? 'Save Changes' : 'Create'}
              </button>
            </div>
          </div>
        </div>
      )}

      {statusTarget && (
        <div className="fixed inset-0 z-40 flex items-center justify-center bg-black/30 px-4">
          <div className="w-full max-w-sm rounded-xl bg-white p-6 shadow-lg">
            <h3 className="text-lg font-semibold text-gray-900">Set doctor inactive?</h3>
            <p className="mt-2 text-sm text-gray-500">
              {statusTarget.name} will no longer be bookable until reactivated. Existing
              appointments are not affected.
            </p>
            <div className="mt-6 flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setStatusTarget(null)}
                className="rounded-lg border border-gray-200 px-4 py-2 text-sm font-medium text-gray-600 hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={confirmDeactivate}
                disabled={statusUpdating}
                className="rounded-lg bg-red-600 px-4 py-2 text-sm font-semibold text-white hover:bg-red-700 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {statusUpdating ? 'Updating…' : 'Set Inactive'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

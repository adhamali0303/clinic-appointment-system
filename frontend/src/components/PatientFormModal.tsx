// frontend/src/components/PatientFormModal.tsx
import { useState } from 'react'
import { patientsApi, type PatientResponse } from '../api/patientsApi'

interface PatientFormModalProps {
  mode: 'create' | 'edit'
  patient?: PatientResponse | null
  onClose: () => void
  onSaved: (patient: PatientResponse) => void
}

export function PatientFormModal({ mode, patient, onClose, onSaved }: PatientFormModalProps) {
  const [name, setName] = useState(patient?.name ?? '')
  const [phone, setPhone] = useState(patient?.phone ?? '')
  const [email, setEmail] = useState(patient?.email ?? '')
  const [error, setError] = useState<string | null>(null)
  const [saving, setSaving] = useState(false)

  const handleSave = async () => {
    setError(null)
    if (!name.trim() || !phone.trim()) {
      setError('Name and phone are required.')
      return
    }
    setSaving(true)
    try {
      const saved =
        mode === 'edit' && patient
          ? await patientsApi.update(patient.id, name.trim(), phone.trim(), email.trim() || undefined)
          : await patientsApi.create(name.trim(), phone.trim(), email.trim() || undefined)
      onSaved(saved)
    } catch {
      setError(
        mode === 'edit'
          ? 'Could not update patient. Please check the details and try again.'
          : 'Could not create patient. Please check the details and try again.',
      )
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="fixed inset-0 z-40 flex items-center justify-center bg-black/30 px-4">
      <div className="w-full max-w-sm rounded-xl bg-white p-6 shadow-lg">
        <h3 className="text-lg font-semibold text-gray-900">
          {mode === 'edit' ? 'Edit Patient' : 'New Patient'}
        </h3>

        <div className="mt-4 space-y-3">
          <div>
            <label htmlFor="patient-name" className="block text-sm font-medium text-gray-700">
              Name
            </label>
            <input
              id="patient-name"
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="mt-1 w-full rounded-lg border border-gray-200 px-3 py-2 text-sm focus:border-teal-500 focus:outline-none focus:ring-1 focus:ring-teal-500"
            />
          </div>
          <div>
            <label htmlFor="patient-phone" className="block text-sm font-medium text-gray-700">
              Phone
            </label>
            <input
              id="patient-phone"
              type="text"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              className="mt-1 w-full rounded-lg border border-gray-200 px-3 py-2 text-sm focus:border-teal-500 focus:outline-none focus:ring-1 focus:ring-teal-500"
            />
          </div>
          <div>
            <label htmlFor="patient-email" className="block text-sm font-medium text-gray-700">
              Email (optional)
            </label>
            <input
              id="patient-email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="mt-1 w-full rounded-lg border border-gray-200 px-3 py-2 text-sm focus:border-teal-500 focus:outline-none focus:ring-1 focus:ring-teal-500"
            />
          </div>

          {error && <p className="text-sm text-red-600">{error}</p>}
        </div>

        <div className="mt-6 flex justify-end gap-2">
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg border border-gray-200 px-4 py-2 text-sm font-medium text-gray-600 hover:bg-gray-50"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={handleSave}
            disabled={saving}
            className="rounded-lg bg-teal-500 px-4 py-2 text-sm font-semibold text-white hover:bg-teal-600 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {saving
              ? mode === 'edit'
                ? 'Saving…'
                : 'Creating…'
              : mode === 'edit'
                ? 'Save Changes'
                : 'Create'}
          </button>
        </div>
      </div>
    </div>
  )
}

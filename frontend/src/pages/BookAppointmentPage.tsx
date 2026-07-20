// frontend/src/pages/BookAppointmentPage.tsx
import { useSearchParams } from 'react-router-dom'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { patientsApi } from '../api/patientsApi'
import { BookingWizard } from '../components/booking/BookingWizard'

export function BookAppointmentPage() {
  const queryClient = useQueryClient()
  const [searchParams] = useSearchParams()
  const initialPatientId = searchParams.get('patientId')

  // Only fetched when arriving from the Patients page's "Book" action - avoids
  // a network round-trip before the wizard can mount in the common case.
  const { data: patients, isLoading } = useQuery({
    queryKey: ['patients'],
    queryFn: patientsApi.getAll,
    enabled: Boolean(initialPatientId),
  })

  if (initialPatientId && isLoading) {
    return (
      <div className="mx-auto max-w-3xl">
        <p className="text-sm text-gray-500">Loading…</p>
      </div>
    )
  }

  const initialPatient = initialPatientId
    ? (patients?.find((p) => p.id === Number(initialPatientId)) ?? null)
    : null

  return (
    <div className="mx-auto max-w-3xl">
      <BookingWizard
        mode="create"
        init={initialPatient ? { patient: initialPatient } : undefined}
        onDone={() => {
          queryClient.invalidateQueries({ queryKey: ['appointments'] })
        }}
      />
    </div>
  )
}

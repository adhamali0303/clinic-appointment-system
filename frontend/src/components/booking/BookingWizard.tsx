// frontend/src/components/booking/BookingWizard.tsx
import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import axios from 'axios'
import { appointmentsApi, type AppointmentResponseDto } from '../../api/appointmentsApi'
import {
  useBookingWizard,
  WIZARD_STEPS,
  type BookingWizardInit,
  type WizardMode,
} from '../../hooks/useBookingWizard'
import { StepIndicator } from '../StepIndicator'
import { Card } from '../Card'
import { Toast } from '../Toast'
import { DoctorStep } from './DoctorStep'
import { DateStep } from './DateStep'
import { SlotStep } from './SlotStep'
import { PatientStep } from './PatientStep'
import { ConfirmStep } from './ConfirmStep'
import { combineDateAndTime, formatDateLong, formatTime } from '../../lib/format'

interface ApiErrorResponse {
  message?: string
}

interface BookingWizardProps {
  mode: WizardMode
  appointmentId?: number
  init?: BookingWizardInit
  onDone?: (appointment: AppointmentResponseDto) => void
}

export function BookingWizard({ mode, appointmentId, init, onDone }: BookingWizardProps) {
  const navigate = useNavigate()
  const wizard = useBookingWizard(mode, init)
  const { state } = wizard

  const [submitting, setSubmitting] = useState(false)
  const [conflictError, setConflictError] = useState(false)
  const [errorMessage, setErrorMessage] = useState<string | null>(null)
  const [bookedAppointment, setBookedAppointment] = useState<AppointmentResponseDto | null>(null)
  const [toastMessage, setToastMessage] = useState<string | null>(null)

  const handleConfirm = async () => {
    if (!state.doctor || !state.patient || !state.date || !state.slot) return
    setSubmitting(true)
    setConflictError(false)
    setErrorMessage(null)
    try {
      // Notes are UI-only (see ConfirmStep) - AppointmentRequestDto has no field for them.
      const payload = {
        doctorId: state.doctor.id,
        patientId: state.patient.id,
        startTime: combineDateAndTime(state.date, state.slot.startTime),
        endTime: combineDateAndTime(state.date, state.slot.endTime),
      }
      const appointment =
        mode === 'reschedule' && appointmentId
          ? await appointmentsApi.reschedule(appointmentId, payload)
          : await appointmentsApi.create(payload)

      onDone?.(appointment)

      if (mode === 'create') {
        setBookedAppointment(appointment)
        setToastMessage(
          `Appointment booked! ${state.patient.name} · ${formatTime(combineDateAndTime(state.date, state.slot.startTime))}`,
        )
      }
    } catch (err) {
      if (axios.isAxiosError<ApiErrorResponse>(err) && err.response) {
        if (err.response.status === 409) {
          setConflictError(true)
        } else if (err.response.status === 400) {
          setErrorMessage(err.response.data?.message ?? 'This booking could not be completed.')
        } else {
          setErrorMessage('Something went wrong. Please try again.')
        }
      } else {
        setErrorMessage('Something went wrong. Please try again.')
      }
    } finally {
      setSubmitting(false)
    }
  }

  const handleBookAnother = () => {
    wizard.reset()
    setBookedAppointment(null)
    setConflictError(false)
    setErrorMessage(null)
    setToastMessage(null)
  }

  if (
    mode === 'create' &&
    bookedAppointment &&
    state.doctor &&
    state.patient &&
    state.date &&
    state.slot
  ) {
    return (
      <div className="mx-auto max-w-2xl">
        {toastMessage && <Toast message={toastMessage} onClose={() => setToastMessage(null)} />}

        <div className="flex flex-col items-center py-8 text-center">
          <div className="flex h-16 w-16 items-center justify-center rounded-full bg-emerald-50">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              viewBox="0 0 24 24"
              fill="currentColor"
              className="h-9 w-9 text-emerald-500"
            >
              <path
                fillRule="evenodd"
                d="M2.25 12c0-5.385 4.365-9.75 9.75-9.75s9.75 4.365 9.75 9.75-4.365 9.75-9.75 9.75S2.25 17.385 2.25 12zm13.36-1.814a.75.75 0 10-1.22-.872l-3.236 4.53L9.53 12.22a.75.75 0 00-1.06 1.06l2.25 2.25a.75.75 0 001.14-.094l3.75-5.25z"
                clipRule="evenodd"
              />
            </svg>
          </div>
          <h1 className="mt-4 text-2xl font-semibold text-gray-900">Appointment Booked!</h1>
          <p className="mt-1 text-sm text-gray-500">The appointment has been added to the schedule.</p>
        </div>

        <Card className="bg-gray-50">
          <dl className="space-y-3 text-sm">
            <div className="flex justify-between gap-4">
              <dt className="text-gray-500">Doctor</dt>
              <dd className="text-right font-medium text-gray-900">
                {state.doctor.name} · {state.doctor.specialty}
              </dd>
            </div>
            <div className="flex justify-between gap-4">
              <dt className="text-gray-500">Patient</dt>
              <dd className="text-right font-medium text-gray-900">{state.patient.name}</dd>
            </div>
            <div className="flex justify-between gap-4">
              <dt className="text-gray-500">Date</dt>
              <dd className="text-right font-medium text-gray-900">
                {formatDateLong(new Date(`${state.date}T00:00:00`))}
              </dd>
            </div>
            <div className="flex justify-between gap-4">
              <dt className="text-gray-500">Time</dt>
              <dd className="text-right font-medium text-gray-900">
                {formatTime(combineDateAndTime(state.date, state.slot.startTime))}
              </dd>
            </div>
          </dl>
        </Card>

        <div className="mt-6 flex justify-center gap-3">
          <button
            type="button"
            onClick={handleBookAnother}
            className="rounded-lg bg-teal-500 px-4 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-teal-600"
          >
            Book Another
          </button>
          <button
            type="button"
            onClick={() => navigate('/appointments')}
            className="rounded-lg border border-gray-200 px-4 py-2.5 text-sm font-medium text-gray-600 hover:bg-gray-50"
          >
            Back to Appointments
          </button>
        </div>
      </div>
    )
  }

  const heading = mode === 'reschedule' ? 'Reschedule Appointment' : 'Book Appointment'
  const subtitle =
    mode === 'reschedule'
      ? 'Choose a new date and time for this appointment.'
      : 'Complete each step to schedule an appointment.'
  const backFloor = mode === 'reschedule' ? 1 : 0

  return (
    <div className={mode === 'create' ? 'mx-auto max-w-3xl' : ''}>
      <h1 className="text-2xl font-semibold text-gray-900">{heading}</h1>
      <p className="mt-1 text-sm text-gray-500">{subtitle}</p>

      <div className="mt-6">
        <StepIndicator steps={WIZARD_STEPS} currentStep={state.step} />
      </div>

      <Card className="mt-6">
        {state.step === 0 && <DoctorStep selectedDoctor={state.doctor} onSelect={wizard.setDoctor} />}

        {state.step === 1 && state.doctor && (
          <DateStep doctorId={state.doctor.id} selectedDate={state.date} onSelect={wizard.setDate} />
        )}

        {state.step === 2 && state.doctor && state.date && (
          <SlotStep
            doctorId={state.doctor.id}
            doctorName={state.doctor.name}
            date={state.date}
            selectedSlot={state.slot}
            onSelect={wizard.setSlot}
          />
        )}

        {state.step === 3 && (
          <PatientStep selectedPatient={state.patient} onSelect={wizard.setPatient} />
        )}

        {state.step === 4 && state.doctor && state.patient && state.date && state.slot && (
          <ConfirmStep
            doctor={state.doctor}
            patient={state.patient}
            date={state.date}
            slot={state.slot}
            notes={state.notes}
            onNotesChange={wizard.setNotes}
            conflictError={conflictError}
            errorMessage={errorMessage}
            onBackToSlots={() => wizard.goToStep(2)}
          />
        )}

        <div className="mt-6 flex items-center justify-between border-t border-gray-100 pt-4">
          <button
            type="button"
            onClick={wizard.goBack}
            disabled={state.step === backFloor}
            className="rounded-lg border border-gray-200 px-4 py-2 text-sm font-medium text-gray-600 hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-40"
          >
            Back
          </button>

          {state.step < WIZARD_STEPS.length - 1 ? (
            <button
              type="button"
              onClick={wizard.goNext}
              disabled={!wizard.canProceed}
              className="rounded-lg bg-teal-500 px-4 py-2 text-sm font-semibold text-white hover:bg-teal-600 disabled:cursor-not-allowed disabled:opacity-40"
            >
              Next
            </button>
          ) : (
            <button
              type="button"
              onClick={handleConfirm}
              disabled={submitting}
              className="rounded-lg bg-teal-500 px-4 py-2 text-sm font-semibold text-white hover:bg-teal-600 disabled:cursor-not-allowed disabled:opacity-40"
            >
              {submitting
                ? mode === 'reschedule'
                  ? 'Rescheduling…'
                  : 'Booking…'
                : mode === 'reschedule'
                  ? 'Confirm Reschedule'
                  : 'Confirm Booking'}
            </button>
          )}
        </div>
      </Card>
    </div>
  )
}

// frontend/src/hooks/useBookingWizard.ts
import { useCallback, useMemo, useState } from 'react'
import type { DoctorResponse, TimeSlotResponse } from '../api/doctorsApi'
import type { PatientResponse } from '../api/patientsApi'

export const WIZARD_STEPS = ['Doctor', 'Date', 'Slots', 'Patient', 'Confirm'] as const

export type WizardMode = 'create' | 'reschedule'

export interface BookingWizardState {
  step: number
  doctor: DoctorResponse | null
  date: string | null
  slot: TimeSlotResponse | null
  patient: PatientResponse | null
  notes: string
}

export interface BookingWizardInit {
  doctor?: DoctorResponse | null
  date?: string | null
  slot?: TimeSlotResponse | null
  patient?: PatientResponse | null
}

const baseState: BookingWizardState = {
  step: 0,
  doctor: null,
  date: null,
  slot: null,
  patient: null,
  notes: '',
}

export function useBookingWizard(mode: WizardMode = 'create', init?: BookingWizardInit) {
  const [state, setState] = useState<BookingWizardState>(() => ({
    ...baseState,
    ...init,
    step: mode === 'reschedule' ? 1 : 0,
  }))

  const setDoctor = useCallback((doctor: DoctorResponse) => {
    setState((s) => ({ ...s, doctor, date: null, slot: null }))
  }, [])

  const setDate = useCallback((date: string) => {
    setState((s) => ({ ...s, date, slot: null }))
  }, [])

  const setSlot = useCallback((slot: TimeSlotResponse) => {
    setState((s) => ({ ...s, slot }))
  }, [])

  const setPatient = useCallback((patient: PatientResponse) => {
    setState((s) => ({ ...s, patient }))
  }, [])

  const setNotes = useCallback((notes: string) => {
    setState((s) => ({ ...s, notes }))
  }, [])

  // Reschedule mode skips Step 1 (Doctor) and Step 4 (Patient) - both are
  // already fixed for an existing appointment (the reschedule endpoint only
  // ever updates the time, per BACKEND_CONTEXT.md).
  const goNext = useCallback(() => {
    setState((s) => {
      const next = mode === 'reschedule' && s.step === 2 ? 4 : s.step + 1
      return { ...s, step: Math.min(next, WIZARD_STEPS.length - 1) }
    })
  }, [mode])

  const goBack = useCallback(() => {
    setState((s) => {
      const floor = mode === 'reschedule' ? 1 : 0
      const prev = mode === 'reschedule' && s.step === 4 ? 2 : s.step - 1
      return { ...s, step: Math.max(prev, floor) }
    })
  }, [mode])

  const goToStep = useCallback((step: number) => {
    setState((s) => ({ ...s, step }))
  }, [])

  const reset = useCallback(() => {
    setState({ ...baseState, ...init, step: mode === 'reschedule' ? 1 : 0 })
  }, [mode, init])

  const canProceed = useMemo(() => {
    switch (state.step) {
      case 0:
        return state.doctor !== null
      case 1:
        return state.date !== null
      case 2:
        return state.slot !== null
      case 3:
        return state.patient !== null
      default:
        return true
    }
  }, [state.step, state.doctor, state.date, state.slot, state.patient])

  return {
    state,
    setDoctor,
    setDate,
    setSlot,
    setPatient,
    setNotes,
    goNext,
    goBack,
    goToStep,
    reset,
    canProceed,
  }
}

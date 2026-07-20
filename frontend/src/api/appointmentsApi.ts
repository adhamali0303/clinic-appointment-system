// frontend/src/api/appointmentsApi.ts
import { apiClient } from './apiClient'

export type AppointmentStatus = 'SCHEDULED' | 'COMPLETED' | 'CANCELED'

export interface AppointmentResponseDto {
  id: number
  doctorId: number
  patientId: number
  appointmentDateTime: string
  status: AppointmentStatus
}

export interface AppointmentRequestDto {
  doctorId: number
  patientId: number
  startTime: string
  endTime: string
}

export interface AppointmentSearchParams {
  doctorId?: number
  patientId?: number
  startDate?: string
  endDate?: string
  status?: AppointmentStatus
}

export const appointmentsApi = {
  create: async (body: AppointmentRequestDto): Promise<AppointmentResponseDto> => {
    const { data } = await apiClient.post<AppointmentResponseDto>('/api/v1/appointments', body)
    return data
  },

  cancel: async (id: number): Promise<AppointmentResponseDto> => {
    const { data } = await apiClient.patch<AppointmentResponseDto>(
      `/api/v1/appointments/${id}/cancel`,
    )
    return data
  },

  reschedule: async (
    id: number,
    body: AppointmentRequestDto,
  ): Promise<AppointmentResponseDto> => {
    const { data } = await apiClient.patch<AppointmentResponseDto>(
      `/api/v1/appointments/${id}/reschedule`,
      body,
    )
    return data
  },

  search: async (params: AppointmentSearchParams = {}): Promise<AppointmentResponseDto[]> => {
    const { data } = await apiClient.get<AppointmentResponseDto[]>('/api/v1/appointments', {
      params,
    })
    return data
  },
}

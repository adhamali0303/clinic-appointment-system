// frontend/src/api/doctorsApi.ts
import { apiClient } from './apiClient'

export type DoctorStatus = 'ACTIVE' | 'INACTIVE'

export interface DoctorResponse {
  id: number
  userId: number
  name: string
  email: string
  specialty: string
  status: DoctorStatus
}

export interface TimeSlotResponse {
  startTime: string
  endTime: string
}

export const doctorsApi = {
  getAll: async (): Promise<DoctorResponse[]> => {
    const { data } = await apiClient.get<DoctorResponse[]>('/api/v1/doctors')
    return data
  },

  getById: async (id: number): Promise<DoctorResponse> => {
    const { data } = await apiClient.get<DoctorResponse>(`/api/v1/doctors/${id}`)
    return data
  },

  create: async (userId: number, specialty: string): Promise<DoctorResponse> => {
    const { data } = await apiClient.post<DoctorResponse>('/api/v1/doctors', { userId, specialty })
    return data
  },

  update: async (id: number, userId: number, specialty: string): Promise<DoctorResponse> => {
    const { data } = await apiClient.put<DoctorResponse>(`/api/v1/doctors/${id}`, {
      userId,
      specialty,
    })
    return data
  },

  updateStatus: async (id: number, status: DoctorStatus): Promise<DoctorResponse> => {
    const { data } = await apiClient.patch<DoctorResponse>(`/api/v1/doctors/${id}/status`, {
      status,
    })
    return data
  },

  getAvailability: async (id: number, date: string): Promise<TimeSlotResponse[]> => {
    const { data } = await apiClient.get<TimeSlotResponse[]>(
      `/api/v1/doctors/${id}/availability`,
      { params: { date } },
    )
    return data
  },
}

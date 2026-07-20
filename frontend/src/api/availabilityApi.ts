// frontend/src/api/availabilityApi.ts
import { apiClient } from './apiClient'

export interface DoctorAvailabilityResponse {
  id: number
  doctorId: number
  date: string
  startTime: string
  endTime: string
}

export const availabilityApi = {
  getAll: async (): Promise<DoctorAvailabilityResponse[]> => {
    const { data } = await apiClient.get<DoctorAvailabilityResponse[]>('/api/v1/availabilities')
    return data
  },

  create: async (
    doctorId: number,
    date: string,
    startTime: string,
    endTime: string,
  ): Promise<DoctorAvailabilityResponse> => {
    const { data } = await apiClient.post<DoctorAvailabilityResponse>('/api/v1/availabilities', {
      doctorId,
      date,
      startTime,
      endTime,
    })
    return data
  },
}

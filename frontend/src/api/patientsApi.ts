// frontend/src/api/patientsApi.ts
import { apiClient } from './apiClient'

export interface PatientResponse {
  id: number
  name: string
  phone: string
  email: string | null
}

export const patientsApi = {
  getAll: async (): Promise<PatientResponse[]> => {
    const { data } = await apiClient.get<PatientResponse[]>('/api/v1/patients')
    return data
  },

  getById: async (id: number): Promise<PatientResponse> => {
    const { data } = await apiClient.get<PatientResponse>(`/api/v1/patients/${id}`)
    return data
  },

  create: async (name: string, phone: string, email?: string): Promise<PatientResponse> => {
    const { data } = await apiClient.post<PatientResponse>('/api/v1/patients', {
      name,
      phone,
      email,
    })
    return data
  },

  update: async (
    id: number,
    name: string,
    phone: string,
    email?: string,
  ): Promise<PatientResponse> => {
    const { data } = await apiClient.put<PatientResponse>(`/api/v1/patients/${id}`, {
      name,
      phone,
      email,
    })
    return data
  },
}

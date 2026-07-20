// frontend/src/api/auditLogApi.ts
import { apiClient } from './apiClient'

export interface AuditLogResponse {
  id: number
  action: string
  performedBy: string
  timestamp: string
  details: string
}

export interface AuditLogSearchParams {
  action?: string
  limit?: number
}

export const auditLogApi = {
  getAll: async (params: AuditLogSearchParams = {}): Promise<AuditLogResponse[]> => {
    const { data } = await apiClient.get<AuditLogResponse[]>('/api/v1/audit-logs', { params })
    return data
  },
}

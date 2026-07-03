import { api } from '@/lib/api'
import type { GroupMonitoringPayload } from './types'

export async function getGroupMonitoring() {
  const res = await api.get<{ success: boolean; data: GroupMonitoringPayload }>(
    '/api/group-monitoring'
  )
  return res.data?.data
}

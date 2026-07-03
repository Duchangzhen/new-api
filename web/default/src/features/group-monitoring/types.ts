export type MonitoringState =
  | 'available'
  | 'anomaly'
  | 'idle'
  | 'unavailable'

export interface MonitoringHistoryPoint {
  timestamp: number
  success_rate: number | null
  cache_hit_rate: number | null
  requests: number
}

export interface MonitoringGroup {
  tag: string
  name: string
  model_name: string
  state: MonitoringState
  total_channels: number
  enabled_channels: number
  manual_disabled_channels: number
  auto_disabled_channels: number
  recent_requests: number
  average_latency_ms: number
  availability_rate: number
  cache_hit_rate: number
  last_probe_at: number
  last_request_at: number
  history: MonitoringHistoryPoint[]
}

export interface MonitoringSummary {
  available_groups: number
  anomaly_groups: number
  idle_groups: number
  unavailable_groups: number
  total_groups: number
  updated_at: number
}

export interface GroupMonitoringPayload {
  summary: MonitoringSummary
  groups: MonitoringGroup[]
}

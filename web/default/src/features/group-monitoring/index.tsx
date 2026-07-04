import { useMemo, useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { format } from 'date-fns'
import {
  Clock3,
  LayoutGrid,
  Loader2,
  RefreshCw,
  ShieldAlert,
  ShieldCheck,
  WifiOff,
} from 'lucide-react'
import {
  CartesianGrid,
  Legend,
  Line,
  LineChart,
  XAxis,
  YAxis,
} from 'recharts'
import { PageTransition } from '@/components/page-transition'
import { PublicLayout } from '@/components/layout'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
} from '@/components/ui/chart'
import { Sheet, SheetContent, SheetDescription, SheetTitle } from '@/components/ui/sheet'
import { Skeleton } from '@/components/ui/skeleton'
import { cn } from '@/lib/utils'
import { getGroupMonitoring } from './api'
import type {
  GroupMonitoringPayload,
  MonitoringGroup,
  MonitoringHistoryPoint,
  MonitoringState,
} from './types'

const MONITORING_QUERY_KEY = ['group-monitoring']

function formatPercent(value: number) {
  return `${value.toFixed(1)}%`
}

function formatLatency(ms: number) {
  if (!ms || ms <= 0) return '--'
  return `${(ms / 1000).toFixed(2)}s`
}

function formatDateTime(timestamp: number) {
  if (!timestamp) return '暂无'
  return format(timestamp * 1000, 'MM-dd HH:mm')
}

function formatRelativeUpdate(timestamp: number) {
  if (!timestamp) return '暂无更新'

  const diffMinutes = Math.max(
    0,
    Math.round((Date.now() - timestamp * 1000) / 60000)
  )

  if (diffMinutes <= 0) return '数据刚刚更新'
  if (diffMinutes < 60) return `数据更新于 ${diffMinutes} 分钟前`

  const diffHours = Math.floor(diffMinutes / 60)
  if (diffHours < 24) return `数据更新于 ${diffHours} 小时前`

  const diffDays = Math.floor(diffHours / 24)
  return `数据更新于 ${diffDays} 天前`
}

function stateLabel(state: MonitoringState) {
  switch (state) {
    case 'available':
      return '当前可用'
    case 'anomaly':
      return '探测异常'
    case 'idle':
      return '无调用'
    default:
      return '不可用'
  }
}

function stateDotClassName(state: MonitoringState) {
  switch (state) {
    case 'available':
      return 'bg-emerald-500'
    case 'anomaly':
      return 'bg-red-500'
    case 'idle':
      return 'bg-slate-400'
    default:
      return 'bg-rose-500'
  }
}

function stateBadgeClassName(state: MonitoringState) {
  switch (state) {
    case 'available':
      return 'border-emerald-200 bg-emerald-50 text-emerald-700'
    case 'anomaly':
      return 'border-red-200 bg-red-50 text-red-700'
    case 'idle':
      return 'border-slate-200 bg-slate-100 text-slate-600'
    default:
      return 'border-rose-200 bg-rose-50 text-rose-700'
  }
}

function metricTextClassName(value: number, tone: 'latency' | 'request') {
  if (tone === 'request') {
    return value > 0 ? 'text-emerald-600' : 'text-slate-500'
  }

  if (value <= 0) return 'text-slate-500'
  if (value < 4000) return 'text-lime-600'
  if (value < 10000) return 'text-amber-500'
  return 'text-red-500'
}

function buildPath(
  history: MonitoringHistoryPoint[],
  selector: (point: MonitoringHistoryPoint) => number | null,
  width: number,
  height: number
) {
  const safeHeight = Math.max(height - 8, 1)
  let path = ''
  let started = false

  history.forEach((point, index) => {
    const value = selector(point)
    if (value === null || Number.isNaN(value)) {
      started = false
      return
    }

    const x =
      history.length <= 1 ? width / 2 : (index / (history.length - 1)) * width
    const normalized = Math.max(0, Math.min(100, value))
    const y = height - 4 - (normalized / 100) * safeHeight

    if (!started) {
      path += `M ${x} ${y}`
      started = true
    } else {
      path += ` L ${x} ${y}`
    }
  })

  return path
}

function HistorySparkline({ history }: { history: MonitoringHistoryPoint[] }) {
  const width = 420
  const height = 92
  const successPath = buildPath(history, (point) => point.success_rate, width, height)
  const cachePath = buildPath(history, (point) => point.cache_hit_rate, width, height)
  const first = history[0]
  const last = history[history.length - 1]

  return (
    <div className='space-y-2'>
      <div className='flex items-center justify-between text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-600'>
        <span>History</span>
        <div className='flex items-center gap-3 text-[11px] font-normal normal-case tracking-normal text-slate-500'>
          <span className='inline-flex items-center gap-1'>
            <span className='h-1.5 w-3 rounded-full bg-blue-500' />
            最新探测
          </span>
          <span className='inline-flex items-center gap-1'>
            <span className='h-1.5 w-3 rounded-full bg-teal-500' />
            缓存率
          </span>
        </div>
      </div>

      <div className='rounded-md border-t border-slate-200 pt-4'>
        <svg
          viewBox={`0 0 ${width} ${height}`}
          preserveAspectRatio='none'
          className='h-28 w-full'
        >
          <path d={`M 0 2 L ${width} 2`} fill='none' stroke='#dbeafe' strokeWidth='2' />
          <path d={successPath} fill='none' stroke='#3b82f6' strokeWidth='2' />
          <path d={cachePath} fill='none' stroke='#14b8a6' strokeWidth='2' />
        </svg>
      </div>

      <div className='flex items-center justify-between text-xs text-slate-500'>
        <span>{first ? format(first.timestamp * 1000, 'HH:mm') : '--:--'}</span>
        <span>{last ? format(last.timestamp * 1000, 'HH:mm') : '--:--'}</span>
      </div>
    </div>
  )
}

function MetricBar(props: {
  label: string
  value: number
  barClassName: string
}) {
  return (
    <div className='space-y-2'>
      <div className='flex items-center justify-between text-[15px]'>
        <span className='text-slate-700'>{props.label}</span>
        <span className='font-semibold tabular-nums text-emerald-600'>
          {formatPercent(props.value)}
        </span>
      </div>
      <div className='h-2 rounded-full bg-slate-100'>
        <div
          className={cn('h-2 rounded-full transition-[width]', props.barClassName)}
          style={{ width: `${Math.max(0, Math.min(100, props.value))}%` }}
        />
      </div>
    </div>
  )
}

function MonitoringStatusBadge({ state }: { state: MonitoringState }) {
  return (
    <Badge
      variant='outline'
      className={cn(
        'shrink-0 gap-1.5 rounded-full border px-3 py-1 text-[13px] font-medium shadow-none',
        stateBadgeClassName(state)
      )}
    >
      <span className={cn('h-2 w-2 rounded-full', stateDotClassName(state))} />
      {stateLabel(state)}
    </Badge>
  )
}

function MonitoringCard(props: {
  group: MonitoringGroup
  onOpen: (group: MonitoringGroup) => void
}) {
  const { group } = props

  return (
    <button
      type='button'
      onClick={() => props.onOpen(group)}
      className='w-full text-left transition-transform duration-150 hover:-translate-y-0.5'
    >
      <Card className='h-full rounded-3xl border border-slate-200 bg-white shadow-[0_6px_24px_rgba(15,23,42,0.06)]'>
        <CardHeader className='space-y-5 pb-4'>
          <div className='flex items-start justify-between gap-4'>
            <div className='min-w-0'>
              <CardTitle className='truncate text-[1rem] font-semibold text-slate-900 sm:text-[1.05rem]'>
                {group.name}
              </CardTitle>
              <div className='mt-2 truncate text-[15px] text-slate-500'>
                {group.model_name || '未配置模型'}
              </div>
            </div>
            <MonitoringStatusBadge state={group.state} />
          </div>

          <div className='grid grid-cols-[1fr_auto_1fr_auto] items-center gap-x-3 text-[14px]'>
            <div className='truncate text-slate-400'>延迟</div>
            <div
              className={cn(
                'font-semibold tabular-nums',
                metricTextClassName(group.average_latency_ms, 'latency')
              )}
            >
              {formatLatency(group.average_latency_ms)}
            </div>
            <div className='truncate text-right text-slate-400'>近 12h 请求</div>
            <div
              className={cn(
                'font-semibold tabular-nums',
                metricTextClassName(group.recent_requests, 'request')
              )}
            >
              {group.recent_requests}
            </div>
          </div>
        </CardHeader>

        <CardContent className='space-y-5 pt-0'>
          <MetricBar
            label='可用率'
            value={group.availability_rate}
            barClassName='bg-emerald-500'
          />
          <MetricBar
            label='缓存命中率'
            value={group.cache_hit_rate}
            barClassName='bg-teal-400'
          />
          <HistorySparkline history={group.history} />
        </CardContent>
      </Card>
    </button>
  )
}

function MonitoringSkeleton() {
  return (
    <PublicLayout showMainContainer={false}>
      <div className='mx-auto w-full max-w-[1880px] px-3 pt-12 pb-10 sm:px-6 sm:pt-16 xl:px-8'>
        <div className='rounded-3xl border border-slate-200 bg-white px-6 py-6 shadow-sm'>
          <Skeleton className='h-7 w-80' />
        </div>
        <div className='mt-8 grid gap-5 md:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4'>
          {Array.from({ length: 8 }).map((_, index) => (
            <Card key={index} className='min-h-[390px] rounded-3xl border-slate-200'>
              <CardHeader className='space-y-5'>
                <Skeleton className='h-7 w-40' />
                <Skeleton className='h-5 w-32' />
                <Skeleton className='h-5 w-full' />
              </CardHeader>
              <CardContent className='space-y-5'>
                <Skeleton className='h-12 w-full' />
                <Skeleton className='h-12 w-full' />
                <Skeleton className='h-36 w-full' />
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </PublicLayout>
  )
}

function MonitoringDetailSheet(props: {
  group: MonitoringGroup | null
  open: boolean
  onOpenChange: (open: boolean) => void
}) {
  const chartData = useMemo(() => {
    return (props.group?.history || []).map((point) => ({
      time: format(point.timestamp * 1000, 'HH:mm'),
      successRate: point.success_rate,
      cacheHitRate: point.cache_hit_rate,
      requests: point.requests,
    }))
  }, [props.group])

  return (
    <Sheet open={props.open} onOpenChange={props.onOpenChange}>
      <SheetContent
        side='right'
        className='w-full max-w-none border-l border-slate-200 bg-white p-0 sm:max-w-[760px]'
      >
        {props.group ? (
          <div className='flex h-full flex-col'>
            <div className='border-b border-slate-200 px-8 pt-10 pb-6'>
              <SheetTitle className='text-[2.2rem] font-semibold tracking-tight text-slate-950'>
                {props.group.name} - 详情
              </SheetTitle>
              <SheetDescription className='mt-8 max-w-[620px] text-[14px] leading-8 text-slate-700'>
                汇总口径为最近窗口；折线按单个聚合桶展示，并附带当前时间所在桶的实时快照。暂无调用会延续上一有效视觉高度，首段连续无调用保持留空。
              </SheetDescription>
            </div>

            <div className='flex-1 space-y-6 overflow-y-auto px-8 py-8'>
              <div className='rounded-3xl border border-slate-200 bg-white p-4'>
                <ChartContainer
                  className='h-[360px] w-full'
                  config={{
                    successRate: { color: '#3b82f6', label: '可用率' },
                    cacheHitRate: { color: '#14b8a6', label: '缓存命中率' },
                  }}
                >
                  <LineChart data={chartData} margin={{ top: 12, right: 8, left: 8, bottom: 0 }}>
                    <CartesianGrid vertical={false} strokeDasharray='0' />
                    <XAxis dataKey='time' minTickGap={24} tickLine={false} axisLine={false} />
                    <YAxis
                      domain={[0, 100]}
                      tickFormatter={(value) => `${value}`}
                      tickLine={false}
                      axisLine={false}
                      width={34}
                    />
                    <Legend />
                    <ChartTooltip
                      content={
                        <ChartTooltipContent
                          formatter={(value, name) => (
                            <div className='flex w-full items-center justify-between gap-5'>
                              <span>{name}</span>
                              <span className='font-medium tabular-nums'>
                                {typeof value === 'number' ? `${value.toFixed(1)}%` : '--'}
                              </span>
                            </div>
                          )}
                        />
                      }
                    />
                    <Line
                      dataKey='successRate'
                      name='可用率'
                      stroke='var(--color-successRate)'
                      strokeWidth={2.5}
                      dot={false}
                      connectNulls={false}
                      type='monotone'
                    />
                    <Line
                      dataKey='cacheHitRate'
                      name='缓存命中率'
                      stroke='var(--color-cacheHitRate)'
                      strokeWidth={2.5}
                      dot={false}
                      connectNulls={false}
                      type='monotone'
                    />
                  </LineChart>
                </ChartContainer>
              </div>

              <div className='grid gap-4 sm:grid-cols-2'>
                <DetailMetricCard label='状态' value={stateLabel(props.group.state)} />
                <DetailMetricCard
                  label='可用率'
                  value={formatPercent(props.group.availability_rate)}
                />
                <DetailMetricCard
                  label='缓存命中率'
                  value={formatPercent(props.group.cache_hit_rate)}
                />
                <DetailMetricCard
                  label='平均延迟'
                  value={formatLatency(props.group.average_latency_ms)}
                />
                <DetailMetricCard label='模型' value={props.group.model_name || '未配置模型'} />
                <DetailMetricCard
                  label='近 12h 请求'
                  value={String(props.group.recent_requests)}
                />
                <DetailMetricCard
                  label='最近探测'
                  value={formatDateTime(props.group.last_probe_at)}
                />
                <DetailMetricCard
                  label='最近请求'
                  value={formatDateTime(props.group.last_request_at)}
                />
              </div>

              <div className='grid gap-4 sm:grid-cols-2'>
                <div className='rounded-3xl border border-slate-200 bg-white px-5 py-4'>
                  <div className='text-[15px] font-medium text-slate-800'>渠道状态</div>
                  <div className='mt-4 space-y-2 text-[15px] text-slate-700'>
                    <div>总渠道：{props.group.total_channels}</div>
                    <div>启用：{props.group.enabled_channels}</div>
                    <div>手动禁用：{props.group.manual_disabled_channels}</div>
                    <div>自动禁用：{props.group.auto_disabled_channels}</div>
                  </div>
                </div>

                <div className='rounded-3xl border border-slate-200 bg-white px-5 py-4'>
                  <div className='flex items-center gap-2 text-[15px] font-medium text-slate-800'>
                    <Clock3 className='h-4 w-4 text-slate-500' />
                    近 12 小时趋势
                  </div>
                  <div className='mt-4 space-y-2 text-[15px] text-slate-700'>
                    {chartData.length ? (
                      chartData
                        .filter((item) => item.successRate !== null || item.cacheHitRate !== null)
                        .slice(-4)
                        .map((item) => (
                          <div key={item.time}>
                            {item.time}{' '}
                            {item.successRate !== null ? `${item.successRate.toFixed(0)}%` : '--'}
                            {item.cacheHitRate !== null
                              ? ` / ${item.cacheHitRate.toFixed(0)}%`
                              : ''}
                          </div>
                        ))
                    ) : (
                      <div>暂无趋势数据</div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>
        ) : null}
      </SheetContent>
    </Sheet>
  )
}

function DetailMetricCard(props: { label: string; value: string }) {
  return (
    <div className='rounded-3xl border border-slate-200 bg-white px-5 py-4'>
      <div className='text-[13px] text-slate-500'>{props.label}</div>
      <div className='mt-2 text-[24px] font-semibold tracking-tight text-slate-900'>
        {props.value}
      </div>
    </div>
  )
}

function EmptyMonitoringState() {
  return (
    <div className='rounded-3xl border border-dashed border-slate-200 bg-white px-8 py-16 text-center shadow-sm'>
      <div className='mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-slate-100'>
        <LayoutGrid className='h-6 w-6 text-slate-500' />
      </div>
      <h2 className='mt-5 text-xl font-semibold text-slate-900'>暂无监控分组</h2>
      <p className='mt-2 text-sm text-slate-500'>
        请先给渠道设置 tag，监控页会按 tag 聚合展示。
      </p>
    </div>
  )
}

function SummaryItem(props: {
  state: MonitoringState
  value: number
  label: string
  icon: React.ReactNode
}) {
  return (
    <div className='inline-flex items-center gap-2 text-[15px] text-slate-700'>
      <span className={cn('h-2.5 w-2.5 rounded-full', stateDotClassName(props.state))} />
      <span className='font-medium'>{props.value}</span>
      <span>{props.label}</span>
      <span className='hidden text-slate-400 sm:inline'>{props.icon}</span>
    </div>
  )
}

function MonitoringHeader(props: { payload: GroupMonitoringPayload }) {
  const { summary } = props.payload

  return (
    <div className='rounded-3xl border border-slate-200 bg-white px-6 py-6 shadow-[0_6px_24px_rgba(15,23,42,0.04)]'>
      <div className='flex flex-col gap-4 xl:flex-row xl:items-center xl:justify-between'>
        <div className='flex flex-wrap items-center gap-x-6 gap-y-3'>
          <SummaryItem
            state='available'
            value={summary.available_groups}
            label='当前可用'
            icon={<ShieldCheck className='h-4 w-4' />}
          />
          <SummaryItem
            state='anomaly'
            value={summary.anomaly_groups}
            label='探测异常'
            icon={<ShieldAlert className='h-4 w-4' />}
          />
          <SummaryItem
            state='idle'
            value={summary.idle_groups}
            label='无调用'
            icon={<WifiOff className='h-4 w-4' />}
          />
          <div className='text-[15px] text-slate-500'>{summary.total_groups} 个分组</div>
        </div>

        <div className='text-[15px] text-slate-500'>{formatRelativeUpdate(summary.updated_at)}</div>
      </div>
    </div>
  )
}

export function GroupMonitoring() {
  const [selectedGroup, setSelectedGroup] = useState<MonitoringGroup | null>(null)
  const monitoringQuery = useQuery({
    queryKey: MONITORING_QUERY_KEY,
    queryFn: getGroupMonitoring,
    refetchInterval: 120000,
  })

  const payload = monitoringQuery.data

  if (monitoringQuery.isLoading) {
    return <MonitoringSkeleton />
  }

  return (
    <PublicLayout showMainContainer={false}>
      <PageTransition className='mx-auto w-full max-w-[1880px] px-3 pt-12 pb-10 sm:px-6 sm:pt-16 xl:px-8'>
        <div className='space-y-8'>
          <div className='flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between'>
            <div className='space-y-1'>
              <div className='text-[30px] font-semibold tracking-tight text-slate-950'>
                分组监控
              </div>
              <div className='text-sm text-slate-500'>
                监控数据每 2 分钟自动刷新，点击卡片查看详情
              </div>
            </div>

            <Button
              variant='outline'
              size='sm'
              className='h-10 rounded-full border-slate-200 px-4 text-[14px]'
              onClick={() => monitoringQuery.refetch()}
              disabled={monitoringQuery.isFetching}
            >
              {monitoringQuery.isFetching ? (
                <Loader2 className='mr-2 h-4 w-4 animate-spin' />
              ) : (
                <RefreshCw className='mr-2 h-4 w-4' />
              )}
              刷新
            </Button>
          </div>

          {payload ? <MonitoringHeader payload={payload} /> : null}

          {monitoringQuery.isError ? (
            <div className='rounded-3xl border border-red-200 bg-red-50 px-6 py-10 text-center text-sm text-red-600'>
              分组监控数据加载失败，请稍后重试。
            </div>
          ) : payload?.groups?.length ? (
            <div className='grid gap-5 md:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4'>
              {payload.groups.map((group) => (
                <MonitoringCard
                  key={group.tag}
                  group={group}
                  onOpen={setSelectedGroup}
                />
              ))}
            </div>
          ) : (
            <EmptyMonitoringState />
          )}
        </div>
      </PageTransition>

      <MonitoringDetailSheet
        group={selectedGroup}
        open={!!selectedGroup}
        onOpenChange={(open) => {
          if (!open) {
            setSelectedGroup(null)
          }
        }}
      />
    </PublicLayout>
  )
}

import { useMemo, useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { format } from 'date-fns'
import {
  Activity,
  Clock3,
  Gauge,
  Loader2,
  MousePointerClick,
  RefreshCw,
  Server,
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
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
} from '@/components/ui/chart'
import { Button } from '@/components/ui/button'
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet'
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

function formatRelativeUpdate(timestamp: number) {
  if (!timestamp) return '暂无更新'
  const diffMinutes = Math.max(
    0,
    Math.round((Date.now() - timestamp * 1000) / 60000)
  )
  if (diffMinutes <= 0) return '刚刚更新'
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

function stateBadgeClassName(state: MonitoringState) {
  switch (state) {
    case 'available':
      return 'border-emerald-500/15 bg-emerald-500/10 text-emerald-600 dark:text-emerald-300'
    case 'anomaly':
      return 'border-amber-500/20 bg-amber-500/10 text-amber-600 dark:text-amber-300'
    case 'idle':
      return 'border-slate-500/15 bg-slate-500/10 text-slate-500 dark:text-slate-300'
    default:
      return 'border-rose-500/20 bg-rose-500/10 text-rose-600 dark:text-rose-300'
  }
}

function summaryDotClassName(state: MonitoringState) {
  switch (state) {
    case 'available':
      return 'bg-emerald-500'
    case 'anomaly':
      return 'bg-red-500'
    case 'idle':
      return 'bg-slate-500'
    default:
      return 'bg-rose-500'
  }
}

function buildPath(
  history: MonitoringHistoryPoint[],
  selector: (point: MonitoringHistoryPoint) => number | null,
  width: number,
  height: number
) {
  const safeHeight = Math.max(height - 6, 1)
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
    const y = height - 3 - (Math.max(0, Math.min(100, value)) / 100) * safeHeight
    if (!started) {
      path += `M ${x} ${y}`
      started = true
    } else {
      path += ` L ${x} ${y}`
    }
  })

  return path
}

function HistorySparkline(props: { history: MonitoringHistoryPoint[] }) {
  const width = 420
  const height = 92
  const successPath = buildPath(
    props.history,
    (point) => point.success_rate,
    width,
    height
  )
  const cachePath = buildPath(
    props.history,
    (point) => point.cache_hit_rate,
    width,
    height
  )
  const first = props.history[0]
  const last = props.history[props.history.length - 1]

  return (
    <div className='space-y-2'>
      <div className='flex items-center justify-between text-[11px] font-medium tracking-[0.18em] text-muted-foreground uppercase'>
        <span>History</span>
        <div className='flex items-center gap-3 text-[10px] tracking-normal text-muted-foreground'>
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
      <div className='rounded-lg border border-border/60 bg-muted/20 p-2'>
        <svg
          viewBox={`0 0 ${width} ${height}`}
          preserveAspectRatio='none'
          className='h-28 w-full'
        >
          <path d={successPath} fill='none' stroke='#3b82f6' strokeWidth='2.2' />
          <path d={cachePath} fill='none' stroke='#14b8a6' strokeWidth='2.2' />
        </svg>
      </div>
      <div className='flex items-center justify-between text-xs text-muted-foreground'>
        <span>{first ? format(first.timestamp * 1000, 'HH:mm') : '--:--'}</span>
        <span>{last ? format(last.timestamp * 1000, 'HH:mm') : '--:--'}</span>
      </div>
    </div>
  )
}

function MetricBar(props: {
  label: string
  value: number
  tone: 'success' | 'teal'
}) {
  return (
    <div className='space-y-2'>
      <div className='flex items-center justify-between text-sm'>
        <span>{props.label}</span>
        <span className='font-semibold tabular-nums'>
          {formatPercent(props.value)}
        </span>
      </div>
      <div className='h-2 rounded-full bg-muted'>
        <div
          className={cn(
            'h-2 rounded-full transition-[width]',
            props.tone === 'success' ? 'bg-emerald-500' : 'bg-teal-400'
          )}
          style={{ width: `${Math.max(0, Math.min(100, props.value))}%` }}
        />
      </div>
    </div>
  )
}

function MonitoringCard(props: {
  group: MonitoringGroup
  onOpen: (group: MonitoringGroup) => void
}) {
  return (
    <button
      type='button'
      onClick={() => props.onOpen(props.group)}
      className='text-left transition-transform hover:-translate-y-0.5'
    >
      <Card className='h-full border-border/70 bg-card/95 shadow-sm'>
        <CardHeader className='gap-3'>
          <div className='flex items-start justify-between gap-4'>
            <div className='min-w-0'>
              <CardTitle className='truncate text-[1.15rem] font-semibold'>
                {props.group.name}
              </CardTitle>
              <CardDescription className='mt-1 truncate text-base'>
                {props.group.model_name || '未配置模型'}
              </CardDescription>
            </div>
            <Badge
              variant='outline'
              className={cn('shrink-0', stateBadgeClassName(props.group.state))}
            >
              <span
                className={cn(
                  'h-1.5 w-1.5 rounded-full',
                  summaryDotClassName(props.group.state)
                )}
              />
              {stateLabel(props.group.state)}
            </Badge>
          </div>
          <div className='grid grid-cols-2 gap-3 text-sm'>
            <div className='rounded-lg border border-border/50 bg-muted/20 px-3 py-2'>
              <div className='text-xs text-muted-foreground'>延迟</div>
              <div className='mt-1 font-semibold tabular-nums text-lime-600 dark:text-lime-300'>
                {formatLatency(props.group.average_latency_ms)}
              </div>
            </div>
            <div className='rounded-lg border border-border/50 bg-muted/20 px-3 py-2'>
              <div className='text-xs text-muted-foreground'>通道</div>
              <div className='mt-1 font-semibold tabular-nums'>
                {props.group.enabled_channels}/{props.group.total_channels}
              </div>
            </div>
          </div>
        </CardHeader>

        <CardContent className='space-y-5'>
          <MetricBar
            label='可用率'
            value={props.group.availability_rate}
            tone='success'
          />
          <MetricBar
            label='缓存命中率'
            value={props.group.cache_hit_rate}
            tone='teal'
          />
          <HistorySparkline history={props.group.history} />
        </CardContent>
      </Card>
    </button>
  )
}

function MonitoringSkeleton() {
  return (
    <PublicLayout showMainContainer={false}>
      <div className='mx-auto w-full max-w-[1800px] px-3 pt-16 pb-8 sm:px-6 sm:pt-20 xl:px-8'>
        <div className='rounded-2xl border border-border/60 bg-card/90 px-6 py-5'>
          <Skeleton className='h-6 w-72' />
        </div>
        <div className='mt-6 grid gap-5 md:grid-cols-2 2xl:grid-cols-4'>
          {Array.from({ length: 8 }).map((_, index) => (
            <Card key={index} className='min-h-[420px] border-border/70'>
              <CardHeader>
                <Skeleton className='h-7 w-40' />
                <Skeleton className='h-5 w-28' />
              </CardHeader>
              <CardContent className='space-y-4'>
                <Skeleton className='h-14 w-full' />
                <Skeleton className='h-14 w-full' />
                <Skeleton className='h-40 w-full' />
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
      <SheetContent side='right' className='w-full sm:max-w-3xl'>
        {props.group ? (
          <>
            <SheetHeader className='border-b border-border/60 pb-5'>
              <SheetTitle className='text-2xl font-semibold'>
                {props.group.name} - 详情
              </SheetTitle>
              <SheetDescription className='max-w-2xl text-sm leading-7'>
                汇总口径为最近 12 小时的分组请求日志。折线按 10 分钟窗口聚合，蓝线表示可用率，绿线表示缓存命中率。
              </SheetDescription>
            </SheetHeader>

            <div className='flex-1 space-y-6 overflow-y-auto px-4 pb-6'>
              <div className='grid gap-3 pt-4 sm:grid-cols-4'>
                <div className='rounded-xl border border-border/60 bg-muted/20 px-4 py-3'>
                  <div className='text-xs text-muted-foreground'>当前状态</div>
                  <div className='mt-2 font-semibold'>
                    {stateLabel(props.group.state)}
                  </div>
                </div>
                <div className='rounded-xl border border-border/60 bg-muted/20 px-4 py-3'>
                  <div className='text-xs text-muted-foreground'>可用率</div>
                  <div className='mt-2 font-semibold tabular-nums'>
                    {formatPercent(props.group.availability_rate)}
                  </div>
                </div>
                <div className='rounded-xl border border-border/60 bg-muted/20 px-4 py-3'>
                  <div className='text-xs text-muted-foreground'>缓存命中率</div>
                  <div className='mt-2 font-semibold tabular-nums'>
                    {formatPercent(props.group.cache_hit_rate)}
                  </div>
                </div>
                <div className='rounded-xl border border-border/60 bg-muted/20 px-4 py-3'>
                  <div className='text-xs text-muted-foreground'>平均延迟</div>
                  <div className='mt-2 font-semibold tabular-nums'>
                    {formatLatency(props.group.average_latency_ms)}
                  </div>
                </div>
              </div>

              <div className='rounded-2xl border border-border/60 bg-card/90 p-4'>
                <ChartContainer
                  className='h-[320px] w-full'
                  config={{
                    successRate: { color: '#3b82f6', label: '可用率' },
                    cacheHitRate: { color: '#14b8a6', label: '缓存命中率' },
                  }}
                >
                  <LineChart data={chartData}>
                    <CartesianGrid vertical={false} />
                    <XAxis dataKey='time' minTickGap={22} tickLine={false} />
                    <YAxis
                      domain={[0, 100]}
                      tickFormatter={(value) => `${value}%`}
                      tickLine={false}
                      width={50}
                    />
                    <Legend />
                    <ChartTooltip
                      content={
                        <ChartTooltipContent
                          formatter={(value, name) => (
                            <div className='flex w-full items-center justify-between gap-6'>
                              <span>{name}</span>
                              <span className='font-medium tabular-nums'>
                                {typeof value === 'number'
                                  ? `${value.toFixed(1)}%`
                                  : '--'}
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

              <div className='grid gap-3 sm:grid-cols-2'>
                <div className='rounded-xl border border-border/60 bg-muted/20 px-4 py-3'>
                  <div className='text-xs text-muted-foreground'>模型</div>
                  <div className='mt-2 font-medium'>{props.group.model_name}</div>
                </div>
                <div className='rounded-xl border border-border/60 bg-muted/20 px-4 py-3'>
                  <div className='text-xs text-muted-foreground'>最近探测</div>
                  <div className='mt-2 font-medium'>
                    {props.group.last_probe_at
                      ? format(props.group.last_probe_at * 1000, 'MM-dd HH:mm')
                      : '暂无'}
                  </div>
                </div>
                <div className='rounded-xl border border-border/60 bg-muted/20 px-4 py-3'>
                  <div className='text-xs text-muted-foreground'>最近请求数</div>
                  <div className='mt-2 font-medium tabular-nums'>
                    {props.group.recent_requests}
                  </div>
                </div>
                <div className='rounded-xl border border-border/60 bg-muted/20 px-4 py-3'>
                  <div className='text-xs text-muted-foreground'>禁用通道</div>
                  <div className='mt-2 font-medium tabular-nums'>
                    手动 {props.group.manual_disabled_channels} / 自动{' '}
                    {props.group.auto_disabled_channels}
                  </div>
                </div>
              </div>
            </div>
          </>
        ) : null}
      </SheetContent>
    </Sheet>
  )
}

function EmptyMonitoringState() {
  return (
    <div className='rounded-2xl border border-dashed border-border/70 bg-muted/10 px-8 py-14 text-center'>
      <div className='mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-muted'>
        <Server className='h-5 w-5 text-muted-foreground' />
      </div>
      <h2 className='mt-4 text-lg font-semibold'>还没有可展示的分组监控</h2>
      <p className='mt-2 text-sm text-muted-foreground'>
        先给渠道打上标签并产生一些调用日志，这里就会出现分组卡片。
      </p>
    </div>
  )
}

function MonitoringHeader(props: { payload: GroupMonitoringPayload }) {
  const { summary } = props.payload

  return (
    <div className='rounded-2xl border border-border/60 bg-card/95 px-6 py-5 shadow-sm'>
      <div className='flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between'>
        <div className='flex flex-wrap items-center gap-5 text-sm'>
          <span className='inline-flex items-center gap-2'>
            <span
              className={cn(
                'h-2.5 w-2.5 rounded-full',
                summaryDotClassName('available')
              )}
            />
            {summary.available_groups} 当前可用
          </span>
          <span className='inline-flex items-center gap-2'>
            <span
              className={cn(
                'h-2.5 w-2.5 rounded-full',
                summaryDotClassName('anomaly')
              )}
            />
            {summary.anomaly_groups} 探测异常
          </span>
          <span className='inline-flex items-center gap-2'>
            <span
              className={cn(
                'h-2.5 w-2.5 rounded-full',
                summaryDotClassName('idle')
              )}
            />
            {summary.idle_groups} 无调用
          </span>
          <span className='text-muted-foreground'>
            {summary.total_groups} 个分组
          </span>
        </div>
        <div className='text-sm text-muted-foreground'>
          {formatRelativeUpdate(summary.updated_at)}
        </div>
      </div>
    </div>
  )
}

export function GroupMonitoring() {
  const [selectedGroup, setSelectedGroup] = useState<MonitoringGroup | null>(
    null
  )
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
      <div className='relative'>
        <PageTransition className='mx-auto w-full max-w-[1800px] px-3 pt-16 pb-8 sm:px-6 sm:pt-20 sm:pb-10 xl:px-8'>
          <div className='flex flex-col gap-6'>
            <header className='flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between'>
              <div className='space-y-3'>
                <Badge
                  variant='outline'
                  className='border-primary/20 bg-primary/5 text-primary'
                >
                  <Activity className='h-3.5 w-3.5' />
                  分组监控
                </Badge>
                <div>
                  <h1 className='text-3xl font-semibold tracking-tight sm:text-4xl'>
                    分组状态总览
                  </h1>
                  <p className='mt-2 max-w-3xl text-sm leading-7 text-muted-foreground sm:text-base'>
                    按渠道标签聚合最近 12 小时调用日志，展示每个分组的可用率、缓存命中率、延迟和历史变化。
                  </p>
                </div>
              </div>

              <div className='flex flex-wrap items-center gap-3 text-sm text-muted-foreground'>
                <span className='inline-flex items-center gap-2'>
                  <Clock3 className='h-4 w-4' />
                  10 分钟粒度
                </span>
                <span className='inline-flex items-center gap-2'>
                  <Gauge className='h-4 w-4' />
                  12 小时窗口
                </span>
                <span className='inline-flex items-center gap-2'>
                  <MousePointerClick className='h-4 w-4' />
                  点击卡片查看详情
                </span>
                <Button
                  variant='outline'
                  size='sm'
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
            </header>

            {payload ? <MonitoringHeader payload={payload} /> : null}

            {monitoringQuery.isError ? (
              <div className='rounded-2xl border border-rose-500/20 bg-rose-500/5 px-6 py-10 text-center text-sm text-rose-600 dark:text-rose-300'>
                分组监控数据加载失败，请稍后重试。
              </div>
            ) : payload?.groups?.length ? (
              <div className='grid gap-5 md:grid-cols-2 2xl:grid-cols-4'>
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
      </div>

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

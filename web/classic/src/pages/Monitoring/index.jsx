/*
Copyright (C) 2025 QuantumNous

This program is free software: you can redistribute it and/or modify
it under the terms of the GNU Affero General Public License as
published by the Free Software Foundation, either version 3 of the
License, or (at your option) any later version.

This program is distributed in the hope that it will be useful,
but WITHOUT ANY WARRANTY; without even the implied warranty of
MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE. See the
GNU Affero General Public License for more details.

You should have received a copy of the GNU Affero General Public License
along with this program. If not, see <https://www.gnu.org/licenses/>.

For commercial licensing, please contact support@quantumnous.com
*/

import React, { useCallback, useEffect, useMemo, useState } from 'react';
import dayjs from 'dayjs';
import { Banner, Button, Card, Empty, Spin, Tag } from '@douyinfe/semi-ui';
import {
  Activity,
  Clock3,
  Database,
  Gauge,
  RefreshCw,
  ShieldAlert,
  ShieldCheck,
  WifiOff,
} from 'lucide-react';
import {
  IllustrationConstruction,
  IllustrationConstructionDark,
} from '@douyinfe/semi-illustrations';
import { API, showError } from '../../helpers';

const shellCardClass =
  'overflow-hidden !rounded-2xl border border-slate-200/90 bg-white/95 shadow-[0_8px_30px_rgba(15,23,42,0.08)]';

const stateMeta = {
  available: {
    color: 'green',
    label: 'Available',
    dot: 'bg-emerald-500',
    panel: 'border-emerald-200 bg-emerald-50/70 text-emerald-700',
    icon: ShieldCheck,
  },
  anomaly: {
    color: 'orange',
    label: 'Anomaly',
    dot: 'bg-amber-500',
    panel: 'border-amber-200 bg-amber-50/80 text-amber-700',
    icon: ShieldAlert,
  },
  idle: {
    color: 'blue',
    label: 'Idle',
    dot: 'bg-sky-500',
    panel: 'border-sky-200 bg-sky-50/80 text-sky-700',
    icon: Activity,
  },
  unavailable: {
    color: 'red',
    label: 'Unavailable',
    dot: 'bg-rose-500',
    panel: 'border-rose-200 bg-rose-50/80 text-rose-700',
    icon: WifiOff,
  },
};

function formatPercent(value) {
  if (!Number.isFinite(value)) {
    return '--';
  }
  return `${value.toFixed(1)}%`;
}

function formatLatency(value) {
  if (!Number.isFinite(value) || value <= 0) {
    return '--';
  }
  return `${Math.round(value)} ms`;
}

function formatTime(timestamp) {
  if (!timestamp) {
    return '--';
  }
  return dayjs.unix(timestamp).format('MM-DD HH:mm');
}

function formatRelativeTime(timestamp) {
  if (!timestamp) {
    return 'No recent update';
  }

  const minutes = Math.max(0, dayjs().diff(dayjs.unix(timestamp), 'minute'));
  if (minutes < 1) {
    return 'Updated just now';
  }
  if (minutes < 60) {
    return `Updated ${minutes} min ago`;
  }

  const hours = Math.floor(minutes / 60);
  if (hours < 24) {
    return `Updated ${hours} hr ago`;
  }

  const days = Math.floor(hours / 24);
  return `Updated ${days} day${days > 1 ? 's' : ''} ago`;
}

function buildPath(history, selector, width, height) {
  const points = history || [];
  const safeHeight = Math.max(height - 10, 1);
  let path = '';
  let started = false;

  points.forEach((point, index) => {
    const rawValue = selector(point);
    if (rawValue == null || Number.isNaN(rawValue)) {
      started = false;
      return;
    }

    const x = points.length <= 1 ? width / 2 : (index / (points.length - 1)) * width;
    const value = Math.max(0, Math.min(100, rawValue));
    const y = height - 5 - (value / 100) * safeHeight;

    if (!started) {
      path += `M ${x} ${y}`;
      started = true;
    } else {
      path += ` L ${x} ${y}`;
    }
  });

  return path;
}

const StatusBadge = ({ state }) => {
  const meta = stateMeta[state] || stateMeta.unavailable;
  const Icon = meta.icon;

  return (
    <div
      className={`inline-flex items-center gap-2 rounded-full border px-3 py-1 text-xs font-semibold ${meta.panel}`}
    >
      <span className={`h-2 w-2 rounded-full ${meta.dot}`} />
      <Icon size={13} />
      <span>{meta.label}</span>
    </div>
  );
};

const SummaryCard = ({ icon: Icon, label, value, accent }) => (
  <div
    className={`rounded-2xl border bg-white/95 p-4 shadow-[0_6px_20px_rgba(15,23,42,0.05)] ${accent}`}
    style={{ minHeight: 116 }}
  >
    <div className='flex items-start justify-between gap-3'>
      <div>
        <div className='text-xs font-medium uppercase tracking-[0.18em] text-slate-500'>
          {label}
        </div>
        <div className='mt-3 text-3xl font-semibold text-slate-900'>{value}</div>
      </div>
      <div className='flex h-11 w-11 items-center justify-center rounded-2xl bg-slate-100 text-slate-700'>
        <Icon size={18} />
      </div>
    </div>
  </div>
);

const MetricBar = ({ label, value, className }) => (
  <div className='space-y-2'>
    <div className='flex items-center justify-between text-sm text-slate-600'>
      <span>{label}</span>
      <span className='font-semibold text-slate-900'>{formatPercent(value)}</span>
    </div>
    <div className='h-2 rounded-full bg-slate-100'>
      <div
        className={`h-2 rounded-full transition-[width] ${className}`}
        style={{ width: `${Math.max(0, Math.min(100, value || 0))}%` }}
      />
    </div>
  </div>
);

const HistorySparkline = ({ history = [] }) => {
  const width = 420;
  const height = 86;
  const successPath = buildPath(history, (point) => point.success_rate, width, height);
  const cachePath = buildPath(history, (point) => point.cache_hit_rate, width, height);
  const first = history[0];
  const last = history[history.length - 1];

  return (
    <div className='space-y-3'>
      <div className='flex items-center justify-between text-[11px] uppercase tracking-[0.18em] text-slate-500'>
        <span>History</span>
        <div className='flex items-center gap-3 text-[11px] normal-case tracking-normal text-slate-500'>
          <span className='inline-flex items-center gap-1'>
            <span className='h-1.5 w-3 rounded-full bg-blue-500' />
            Success
          </span>
          <span className='inline-flex items-center gap-1'>
            <span className='h-1.5 w-3 rounded-full bg-teal-500' />
            Cache
          </span>
        </div>
      </div>
      <div className='rounded-xl border border-slate-200 bg-white px-3 py-3'>
        <svg
          viewBox={`0 0 ${width} ${height}`}
          preserveAspectRatio='none'
          className='h-24 w-full'
        >
          <path d={`M 0 2 L ${width} 2`} fill='none' stroke='#dbeafe' strokeWidth='2' />
          <path d={successPath} fill='none' stroke='#3b82f6' strokeWidth='2.2' />
          <path d={cachePath} fill='none' stroke='#14b8a6' strokeWidth='2.2' />
        </svg>
      </div>
      <div className='flex items-center justify-between text-xs text-slate-500'>
        <span>{first ? dayjs.unix(first.timestamp).format('HH:mm') : '--:--'}</span>
        <span>{last ? dayjs.unix(last.timestamp).format('HH:mm') : '--:--'}</span>
      </div>
    </div>
  );
};

const MonitoringCard = ({ group }) => {
  const meta = stateMeta[group.state] || stateMeta.unavailable;
  const requestCount = group.recent_requests || 0;
  const availableCount = group.enabled_channels || 0;

  return (
    <Card className={shellCardClass} bodyStyle={{ padding: 0 }}>
      <div className='p-5'>
        <div className='flex flex-wrap items-start justify-between gap-4'>
          <div className='min-w-0'>
            <div className='flex flex-wrap items-center gap-2'>
              <div className='truncate text-xl font-semibold text-slate-900'>
                {group.name || group.tag}
              </div>
              <StatusBadge state={group.state} />
            </div>
            <div className='mt-2 text-sm text-slate-500'>
              Model: {group.model_name || 'Not configured'}
            </div>
          </div>

          <div className='rounded-2xl border border-slate-200 bg-slate-50/80 px-4 py-3 text-right text-xs text-slate-500'>
            <div>Last probe: {formatTime(group.last_probe_at)}</div>
            <div className='mt-1'>Last request: {formatTime(group.last_request_at)}</div>
            <div className='mt-1 font-medium text-slate-700'>
              {formatRelativeTime(group.last_probe_at || group.last_request_at)}
            </div>
          </div>
        </div>

        <div className='mt-5 grid gap-3 sm:grid-cols-2 xl:grid-cols-4'>
          <div className='rounded-2xl border border-slate-200 bg-slate-50/70 p-4'>
            <div className='text-xs uppercase tracking-[0.16em] text-slate-500'>
              Availability
            </div>
            <div className='mt-2 text-2xl font-semibold text-slate-900'>
              {formatPercent(group.availability_rate)}
            </div>
          </div>
          <div className='rounded-2xl border border-slate-200 bg-slate-50/70 p-4'>
            <div className='text-xs uppercase tracking-[0.16em] text-slate-500'>
              Cache Hit
            </div>
            <div className='mt-2 text-2xl font-semibold text-slate-900'>
              {formatPercent(group.cache_hit_rate)}
            </div>
          </div>
          <div className='rounded-2xl border border-slate-200 bg-slate-50/70 p-4'>
            <div className='text-xs uppercase tracking-[0.16em] text-slate-500'>
              Avg Latency
            </div>
            <div className='mt-2 text-2xl font-semibold text-slate-900'>
              {formatLatency(group.average_latency_ms)}
            </div>
          </div>
          <div className='rounded-2xl border border-slate-200 bg-slate-50/70 p-4'>
            <div className='text-xs uppercase tracking-[0.16em] text-slate-500'>
              Requests 12h
            </div>
            <div className='mt-2 text-2xl font-semibold text-slate-900'>
              {requestCount}
            </div>
          </div>
        </div>

        <div className='mt-5 grid gap-4 xl:grid-cols-[1.05fr_0.95fr]'>
          <div className='rounded-2xl border border-slate-200 bg-slate-50/60 p-4'>
            <div className='mb-4 flex items-center gap-2 text-sm font-semibold text-slate-800'>
              <Gauge size={16} />
              Health Overview
            </div>
            <div className='space-y-4'>
              <MetricBar
                label='Availability'
                value={group.availability_rate}
                className='bg-gradient-to-r from-emerald-400 to-emerald-600'
              />
              <MetricBar
                label='Cache Hit'
                value={group.cache_hit_rate}
                className='bg-gradient-to-r from-sky-400 to-blue-600'
              />
            </div>
          </div>

          <div className='rounded-2xl border border-slate-200 bg-slate-50/60 p-4'>
            <div className='mb-4 flex items-center gap-2 text-sm font-semibold text-slate-800'>
              <Database size={16} />
              Channel Snapshot
            </div>
            <div className='grid grid-cols-2 gap-3 text-sm text-slate-700'>
              <div className='rounded-xl border border-slate-200 bg-white p-3'>
                <div className='text-xs text-slate-500'>Total</div>
                <div className='mt-1 text-xl font-semibold text-slate-900'>
                  {group.total_channels || 0}
                </div>
              </div>
              <div className='rounded-xl border border-slate-200 bg-white p-3'>
                <div className='text-xs text-slate-500'>Enabled</div>
                <div className='mt-1 text-xl font-semibold text-slate-900'>
                  {availableCount}
                </div>
              </div>
              <div className='rounded-xl border border-slate-200 bg-white p-3'>
                <div className='text-xs text-slate-500'>Manual Off</div>
                <div className='mt-1 text-xl font-semibold text-slate-900'>
                  {group.manual_disabled_channels || 0}
                </div>
              </div>
              <div className='rounded-xl border border-slate-200 bg-white p-3'>
                <div className='text-xs text-slate-500'>Auto Off</div>
                <div className='mt-1 text-xl font-semibold text-slate-900'>
                  {group.auto_disabled_channels || 0}
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className='mt-5 rounded-2xl border border-slate-200 bg-slate-50/60 p-4'>
          <div className='mb-4 flex items-center gap-2 text-sm font-semibold text-slate-800'>
            <Clock3 size={16} />
            12h Trend
          </div>
          <HistorySparkline history={group.history || []} />
        </div>
      </div>
    </Card>
  );
};

const Monitoring = () => {
  const [payload, setPayload] = useState(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const loadMonitoring = useCallback(async (silent = false) => {
    if (silent) {
      setRefreshing(true);
    } else {
      setLoading(true);
    }

    try {
      const res = await API.get('/api/group-monitoring');
      const { success, message, data } = res.data;
      if (!success) {
        showError(message || 'Failed to load monitoring data');
        return;
      }
      setPayload(data);
    } catch (error) {
      showError(error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    loadMonitoring();
  }, [loadMonitoring]);

  const groups = payload?.groups || [];
  const summary = payload?.summary;

  const summaryItems = useMemo(() => {
    if (!summary) {
      return [];
    }
    return [
      {
        icon: Database,
        label: 'Total Groups',
        value: summary.total_groups,
        accent: 'border-slate-200',
      },
      {
        icon: ShieldCheck,
        label: 'Available',
        value: summary.available_groups,
        accent: 'border-emerald-200 bg-emerald-50/75',
      },
      {
        icon: ShieldAlert,
        label: 'Anomaly',
        value: summary.anomaly_groups,
        accent: 'border-amber-200 bg-amber-50/75',
      },
      {
        icon: WifiOff,
        label: 'Idle + Down',
        value: (summary.unavailable_groups || 0) + (summary.idle_groups || 0),
        accent: 'border-rose-200 bg-rose-50/75',
      },
    ];
  }, [summary]);

  return (
    <div className='classic-page-fill bg-slate-50 px-3 pb-8 pt-[72px]'>
      <div className='mx-auto w-full max-w-7xl space-y-5'>
        <Card className={shellCardClass} bodyStyle={{ padding: 0 }}>
          <div className='border-b border-slate-200 bg-[radial-gradient(circle_at_top_left,_rgba(59,130,246,0.12),_transparent_38%),radial-gradient(circle_at_top_right,_rgba(20,184,166,0.12),_transparent_34%),white] p-6'>
            <div className='flex flex-wrap items-start justify-between gap-4'>
              <div className='min-w-0'>
                <div className='flex items-center gap-2 text-slate-800'>
                  <Activity size={18} />
                  <span className='text-sm font-medium uppercase tracking-[0.18em] text-slate-500'>
                    Group Monitoring
                  </span>
                </div>
                <div className='mt-3 text-3xl font-semibold text-slate-900'>
                  Real-time group health board
                </div>
                <div className='mt-3 max-w-3xl text-sm text-slate-600'>
                  A cleaner operational view for availability, cache hit rate, latency,
                  recent traffic, and channel status.
                </div>
              </div>

              <div className='flex items-center gap-3'>
                <div className='rounded-full border border-slate-200 bg-white px-4 py-2 text-xs text-slate-600 shadow-sm'>
                  {formatRelativeTime(summary?.updated_at)}
                </div>
                <Button
                  icon={<RefreshCw size={14} />}
                  loading={refreshing}
                  theme='solid'
                  type='primary'
                  onClick={() => loadMonitoring(true)}
                >
                  Refresh
                </Button>
              </div>
            </div>
          </div>

          <div className='p-5'>
            <Banner
              type='info'
              closeIcon={null}
              description={`Monitoring refreshes every 2 minutes. Last sync: ${formatTime(summary?.updated_at)}`}
            />
          </div>
        </Card>

        <Spin spinning={loading}>
          <div className='grid gap-4 md:grid-cols-2 xl:grid-cols-4'>
            {summaryItems.map((item) => (
              <SummaryCard key={item.label} {...item} />
            ))}
          </div>

          {groups.length === 0 ? (
            <Card className={shellCardClass}>
              <div className='flex justify-center py-12'>
                <Empty
                  image={<IllustrationConstruction style={{ width: 150, height: 150 }} />}
                  darkModeImage={
                    <IllustrationConstructionDark style={{ width: 150, height: 150 }} />
                  }
                  title='No monitored groups yet'
                  description='Assign tags to channels first, then groups will appear here automatically.'
                />
              </div>
            </Card>
          ) : (
            <div className='grid gap-4 xl:grid-cols-2'>
              {groups.map((group) => (
                <MonitoringCard key={group.tag} group={group} />
              ))}
            </div>
          )}
        </Spin>
      </div>
    </div>
  );
};

export default Monitoring;

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
import { Empty, Spin } from '@douyinfe/semi-ui';
import {
  IllustrationConstruction,
  IllustrationConstructionDark,
} from '@douyinfe/semi-illustrations';
import { API, showError } from '../../helpers';

const cardClassName =
  'rounded-[10px] border border-[#e5e7eb] bg-white shadow-[0_2px_10px_rgba(15,23,42,0.08)]';

const historyBlue = '#3b82f6';
const historyTeal = '#20c7bd';

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
  if (value < 1000) {
    return `${value}ms`;
  }
  return `${(value / 1000).toFixed(2)}s`;
}

function formatPriceLikeValue(value) {
  if (typeof value === 'string' && value.trim()) {
    return value.trim();
  }
  if (Number.isFinite(value)) {
    return `${Number(value).toFixed(2)}元/刀`;
  }
  return null;
}

function formatCardSecondaryMetric(group) {
  return (
    formatPriceLikeValue(group.price_text) ||
    formatPriceLikeValue(group.group_price_text) ||
    formatPriceLikeValue(group.price) ||
    formatPriceLikeValue(group.group_price) ||
    `${group.recent_requests || 0}次请求`
  );
}

function formatTime(timestamp) {
  if (!timestamp) {
    return '--';
  }
  return dayjs.unix(timestamp).format('HH:mm');
}

function formatRelativeSummary(timestamp) {
  if (!timestamp) {
    return '数据更新于 刚刚';
  }

  const diffMinutes = Math.max(
    0,
    dayjs().diff(dayjs.unix(timestamp), 'minute'),
  );
  if (diffMinutes < 1) {
    return '数据更新于 刚刚';
  }
  if (diffMinutes < 60) {
    return `数据更新于 ${diffMinutes} 分钟前`;
  }

  const diffHours = Math.floor(diffMinutes / 60);
  if (diffHours < 24) {
    return `数据更新于 ${diffHours} 小时前`;
  }

  const diffDays = Math.floor(diffHours / 24);
  return `数据更新于 ${diffDays} 天前`;
}

function stateLabel(state) {
  switch (state) {
    case 'available':
      return '当前可用';
    case 'anomaly':
      return '探测异常';
    case 'idle':
      return '无调用';
    default:
      return '无调用';
  }
}

function stateDotClassName(state) {
  switch (state) {
    case 'available':
      return 'bg-emerald-500';
    case 'anomaly':
      return 'bg-red-500';
    case 'idle':
      return 'bg-[#6b7280]';
    default:
      return 'bg-[#6b7280]';
  }
}

function stateBadgeClassName(state) {
  switch (state) {
    case 'available':
      return 'bg-[#ecfdf3] text-[#16a34a]';
    case 'anomaly':
      return 'bg-[#fef2f2] text-[#ef4444]';
    case 'idle':
      return 'bg-[#f3f4f6] text-[#6b7280]';
    default:
      return 'bg-[#f3f4f6] text-[#6b7280]';
  }
}

function latencyClassName(value) {
  if (!Number.isFinite(value) || value <= 0) {
    return 'text-[#9ca3af]';
  }
  if (value < 4000) {
    return 'text-[#16a34a]';
  }
  if (value < 8000) {
    return 'text-[#f59e0b]';
  }
  return 'text-[#f97316]';
}

function cacheBarWidth(value) {
  return `${Math.max(0, Math.min(100, value || 0))}%`;
}

function buildHistoryPath(history, selector, width, height) {
  if (!history.length) {
    return '';
  }

  const safeHeight = Math.max(height - 12, 1);
  let path = '';
  let started = false;

  history.forEach((point, index) => {
    const rawValue = selector(point);
    if (rawValue == null || Number.isNaN(rawValue)) {
      started = false;
      return;
    }

    const x =
      history.length <= 1 ? width / 2 : (index / (history.length - 1)) * width;
    const value = Math.max(0, Math.min(100, rawValue));
    const y = height - 6 - (value / 100) * safeHeight;

    if (!started) {
      path += `M ${x} ${y}`;
      started = true;
    } else {
      path += ` L ${x} ${y}`;
    }
  });

  return path;
}

function SummaryDot({ colorClassName, value, label }) {
  return (
    <div className='inline-flex items-center gap-[6px] text-[14px] leading-5 text-[#374151]'>
      <span className={`h-2 w-2 rounded-full ${colorClassName}`} />
      <span className='font-medium text-[#1f2937]'>{value}</span>
      <span>{label}</span>
    </div>
  );
}

function TopSummary({ summary }) {
  return (
    <div className={`${cardClassName} px-7 py-[19px]`}>
      <div className='flex flex-col gap-3 xl:flex-row xl:items-center xl:justify-between'>
        <div className='flex flex-wrap items-center gap-x-4 gap-y-2'>
          <SummaryDot
            colorClassName='bg-[#22c55e]'
            value={summary?.available_groups || 0}
            label='当前可用'
          />
          <SummaryDot
            colorClassName='bg-[#ef4444]'
            value={summary?.anomaly_groups || 0}
            label='探测异常'
          />
          <SummaryDot
            colorClassName='bg-[#6b7280]'
            value={
              (summary?.idle_groups || 0) + (summary?.unavailable_groups || 0)
            }
            label='无调用'
          />
          <div className='h-5 w-px bg-[#e5e7eb]' />
          <div className='text-[14px] leading-5 text-[#4b5563]'>
            {summary?.total_groups || 0} 个分组
          </div>
        </div>

        <div className='self-end text-[12px] leading-5 text-[#64748b] xl:self-auto'>
          {formatRelativeSummary(summary?.updated_at)}
        </div>
      </div>
    </div>
  );
}

function MetricRow({ label, value, colorClassName, muted }) {
  const displayValue = muted ? '无调用' : formatPercent(value);
  const barWidth = muted ? '0%' : cacheBarWidth(value);

  return (
    <div className='space-y-[7px]'>
      <div className='flex items-center justify-between text-[13px] leading-5'>
        <span className='text-[#374151]'>{label}</span>
        <span
          className={`font-semibold tabular-nums ${muted ? 'text-[#6b7280]' : 'text-[#22c55e]'}`}
        >
          {displayValue}
        </span>
      </div>
      <div className='h-[6px] rounded-full bg-[#f3f4f6]'>
        <div
          className={`h-[6px] rounded-full transition-[width] ${colorClassName}`}
          style={{ width: barWidth }}
        />
      </div>
    </div>
  );
}

function HistoryChart({ history }) {
  const width = 420;
  const height = 76;
  const latestProbePath = buildHistoryPath(
    history,
    (point) => point.success_rate,
    width,
    height,
  );
  const cachePath = buildHistoryPath(
    history,
    (point) => point.cache_hit_rate,
    width,
    height,
  );
  const first = history?.[0];
  const last = history?.[history.length - 1];

  return (
    <div className='pt-[12px]'>
      <div className='mb-[8px] flex items-center justify-between text-[11px] font-semibold uppercase tracking-[0.12em] text-[#6b7280]'>
        <span>History</span>
        <div className='flex items-center gap-3 text-[10px] font-normal normal-case tracking-normal text-[#6b7280]'>
          <span className='inline-flex items-center gap-[5px]'>
            <span className='h-[3px] w-3 rounded-full bg-[#3b82f6]' />
            最新探测
          </span>
          <span className='inline-flex items-center gap-[5px]'>
            <span className='h-[3px] w-3 rounded-full bg-[#22c55e]' />
            缓存率
          </span>
        </div>
      </div>

      <div className='border-t border-[#e5e7eb] pt-[10px]'>
        <svg
          viewBox={`0 0 ${width} ${height}`}
          preserveAspectRatio='none'
          className='h-[66px] w-full'
        >
          <path
            d={`M 0 2 L ${width} 2`}
            fill='none'
            stroke='#dbeafe'
            strokeWidth='2'
          />
          <path
            d={latestProbePath}
            fill='none'
            stroke={historyBlue}
            strokeWidth='2'
          />
          <path
            d={cachePath}
            fill='none'
            stroke={historyTeal}
            strokeWidth='2'
          />
        </svg>
      </div>

      <div className='flex items-center justify-between text-[10px] leading-4 text-[#6b7280]'>
        <span>{first ? formatTime(first.timestamp) : '--:--'}</span>
        <span>{last ? formatTime(last.timestamp) : '--:--'}</span>
      </div>
    </div>
  );
}

function GroupCard({ group }) {
  const muted = group.state === 'idle' || group.state === 'unavailable';

  return (
    <div
      className={`${cardClassName} h-full min-h-[356px] overflow-hidden p-5`}
    >
      <div className='flex items-start justify-between gap-4'>
        <div className='min-w-0 flex-1'>
          <div className='truncate text-[15px] font-semibold leading-6 text-[#111827]'>
            {group.name || group.tag}
          </div>
          <div className='mt-[3px] truncate text-[12px] leading-5 text-[#6b7280]'>
            {group.model_name || '未配置模型'}
          </div>
        </div>

        <div
          className={`inline-flex shrink-0 items-center gap-[6px] rounded-full px-[10px] py-[4px] text-[12px] font-semibold leading-4 ${stateBadgeClassName(group.state)}`}
        >
          <span
            className={`h-[6px] w-[6px] rounded-full ${stateDotClassName(group.state)}`}
          />
          {stateLabel(group.state)}
        </div>
      </div>

      <div className='mt-[8px] flex items-center justify-end gap-[9px] text-[12px] leading-4'>
        <span
          className={`font-semibold tabular-nums ${latencyClassName(group.average_latency_ms)}`}
        >
          {formatLatency(group.average_latency_ms)}
        </span>
        <span className='text-[#d1d5db]'>|</span>
        <span className='font-semibold tabular-nums text-[#6b7280]'>
          {formatCardSecondaryMetric(group)}
        </span>
      </div>

      <div className='mt-[14px] space-y-[11px]'>
        <MetricRow
          label='可用率'
          value={group.availability_rate}
          colorClassName='bg-[#22c55e]'
          muted={muted}
        />
        <MetricRow
          label='缓存命中率'
          value={group.cache_hit_rate}
          colorClassName='bg-[#5eead4]'
          muted={muted}
        />
      </div>

      <HistoryChart history={group.history || []} />
    </div>
  );
}

function createPreviewHistory(now, cacheBase, pattern = 'steady') {
  const bucketSeconds = 10 * 60;
  const length = 73;

  return Array.from({ length }, (_, index) => {
    const timestamp = now - (length - 1 - index) * bucketSeconds;
    if (pattern === 'empty') {
      return {
        timestamp,
        success_rate: null,
        cache_hit_rate: null,
        requests: 0,
      };
    }

    const wave = Math.sin(index * 0.7) * 7 + Math.cos(index * 0.23) * 4;
    const drop = [6, 18, 37, 58, 70].includes(index)
      ? pattern === 'volatile'
        ? 35
        : 10
      : 0;
    const successRate =
      pattern === 'volatile'
        ? Math.max(78, 98 - (index % 3 === 0 ? 12 : 0) - drop)
        : Math.max(90, 100 - drop);
    const cacheHitRate = Math.max(
      2,
      Math.min(99, cacheBase + wave - (pattern === 'low' ? index % 9 : 0)),
    );

    return {
      timestamp,
      success_rate: successRate,
      cache_hit_rate: Number(cacheHitRate.toFixed(1)),
      requests: 8 + ((index * 7) % 36),
    };
  });
}

function createPreviewPayload() {
  const now = dayjs().unix();
  const groups = [
    {
      tag: 'claude-max',
      name: 'ClaudeCode-Max',
      model_name: 'claude-fable-5',
      state: 'available',
      recent_requests: 1284,
      average_latency_ms: 5470,
      availability_rate: 100,
      cache_hit_rate: 99.6,
      price_text: '1.50元/刀',
      history: createPreviewHistory(now, 99, 'steady'),
    },
    {
      tag: 'claude-max-c',
      name: 'ClaudeCode-Max-C',
      model_name: 'claude-opus-4-6',
      state: 'available',
      recent_requests: 928,
      average_latency_ms: 3900,
      availability_rate: 100,
      cache_hit_rate: 69.5,
      price_text: '1.60元/刀',
      history: createPreviewHistory(now, 69, 'steady'),
    },
    {
      tag: 'claude-reverse',
      name: 'Claudecode-反重力逆向',
      model_name: 'claude-opus-4-6',
      state: 'idle',
      recent_requests: 0,
      average_latency_ms: 0,
      availability_rate: 0,
      cache_hit_rate: 0,
      price_text: '0.65元/刀',
      history: createPreviewHistory(now, 0, 'empty'),
    },
    {
      tag: 'claude-supplement',
      name: 'ClaudeCode-补贴渠道',
      model_name: 'claude-opus-4-7',
      state: 'available',
      recent_requests: 641,
      average_latency_ms: 1310,
      availability_rate: 100,
      cache_hit_rate: 63.9,
      price_text: '0.50元/刀',
      history: createPreviewHistory(now, 64, 'volatile'),
    },
    {
      tag: 'claude-cheap',
      name: 'ClaudeCode-廉价渠道',
      model_name: 'claude-haiku-4-5-20251001',
      state: 'available',
      recent_requests: 512,
      average_latency_ms: 4060,
      availability_rate: 100,
      cache_hit_rate: 44.2,
      price_text: '0.45元/刀',
      history: createPreviewHistory(now, 44, 'low'),
    },
    {
      tag: 'claude-kiro',
      name: 'ClaudeCode-Kiro逆向',
      model_name: 'claude-opus-4-8',
      state: 'available',
      recent_requests: 734,
      average_latency_ms: 3110,
      availability_rate: 100,
      cache_hit_rate: 93.7,
      price_text: '0.40元/刀',
      history: createPreviewHistory(now, 94, 'steady'),
    },
    {
      tag: 'claude-opus',
      name: 'ClaudeCode-逆向',
      model_name: 'claude-opus-4-8',
      state: 'available',
      recent_requests: 420,
      average_latency_ms: 7790,
      availability_rate: 100,
      cache_hit_rate: 92.9,
      price_text: '0.30元/刀',
      history: createPreviewHistory(now, 93, 'volatile'),
    },
    {
      tag: 'codex-plus',
      name: 'Codex | Plus号池',
      model_name: 'gpt-5.5',
      state: 'available',
      recent_requests: 1186,
      average_latency_ms: 2520,
      availability_rate: 99.9,
      cache_hit_rate: 47.4,
      price_text: '0.15元/刀',
      history: createPreviewHistory(now, 47, 'low'),
    },
  ];

  return {
    summary: {
      available_groups: 7,
      anomaly_groups: 0,
      idle_groups: 1,
      unavailable_groups: 0,
      total_groups: groups.length,
      updated_at: now,
    },
    groups,
  };
}

function EmptyMonitoringState() {
  return (
    <div className={`${cardClassName} px-6 py-16`}>
      <div className='flex justify-center'>
        <Empty
          image={
            <IllustrationConstruction style={{ width: 150, height: 150 }} />
          }
          darkModeImage={
            <IllustrationConstructionDark style={{ width: 150, height: 150 }} />
          }
          title='暂无监控分组'
          description='请先给渠道设置 tag，监控页会按 tag 自动聚合展示。'
        />
      </div>
    </div>
  );
}

const Monitoring = () => {
  const [payload, setPayload] = useState(null);
  const [loading, setLoading] = useState(true);
  const previewMode = useMemo(() => {
    if (typeof window === 'undefined') {
      return false;
    }
    const params = new URLSearchParams(window.location.search);
    return params.has('preview') || params.has('demo');
  }, []);
  const previewPayload = useMemo(
    () => (previewMode ? createPreviewPayload() : null),
    [previewMode],
  );

  const loadMonitoring = useCallback(async (silent = false) => {
    if (!silent) {
      setLoading(true);
    }

    try {
      const res = await API.get('/api/group-monitoring');
      const { success, message, data } = res.data;
      if (!success) {
        showError(message || '加载分组监控失败');
        return;
      }
      setPayload(data);
    } catch (error) {
      showError(error);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (previewMode) {
      setLoading(false);
      return undefined;
    }

    loadMonitoring();
    const timer = window.setInterval(() => loadMonitoring(true), 120000);
    return () => window.clearInterval(timer);
  }, [loadMonitoring, previewMode]);

  const groups = previewPayload?.groups || payload?.groups || [];
  const summary = previewPayload?.summary || payload?.summary;

  const sortedGroups = useMemo(() => {
    return [...groups].sort((a, b) => {
      const order = { available: 0, anomaly: 1, idle: 2, unavailable: 3 };
      const stateDiff = (order[a.state] ?? 9) - (order[b.state] ?? 9);
      if (stateDiff !== 0) {
        return stateDiff;
      }
      if ((b.recent_requests || 0) !== (a.recent_requests || 0)) {
        return (b.recent_requests || 0) - (a.recent_requests || 0);
      }
      return (b.availability_rate || 0) - (a.availability_rate || 0);
    });
  }, [groups]);

  return (
    <div className='classic-page-fill bg-[#fafafa] px-1 pb-8 pt-0'>
      <div className='mx-auto w-full max-w-[1900px] space-y-6'>
        <TopSummary summary={summary} />

        <Spin spinning={loading && !previewMode}>
          {sortedGroups.length === 0 ? (
            <EmptyMonitoringState />
          ) : (
            <div className='grid gap-4 md:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4'>
              {sortedGroups.map((group) => (
                <GroupCard key={group.tag} group={group} />
              ))}
            </div>
          )}
        </Spin>
      </div>
    </div>
  );
};

export default Monitoring;

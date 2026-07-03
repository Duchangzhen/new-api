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
import {
  Banner,
  Button,
  Card,
  Empty,
  Spin,
  Tag,
} from '@douyinfe/semi-ui';
import {
  Activity,
  Clock3,
  RefreshCw,
  Server,
  ShieldCheck,
  TriangleAlert,
  WifiOff,
} from 'lucide-react';
import {
  IllustrationConstruction,
  IllustrationConstructionDark,
} from '@douyinfe/semi-illustrations';
import { useTranslation } from 'react-i18next';
import { API, showError } from '../../helpers';

const summaryCardClass =
  'rounded-2xl border border-slate-200 bg-white/90 p-4 shadow-sm';

const stateMeta = {
  available: {
    color: 'green',
    text: '可用',
    icon: ShieldCheck,
  },
  anomaly: {
    color: 'orange',
    text: '异常',
    icon: TriangleAlert,
  },
  idle: {
    color: 'blue',
    text: '空闲',
    icon: Activity,
  },
  unavailable: {
    color: 'red',
    text: '不可用',
    icon: WifiOff,
  },
};

function formatPercent(value) {
  if (!Number.isFinite(value)) {
    return '-';
  }
  return `${value.toFixed(1)}%`;
}

function formatTime(timestamp) {
  if (!timestamp) {
    return '暂无';
  }
  return dayjs.unix(timestamp).format('MM-DD HH:mm');
}

function renderHistory(history) {
  const nonZeroPoints = history.filter((point) => point.requests > 0);
  if (nonZeroPoints.length === 0) {
    return '近 12 小时暂无请求';
  }

  return nonZeroPoints
    .slice(-6)
    .map((point) => {
      const time = dayjs.unix(point.timestamp).format('HH:mm');
      const success = point.success_rate == null
        ? '-'
        : `${point.success_rate.toFixed(0)}%`;
      return `${time} ${success}`;
    })
    .join(' / ');
}

const SummaryCard = ({ icon: Icon, label, value, toneClass = '' }) => (
  <div className={`${summaryCardClass} ${toneClass}`}>
    <div className='flex items-center gap-3'>
      <div className='flex h-10 w-10 items-center justify-center rounded-xl bg-slate-100 text-slate-700'>
        <Icon size={18} />
      </div>
      <div className='min-w-0'>
        <div className='text-xs text-slate-500'>{label}</div>
        <div className='mt-1 text-2xl font-semibold text-slate-900'>{value}</div>
      </div>
    </div>
  </div>
);

const Monitoring = () => {
  const { t } = useTranslation();
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
        showError(message || '加载分组监控失败');
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
        icon: Server,
        label: '分组总数',
        value: summary.total_groups,
      },
      {
        icon: ShieldCheck,
        label: '可用分组',
        value: summary.available_groups,
        toneClass: 'border-emerald-200 bg-emerald-50/70',
      },
      {
        icon: TriangleAlert,
        label: '异常分组',
        value: summary.anomaly_groups,
        toneClass: 'border-amber-200 bg-amber-50/70',
      },
      {
        icon: WifiOff,
        label: '不可用/空闲',
        value: summary.unavailable_groups + summary.idle_groups,
        toneClass: 'border-rose-200 bg-rose-50/70',
      },
    ];
  }, [summary]);

  return (
    <div className='classic-page-fill px-3 pb-6 pt-[72px]'>
      <div className='mx-auto w-full max-w-7xl space-y-4'>
        <Card
          className='!rounded-2xl shadow-sm'
          bodyStyle={{ padding: 20 }}
          title={
            <div className='flex items-center justify-between gap-3'>
              <div className='flex items-center gap-2'>
                <Activity size={18} />
                <span>分组监控</span>
              </div>
              <Button
                icon={<RefreshCw size={14} />}
                loading={refreshing}
                theme='borderless'
                type='tertiary'
                onClick={() => loadMonitoring(true)}
              >
                刷新
              </Button>
            </div>
          }
        >
          <Banner
            type='info'
            closeIcon={null}
            description={`数据每 2 分钟更新一次，当前主题为 classic。最近更新时间：${formatTime(summary?.updated_at)}`}
          />
        </Card>

        <Spin spinning={loading}>
          <div className='grid gap-4 md:grid-cols-2 xl:grid-cols-4'>
            {summaryItems.map((item) => (
              <SummaryCard key={item.label} {...item} />
            ))}
          </div>

          {groups.length === 0 ? (
            <Card className='!rounded-2xl shadow-sm'>
              <div className='flex justify-center py-10'>
                <Empty
                  image={
                    <IllustrationConstruction style={{ width: 150, height: 150 }} />
                  }
                  darkModeImage={
                    <IllustrationConstructionDark
                      style={{ width: 150, height: 150 }}
                    />
                  }
                  title='暂无监控分组'
                  description='请先给渠道设置 tag，监控页会按 tag 聚合展示。'
                />
              </div>
            </Card>
          ) : (
            <div className='grid gap-4 xl:grid-cols-2'>
              {groups.map((group) => {
                const meta = stateMeta[group.state] || stateMeta.unavailable;
                const StateIcon = meta.icon;
                return (
                  <Card
                    key={group.tag}
                    className='!rounded-2xl shadow-sm'
                    bodyStyle={{ padding: 20 }}
                  >
                    <div className='flex flex-wrap items-start justify-between gap-3'>
                      <div className='min-w-0'>
                        <div className='flex flex-wrap items-center gap-2'>
                          <div className='text-lg font-semibold text-slate-900'>
                            {group.name || group.tag}
                          </div>
                          <Tag color={meta.color} shape='circle'>
                            <span className='inline-flex items-center gap-1'>
                              <StateIcon size={12} />
                              {meta.text}
                            </span>
                          </Tag>
                        </div>
                        <div className='mt-1 text-sm text-slate-500'>
                          模型：{group.model_name || '未设置'}
                        </div>
                      </div>
                      <div className='text-right text-xs text-slate-500'>
                        <div>最近探测：{formatTime(group.last_probe_at)}</div>
                        <div>最近请求：{formatTime(group.last_request_at)}</div>
                      </div>
                    </div>

                    <div className='mt-4 grid gap-3 sm:grid-cols-2 xl:grid-cols-4'>
                      <div className='rounded-xl bg-slate-50 p-3'>
                        <div className='text-xs text-slate-500'>可用率</div>
                        <div className='mt-1 text-xl font-semibold text-slate-900'>
                          {formatPercent(group.availability_rate)}
                        </div>
                      </div>
                      <div className='rounded-xl bg-slate-50 p-3'>
                        <div className='text-xs text-slate-500'>缓存命中</div>
                        <div className='mt-1 text-xl font-semibold text-slate-900'>
                          {formatPercent(group.cache_hit_rate)}
                        </div>
                      </div>
                      <div className='rounded-xl bg-slate-50 p-3'>
                        <div className='text-xs text-slate-500'>平均延迟</div>
                        <div className='mt-1 text-xl font-semibold text-slate-900'>
                          {group.average_latency_ms || 0} ms
                        </div>
                      </div>
                      <div className='rounded-xl bg-slate-50 p-3'>
                        <div className='text-xs text-slate-500'>近 12h 请求</div>
                        <div className='mt-1 text-xl font-semibold text-slate-900'>
                          {group.recent_requests || 0}
                        </div>
                      </div>
                    </div>

                    <div className='mt-4 grid gap-3 sm:grid-cols-2'>
                      <div className='rounded-xl border border-slate-200 p-3'>
                        <div className='mb-2 text-xs text-slate-500'>渠道状态</div>
                        <div className='space-y-1 text-sm text-slate-700'>
                          <div>总渠道：{group.total_channels}</div>
                          <div>启用：{group.enabled_channels}</div>
                          <div>手动禁用：{group.manual_disabled_channels}</div>
                          <div>自动禁用：{group.auto_disabled_channels}</div>
                        </div>
                      </div>
                      <div className='rounded-xl border border-slate-200 p-3'>
                        <div className='mb-2 flex items-center gap-2 text-xs text-slate-500'>
                          <Clock3 size={12} />
                          近 12 小时走势
                        </div>
                        <div className='text-sm leading-6 text-slate-700'>
                          {renderHistory(group.history || [])}
                        </div>
                      </div>
                    </div>
                  </Card>
                );
              })}
            </div>
          )}
        </Spin>
      </div>
    </div>
  );
};

export default Monitoring;

/*
Copyright (C) 2023-2026 QuantumNous

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
import { BarChart3, Gift, Sparkles, TrendingUp, Users } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { formatQuota } from '@/lib/format'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Skeleton } from '@/components/ui/skeleton'
import { CopyButton } from '@/components/copy-button'
import type { UserWalletData } from '../types'

interface AffiliateRewardsCardProps {
  user: UserWalletData | null
  affiliateLink: string
  onTransfer: () => void
  complianceConfirmed?: boolean
  loading?: boolean
}

export function AffiliateRewardsCard({
  user,
  affiliateLink,
  onTransfer,
  complianceConfirmed = true,
  loading,
}: AffiliateRewardsCardProps) {
  const { t } = useTranslation()

  if (loading) {
    return (
      <Card className='gap-0 overflow-hidden py-0'>
        <CardHeader className='p-3 !pb-3 sm:p-5 sm:!pb-5'>
          <Skeleton className='h-6 w-32' />
          <Skeleton className='mt-2 h-4 w-48' />
        </CardHeader>
        <CardContent className='space-y-3 p-3 sm:p-4'>
          <Skeleton className='h-56 rounded-xl' />
          <Skeleton className='h-32 rounded-xl' />
        </CardContent>
      </Card>
    )
  }

  const hasRewards = (user?.aff_quota ?? 0) > 0

  return (
    <Card className='gap-0 overflow-hidden py-0'>
      <CardHeader className='p-3 !pb-3 sm:p-5 sm:!pb-5'>
        <div className='flex min-w-0 items-center gap-3'>
          <div className='flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-emerald-500 text-white shadow-lg shadow-emerald-500/25'>
            <Gift className='h-4 w-4' />
          </div>
          <div className='min-w-0'>
            <h3 className='truncate text-lg font-semibold tracking-tight'>
              邀请奖励
            </h3>
            <p className='text-muted-foreground truncate text-sm'>
              邀请好友获得额外奖励
            </p>
          </div>
        </div>
      </CardHeader>

      <CardContent className='space-y-3 p-3 pt-0 sm:p-4 sm:pt-0'>
        <div className='relative overflow-hidden rounded-xl bg-[#064f54] p-5 text-white sm:p-6'>
          <div
            className='pointer-events-none absolute inset-0 opacity-45'
            style={{
              background:
                'radial-gradient(circle at 30% 20%, rgba(86, 196, 170, .45), transparent 36%), radial-gradient(circle at 70% 10%, rgba(37, 99, 235, .32), transparent 30%), linear-gradient(135deg, rgba(6, 95, 70, .85), rgba(15, 82, 93, .94))',
            }}
          />
          <div className='pointer-events-none absolute inset-x-0 bottom-0 h-24 bg-gradient-to-t from-black/25 to-transparent' />
          <div className='relative space-y-6'>
            <div className='flex items-center justify-between gap-3'>
              <h4 className='text-xl font-bold'>收益统计</h4>
              {hasRewards && (
                <Button
                  size='sm'
                  variant='secondary'
                  onClick={onTransfer}
                  disabled={!complianceConfirmed}
                  className='h-9 rounded-xl bg-white/85 text-zinc-700 hover:bg-white'
                >
                  <Sparkles className='h-4 w-4' />
                  划转到余额
                </Button>
              )}
            </div>

            <div className='grid grid-cols-3 gap-4 text-center'>
              <div>
                <div className='text-3xl font-bold tabular-nums'>
                  {formatQuota(user?.aff_quota ?? 0)}
                </div>
                <div className='mt-3 inline-flex items-center gap-1 text-sm text-white/85'>
                  <TrendingUp className='h-4 w-4' />
                  待使用收益
                </div>
              </div>
              <div>
                <div className='text-3xl font-bold tabular-nums'>
                  {formatQuota(user?.aff_history_quota ?? 0)}
                </div>
                <div className='mt-3 inline-flex items-center gap-1 text-sm text-white/85'>
                  <BarChart3 className='h-4 w-4' />
                  总收益
                </div>
              </div>
              <div>
                <div className='text-3xl font-bold tabular-nums'>
                  {(user?.aff_count ?? 0).toLocaleString()}
                </div>
                <div className='mt-3 inline-flex items-center gap-1 text-sm text-white/85'>
                  <Users className='h-4 w-4' />
                  邀请人数
                </div>
              </div>
            </div>

            <div className='relative flex items-center gap-2 rounded-lg bg-white/95 p-2 text-zinc-900'>
              <span className='shrink-0 pl-2 text-sm font-semibold'>
                邀请链接
              </span>
              <Input
                value={affiliateLink}
                readOnly
                className='h-9 min-w-0 border-0 bg-transparent px-0 font-mono text-sm shadow-none focus-visible:ring-0'
              />
              <CopyButton
                value={affiliateLink}
                variant='default'
                size='sm'
                className='h-10 rounded-lg bg-blue-600 px-4 text-white hover:bg-blue-700'
                iconClassName='h-4 w-4'
                tooltip={t('Copy referral link')}
                aria-label={t('Copy referral link')}
              >
                复制
              </CopyButton>
            </div>
          </div>
        </div>

        <div className='rounded-xl border'>
          <div className='border-b px-4 py-3 text-sm text-zinc-600 dark:text-zinc-300'>
            奖励说明
          </div>
          <div className='space-y-3 p-4 text-sm text-muted-foreground'>
            {[
              '邀请好友注册，好友充值后您可获得相应奖励',
              '通过划转功能将奖励额度转入到您的账户余额中',
              '邀请的好友越多，获得的奖励越多',
            ].map((item) => (
              <div key={item} className='flex gap-3'>
                <span className='mt-1.5 size-2 shrink-0 rounded-full bg-green-500' />
                <span>{item}</span>
              </div>
            ))}
          </div>
        </div>

        {!complianceConfirmed ? (
          <p className='text-muted-foreground text-xs'>
            {t(
              'Referral reward transfer is disabled until the administrator confirms compliance terms.'
            )}
          </p>
        ) : null}
      </CardContent>
    </Card>
  )
}

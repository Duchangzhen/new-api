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
import {
  useState,
  useEffect,
  useMemo,
  useCallback,
  type ReactNode,
} from 'react'
import {
  CreditCard,
  ReceiptText,
  RefreshCw,
  Sparkles,
  WalletCards,
} from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { toast } from 'sonner'
import { formatQuota } from '@/lib/format'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Separator } from '@/components/ui/separator'
import { Skeleton } from '@/components/ui/skeleton'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { TitledCard } from '@/components/ui/titled-card'
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from '@/components/ui/tooltip'
import {
  getPublicPlans,
  getSelfSubscriptionFull,
  updateBillingPreference,
} from '@/features/subscriptions/api'
import { SubscriptionPurchaseDialog } from '@/features/subscriptions/components/dialogs/subscription-purchase-dialog'
import { formatDuration, formatResetPeriod } from '@/features/subscriptions/lib'
import type {
  PlanRecord,
  SubscriptionPlan,
  UserSubscriptionRecord,
} from '@/features/subscriptions/types'
import type { PaymentMethod, TopupInfo } from '../types'

interface SubscriptionPlansCardProps {
  topupInfo: TopupInfo | null
  onAvailabilityChange?: (available: boolean) => void
  userQuota?: number
  onPurchaseSuccess?: () => void | Promise<void>
  onOpenBilling?: () => void
  rechargePanel?: ReactNode
}

function getEpayMethods(payMethods: PaymentMethod[] = []): PaymentMethod[] {
  return payMethods.filter(
    (m) => m?.type && m.type !== 'stripe' && m.type !== 'creem'
  )
}

function getBillingPreferenceLabel(
  preference: string,
  t: (key: string) => string
): string {
  switch (preference) {
    case 'subscription_first':
      return t('Subscription First')
    case 'wallet_first':
      return t('Wallet First')
    case 'subscription_only':
      return t('Subscription Only')
    case 'wallet_only':
      return t('Wallet Only')
    default:
      return preference
  }
}

function getCurrencySymbol(currency?: string): string {
  const normalized = (currency || '').toUpperCase()
  if (normalized === 'CNY' || normalized === 'RMB') return '¥'
  if (normalized === 'EUR') return '€'
  if (normalized === 'GBP') return '£'
  return '$'
}

function formatPlanPrice(plan: SubscriptionPlan): string {
  const amount = Number(plan.price_amount || 0)
  const formatted = new Intl.NumberFormat(undefined, {
    minimumFractionDigits: Number.isInteger(amount) ? 0 : 2,
    maximumFractionDigits: 2,
  }).format(amount)
  return `${getCurrencySymbol(plan.currency)}${formatted}`
}

function formatPlanQuota(plan: SubscriptionPlan, t: (key: string) => string) {
  const total = Number(plan.total_amount || 0)
  return total > 0 ? formatQuota(total) : t('Unlimited')
}

function planSubtitle(plan: SubscriptionPlan): string {
  return plan.subtitle?.trim() || ''
}

export function SubscriptionPlansCard({
  topupInfo,
  onAvailabilityChange,
  userQuota,
  onPurchaseSuccess,
  onOpenBilling,
  rechargePanel,
}: SubscriptionPlansCardProps) {
  const { t } = useTranslation()

  const [plans, setPlans] = useState<PlanRecord[]>([])
  const [activeSubscriptions, setActiveSubscriptions] = useState<
    UserSubscriptionRecord[]
  >([])
  const [allSubscriptions, setAllSubscriptions] = useState<
    UserSubscriptionRecord[]
  >([])
  const [billingPreference, setBillingPreference] =
    useState('subscription_first')
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const [activeTab, setActiveTab] = useState('plans')

  const [purchaseOpen, setPurchaseOpen] = useState(false)
  const [selectedPlan, setSelectedPlan] = useState<PlanRecord | null>(null)

  const enableStripe = !!topupInfo?.enable_stripe_topup
  const enableCreem = !!topupInfo?.enable_creem_topup
  const enableWaffoPancake = !!topupInfo?.enable_waffo_pancake_topup
  const enableOnlineTopUp = !!topupInfo?.enable_online_topup
  const epayMethods = useMemo(
    () => getEpayMethods(topupInfo?.pay_methods),
    [topupInfo?.pay_methods]
  )

  const fetchPlans = useCallback(async () => {
    try {
      const res = await getPublicPlans()
      if (res.success) {
        setPlans(res.data || [])
      }
    } catch {
      setPlans([])
    }
  }, [])

  const fetchSelfSubscription = useCallback(async () => {
    try {
      const res = await getSelfSubscriptionFull()
      if (res.success && res.data) {
        setBillingPreference(
          res.data.billing_preference || 'subscription_first'
        )
        setActiveSubscriptions(res.data.subscriptions || [])
        setAllSubscriptions(res.data.all_subscriptions || [])
      }
    } catch {
      // Ignore self subscription errors on wallet page.
    }
  }, [])

  useEffect(() => {
    const init = async () => {
      setLoading(true)
      await Promise.all([fetchPlans(), fetchSelfSubscription()])
      setLoading(false)
    }
    init()
  }, [fetchPlans, fetchSelfSubscription])

  useEffect(() => {
    if (!loading && plans.length === 0 && rechargePanel) {
      setActiveTab('topup')
    }
  }, [loading, plans.length, rechargePanel])

  const handleRefresh = async () => {
    setRefreshing(true)
    try {
      await fetchSelfSubscription()
    } finally {
      setRefreshing(false)
    }
  }

  const handlePreferenceChange = async (pref: string) => {
    const previous = billingPreference
    setBillingPreference(pref)
    try {
      const res = await updateBillingPreference(pref)
      if (res.success) {
        toast.success(t('Updated successfully'))
        const normalized = res.data?.billing_preference || pref
        setBillingPreference(normalized)
      } else {
        toast.error(res.message || t('Update failed'))
        setBillingPreference(previous)
      }
    } catch {
      toast.error(t('Request failed'))
      setBillingPreference(previous)
    }
  }

  const hasActive = activeSubscriptions.length > 0
  const hasAny = allSubscriptions.length > 0
  const isAvailable = loading || plans.length > 0 || hasAny || !!rechargePanel
  const disablePref = !hasActive
  const isSubPref =
    billingPreference === 'subscription_first' ||
    billingPreference === 'subscription_only'
  const displayPref =
    disablePref && isSubPref ? 'wallet_first' : billingPreference
  const preferenceHint = disablePref
    ? '当前无生效订阅，将自动使用钱包。购买套餐后即可享受模型权益。'
    : `当前扣费偏好：${getBillingPreferenceLabel(displayPref, t)}。`

  const planPurchaseCountMap = useMemo(() => {
    const map = new Map<number, number>()
    for (const sub of allSubscriptions) {
      const planId = sub?.subscription?.plan_id
      if (!planId) continue
      map.set(planId, (map.get(planId) || 0) + 1)
    }
    return map
  }, [allSubscriptions])

  useEffect(() => {
    onAvailabilityChange?.(isAvailable)
  }, [isAvailable, onAvailabilityChange])

  if (loading) {
    return (
      <TitledCard
        title='账户充值'
        description='多种充值方式，安全便捷'
        icon={<CreditCard className='h-4 w-4 text-white' />}
        iconClassName='bg-blue-500 shadow-lg shadow-blue-500/25'
      >
        <Skeleton className='h-24 rounded-xl' />
        <div className='mt-4 grid gap-4 md:grid-cols-2 2xl:grid-cols-3'>
          {Array.from({ length: 5 }).map((_, i) => (
            <Skeleton key={i} className='h-72 rounded-xl' />
          ))}
        </div>
      </TitledCard>
    )
  }

  if (plans.length === 0 && !hasAny && !rechargePanel) {
    return null
  }

  return (
    <>
      <TitledCard
        title='账户充值'
        description='多种充值方式，安全便捷'
        icon={<CreditCard className='h-4 w-4 text-white' />}
        iconClassName='bg-blue-500 shadow-lg shadow-blue-500/25'
        action={
          onOpenBilling ? (
            <Button
              size='sm'
              onClick={onOpenBilling}
              className='h-10 rounded-xl bg-blue-600 px-4 text-white hover:bg-blue-700'
            >
              <ReceiptText className='h-4 w-4' />
              账单
            </Button>
          ) : null
        }
        contentClassName='space-y-3 p-0 sm:p-0'
      >
        <Tabs
          value={activeTab}
          onValueChange={(value) => setActiveTab(String(value))}
          className='gap-0'
        >
          <TabsList
            variant='line'
            className='border-border/70 flex h-11 w-full justify-start gap-0 border-b px-3 sm:px-3'
          >
            <TabsTrigger
              value='plans'
              className='h-11 flex-none rounded-none border-r px-4 data-active:font-semibold data-active:after:opacity-0'
            >
              <Sparkles className='h-4 w-4' />
              订阅套餐
            </TabsTrigger>
            <TabsTrigger
              value='topup'
              className='h-11 flex-none rounded-none px-4 data-active:font-semibold data-active:after:opacity-0'
            >
              <WalletCards className='h-4 w-4' />
              额度充值
            </TabsTrigger>
          </TabsList>

          <TabsContent value='plans' className='space-y-3 p-3 sm:p-4'>
            <div className='rounded-xl border p-3 sm:p-4'>
              <div className='flex flex-wrap items-center justify-between gap-2.5'>
                <div className='flex min-w-0 flex-wrap items-center gap-2'>
                  <span className='font-semibold'>我的订阅</span>
                  <span
                    className={cn(
                      'rounded-full border px-2 py-0.5 text-xs',
                      hasActive
                        ? 'border-emerald-200 bg-emerald-50 text-emerald-700 dark:border-emerald-900/60 dark:bg-emerald-950/40 dark:text-emerald-300'
                        : 'text-muted-foreground bg-background'
                    )}
                  >
                    {hasActive ? `${activeSubscriptions.length} 生效中` : '无生效'}
                  </span>
                </div>

                <div className='flex w-full items-center gap-2 sm:w-auto'>
                  <Select
                    items={[
                      {
                        value: 'subscription_first',
                        label: getBillingPreferenceLabel(
                          'subscription_first',
                          t
                        ),
                      },
                      {
                        value: 'wallet_first',
                        label: getBillingPreferenceLabel('wallet_first', t),
                      },
                      {
                        value: 'subscription_only',
                        label: getBillingPreferenceLabel(
                          'subscription_only',
                          t
                        ),
                      },
                      {
                        value: 'wallet_only',
                        label: getBillingPreferenceLabel('wallet_only', t),
                      },
                    ]}
                    value={displayPref}
                    onValueChange={(v) =>
                      v !== null && handlePreferenceChange(v)
                    }
                  >
                    <SelectTrigger className='h-9 flex-1 rounded-full text-xs sm:w-36 sm:flex-none'>
                      <SelectValue>
                        {getBillingPreferenceLabel(displayPref, t)}
                      </SelectValue>
                    </SelectTrigger>
                    <SelectContent alignItemWithTrigger={false}>
                      <SelectGroup>
                        <SelectItem
                          value='subscription_first'
                          disabled={disablePref}
                        >
                          {getBillingPreferenceLabel('subscription_first', t)}
                          {disablePref ? ` (${t('No Active')})` : ''}
                        </SelectItem>
                        <SelectItem value='wallet_first'>
                          {getBillingPreferenceLabel('wallet_first', t)}
                        </SelectItem>
                        <SelectItem
                          value='subscription_only'
                          disabled={disablePref}
                        >
                          {getBillingPreferenceLabel('subscription_only', t)}
                          {disablePref ? ` (${t('No Active')})` : ''}
                        </SelectItem>
                        <SelectItem value='wallet_only'>
                          {getBillingPreferenceLabel('wallet_only', t)}
                        </SelectItem>
                      </SelectGroup>
                    </SelectContent>
                  </Select>
                  <Button
                    variant='ghost'
                    size='icon'
                    className='h-9 w-9 rounded-full'
                    onClick={handleRefresh}
                    disabled={refreshing}
                    aria-label='刷新订阅'
                  >
                    <RefreshCw
                      className={`h-4 w-4 ${refreshing ? 'animate-spin' : ''}`}
                    />
                  </Button>
                </div>
              </div>

              <p className='text-muted-foreground mt-2 text-sm'>
                {preferenceHint}
              </p>

              {hasAny && (
                <div className='mt-3 space-y-2'>
                  {allSubscriptions.slice(0, 3).map((sub) => {
                    const subscription = sub.subscription
                    const endTime = subscription?.end_time || 0
                    const isActive =
                      subscription?.status === 'active' &&
                      endTime > Date.now() / 1000
                    const remainAmount = Math.max(
                      0,
                      Number(subscription?.amount_total || 0) -
                        Number(subscription?.amount_used || 0)
                    )

                    return (
                      <div
                        key={subscription?.id}
                        className='bg-muted/30 flex flex-wrap items-center justify-between gap-2 rounded-lg border px-3 py-2 text-xs'
                      >
                        <span className='font-medium'>
                          订阅 #{subscription?.id}
                        </span>
                        <span className='text-muted-foreground'>
                          {isActive ? '生效中' : '已失效'} · 剩余{' '}
                          {formatQuota(remainAmount)}
                        </span>
                      </div>
                    )
                  })}
                </div>
              )}
            </div>

            {plans.length > 0 ? (
              <div className='grid grid-cols-1 gap-4 md:grid-cols-2 2xl:grid-cols-3'>
                {plans.map((p, index) => {
                  const plan = p?.plan
                  if (!plan) return null
                  const isPopular = index === 0 && plans.length > 1
                  const limit = Number(plan.max_purchase_per_user || 0)
                  const count = planPurchaseCountMap.get(plan.id) || 0
                  const reached = limit > 0 && count >= limit
                  const quota = formatPlanQuota(plan, t)
                  const subtitle = planSubtitle(plan)
                  const benefits = [
                    `有效期: ${formatDuration(plan, t)}`,
                    `总额度: ${quota}`,
                    formatResetPeriod(plan, t) !== t('No Reset')
                      ? `重置周期: ${formatResetPeriod(plan, t)}`
                      : null,
                  ].filter(Boolean) as string[]

                  return (
                    <div
                      key={plan.id}
                      className={cn(
                        'bg-background flex min-h-[360px] flex-col rounded-xl border p-8 transition-all hover:shadow-md',
                        isPopular &&
                          'border-blue-300 shadow-sm ring-2 ring-blue-200/70 dark:border-blue-600 dark:ring-blue-900/50'
                      )}
                    >
                      <div className='min-h-7'>
                        {isPopular && (
                          <span className='inline-flex items-center gap-1 rounded-full bg-fuchsia-100 px-2.5 py-1 text-xs font-medium text-fuchsia-700 dark:bg-fuchsia-950/50 dark:text-fuchsia-300'>
                            <Sparkles className='h-3.5 w-3.5' />
                            推荐
                          </span>
                        )}
                      </div>

                      <h3 className='mt-3 text-2xl font-bold tracking-tight'>
                        {plan.title || '订阅套餐'}
                      </h3>
                      {subtitle && (
                        <p className='text-muted-foreground mt-1 text-sm'>
                          {subtitle}
                        </p>
                      )}

                      <div className='mt-7 text-4xl font-bold tracking-tight text-zinc-700 dark:text-zinc-100'>
                        {formatPlanPrice(plan)}
                      </div>

                      <div className='mt-4 flex-1 space-y-2'>
                        {benefits.map((label) => (
                          <div
                            key={label}
                            className='text-muted-foreground flex items-center gap-2 text-sm'
                          >
                            <span className='size-1.5 shrink-0 rounded-full bg-zinc-500' />
                            <span>{label}</span>
                          </div>
                        ))}
                      </div>

                      <Separator className='my-4' />

                      {reached ? (
                        <Tooltip>
                          <TooltipTrigger render={<div />}>
                            <Button
                              variant='outline'
                              className='h-10 w-full rounded-xl'
                              disabled
                            >
                              已达上限
                            </Button>
                          </TooltipTrigger>
                          <TooltipContent>
                            {t('Purchase limit reached')} ({count}/{limit})
                          </TooltipContent>
                        </Tooltip>
                      ) : (
                        <Button
                          variant='outline'
                          className='h-10 w-full rounded-xl text-base font-semibold text-blue-600 hover:text-blue-700'
                          onClick={() => {
                            setSelectedPlan(p)
                            setPurchaseOpen(true)
                          }}
                        >
                          立即订阅
                        </Button>
                      )}
                    </div>
                  )
                })}
              </div>
            ) : (
              <div className='text-muted-foreground rounded-xl border border-dashed py-10 text-center text-sm'>
                暂无可购买的订阅套餐
              </div>
            )}
          </TabsContent>

          <TabsContent
            value='topup'
            id='wallet-add-funds'
            className='scroll-mt-4 p-3 sm:p-4'
          >
            {rechargePanel}
          </TabsContent>
        </Tabs>
      </TitledCard>

      <SubscriptionPurchaseDialog
        open={purchaseOpen}
        onOpenChange={(open) => {
          setPurchaseOpen(open)
          if (!open) {
            fetchSelfSubscription()
          }
        }}
        plan={selectedPlan}
        enableStripe={enableStripe}
        enableCreem={enableCreem}
        enableWaffoPancake={enableWaffoPancake}
        enableOnlineTopUp={enableOnlineTopUp}
        epayMethods={epayMethods}
        userQuota={userQuota}
        onPurchaseSuccess={onPurchaseSuccess}
        purchaseLimit={
          selectedPlan?.plan?.max_purchase_per_user
            ? Number(selectedPlan.plan.max_purchase_per_user)
            : undefined
        }
        purchaseCount={
          selectedPlan?.plan?.id
            ? planPurchaseCountMap.get(selectedPlan.plan.id)
            : undefined
        }
      />
    </>
  )
}

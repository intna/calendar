'use client'

import dynamic from 'next/dynamic'
import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { cn } from '@/lib/cn'
import { addDays, formatShortDate, startOfWeek, todayISO, withDayInMonth } from '@/lib/dates'
import { formatRoi, formatU } from '@/lib/format'
import { dailyChart, monthlyChart, periodRange, shiftDate, summarize } from '@/lib/period'
import type { SeriesData, ViewMode } from '@/lib/types'
import { DayView } from '@/components/DayView'
import { Ledger } from '@/components/Ledger'
import { Mark } from '@/components/Mark'
import { MonthView } from '@/components/MonthView'
import { StatBar, type StatItem } from '@/components/StatBar'
import { WeekView } from '@/components/WeekView'
import { YearView } from '@/components/YearView'
import type { FlowMark } from '@/components/types'

const ChartPanel = dynamic(() => import('@/components/Analytics').then((mod) => mod.Analytics), {
  ssr: false,
  loading: () => <div className="h-[360px] border border-hive-line bg-white" />,
})

const views: Array<{ id: ViewMode; label: string }> = [
  { id: 'day', label: 'Day' },
  { id: 'week', label: 'Week' },
  { id: 'month', label: 'Month' },
  { id: 'year', label: 'Year' },
]

export function Dashboard() {
  const [series, setSeries] = useState<SeriesData | null>(null)
  const [view, setView] = useState<ViewMode>('month')
  const [date, setDate] = useState('')
  const [today, setToday] = useState('')
  const [mounted, setMounted] = useState(false)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [notice, setNotice] = useState('')
  const timer = useRef<number | null>(null)

  const flash = useCallback((text: string) => {
    setNotice(text)
    if (timer.current) window.clearTimeout(timer.current)
    timer.current = window.setTimeout(() => setNotice(''), 2400)
  }, [])

  const load = useCallback(async () => {
    const response = await fetch('/api/series', { cache: 'no-store' })
    const data: unknown = await response.json()
    if (!response.ok) {
      const message = readError(data) || 'Could not load'
      throw new Error(message)
    }
    if (!isSeries(data)) throw new Error('Could not load')
    setSeries(data)
  }, [])

  useEffect(() => {
    const now = todayISO()
    setToday(now)
    setDate(now)
    setMounted(true)
  }, [])

  useEffect(() => {
    let cancelled = false
    load()
      .catch((reason: unknown) => {
        if (!cancelled) setError(reason instanceof Error ? reason.message : 'Could not load')
      })
      .finally(() => {
        if (!cancelled) setLoading(false)
      })
    return () => {
      cancelled = true
    }
  }, [load])

  const write = useCallback(
    async (url: string, init: RequestInit, success: string) => {
      setSaving(true)
      setError('')
      try {
        const response = await fetch(url, {
          ...init,
          headers: { 'Content-Type': 'application/json', ...(init.headers ?? {}) },
        })
        const data: unknown = await response.json()
        if (!response.ok || !isSeries(data)) throw new Error(readError(data) || 'Could not save')
        setSeries(data)
        flash(success)
        return true
      } catch (reason) {
        setError(reason instanceof Error ? reason.message : 'Could not save')
        return false
      } finally {
        setSaving(false)
      }
    },
    [flash],
  )

  const dayMap = useMemo(() => new Map((series?.days ?? []).map((day) => [day.date, day])), [series])
  const flowMap = useMemo(() => buildFlowMap(series?.cashflows ?? []), [series])
  const range = useMemo(() => (date ? periodRange(view, date) : null), [date, view])
  const summary = useMemo(() => {
    if (!series || !range) return null
    return summarize(series.days, series.cashflows, range.start, range.end)
  }, [series, range])

  const chart = useMemo(() => {
    if (!series || !date || !range) return null
    if (view === 'year') {
      return {
        title: 'Monthly PnL',
        caption: 'Yellow bars are the month. The black line is cumulative.',
        points: monthlyChart(series.days, Number(date.slice(0, 4))),
        summary: summary ?? summarize(series.days, series.cashflows, range.start, range.end),
      }
    }
    if (view === 'day') {
      const from = addDays(date, -29)
      return {
        title: 'Last 30 days',
        caption: 'Yellow bars are the day. The black line is cumulative.',
        points: dailyChart(series.days, from, date),
        summary: summarize(series.days, series.cashflows, from, date),
      }
    }
    return {
      title: view === 'week' ? 'This week' : 'This month',
      caption: 'Yellow bars are the day. The black line is cumulative.',
      points: dailyChart(series.days, range.start, range.end),
      summary: summary ?? summarize(series.days, series.cashflows, range.start, range.end),
    }
  }, [series, date, range, summary, view])

  const stats = useMemo(() => buildStats(series, summary), [series, summary])
  const selected = date ? dayMap.get(date) ?? null : null

  return (
    <div className="min-h-screen">
      <div className="sticky top-0 z-30">
        <div className="h-[3px] bg-hive-yellow" />
        <header className="border-b border-hive-line bg-white/95 backdrop-blur">
          <div className="mx-auto flex max-w-[1480px] flex-wrap items-center gap-4 px-4 py-3.5 sm:px-6">
            <Mark />
            <div className="ml-auto flex items-center gap-2">
              <div className="flex border border-hive-line">
                {views.map((item) => (
                  <button
                    key={item.id}
                    type="button"
                    aria-pressed={view === item.id}
                    onClick={() => setView(item.id)}
                    className={cn(
                      'px-3 py-2 text-sm tracking-[0.08em] sm:px-4',
                      view === item.id ? 'bg-hive-yellow font-semibold text-black' : 'text-hive-muted hover:text-hive-ivory',
                    )}
                  >
                    {item.label}
                  </button>
                ))}
              </div>
              <button
                type="button"
                className="border border-hive-line px-3 py-2 text-sm text-hive-ivory hover:border-hive-yellow"
                onClick={() => {
                  setLoading(true)
                  load()
                    .catch((reason: unknown) => setError(reason instanceof Error ? reason.message : 'Could not load'))
                    .finally(() => setLoading(false))
                }}
              >
                {loading && series ? 'Syncing' : 'Refresh'}
              </button>
            </div>
          </div>
        </header>
      </div>

      <main className="mx-auto max-w-[1480px] px-4 py-6 sm:px-6">
        {!mounted || (loading && !series) ? <Skeleton /> : null}
        {mounted && !loading && !series ? (
          <DatabaseError
            message={error || 'Unable to reach MongoDB. Start the database and check MONGODB_URI.'}
            onRetry={() => {
              setLoading(true)
              setError('')
              load()
                .catch((reason: unknown) => setError(reason instanceof Error ? reason.message : 'Could not load'))
                .finally(() => setLoading(false))
            }}
          />
        ) : null}

        {mounted && series && range && summary && chart ? (
          <div className="grid items-start gap-6 lg:grid-cols-[minmax(0,1fr)_380px]">
            <div className="min-w-0 space-y-6">
              {error ? <Banner tone="alert">{error}</Banner> : null}
              {notice ? <Banner>{notice}</Banner> : null}
              <StatBar items={stats} />
              <section className="border border-hive-line bg-white">
                <div className="flex flex-wrap items-center justify-between gap-3 border-b border-hive-line px-4 py-4 sm:px-5">
                  <div>
                    <div className="text-[11px] tracking-[0.18em] text-hive-muted">{viewName(view)}</div>
                    <h2 className="mt-1 text-xl font-semibold tracking-wide">{range.label}</h2>
                  </div>
                  <div className="flex items-center gap-2">
                    <IconButton label="Previous" onClick={() => setDate(shiftDate(date, view, -1))} />
                    <IconButton label="Next" direction="right" onClick={() => setDate(shiftDate(date, view, 1))} />
                    {date !== today ? (
                      <button
                        type="button"
                        className="border border-hive-line px-3 py-2 text-sm text-hive-ivory hover:border-hive-yellow"
                        onClick={() => setDate(today)}
                      >
                        Today
                      </button>
                    ) : null}
                  </div>
                </div>
                {view === 'month' ? (
                  <MonthView date={date} today={today} dayMap={dayMap} flowMap={flowMap} onSelect={setDate} />
                ) : null}
                {view === 'week' ? (
                  <WeekView
                    start={startOfWeek(date)}
                    selected={date}
                    today={today}
                    dayMap={dayMap}
                    flowMap={flowMap}
                    onSelect={setDate}
                  />
                ) : null}
                {view === 'day' ? <DayView date={date} today={today} day={selected} /> : null}
                {view === 'year' ? (
                  <YearView
                    date={date}
                    today={today}
                    days={series.days}
                    cashflows={series.cashflows}
                    dayMap={dayMap}
                    onSelect={setDate}
                    onOpenMonth={(monthDate) => {
                      setDate(withDayInMonth(date, monthDate))
                      setView('month')
                    }}
                  />
                ) : null}
              </section>
              <ChartPanel title={chart.title} caption={chart.caption} points={chart.points} summary={chart.summary} />
              <p className="text-xs tracking-wide text-hive-muted">
                PnL = current balance − previous balance − deposits + withdrawals. The first balance is the baseline.
              </p>
            </div>
            <Ledger
              date={date}
              today={today}
              day={selected}
              balances={series.balances}
              cashflows={series.cashflows}
              period={range}
              saving={saving}
              onDate={setDate}
              onSaveBalance={(balance, note) =>
                write('/api/balances', { method: 'POST', body: JSON.stringify({ date, balance, note }) }, 'Balance saved')
              }
              onDeleteBalance={() => write(`/api/balances?date=${date}`, { method: 'DELETE' }, 'Balance deleted')}
              onAddCashflow={(type, amount, note) =>
                write(
                  '/api/cashflows',
                  { method: 'POST', body: JSON.stringify({ date, type, amount, note }) },
                  type === 'deposit' ? 'Deposit recorded' : 'Withdrawal recorded',
                )
              }
              onDeleteCashflow={(id) => write(`/api/cashflows?id=${id}`, { method: 'DELETE' }, 'Cashflow deleted')}
            />
          </div>
        ) : null}
      </main>
    </div>
  )
}

function buildStats(series: SeriesData | null, summary: ReturnType<typeof summarize> | null): StatItem[] {
  const balances = [...(series?.balances ?? [])].sort((a, b) => a.date.localeCompare(b.date))
  const latest = balances[balances.length - 1]
  const cumulative = [...(series?.days ?? [])].reverse().find((day) => day.cumulative !== null)?.cumulative ?? null
  return [
    {
      label: 'Latest balance',
      value: latest ? formatU(latest.balance) : '—',
      unit: latest ? 'U' : undefined,
      hint: latest ? `As of ${formatShortDate(latest.date)}` : 'Not recorded',
      tone: 'ivory',
    },
    {
      label: 'Cumulative PnL',
      value: cumulative === null ? '—' : formatU(cumulative, true),
      unit: cumulative === null ? undefined : 'U',
      hint: cumulative === null ? 'Record two balances to start' : 'Deposits and withdrawals excluded',
      tone: toneOf(cumulative),
    },
    {
      label: 'Period PnL',
      value: summary?.pnl === null || summary?.pnl === undefined ? '—' : formatU(summary.pnl, true),
      unit: summary?.pnl === null || summary?.pnl === undefined ? undefined : 'U',
      hint: summary?.count ? `Daily avg ${formatU(summary.avg ?? 0, true)}` : 'No PnL in this range',
      tone: toneOf(summary?.pnl ?? null),
    },
    {
      label: 'Return',
      value: formatRoi(summary?.roi ?? null),
      hint: 'Period PnL / starting balance',
      tone: toneOf(summary?.roi ?? null),
    },
  ]
}

function buildFlowMap(cashflows: SeriesData['cashflows']): Map<string, FlowMark> {
  const map = new Map<string, FlowMark>()
  for (const flow of cashflows) {
    const current = map.get(flow.date) ?? { deposit: 0, withdraw: 0 }
    const next = flow.amount
    if (flow.type === 'deposit') current.deposit = (Math.round(current.deposit * 100) + Math.round(next * 100)) / 100
    else current.withdraw = (Math.round(current.withdraw * 100) + Math.round(next * 100)) / 100
    map.set(flow.date, current)
  }
  return map
}

function toneOf(value: number | null): StatItem['tone'] {
  if (value === null || value === 0) return 'muted'
  return value > 0 ? 'yellow' : 'ivory'
}

function viewName(view: ViewMode): string {
  if (view === 'day') return 'Day'
  if (view === 'week') return 'Week'
  if (view === 'month') return 'Month'
  return 'Year'
}

function isSeries(data: unknown): data is SeriesData {
  return Boolean(data && typeof data === 'object' && Array.isArray((data as SeriesData).days))
}

function readError(data: unknown): string {
  if (!data || typeof data !== 'object' || !('error' in data)) return ''
  const error = (data as { error?: unknown }).error
  return typeof error === 'string' ? error : ''
}

function Banner({ children, tone = 'quiet' }: { children: string; tone?: 'quiet' | 'alert' }) {
  const className =
    tone === 'alert'
      ? 'border border-hive-yellow bg-[#FFF8CC] px-4 py-3 text-sm text-hive-ivory'
      : 'border border-hive-line bg-[#F7F7F4] px-4 py-3 text-sm text-hive-ivory'
  return <div className={className}>{children}</div>
}

function Skeleton() {
  return (
    <div className="space-y-6">
      <div className="h-28 animate-pulse bg-[#F3F3F0]" />
      <div className="h-[520px] animate-pulse bg-[#F7F7F4]" />
    </div>
  )
}

function DatabaseError({ message, onRetry }: { message: string; onRetry: () => void }) {
  return (
    <div className="border border-hive-line bg-white px-6 py-16 text-center">
      <div className="text-[11px] tracking-[0.22em] text-hive-yellow">DATABASE OFFLINE</div>
      <p className="mx-auto mt-4 max-w-md text-sm leading-7 text-hive-ivory">{message}</p>
      <p className="mx-auto mt-3 max-w-md text-sm leading-7 text-hive-muted">
        Run docker compose up -d locally. On a server, start MongoDB and set MONGODB_URI.
      </p>
      <button type="button" onClick={onRetry} className="mt-6 bg-hive-yellow px-4 py-2 text-sm font-semibold text-black">
        Retry
      </button>
    </div>
  )
}

function IconButton({
  label,
  direction = 'left',
  onClick,
}: {
  label: string
  direction?: 'left' | 'right'
  onClick: () => void
}) {
  return (
    <button
      type="button"
      aria-label={label}
      onClick={onClick}
      className="flex h-10 w-10 items-center justify-center border border-hive-line text-hive-ivory hover:border-hive-yellow"
    >
      <svg viewBox="0 0 16 16" className="h-4 w-4" aria-hidden>
        <path
          d={direction === 'left' ? 'M10 3 L5 8 L10 13' : 'M6 3 L11 8 L6 13'}
          fill="none"
          stroke="currentColor"
          strokeWidth="1.6"
        />
      </svg>
    </button>
  )
}

import {
  addDays,
  addMonths,
  addYears,
  endOfMonth,
  endOfWeek,
  endOfYear,
  formatLongDate,
  formatMonthLabel,
  formatMonthName,
  formatShortDate,
  formatTick,
  startOfMonth,
  startOfWeek,
  startOfYear,
} from './dates'
import { sumMoney } from './format'
import type { Cashflow, DayStat, ViewMode } from './types'

export type Summary = {
  pnl: number | null
  roi: number | null
  avg: number | null
  win: number
  loss: number
  flat: number
  winRate: number | null
  best: { date: string; pnl: number } | null
  worst: { date: string; pnl: number } | null
  deposits: number
  withdrawals: number
  count: number
}

export type ChartPoint = {
  key: string
  label: string
  title: string
  pnl: number | null
  cumulative: number | null
}

export function shiftDate(iso: string, view: ViewMode, direction: -1 | 1): string {
  if (view === 'day') return addDays(iso, direction)
  if (view === 'week') return addDays(iso, direction * 7)
  if (view === 'month') return addMonths(iso, direction)
  return addYears(iso, direction)
}

export function periodRange(view: ViewMode, date: string): { start: string; end: string; label: string } {
  if (view === 'day') return { start: date, end: date, label: formatLongDate(date) }
  if (view === 'week') {
    const start = startOfWeek(date)
    const end = endOfWeek(date)
    const startDate = formatShortDate(start)
    const endDate = formatShortDate(end)
    return { start, end, label: `${startDate} – ${endDate}` }
  }
  if (view === 'month') {
    return { start: startOfMonth(date), end: endOfMonth(date), label: formatMonthLabel(date) }
  }
  return { start: startOfYear(date), end: endOfYear(date), label: date.slice(0, 4) }
}

export function summarize(days: DayStat[], cashflows: Cashflow[], start: string, end: string): Summary {
  const settled = days.filter((day) => day.date >= start && day.date <= end && day.pnl !== null)
  const pnls = settled.map((day) => day.pnl as number)
  const pnl = pnls.length ? sumMoney(pnls) : null
  const base = settled[0]?.prevBalance
  const roi = pnl !== null && typeof base === 'number' && base !== 0 ? pnl / base : null
  const avg = pnl !== null && pnls.length ? Math.round((pnl / pnls.length) * 100) / 100 : null

  let win = 0
  let loss = 0
  let flat = 0
  let best: Summary['best'] = null
  let worst: Summary['worst'] = null
  for (const day of settled) {
    if (day.pnl === null) continue
    if (day.pnl > 0) win += 1
    else if (day.pnl < 0) loss += 1
    else flat += 1
    if (!best || day.pnl > best.pnl) best = { date: day.date, pnl: day.pnl }
    if (!worst || day.pnl < worst.pnl) worst = { date: day.date, pnl: day.pnl }
  }

  let depositCents = 0
  let withdrawCents = 0
  for (const flow of cashflows) {
    if (flow.date < start || flow.date > end) continue
    const amount = Math.round(flow.amount * 100)
    if (flow.type === 'deposit') depositCents += amount
    else withdrawCents += amount
  }

  return {
    pnl,
    roi,
    avg,
    win,
    loss,
    flat,
    winRate: win + loss === 0 ? null : win / (win + loss),
    best,
    worst,
    deposits: depositCents / 100,
    withdrawals: withdrawCents / 100,
    count: pnls.length,
  }
}

export function dailyChart(days: DayStat[], start: string, end: string): ChartPoint[] {
  let cumulative: number | null = null
  for (const day of days) {
    if (day.date < start && day.cumulative !== null) cumulative = day.cumulative
    if (day.date >= start) break
  }
  const map = new Map(days.map((day) => [day.date, day]))
  const points: ChartPoint[] = []
  let cursor = start
  while (cursor <= end) {
    const stat = map.get(cursor)
    if (stat && stat.pnl !== null) cumulative = stat.cumulative
    points.push({
      key: cursor,
      label: formatTick(cursor),
      title: formatLongDate(cursor),
      pnl: stat && stat.pnl !== null ? stat.pnl : null,
      cumulative,
    })
    cursor = addDays(cursor, 1)
  }
  return points
}

export function monthlyChart(days: DayStat[], year: number): ChartPoint[] {
  let cumulative: number | null = null
  for (const day of days) {
    if (day.date < `${year}-01-01` && day.cumulative !== null) cumulative = day.cumulative
  }
  const points: ChartPoint[] = []
  for (let month = 1; month <= 12; month += 1) {
    const start = `${year}-${String(month).padStart(2, '0')}-01`
    const end = endOfMonth(start)
    const settled = days.filter((day) => day.date >= start && day.date <= end && day.pnl !== null)
    const pnl = settled.length ? sumMoney(settled.map((day) => day.pnl as number)) : null
    if (settled.length) cumulative = settled[settled.length - 1].cumulative
    points.push({
      key: start,
      label: formatMonthName(month),
      title: `${formatMonthName(month)} ${year}`,
      pnl,
      cumulative,
    })
  }
  return points
}

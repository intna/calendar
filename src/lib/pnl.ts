import { daysBetween } from './dates'
import type { Balance, Cashflow, DayStat } from './types'

function cents(value: number): number {
  return Math.round(value * 100)
}

export function computeSeries(
  balances: Balance[],
  cashflows: Pick<Cashflow, 'date' | 'type' | 'amount'>[],
): DayStat[] {
  const balanceMap = new Map<string, Balance>()
  for (const item of balances) balanceMap.set(item.date, item)
  const ordered = [...balanceMap.values()].sort((a, b) => a.date.localeCompare(b.date))
  const flows = cashflows.map((flow) => ({
    date: flow.date,
    type: flow.type,
    cents: cents(flow.amount),
  }))

  let cumulative = 0
  return ordered.map((item, index) => {
    if (index === 0) {
      return {
        date: item.date,
        balance: item.balance,
        note: item.note ?? '',
        prevDate: null,
        prevBalance: null,
        deposits: 0,
        withdrawals: 0,
        pnl: null,
        cumulative: null,
        spanDays: 0,
      }
    }

    const previous = ordered[index - 1]
    let depositCents = 0
    let withdrawCents = 0
    for (const flow of flows) {
      if (flow.date > previous.date && flow.date <= item.date) {
        if (flow.type === 'deposit') depositCents += flow.cents
        else withdrawCents += flow.cents
      }
    }

    const pnlCents = cents(item.balance) - cents(previous.balance) - depositCents + withdrawCents
    cumulative += pnlCents
    return {
      date: item.date,
      balance: item.balance,
      note: item.note ?? '',
      prevDate: previous.date,
      prevBalance: previous.balance,
      deposits: depositCents / 100,
      withdrawals: withdrawCents / 100,
      pnl: pnlCents / 100,
      cumulative: cumulative / 100,
      spanDays: daysBetween(previous.date, item.date),
    }
  })
}

export function cashflowState(
  date: string,
  balances: { date: string }[],
): 'ignored' | 'pending' | 'applied' {
  if (balances.length === 0) return 'pending'
  const dates = balances.map((item) => item.date).sort()
  if (date <= dates[0]) return 'ignored'
  if (date > dates[dates.length - 1]) return 'pending'
  return 'applied'
}

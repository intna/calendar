export type ViewMode = 'day' | 'week' | 'month' | 'year'
export type CashflowType = 'deposit' | 'withdraw'

export type Balance = {
  date: string
  balance: number
  note: string
}

export type Cashflow = {
  id: string
  date: string
  type: CashflowType
  amount: number
  note: string
}

export type DayStat = {
  date: string
  balance: number
  note: string
  prevDate: string | null
  prevBalance: number | null
  deposits: number
  withdrawals: number
  pnl: number | null
  cumulative: number | null
  spanDays: number
}

export type SeriesData = {
  balances: Balance[]
  cashflows: Cashflow[]
  days: DayStat[]
}

'use client'

import { useEffect, useState } from 'react'
import { cn } from '@/lib/cn'
import { addDays, formatLongDate, formatShortDate } from '@/lib/dates'
import { formatU, parseMoney, pnlClass } from '@/lib/format'
import { cashflowState } from '@/lib/pnl'
import type { Balance, Cashflow, CashflowType, DayStat } from '@/lib/types'

export function Ledger({
  date,
  today,
  day,
  balances,
  cashflows,
  period,
  saving,
  onDate,
  onSaveBalance,
  onDeleteBalance,
  onAddCashflow,
  onDeleteCashflow,
}: {
  date: string
  today: string
  day: DayStat | null
  balances: Balance[]
  cashflows: Cashflow[]
  period: { start: string; end: string }
  saving: boolean
  onDate: (date: string) => void
  onSaveBalance: (balance: number, note: string) => Promise<boolean>
  onDeleteBalance: () => Promise<boolean>
  onAddCashflow: (type: CashflowType, amount: number, note: string) => Promise<boolean>
  onDeleteCashflow: (id: string) => Promise<boolean>
}) {
  const [balanceInput, setBalanceInput] = useState('')
  const [balanceNote, setBalanceNote] = useState('')
  const [flowType, setFlowType] = useState<CashflowType>('deposit')
  const [flowAmount, setFlowAmount] = useState('')
  const [flowNote, setFlowNote] = useState('')
  const [scope, setScope] = useState<'day' | 'period'>('day')
  const [balanceError, setBalanceError] = useState('')
  const [flowError, setFlowError] = useState('')
  const future = date > today

  useEffect(() => {
    setBalanceInput(day ? day.balance.toFixed(2) : '')
    setBalanceNote(day?.note ?? '')
  }, [date, day?.balance, day?.note])

  useEffect(() => {
    setFlowAmount('')
    setFlowNote('')
    setBalanceError('')
    setFlowError('')
  }, [date])

  const visible = cashflows
    .filter((flow) => (scope === 'day' ? flow.date === date : flow.date >= period.start && flow.date <= period.end))
    .slice()
    .reverse()

  return (
    <aside className="border border-hive-line bg-white lg:sticky lg:top-[76px] lg:max-h-[calc(100vh-92px)] lg:overflow-auto">
      <div className="border-b border-hive-line px-5 py-5">
        <div className="text-[11px] tracking-[0.18em] text-hive-muted">{formatLongDate(date)}</div>
        {day && day.pnl !== null ? (
          <div className={cn('num mt-3 text-4xl', pnlClass(day.pnl))}>
            {formatU(day.pnl, true)}
            <span className="ml-1.5 font-sans text-[11px] tracking-[0.14em] text-hive-muted">U</span>
          </div>
        ) : day ? (
          <div className="mt-3 text-sm text-hive-muted">Baseline {formatU(day.balance)} U</div>
        ) : (
          <div className="mt-3 text-sm text-hive-muted">No balance yet</div>
        )}
        {day && day.pnl !== null ? (
          <p className="mt-3 text-xs leading-5 text-hive-muted">
            Previous {formatShortDate(day.prevDate ?? date)} {formatU(day.prevBalance ?? 0)} · In {formatU(day.deposits)} · Out{' '}
            {formatU(day.withdrawals)}
          </p>
        ) : null}
      </div>

      <form
        className="space-y-3 border-b border-hive-line px-5 py-5"
        onSubmit={(event) => {
          event.preventDefault()
          setBalanceError('')
          if (future) {
            setBalanceError('Only today or earlier dates can be recorded')
            return
          }
          const amount = parseMoney(balanceInput)
          if (amount === null) {
            setBalanceError('Enter a valid balance. Zero is allowed.')
            return
          }
          void onSaveBalance(amount, balanceNote.trim())
        }}
      >
        <div className="text-[11px] tracking-[0.18em] text-hive-muted">ENTRY</div>
        <label className="block text-sm" htmlFor="entry-date">
          Date
          <div className="mt-2 flex gap-2">
            <button type="button" className={ghost} onClick={() => onDate(addDays(date, -1))}>
              Prev
            </button>
            <input
              id="entry-date"
              type="date"
              max={today}
              value={date}
              onChange={(event) => {
                if (event.target.value) onDate(event.target.value)
              }}
              className={field}
            />
            <button
              type="button"
              className={ghost}
              disabled={date >= today}
              onClick={() => onDate(addDays(date, 1))}
            >
              Next
            </button>
          </div>
        </label>
        <label className="block text-sm" htmlFor="balance">
          Balance
          <input
            id="balance"
            inputMode="decimal"
            placeholder="0.00"
            value={balanceInput}
            onChange={(event) => setBalanceInput(event.target.value)}
            className={`${field} mt-2`}
          />
        </label>
        <label className="block text-sm" htmlFor="balance-note">
          Note
          <input
            id="balance-note"
            maxLength={200}
            placeholder="Optional"
            value={balanceNote}
            onChange={(event) => setBalanceNote(event.target.value)}
            className={`${field} mt-2`}
          />
        </label>
        <button type="submit" disabled={saving || future} className={primary}>
          {saving ? 'Saving…' : day ? 'Update balance' : 'Save balance'}
        </button>
        {future ? <p className="text-xs text-hive-muted">Future dates cannot be recorded.</p> : null}
        {balanceError ? <p className="text-sm text-hive-yellow">{balanceError}</p> : null}
      </form>

      {day ? (
        <div className="border-b border-hive-line px-5 py-3">
          <button
            type="button"
            className="text-xs tracking-wide text-hive-muted hover:text-hive-ivory"
            onClick={() => {
              if (window.confirm('Delete this balance? PnL will be recalculated from the remaining records.')) void onDeleteBalance()
            }}
          >
            Delete balance
          </button>
        </div>
      ) : null}

      <form
        className="space-y-3 border-b border-hive-line px-5 py-5"
        onSubmit={(event) => {
          event.preventDefault()
          setFlowError('')
          if (future) {
            setFlowError('Only today or earlier cashflows can be recorded')
            return
          }
          const amount = parseMoney(flowAmount)
          if (amount === null || amount <= 0) {
            setFlowError('Enter an amount greater than 0')
            return
          }
          void onAddCashflow(flowType, amount, flowNote.trim()).then((saved) => {
            if (!saved) return
            setFlowAmount('')
            setFlowNote('')
          })
        }}
      >
        <div className="text-[11px] tracking-[0.18em] text-hive-muted">DEPOSIT / WITHDRAWAL</div>
        <div className="flex border border-hive-line">
          {([
            ['deposit', 'Deposit'],
            ['withdraw', 'Withdraw'],
          ] as const).map(([type, label]) => (
            <button
              key={type}
              type="button"
              aria-pressed={flowType === type}
              onClick={() => setFlowType(type)}
              className={cn('flex-1 py-2 text-sm tracking-[0.16em]', flowType === type ? 'bg-hive-yellow text-black' : 'text-hive-muted')}
            >
              {label}
            </button>
          ))}
        </div>
        <input
          inputMode="decimal"
          placeholder="Amount"
          aria-label="Cashflow amount"
          value={flowAmount}
          onChange={(event) => setFlowAmount(event.target.value)}
          className={field}
        />
        <input
          maxLength={200}
          placeholder="Note, optional"
          aria-label="Cashflow note"
          value={flowNote}
          onChange={(event) => setFlowNote(event.target.value)}
          className={field}
        />
        <button type="submit" disabled={saving || future} className={primary}>
          Add cashflow
        </button>
        {flowError ? <p className="text-sm text-hive-yellow">{flowError}</p> : null}
      </form>

      <div className="px-5 py-5">
        <div className="flex items-center justify-between">
          <div className="text-[11px] tracking-[0.18em] text-hive-muted">CASHFLOWS</div>
          <div className="flex border border-hive-line text-xs">
            <button type="button" className={cn('px-2 py-1', scope === 'day' ? 'bg-hive-yellow text-black' : 'text-hive-muted')} onClick={() => setScope('day')}>
              Day
            </button>
            <button type="button" className={cn('px-2 py-1', scope === 'period' ? 'bg-hive-yellow text-black' : 'text-hive-muted')} onClick={() => setScope('period')}>
              Period
            </button>
          </div>
        </div>
        {visible.length === 0 ? (
          <p className="mt-4 text-sm text-hive-muted">{scope === 'day' ? 'No deposits or withdrawals on this day.' : 'No cashflows in this range.'}</p>
        ) : (
          <ul className="mt-4 divide-y divide-hive-line">
            {visible.map((flow) => {
              const state = cashflowState(flow.date, balances)
              return (
                <li key={flow.id} className="flex items-start justify-between gap-3 py-3">
                  <div>
                    <div className="text-sm">
                      {flow.type === 'deposit' ? 'Deposit' : 'Withdrawal'}
                      <span className="num ml-2 text-hive-ivory">{formatU(flow.amount)}</span>
                    </div>
                    <div className="mt-1 text-xs text-hive-muted">
                      {formatShortDate(flow.date)}
                      {state === 'pending' ? ' · Pending' : ''}
                      {state === 'ignored' ? ' · Ignored on baseline day' : ''}
                      {flow.note ? ` · ${flow.note}` : ''}
                    </div>
                  </div>
                  <button
                    type="button"
                    className="text-xs text-hive-muted hover:text-hive-ivory"
                    onClick={() => {
                      if (window.confirm('Delete this cashflow? PnL will be recalculated from the remaining records.')) void onDeleteCashflow(flow.id)
                    }}
                  >
                    Delete
                  </button>
                </li>
              )
            })}
          </ul>
        )}

      </div>
    </aside>
  )
}

const field = 'w-full border border-hive-line bg-white px-3 py-2 text-sm text-hive-ivory outline-none placeholder:text-[#9A9A92] focus:border-hive-yellow'
const primary = 'w-full bg-hive-yellow px-3 py-2.5 text-sm font-semibold tracking-[0.14em] text-black disabled:cursor-not-allowed disabled:opacity-40'
const ghost = 'shrink-0 border border-hive-line px-2 py-2 text-xs text-hive-ivory disabled:cursor-not-allowed disabled:opacity-40'

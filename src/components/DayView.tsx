import { formatLongDate, formatShortDate } from '@/lib/dates'
import { formatU, pnlClass } from '@/lib/format'
import type { DayStat } from '@/lib/types'

export function DayView({ date, today, day }: { date: string; today: string; day: DayStat | null }) {
  return (
    <div className="px-4 py-6 sm:px-8 sm:py-8">
      <div className="flex items-center gap-3 text-[11px] tracking-[0.18em] text-hive-muted">
        <span>DAY PNL</span>
        {date === today ? <span className="bg-hive-yellow px-1.5 py-0.5 font-semibold text-black">Today</span> : null}
      </div>
      <div className="mt-2 text-sm text-hive-muted">{formatLongDate(date)}</div>

      {!day ? (
        <div className="mt-8 max-w-xl">
          <h3 className="text-3xl font-semibold tracking-wide">No balance for this day</h3>
          <p className="mt-4 text-sm leading-7 text-hive-muted">
            Enter the wallet balance at the end of the day on the right. The first entry is only a baseline. PnL starts from the next one. Record deposits and withdrawals separately so they are not counted as profit or loss.
          </p>
        </div>
      ) : day.pnl === null ? (
        <div className="mt-8">
          <div className="num text-6xl text-hive-ivory sm:text-7xl">
            {formatU(day.balance)}
            <span className="ml-2 font-sans text-sm tracking-[0.16em] text-hive-muted">U</span>
          </div>
          <p className="mt-5 max-w-xl text-sm leading-7 text-hive-muted">
            This is the baseline, so this day has no PnL. The next balance will be compared with {formatU(day.balance)} U.
          </p>
        </div>
      ) : (
        <div className="mt-8">
          <div className={`num text-6xl sm:text-7xl ${pnlClass(day.pnl)}`}>
            {formatU(day.pnl, true)}
            <span className="ml-2 font-sans text-sm tracking-[0.16em] text-hive-muted">U</span>
          </div>
          <div className="mt-8 grid gap-px bg-hive-line sm:grid-cols-4">
            <Fact label="Balance" value={`${formatU(day.balance)} U`} />
            <Fact
              label="Previous"
              value={`${formatU(day.prevBalance ?? 0)} U`}
              hint={day.prevDate ? formatShortDate(day.prevDate) : undefined}
            />
            <Fact label="Deposits" value={`${formatU(day.deposits)} U`} />
            <Fact label="Withdrawals" value={`${formatU(day.withdrawals)} U`} />
          </div>
          <p className="num mt-5 text-sm leading-6 text-hive-muted">
            {formatU(day.balance)} − {formatU(day.prevBalance ?? 0)} − {formatU(day.deposits)} +{' '}
            {formatU(day.withdrawals)} = {formatU(day.pnl, true)}
          </p>
          {day.spanDays > 1 ? (
            <p className="mt-3 max-w-2xl text-sm leading-6 text-hive-muted">
              {day.spanDays} days since the last entry. Days without a balance, and their cashflows, are rolled into today.
            </p>
          ) : null}
          {day.note ? <p className="mt-3 text-sm text-hive-ivory">Note: {day.note}</p> : null}
        </div>
      )}
    </div>
  )
}

function Fact({ label, value, hint }: { label: string; value: string; hint?: string }) {
  return (
    <div className="bg-white px-4 py-4">
      <div className="text-[11px] tracking-[0.16em] text-hive-muted">{label}</div>
      <div className="num mt-2 text-xl text-hive-ivory">{value}</div>
      {hint ? <div className="mt-1 text-xs text-hive-muted">{hint}</div> : null}
    </div>
  )
}

import { formatLongDate, formatShortDate } from '@/lib/dates'
import { formatU, pnlClass } from '@/lib/format'
import type { DayStat } from '@/lib/types'

export function DayView({ date, today, day }: { date: string; today: string; day: DayStat | null }) {
  return (
    <div className="px-4 py-6 sm:px-8 sm:py-8">
      <div className="flex items-center gap-3 text-[11px] tracking-[0.18em] text-hive-muted">
        <span>当日收益</span>
        {date === today ? <span className="bg-hive-yellow px-1.5 py-0.5 font-semibold text-black">今天</span> : null}
      </div>
      <div className="mt-2 text-sm text-hive-muted">{formatLongDate(date)}</div>

      {!day ? (
        <div className="mt-8 max-w-xl">
          <h3 className="text-3xl font-semibold tracking-wide">还没有这一天的余额</h3>
          <p className="mt-4 text-sm leading-7 text-hive-muted">
            在右侧记入当天结束时的钱包余额。第一天只作为起点，从下一次记入开始计算收益。充值和提现要单独记账，这样余额变化才不会被算成盈亏。
          </p>
        </div>
      ) : day.pnl === null ? (
        <div className="mt-8">
          <div className="num text-6xl text-hive-ivory sm:text-7xl">
            {formatU(day.balance)}
            <span className="ml-2 font-sans text-sm tracking-[0.16em] text-hive-muted">U</span>
          </div>
          <p className="mt-5 max-w-xl text-sm leading-7 text-hive-muted">
            这是计算起点，当天不产生收益。下一次记入余额时，会用 {formatU(day.balance)} U 作为对照。
          </p>
        </div>
      ) : (
        <div className="mt-8">
          <div className={`num text-6xl sm:text-7xl ${pnlClass(day.pnl)}`}>
            {formatU(day.pnl, true)}
            <span className="ml-2 font-sans text-sm tracking-[0.16em] text-hive-muted">U</span>
          </div>
          <div className="mt-8 grid gap-px bg-hive-line sm:grid-cols-4">
            <Fact label="本次余额" value={`${formatU(day.balance)} U`} />
            <Fact
              label="上次余额"
              value={`${formatU(day.prevBalance ?? 0)} U`}
              hint={day.prevDate ? formatShortDate(day.prevDate) : undefined}
            />
            <Fact label="期间充值" value={`${formatU(day.deposits)} U`} />
            <Fact label="期间提现" value={`${formatU(day.withdrawals)} U`} />
          </div>
          <p className="num mt-5 text-sm leading-6 text-hive-muted">
            {formatU(day.balance)} − {formatU(day.prevBalance ?? 0)} − {formatU(day.deposits)} +{' '}
            {formatU(day.withdrawals)} = {formatU(day.pnl, true)}
          </p>
          {day.spanDays > 1 ? (
            <p className="mt-3 max-w-2xl text-sm leading-6 text-hive-muted">
              距上次记入已过 {day.spanDays} 天，中间没有余额的日期会把盈亏和流水合并记在今天。
            </p>
          ) : null}
          {day.note ? <p className="mt-3 text-sm text-hive-ivory">备注：{day.note}</p> : null}
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

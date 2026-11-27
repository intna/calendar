import { cn } from '@/lib/cn'
import { WEEKDAY_LABELS, endOfMonth, formatMonthName, formatShortDate, yearWeeks } from '@/lib/dates'
import { formatU, pnlClass } from '@/lib/format'
import { summarize } from '@/lib/period'
import type { Cashflow, DayStat } from '@/lib/types'

export function YearView({
  date,
  today,
  days,
  cashflows,
  dayMap,
  onSelect,
  onOpenMonth,
}: {
  date: string
  today: string
  days: DayStat[]
  cashflows: Cashflow[]
  dayMap: Map<string, DayStat>
  onSelect: (date: string) => void
  onOpenMonth: (monthDate: string) => void
}) {
  const year = Number(date.slice(0, 4))
  const weeks = yearWeeks(year)
  const maxAbs = days.reduce((max, day) => {
    if (!day.date.startsWith(`${year}-`) || day.pnl === null) return max
    return Math.max(max, Math.abs(day.pnl))
  }, 0)

  return (
    <div className="space-y-6 px-4 py-5 sm:px-5">
      <div className="grid grid-cols-2 gap-px bg-hive-line md:grid-cols-3 xl:grid-cols-4">
        {Array.from({ length: 12 }, (_, index) => {
          const month = index + 1
          const start = `${year}-${String(month).padStart(2, '0')}-01`
          const summary = summarize(days, cashflows, start, endOfMonth(start))
          const active = date.slice(0, 7) === start.slice(0, 7)
          return (
            <button
              key={start}
              type="button"
              onClick={() => onOpenMonth(start)}
              className={cn('bg-white px-4 py-3 text-left hover:bg-[#F6F6F3]', active && 'shadow-pick')}
            >
              <div className="text-[11px] tracking-[0.14em] text-hive-muted">{formatMonthName(month)}</div>
              <div className={cn('num mt-2 text-xl', pnlClass(summary.pnl))}>
                {summary.pnl === null ? '—' : formatU(summary.pnl, true)}
              </div>
              <div className="mt-2 text-xs text-hive-muted">
                {summary.count === 0
                  ? 'No records'
                  : summary.win === 0 && summary.loss === 0
                    ? `Flat ${summary.flat} days`
                    : `Up ${summary.win} · Down ${summary.loss}`}
              </div>
            </button>
          )
        })}
      </div>

      <div>
        <div className="mb-3 flex items-end justify-between gap-4">
          <h3 className="text-sm tracking-[0.16em]">YEAR</h3>
          <p className="text-xs text-hive-muted">Brighter yellow is a larger gain. Darker gray is a larger loss.</p>
        </div>
        <div className="overflow-x-auto pb-2">
          <div className="flex min-w-[760px]">
            <div className="mr-2 flex flex-col gap-[3px] pt-px text-[10px] leading-[13px] text-hive-muted">
              {WEEKDAY_LABELS.map((label) => (
                <span key={label} className="h-[13px]">
                  {label}
                </span>
              ))}
            </div>
            <div className="flex gap-[3px]">
              {weeks.map((week, weekIndex) => (
                <div key={week[0] ?? `empty-${weekIndex}`} className="flex flex-col gap-[3px]">
                  {week.map((day, dayIndex) =>
                    day ? (
                      <button
                        key={day}
                        type="button"
                        title={heatTitle(day, dayMap.get(day))}
                        onClick={() => onSelect(day)}
                        className="h-[13px] w-[13px]"
                        style={{
                          background: heatColor(dayMap.get(day), maxAbs),
                          outline: day === date || day === today ? '1px solid #FFE600' : undefined,
                          outlineOffset: '1px',
                        }}
                      />
                    ) : (
                      <span key={`pad-${weekIndex}-${dayIndex}`} className="h-[13px] w-[13px]" />
                    ),
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

function heatTitle(date: string, day: DayStat | undefined): string {
  if (!day) return `${formatShortDate(date)} · no record`
  if (day.pnl === null) return `${formatShortDate(date)} · baseline ${formatU(day.balance)}`
  return `${formatShortDate(date)} ${formatU(day.pnl, true)}`
}

function heatColor(day: DayStat | undefined, maxAbs: number): string {
  if (!day) return '#F1F1EC'
  if (day.pnl === null) return '#E3E3DC'
  if (day.pnl === 0 || maxAbs === 0) return '#D5D5CC'
  const ratio = Math.min(Math.abs(day.pnl) / maxAbs, 1)
  const alpha = (0.28 + ratio * 0.72).toFixed(3)
  if (day.pnl > 0) return `rgba(255, 230, 0, ${alpha})`
  return `rgba(20, 20, 20, ${alpha})`
}

import { cn } from '@/lib/cn'
import { WEEKDAY_LABELS, formatShortDate, isSameMonth, monthMatrix } from '@/lib/dates'
import { formatU, pnlClass } from '@/lib/format'
import type { DayStat } from '@/lib/types'
import type { FlowMark } from './types'

export function MonthView({
  date,
  today,
  dayMap,
  flowMap,
  onSelect,
}: {
  date: string
  today: string
  dayMap: Map<string, DayStat>
  flowMap: Map<string, FlowMark>
  onSelect: (date: string) => void
}) {
  const weeks = monthMatrix(date)

  return (
    <div>
      <div className="grid grid-cols-7 border-b border-hive-line">
        {WEEKDAY_LABELS.map((label) => (
          <div key={label} className="px-2 py-3 text-center text-[11px] tracking-[0.18em] text-hive-muted">
            {label}
          </div>
        ))}
      </div>
      <div className="grid grid-cols-7 gap-px bg-hive-line">
        {weeks.flat().map((day) => {
          const stat = dayMap.get(day)
          const flow = flowMap.get(day)
          const outside = !isSameMonth(day, date)
          const selected = day === date
          const pnl = stat?.pnl
          return (
            <button
              key={day}
              type="button"
              onClick={() => onSelect(day)}
              aria-pressed={selected}
              className={cn(
                'flex min-h-[88px] flex-col px-2 py-2 text-left sm:min-h-[108px] sm:px-3',
                cellTone(pnl, outside, Boolean(stat)),
                selected && 'shadow-pick',
              )}
            >
              <div className="flex items-center justify-between">
                <span
                  className={cn(
                    'inline-flex h-6 min-w-6 items-center justify-center text-xs',
                    day === today ? 'bg-hive-yellow font-semibold text-black' : 'text-hive-muted',
                    outside && day !== today && 'opacity-50',
                  )}
                >
                  {Number(day.slice(8))}
                </span>
              </div>
              <div className={cn('mt-3', outside && 'opacity-55')}>
                {typeof pnl === 'number' ? (
                  <div className={cn('num text-sm leading-none sm:text-lg', pnlClass(pnl))}>{formatU(pnl, true)}</div>
                ) : null}
                {stat && pnl === null ? <div className="text-[11px] tracking-[0.14em] text-hive-muted">起点</div> : null}
              </div>
              {flow && (flow.deposit > 0 || flow.withdraw > 0) ? (
                <div className={cn('mt-auto flex gap-2 pt-2 text-[10px] tracking-wide text-hive-muted', outside && 'opacity-50')}>
                  {flow.deposit > 0 ? <span>充</span> : null}
                  {flow.withdraw > 0 ? <span>提</span> : null}
                </div>
              ) : null}
            </button>
          )
        })}
      </div>
      <div className="flex flex-wrap gap-x-5 gap-y-2 px-4 py-3 text-[11px] tracking-wide text-hive-muted sm:px-5">
        <span>黄字为盈利</span>
        <span>黑字为亏损</span>
        <span>起点不计算收益</span>
        <span>充 / 提表示当天有资金进出</span>
        <span className="ml-auto hidden sm:inline">点选 {formatShortDate(date)} 查看明细</span>
      </div>
    </div>
  )
}

function cellTone(pnl: number | null | undefined, outside: boolean, hasBalance: boolean): string {
  if (outside) return 'bg-[#F7F7F4] hover:bg-[#F1F1EC]'
  if (!hasBalance || pnl == null) return 'bg-white hover:bg-[#F6F6F3]'
  if (pnl > 0) return 'bg-[#FFF6B8] hover:bg-[#FFEF8A]'
  if (pnl < 0) return 'bg-[#F4F4F1] hover:bg-[#EBEBE6]'
  return 'bg-[#FBFBF8] hover:bg-[#F3F3EE]'
}

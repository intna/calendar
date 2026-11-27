import { cn } from '@/lib/cn'
import { WEEKDAY_LABELS, addDays, formatTick } from '@/lib/dates'
import { formatU, pnlClass } from '@/lib/format'
import type { DayStat } from '@/lib/types'
import type { FlowMark } from './types'

export function WeekView({
  start,
  selected,
  today,
  dayMap,
  flowMap,
  onSelect,
}: {
  start: string
  selected: string
  today: string
  dayMap: Map<string, DayStat>
  flowMap: Map<string, FlowMark>
  onSelect: (date: string) => void
}) {
  const days = Array.from({ length: 7 }, (_, index) => addDays(start, index))

  return (
    <div className="overflow-x-auto">
      <div className="grid min-w-[760px] grid-cols-7 gap-px bg-hive-line">
        {days.map((day, index) => {
          const stat = dayMap.get(day)
          const flow = flowMap.get(day)
          const pnl = stat?.pnl
          const selectedDay = day === selected
          return (
            <button
              key={day}
              type="button"
              onClick={() => onSelect(day)}
              aria-pressed={selectedDay}
              className={cn(
                'flex min-h-[168px] flex-col bg-white p-3 text-left hover:bg-[#F6F6F3]',
                selectedDay && 'shadow-pick',
              )}
            >
              <div className="flex items-center justify-between text-xs text-hive-muted">
                <span>{WEEKDAY_LABELS[index]}</span>
                <span className={cn(day === today && 'bg-hive-yellow px-1.5 py-0.5 font-semibold text-black')}>
                  {Number(day.slice(8))}
                </span>
              </div>
              <div className="mt-5">
                {typeof pnl === 'number' ? (
                  <div className={cn('num text-2xl', pnlClass(pnl))}>{formatU(pnl, true)}</div>
                ) : stat ? (
                  <div className="text-sm tracking-[0.12em] text-hive-muted">Start</div>
                ) : (
                  <div className="text-sm text-hive-muted">Empty</div>
                )}
              </div>
              <div className="mt-auto space-y-1 pt-4 text-xs text-hive-muted">
                <div>{formatTick(day)}</div>
                <div>{stat ? `Balance ${formatU(stat.balance)}` : '—'}</div>
                {flow && (flow.deposit > 0 || flow.withdraw > 0) ? (
                  <div>
                    {flow.deposit > 0 ? `In ${formatU(flow.deposit)}` : ''}
                    {flow.deposit > 0 && flow.withdraw > 0 ? ' · ' : ''}
                    {flow.withdraw > 0 ? `Out ${formatU(flow.withdraw)}` : ''}
                  </div>
                ) : null}
              </div>
            </button>
          )
        })}
      </div>
    </div>
  )
}

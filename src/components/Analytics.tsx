'use client'

import {
  Bar,
  CartesianGrid,
  Cell,
  ComposedChart,
  Line,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts'
import { formatShortDate } from '@/lib/dates'
import { formatPercent, formatRoi, formatU, pnlClass } from '@/lib/format'
import type { ChartPoint, Summary } from '@/lib/period'

export function Analytics({
  title,
  caption,
  points,
  summary,
}: {
  title: string
  caption: string
  points: ChartPoint[]
  summary: Summary
}) {
  const hasChart = points.some((point) => point.pnl !== null || point.cumulative !== null)
  const slices = [
    { name: '盈利', value: summary.win, color: '#FFE600' },
    { name: '亏损', value: summary.loss, color: '#141414' },
    { name: '持平', value: summary.flat, color: '#D9D9D2' },
  ].filter((slice) => slice.value > 0)

  return (
    <section className="grid gap-px border border-hive-line bg-hive-line lg:grid-cols-[minmax(0,1fr)_300px]">
      <div className="min-w-0 bg-white px-4 py-4 sm:px-5">
        <div className="mb-3 flex flex-wrap items-end justify-between gap-2">
          <h3 className="text-sm tracking-[0.16em]">{title}</h3>
          <p className="text-xs text-hive-muted">{caption}</p>
        </div>
        {hasChart ? (
          <div className="h-[320px]">
            <ResponsiveContainer width="100%" height="100%">
              <ComposedChart data={points} margin={{ top: 12, right: 8, left: 0, bottom: 0 }}>
                <CartesianGrid vertical={false} stroke="#E7E7E1" />
                <XAxis dataKey="label" tick={{ fill: '#6E6E66', fontSize: 11 }} axisLine={false} tickLine={false} minTickGap={28} />
                <YAxis
                  yAxisId="pnl"
                  tick={{ fill: '#6E6E66', fontSize: 11 }}
                  axisLine={false}
                  tickLine={false}
                  width={48}
                  tickFormatter={compactTick}
                />
                <YAxis
                  yAxisId="cum"
                  orientation="right"
                  tick={{ fill: '#6E6E66', fontSize: 11 }}
                  axisLine={false}
                  tickLine={false}
                  width={48}
                  tickFormatter={compactTick}
                />
                <Tooltip content={<ChartTip />} cursor={{ fill: 'rgba(255,230,0,0.18)' }} />
                <Bar yAxisId="pnl" dataKey="pnl" maxBarSize={28} isAnimationActive={false}>
                  {points.map((point) => (
                    <Cell key={point.key} fill={barFill(point.pnl)} />
                  ))}
                </Bar>
                <Line
                  yAxisId="cum"
                  type="monotone"
                  dataKey="cumulative"
                  stroke="#141414"
                  strokeWidth={2}
                  dot={false}
                  connectNulls={false}
                  isAnimationActive={false}
                />
              </ComposedChart>
            </ResponsiveContainer>
          </div>
        ) : (
          <div className="flex h-[320px] items-center justify-center text-sm text-hive-muted">
            记入至少两天余额后，这里会画出收益曲线。
          </div>
        )}
      </div>

      <div className="bg-white px-5 py-4">
        <h3 className="text-sm tracking-[0.16em]">胜负分布</h3>
        <div className="relative mx-auto mt-2 h-[210px] w-[210px]">
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={slices.length ? slices : [{ name: '暂无', value: 1, color: '#F1F1EC' }]}
                dataKey="value"
                innerRadius={64}
                outerRadius={84}
                paddingAngle={slices.length > 1 ? 2 : 0}
                stroke="#FFFFFF"
                isAnimationActive={false}
              >
                {(slices.length ? slices : [{ name: '暂无', value: 1, color: '#F1F1EC' }]).map((slice) => (
                  <Cell key={slice.name} fill={slice.color} />
                ))}
              </Pie>
            </PieChart>
          </ResponsiveContainer>
          <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center">
            <div className="text-[10px] tracking-[0.18em] text-hive-muted">胜率</div>
            <div className="num text-3xl text-hive-ivory">{formatPercent(summary.winRate)}</div>
          </div>
        </div>
        <div className="mt-1 space-y-2 text-sm">
          <Legend color="#FFE600" label="盈利" value={`${summary.win} 天`} />
          <Legend color="#141414" label="亏损" value={`${summary.loss} 天`} />
          <Legend color="#D9D9D2" label="持平" value={`${summary.flat} 天`} />
        </div>
        <div className="mt-5 space-y-3 border-t border-hive-line pt-4 text-sm">
          <Row label="最高单日" value={summary.best ? formatU(summary.best.pnl, true) : '—'} extra={summary.best ? formatShortDate(summary.best.date) : ''} tone={summary.best?.pnl ?? null} />
          <Row label="最低单日" value={summary.worst ? formatU(summary.worst.pnl, true) : '—'} extra={summary.worst ? formatShortDate(summary.worst.date) : ''} tone={summary.worst?.pnl ?? null} />
          <Row label="日均收益" value={summary.avg === null ? '—' : formatU(summary.avg, true)} tone={summary.avg} />
          <Row label="充值" value={formatU(summary.deposits)} />
          <Row label="提现" value={formatU(summary.withdrawals)} />
          <Row label="收益率" value={formatRoi(summary.roi)} tone={summary.roi} />
        </div>
      </div>
    </section>
  )
}

function ChartTip({
  active,
  payload,
}: {
  active?: boolean
  payload?: Array<{ payload?: ChartPoint }>
}) {
  const point = payload?.[0]?.payload
  if (!active || !point) return null
  return (
    <div className="border border-hive-line bg-white px-3 py-2 text-xs shadow-sm">
      <div className="text-hive-muted">{point.title}</div>
      <div className="mt-1 text-hive-ivory">区间 {point.pnl === null ? '—' : formatU(point.pnl, true)}</div>
      <div className="text-hive-ivory">累计 {point.cumulative === null ? '—' : formatU(point.cumulative, true)}</div>
    </div>
  )
}

function Legend({ color, label, value }: { color: string; label: string; value: string }) {
  return (
    <div className="flex items-center justify-between">
      <span className="flex items-center gap-2 text-hive-muted">
        <span className="h-2.5 w-2.5" style={{ background: color }} />
        {label}
      </span>
      <span className="num text-hive-ivory">{value}</span>
    </div>
  )
}

function Row({
  label,
  value,
  extra,
  tone,
}: {
  label: string
  value: string
  extra?: string
  tone?: number | null
}) {
  return (
    <div className="flex items-baseline justify-between gap-3">
      <span className="text-hive-muted">{label}</span>
      <span className="text-right">
        <span className={`num ${tone === undefined ? 'text-hive-ivory' : pnlClass(tone)}`}>{value}</span>
        {extra ? <span className="ml-2 text-xs text-hive-muted">{extra}</span> : null}
      </span>
    </div>
  )
}

function barFill(pnl: number | null): string {
  if (pnl === null || pnl === 0) return '#E4E4DC'
  if (pnl > 0) return '#FFE600'
  return '#141414'
}

function compactTick(value: number): string {
  const absolute = Math.abs(value)
  const sign = value < 0 ? '−' : ''
  if (absolute >= 1000) return `${sign}${(absolute / 1000).toFixed(absolute >= 10000 ? 0 : 1)}k`
  if (absolute >= 100) return `${sign}${Math.round(absolute)}`
  return `${sign}${Math.round(absolute)}`
}

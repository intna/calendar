import assert from 'node:assert/strict'
import { test } from 'node:test'
import { addMonths, daysBetween, endOfWeek, startOfWeek } from '../src/lib/dates'
import { computeSeries, cashflowState } from '../src/lib/pnl'
import { periodRange, summarize } from '../src/lib/period'
import type { Balance, Cashflow } from '../src/lib/types'

function balance(date: string, amount: number): Balance {
  return { date, balance: amount, note: '' }
}

function flow(date: string, type: 'deposit' | 'withdraw', amount: number): Cashflow {
  return { id: `${date}-${type}-${amount}`, date, type, amount, note: '' }
}

test('提现后余额下降，收益为 0', () => {
  const days = computeSeries(
    [balance('2026-11-26', 800), balance('2026-11-27', 300)],
    [flow('2026-11-27', 'withdraw', 500)],
  )
  assert.equal(days[0].pnl, null)
  assert.equal(days[1].pnl, 0)
  assert.equal(days[1].cumulative, 0)
})

test('充值后余额上升，收益为 0', () => {
  const days = computeSeries(
    [balance('2026-11-26', 800), balance('2026-11-27', 1000)],
    [flow('2026-11-27', 'deposit', 200)],
  )
  assert.equal(days[1].pnl, 0)
})

test('交易盈利和充值提现可以同时计算', () => {
  const days = computeSeries(
    [balance('2026-11-26', 800), balance('2026-11-27', 1100)],
    [flow('2026-11-27', 'deposit', 200)],
  )
  assert.equal(days[1].pnl, 100)

  const mixed = computeSeries(
    [balance('2026-11-26', 800), balance('2026-11-27', 400)],
    [flow('2026-11-27', 'withdraw', 500)],
  )
  assert.equal(mixed[1].pnl, 100)

  const both = computeSeries(
    [balance('2026-11-26', 800), balance('2026-11-27', 900)],
    [flow('2026-11-27', 'deposit', 100), flow('2026-11-27', 'withdraw', 50)],
  )
  assert.equal(both[1].pnl, 50)
})

test('起点当天的流水不计入，隔天的流水合并到下一次余额', () => {
  const days = computeSeries(
    [balance('2026-11-01', 800), balance('2026-11-05', 900)],
    [flow('2026-11-01', 'deposit', 500), flow('2026-11-03', 'withdraw', 100)],
  )
  assert.equal(days[1].pnl, 200)
  assert.equal(days[1].withdrawals, 100)
  assert.equal(days[1].deposits, 0)
  assert.equal(days[1].spanDays, 4)
  assert.equal(cashflowState('2026-11-01', days), 'ignored')
  assert.equal(cashflowState('2026-11-03', days), 'applied')
  assert.equal(cashflowState('2026-11-06', days), 'pending')
})

test('小数余额按分计算，避免浮点误差', () => {
  const days = computeSeries(
    [balance('2026-11-26', 100.1), balance('2026-11-27', 100.3)],
    [flow('2026-11-27', 'deposit', 0.2)],
  )
  assert.equal(days[1].pnl, 0)
})

test('累计收益按每次结算相加', () => {
  const days = computeSeries(
    [balance('2026-11-01', 1000), balance('2026-11-02', 1100), balance('2026-11-03', 900)],
    [flow('2026-11-03', 'withdraw', 300)],
  )
  assert.equal(days[1].pnl, 100)
  assert.equal(days[2].pnl, 100)
  assert.equal(days[2].cumulative, 200)
})

test('同一天重复余额取最后一次', () => {
  const days = computeSeries(
    [balance('2026-11-26', 800), balance('2026-11-27', 100), balance('2026-11-27', 900)],
    [],
  )
  assert.equal(days.length, 2)
  assert.equal(days[1].balance, 900)
  assert.equal(days[1].pnl, 100)
})

test('周从周一开始，月末日期会被夹到当月最后一天', () => {
  assert.equal(startOfWeek('2026-11-27'), '2026-11-23')
  assert.equal(endOfWeek('2026-11-27'), '2026-11-29')
  assert.equal(addMonths('2026-03-31', -1), '2026-02-28')
  assert.equal(daysBetween('2026-11-01', '2026-11-05'), 4)
  const week = periodRange('week', '2026-11-27')
  assert.equal(week.start, '2026-11-23')
  assert.equal(week.end, '2026-11-29')
})

test('区间汇总会剔除充值提现', () => {
  const balances = [balance('2026-11-01', 800), balance('2026-11-02', 300), balance('2026-11-03', 500)]
  const flows = [flow('2026-11-02', 'withdraw', 500)]
  const days = computeSeries(balances, flows)
  const summary = summarize(days, flows, '2026-11-01', '2026-11-30')
  assert.equal(summary.pnl, 200)
  assert.equal(summary.withdrawals, 500)
  assert.equal(summary.win, 1)
  assert.equal(summary.flat, 1)
  assert.equal(summary.roi, 200 / 800)
})

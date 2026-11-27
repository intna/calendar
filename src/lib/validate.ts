export class HttpError extends Error {
  status: number

  constructor(status: number, message: string) {
    super(message)
    this.status = status
  }
}

export function assertDate(value: unknown): string {
  if (typeof value !== 'string' || !/^\d{4}-\d{2}-\d{2}$/.test(value)) {
    throw new HttpError(400, '日期格式应为 YYYY-MM-DD')
  }
  const [year, month, day] = value.split('-').map(Number)
  const date = new Date(Date.UTC(year, month - 1, day))
  const valid =
    date.getUTCFullYear() === year && date.getUTCMonth() === month - 1 && date.getUTCDate() === day
  if (!valid || year < 2000 || year > 2100) throw new HttpError(400, '日期无效')
  return value
}

export function assertMoney(value: unknown, allowZero = false): number {
  const numeric = typeof value === 'number' ? value : typeof value === 'string' ? Number(value) : Number.NaN
  if (!Number.isFinite(numeric)) throw new HttpError(400, '金额无效')
  const rounded = Math.round(numeric * 100) / 100
  if (rounded < 0 || (!allowZero && rounded === 0)) {
    throw new HttpError(400, allowZero ? '金额不能为负' : '金额需要大于 0')
  }
  if (rounded > 1_000_000_000) throw new HttpError(400, '金额超出范围')
  return rounded
}

export function assertNote(value: unknown): string {
  if (value == null || value === '') return ''
  if (typeof value !== 'string') throw new HttpError(400, '备注无效')
  const note = value.trim()
  if (note.length > 200) throw new HttpError(400, '备注最多 200 字')
  return note
}

export function assertFlowType(value: unknown): 'deposit' | 'withdraw' {
  if (value !== 'deposit' && value !== 'withdraw') throw new HttpError(400, '流水类型无效')
  return value
}

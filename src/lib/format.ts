export function sumMoney(values: number[]): number {
  const total = values.reduce((sum, value) => sum + Math.round(value * 100), 0)
  return total / 100
}

export function formatU(value: number, signed = false): string {
  const absolute = Math.abs(value).toLocaleString('zh-CN', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })
  if (value < 0) return `−${absolute}`
  if (signed && value > 0) return `+${absolute}`
  return absolute
}

export function formatRoi(value: number | null): string {
  if (value === null || !Number.isFinite(value)) return '—'
  const percent = Math.abs(value * 100).toFixed(2)
  if (value > 0) return `+${percent}%`
  if (value < 0) return `−${percent}%`
  return '0.00%'
}

export function formatPercent(value: number | null): string {
  if (value === null || !Number.isFinite(value)) return '—'
  return `${Math.round(value * 100)}%`
}

export function parseMoney(raw: string): number | null {
  const cleaned = raw
    .trim()
    .replace(/,/g, '')
    .replace(/，/g, '')
    .replace(/\s+/g, '')
    .replace(/[uU]$/, '')
  if (!/^\d+(\.\d+)?$/.test(cleaned)) return null
  const value = Math.round(Number(cleaned) * 100) / 100
  if (!Number.isFinite(value) || value < 0 || value > 1_000_000_000) return null
  return value
}

export function pnlClass(value: number | null): string {
  if (value === null || value === 0) return 'text-hive-muted'
  if (value > 0) return 'text-hive-gold'
  return 'text-hive-ivory'
}

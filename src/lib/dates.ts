export const WEEKDAY_LABELS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'] as const

const WEEKDAY_NAMES = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']
const MONTH_SHORT = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']
const MONTH_LONG = [
  'January',
  'February',
  'March',
  'April',
  'May',
  'June',
  'July',
  'August',
  'September',
  'October',
  'November',
  'December',
]

export function parseISODate(iso: string): Date {
  const [year, month, day] = iso.split('-').map(Number)
  return new Date(year, (month ?? 1) - 1, day ?? 1)
}

export function formatISODate(date: Date): string {
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')
  return `${year}-${month}-${day}`
}

export function todayISO(): string {
  return formatISODate(new Date())
}

export function addDays(iso: string, amount: number): string {
  const date = parseISODate(iso)
  date.setDate(date.getDate() + amount)
  return formatISODate(date)
}

export function addMonths(iso: string, amount: number): string {
  const date = parseISODate(iso)
  const day = date.getDate()
  const target = new Date(date.getFullYear(), date.getMonth() + amount, 1)
  const last = new Date(target.getFullYear(), target.getMonth() + 1, 0).getDate()
  target.setDate(Math.min(day, last))
  return formatISODate(target)
}

export function addYears(iso: string, amount: number): string {
  return addMonths(iso, amount * 12)
}

export function eachDay(start: string, end: string): string[] {
  const days: string[] = []
  let cursor = start
  while (cursor <= end) {
    days.push(cursor)
    cursor = addDays(cursor, 1)
  }
  return days
}

export function daysBetween(start: string, end: string): number {
  const [startYear, startMonth, startDay] = start.split('-').map(Number)
  const [endYear, endMonth, endDay] = end.split('-').map(Number)
  const startUtc = Date.UTC(startYear, startMonth - 1, startDay)
  const endUtc = Date.UTC(endYear, endMonth - 1, endDay)
  return Math.round((endUtc - startUtc) / 86400000)
}

export function startOfWeek(iso: string): string {
  const date = parseISODate(iso)
  const offset = (date.getDay() + 6) % 7
  date.setDate(date.getDate() - offset)
  return formatISODate(date)
}

export function endOfWeek(iso: string): string {
  return addDays(startOfWeek(iso), 6)
}

export function startOfMonth(iso: string): string {
  const date = parseISODate(iso)
  return formatISODate(new Date(date.getFullYear(), date.getMonth(), 1))
}

export function endOfMonth(iso: string): string {
  const date = parseISODate(iso)
  return formatISODate(new Date(date.getFullYear(), date.getMonth() + 1, 0))
}

export function startOfYear(iso: string): string {
  return `${parseISODate(iso).getFullYear()}-01-01`
}

export function endOfYear(iso: string): string {
  return `${parseISODate(iso).getFullYear()}-12-31`
}

export function isSameMonth(a: string, b: string): boolean {
  return a.slice(0, 7) === b.slice(0, 7)
}

export function monthMatrix(iso: string): string[][] {
  const first = parseISODate(startOfMonth(iso))
  const offset = (first.getDay() + 6) % 7
  const cursor = new Date(first.getFullYear(), first.getMonth(), 1 - offset)
  const weeks: string[][] = []
  for (let week = 0; week < 6; week += 1) {
    const days: string[] = []
    for (let index = 0; index < 7; index += 1) {
      days.push(formatISODate(cursor))
      cursor.setDate(cursor.getDate() + 1)
    }
    weeks.push(days)
  }
  return weeks
}

export function yearWeeks(year: number): (string | null)[][] {
  const start = startOfWeek(`${year}-01-01`)
  const end = endOfWeek(`${year}-12-31`)
  const days: string[] = []
  const cursor = parseISODate(start)
  const last = parseISODate(end)
  while (cursor <= last) {
    days.push(formatISODate(cursor))
    cursor.setDate(cursor.getDate() + 1)
  }
  const weeks: (string | null)[][] = []
  for (let index = 0; index < days.length; index += 7) {
    weeks.push(
      days.slice(index, index + 7).map((day) => (day.startsWith(`${year}-`) ? day : null)),
    )
  }
  return weeks
}

export function withDayInMonth(sourceDay: string, monthDate: string): string {
  const wanted = parseISODate(sourceDay).getDate()
  const last = parseISODate(endOfMonth(monthDate)).getDate()
  const base = parseISODate(startOfMonth(monthDate))
  base.setDate(Math.min(wanted, last))
  return formatISODate(base)
}

export function formatLongDate(iso: string): string {
  const date = parseISODate(iso)
  const weekday = WEEKDAY_NAMES[date.getDay()]
  return `${weekday}, ${MONTH_SHORT[date.getMonth()]} ${date.getDate()}, ${date.getFullYear()}`
}

export function formatShortDate(iso: string): string {
  const date = parseISODate(iso)
  return `${MONTH_SHORT[date.getMonth()]} ${date.getDate()}`
}

export function formatMonthLabel(iso: string): string {
  const date = parseISODate(iso)
  return `${MONTH_LONG[date.getMonth()]} ${date.getFullYear()}`
}

export function formatMonthName(month: number): string {
  return MONTH_SHORT[month - 1] ?? ''
}

export function formatTick(iso: string): string {
  const date = parseISODate(iso)
  return `${date.getMonth() + 1}/${date.getDate()}`
}

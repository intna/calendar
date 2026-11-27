import { NextResponse } from 'next/server'
import { withError } from '@/lib/http'
import { loadSeries } from '@/lib/series'

export const dynamic = 'force-dynamic'
export const runtime = 'nodejs'

export function GET() {
  return withError(async () => NextResponse.json(await loadSeries()))
}

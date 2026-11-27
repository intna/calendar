import { NextResponse } from 'next/server'
import { withError } from '@/lib/http'
import { getDb } from '@/lib/mongodb'
import { loadSeries } from '@/lib/series'
import { assertDate, assertMoney, assertNote, HttpError } from '@/lib/validate'

export const dynamic = 'force-dynamic'
export const runtime = 'nodejs'

async function readBody(request: Request): Promise<Record<string, unknown>> {
  const body: unknown = await request.json()
  if (!body || typeof body !== 'object') throw new HttpError(400, '请求格式无效')
  return body as Record<string, unknown>
}

export function POST(request: Request) {
  return withError(async () => {
    const body = await readBody(request)
    const date = assertDate(body.date)
    const balance = assertMoney(body.balance, true)
    const note = assertNote(body.note)
    const db = await getDb()
    const now = new Date()
    await db.collection('balances').updateOne(
      { date },
      { $set: { date, balance, note, updatedAt: now }, $setOnInsert: { createdAt: now } },
      { upsert: true },
    )
    return NextResponse.json(await loadSeries())
  })
}

export function DELETE(request: Request) {
  return withError(async () => {
    const date = assertDate(new URL(request.url).searchParams.get('date'))
    const db = await getDb()
    const result = await db.collection('balances').deleteOne({ date })
    if (result.deletedCount === 0) throw new HttpError(404, '这一天没有余额记录')
    return NextResponse.json(await loadSeries())
  })
}

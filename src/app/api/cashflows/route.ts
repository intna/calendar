import { NextResponse } from 'next/server'
import { withError } from '@/lib/http'
import { getDb } from '@/lib/mongodb'
import { flowId, loadSeries } from '@/lib/series'
import { assertDate, assertFlowType, assertMoney, assertNote, HttpError } from '@/lib/validate'

export const dynamic = 'force-dynamic'
export const runtime = 'nodejs'

export function POST(request: Request) {
  return withError(async () => {
    const body: unknown = await request.json()
    if (!body || typeof body !== 'object') throw new HttpError(400, 'Invalid request')
    const record = body as Record<string, unknown>
    const date = assertDate(record.date)
    const type = assertFlowType(record.type)
    const amount = assertMoney(record.amount)
    const note = assertNote(record.note)
    const db = await getDb()
    await db.collection('cashflows').insertOne({
      date,
      type,
      amount,
      note,
      createdAt: new Date(),
    })
    return NextResponse.json(await loadSeries())
  })
}

export function DELETE(request: Request) {
  return withError(async () => {
    const id = new URL(request.url).searchParams.get('id') ?? ''
    const db = await getDb()
    const result = await db.collection('cashflows').deleteOne({ _id: flowId(id) })
    if (result.deletedCount === 0) throw new HttpError(404, 'Cashflow not found')
    return NextResponse.json(await loadSeries())
  })
}

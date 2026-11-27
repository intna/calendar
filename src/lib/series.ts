import { ObjectId } from 'mongodb'
import { getDb } from './mongodb'
import { computeSeries } from './pnl'
import type { CashflowType, SeriesData } from './types'
import { HttpError } from './validate'

export async function loadSeries(): Promise<SeriesData> {
  const db = await getDb()
  const balanceDocs = await db.collection('balances').find().sort({ date: 1 }).toArray()
  const flowDocs = await db.collection('cashflows').find().sort({ date: 1, createdAt: 1 }).toArray()

  const balances = balanceDocs.map((doc) => ({
    date: String(doc.date),
    balance: Number(doc.balance),
    note: typeof doc.note === 'string' ? doc.note : '',
  }))

  const cashflows = flowDocs
    .map((doc) => ({
      id: String(doc._id),
      date: String(doc.date),
      type: doc.type as CashflowType,
      amount: Number(doc.amount),
      note: typeof doc.note === 'string' ? doc.note : '',
    }))
    .filter((flow) => flow.type === 'deposit' || flow.type === 'withdraw')

  return {
    balances,
    cashflows,
    days: computeSeries(balances, cashflows),
  }
}

export function flowId(id: string): ObjectId {
  if (!ObjectId.isValid(id)) throw new HttpError(400, 'Cashflow not found')
  return new ObjectId(id)
}

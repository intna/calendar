import { NextResponse } from 'next/server'
import { HttpError } from './validate'

export function jsonError(error: unknown) {
  if (error instanceof HttpError) {
    return NextResponse.json({ error: error.message }, { status: error.status })
  }
  if (error instanceof SyntaxError) {
    return NextResponse.json({ error: 'Invalid request' }, { status: 400 })
  }
  console.error(error)
  const text = error instanceof Error ? error.message : ''
  if (/mongo|ECONNREFUSED|ENOTFOUND|MONGODB_URI|server selection|MongoServerSelection/i.test(text)) {
    return NextResponse.json(
      { error: 'Unable to reach MongoDB. Start the database and check MONGODB_URI.' },
      { status: 503 },
    )
  }
  return NextResponse.json({ error: 'Server error' }, { status: 500 })
}

export async function withError(handler: () => Promise<Response>) {
  try {
    return await handler()
  } catch (error) {
    return jsonError(error)
  }
}

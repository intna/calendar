import { NextResponse } from 'next/server'
import { HttpError } from './validate'

export function jsonError(error: unknown) {
  if (error instanceof HttpError) {
    return NextResponse.json({ error: error.message }, { status: error.status })
  }
  if (error instanceof SyntaxError) {
    return NextResponse.json({ error: '请求格式无效' }, { status: 400 })
  }
  console.error(error)
  const text = error instanceof Error ? error.message : ''
  if (/mongo|ECONNREFUSED|ENOTFOUND|MONGODB_URI|server selection|MongoServerSelection/i.test(text)) {
    return NextResponse.json(
      { error: '无法连接 MongoDB。请先启动数据库，并检查 MONGODB_URI。' },
      { status: 503 },
    )
  }
  return NextResponse.json({ error: '服务器错误' }, { status: 500 })
}

export async function withError(handler: () => Promise<Response>) {
  try {
    return await handler()
  } catch (error) {
    return jsonError(error)
  }
}

import { MongoClient, type Db } from 'mongodb'

const globalForMongo = globalThis as unknown as {
  clientPromise?: Promise<MongoClient>
  indexes?: Promise<void>
}

function databaseName(uri: string): string {
  try {
    const name = new URL(uri).pathname.replace(/^\//, '')
    if (name) return name
  } catch {
    return 'polymarket'
  }
  return 'polymarket'
}

async function ensureIndexes(db: Db) {
  if (!globalForMongo.indexes) {
    globalForMongo.indexes = Promise.all([
      db.collection('balances').createIndex({ date: 1 }, { unique: true }),
      db.collection('cashflows').createIndex({ date: 1, createdAt: 1 }),
    ])
      .then(() => undefined)
      .catch((error: unknown) => {
        globalForMongo.indexes = undefined
        throw error
      })
  }
  await globalForMongo.indexes
}

export async function getDb(): Promise<Db> {
  const uri = process.env.MONGODB_URI
  if (!uri) throw new Error('MONGODB_URI is not set')

  if (!globalForMongo.clientPromise) {
    const client = new MongoClient(uri, { serverSelectionTimeoutMS: 4000 })
    globalForMongo.clientPromise = client.connect().catch((error: unknown) => {
      globalForMongo.clientPromise = undefined
      throw error
    })
  }

  try {
    const client = await globalForMongo.clientPromise
    const db = client.db(databaseName(uri))
    await ensureIndexes(db)
    return db
  } catch (error) {
    globalForMongo.clientPromise = undefined
    throw error
  }
}

import type Database from 'better-sqlite3'
import type { Customer, NewCustomer } from '@shared/types'

interface CustomerRow {
  id: number
  name: string
  phone: string | null
  points: number
  created_at: string
  updated_at: string
}

function rowToCustomer(row: CustomerRow): Customer {
  return {
    id: row.id,
    name: row.name,
    phone: row.phone,
    points: row.points,
    createdAt: row.created_at,
    updatedAt: row.updated_at
  }
}

export interface CustomersRepository {
  list(): Customer[]
  findById(id: number): Customer | null
  findByPhone(phone: string): Customer | null
  create(input: NewCustomer): Customer
  /** Applies a points delta (positive to award, negative to redeem) as part of a sale. */
  addPoints(id: number, delta: number): void
}

export function createCustomersRepository(db: Database.Database): CustomersRepository {
  const listStmt = db.prepare('SELECT * FROM customers ORDER BY name COLLATE NOCASE')
  const findByIdStmt = db.prepare('SELECT * FROM customers WHERE id = ?')
  const findByPhoneStmt = db.prepare('SELECT * FROM customers WHERE phone = ?')
  const insertStmt = db.prepare('INSERT INTO customers (name, phone) VALUES (@name, @phone)')
  const addPointsStmt = db.prepare(`
    UPDATE customers
    SET points = points + @delta, updated_at = strftime('%Y-%m-%dT%H:%M:%fZ', 'now')
    WHERE id = @id
  `)

  return {
    list(): Customer[] {
      return (listStmt.all() as CustomerRow[]).map(rowToCustomer)
    },

    findById(id: number): Customer | null {
      const row = findByIdStmt.get(id) as CustomerRow | undefined
      return row ? rowToCustomer(row) : null
    },

    findByPhone(phone: string): Customer | null {
      const row = findByPhoneStmt.get(phone) as CustomerRow | undefined
      return row ? rowToCustomer(row) : null
    },

    create(input: NewCustomer): Customer {
      const result = insertStmt.run({ name: input.name, phone: input.phone })
      return rowToCustomer(findByIdStmt.get(result.lastInsertRowid) as CustomerRow)
    },

    addPoints(id: number, delta: number): void {
      addPointsStmt.run({ id, delta })
    }
  }
}

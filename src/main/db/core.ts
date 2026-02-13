import Database from 'better-sqlite3'
import path from 'path'
import { app } from 'electron'

export interface Product {
  id: number
  name: string
  price: number
  stock: number
  detail: string
  barcode: string
}

export interface CartItem {
  id: number
  name: string
  price: number
  quantity: number
}

//connect database
const dbPath = path.join(app.getPath('desktop'), 'pos-test.db')
export const db = new Database(dbPath, { verbose: console.log })

/**
 * Initialize the database table.
 * This function will be called when the app starts.
 */
export function initDB(): void {
  // Product List
  db.exec(`
    CREATE TABLE IF NOT EXISTS products (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      price INTEGER NOT NULL,
      stock INTEGER DEFAULT 1,
      detail TEXT,
      barcode TEXT UNIQUE
    );
  `)

  // Sale List
  db.exec(`
    CREATE TABLE IF NOT EXISTS sales (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      total_price INTEGER NOT NULL,
      items_json TEXT NOT NULL,
      discount_value REAL DEFAULT 0,
      discount_type TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );
  `)

  console.log('Database initialized at:', dbPath)
}

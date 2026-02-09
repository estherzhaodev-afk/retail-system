import { db, Product } from './core'

/**
 * Inserts a new product into the database.
 * Returns the ID of the new row.
 */
export function addProduct(product: Product): number | bigint {
  const stmt = db.prepare(`
    INSERT INTO products (name, price, stock, detail, barcode)
    VALUES (@name, @price, @stock, @detail, @barcode)
  `)

  const info = stmt.run(product)
  return info.lastInsertRowid as number
}

/**
 * Retrieves all products from the database, newest first.
 */
export function getAllProducts(): Product[] {
  // .all() returns an array of objects
  const stmt = db.prepare('SELECT * FROM products ORDER BY id DESC')
  return stmt.all() as Product[]
}

/**
 * Delete product by id
 */
export function deleteProduct(id: number): number {
  const stmt = db.prepare('DELETE FROM products WHERE id = ?')
  const info = stmt.run(id)
  return info
}

/**
 * Update product by id
 */
export function updateProduct(product: Product): number {
  const stmt = db.prepare(`
    UPDATE products 
    SET name = @name, price = @price, stock = @stock, detail = @detail, barcode = @barcode
    WHERE id = @id
  `)
  const info = stmt.run(product)
  return info.changes
}

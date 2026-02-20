import { db } from './core'
import { Product } from '../../common/types'
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
 *
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
  return info.changes
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

/**
 * Pagination
 * @param page
 * @param pageSize
 * @param searchTerm
 * @returns
 */
export function getProductsPaginated(
  page: number,
  pageSize: number,
  searchTerm: string = ''
): Product[] {
  const offset = (page - 1) * pageSize

  if (searchTerm.trim() === '') {
    const stmt = db.prepare(`
      SELECT * FROM products
      ORDER BY id DESC
      LIMIT ? OFFSET ?
    `)
    return stmt.all(pageSize, offset) as Product[]
  }

  const stmt = db.prepare(`
    SELECT * FROM products
    WHERE name LIKE ? OR barcode LIKE ?
    ORDER BY id DESC
    LIMIT ? OFFSET ?
  `)

  const keyword = `%${searchTerm}%`
  return stmt.all(keyword, keyword, pageSize, offset) as Product[]
}

export function getProductsCount(searchTerm: string = ''): number {
  if (searchTerm.trim() === '') {
    const stmt = db.prepare(`SELECT COUNT(*) as count FROM products`)
    return (stmt.get() as { count: number }).count
  }

  const stmt = db.prepare(`
    SELECT COUNT(*) as count FROM products
    WHERE name LIKE ? OR barcode LIKE ?
  `)

  const keyword = `%${searchTerm}%`
  return (stmt.get(keyword, keyword) as { count: number }).count
}

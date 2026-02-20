import { db } from './core'
import { CartItem, Sale, AnalyticsResult } from '../../common/types'

/**
 * reduce inventory && record sale
 */
export const createSale = db.transaction(
  (cartItems: CartItem[], discount?: { type: 'percent' | 'fixed'; value: number }) => {
    //total
    const total = calculateTotal(cartItems)

    let finalTotal = total

    if (discount) {
      if (discount.type === 'percent') {
        finalTotal = total * (1 - discount.value / 100)
      } else {
        finalTotal = total - discount.value * 100
      }
    }

    //sale record
    const insertSale = db.prepare(
      'INSERT INTO sales( total_price,items_json,discount_value, discount_type,status) VALUES(?,?,?,?,?)'
    )
    const res = insertSale.run(
      finalTotal,
      JSON.stringify(cartItems),
      discount?.value ?? null,
      discount?.type ?? null,
      'COMPLETED'
    )
    //Update invertory
    const updateStock = db.prepare('UPDATE products SET stock = stock - ? WHERE id = ?')

    for (const item of cartItems) {
      updateStock.run(item.quantity, item.id)
    }

    return { success: true, saleId: res.id }
  }
)

/**
 * Calculate total
 */
function calculateTotal(cartItems: CartItem[]): number {
  return cartItems.reduce((sum, item) => sum + item.price * item.quantity, 0)
}

/**
 * Get sale data
 */
export function getSalesAnalytics(): AnalyticsResult {
  const stats = fetchTodayStats()
  const recent = fetchRecentSales(10)

  return {
    todayRevenue: stats.totalRevenue,
    todayOrders: stats.totalOrders,
    recentSales: recent
  }
}

/**
 * Today Analytics
 */
function fetchTodayStats(): {
  totalRevenue: number
  totalOrders: number
} {
  const stmt = db.prepare(`
    SELECT 
      SUM(total_price) as totalRevenue, 
      COUNT(*) as totalOrders 
    FROM sales 
    WHERE date(created_at, 'localtime') = date('now', 'localtime')
    AND status != 'VOID'
  `)

  const result = stmt.get() as { totalRevenue: number; totalOrders: number }

  return {
    totalRevenue: result.totalRevenue || 0,
    totalOrders: result.totalOrders || 0
  }
}

/**
 * Renctly 10
 * @param limit
 */
function fetchRecentSales(limit: number): Sale[] {
  const stmt = db.prepare(`
    SELECT * FROM sales 
    ORDER BY id DESC 
    LIMIT ?
  `)
  return stmt.all(limit)
}

/**
 * Get All Sale
 */
export function getAllSales(): Sale[] {
  const stmt = db.prepare('SELECt * from sales ORDER BY id DESC')
  return stmt.all() as Sale[]
}

/**
 * void sale
 */
export const voidSaleTransaction = (saleId: number): boolean => {
  const execute = db.transaction(() => {
    const sale = db.prepare('SELECT status, items_json FROM sales WHERE id = ?').get(saleId)

    if (!sale) throw new Error('Order not found')
    if (sale.status === 'VOID') throw new Error('Order is already voided')

    const items = JSON.parse(sale.items_json)

    db.prepare("UPDATE sales SET status = 'VOID' WHERE id = ?").run(saleId)

    const updateStockStmt = db.prepare('UPDATE products SET stock = stock + ? WHERE id = ?')
    for (const item of items) {
      updateStockStmt.run(item.quantity, item.id)
    }

    return true
  })

  return execute()
}

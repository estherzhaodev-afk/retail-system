import { db, CartItem } from './core'

export interface SaleRow {
  id: number
  total_price: number
  items_json: string
  created_at: string
}

export interface AnalyticsResult {
  todayRevenue: number
  todayOrders: number
  recentSales: SaleRow[]
}

/**
 * reduce inventory && record sale
 */
export const createSale = db.transaction((cartItems: CartItem[]) => {
  //total
  const total = calculateTotal(cartItems)

  //sale record
  const insertSale = db.prepare('INSERT INTO sales( total_price,items_json ) VALUES(?,?)')
  insertSale.run(total, JSON.stringify(cartItems))
  //Update invertory
  const updateStock = db.prepare('UPDATE products SET stock = stock - ? WHERE id = ?')

  for (const item of cartItems) {
    updateStock.run(item.quantity, item.id)
  }

  return { success: true }
})

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
function fetchRecentSales(limit: number): SaleRow[] {
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
export function getAllSales(): SaleRow[] {
  const stmt = db.prepare('SELECt * from sales ORDER BY id DESC')
  return stmt.all() as SaleRow[]
}

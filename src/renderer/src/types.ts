export interface Product {
  id: number
  name: string
  price: number
  stock: number
  detail: string
  barcode: string
}

export interface CartItem extends Product {
  quantity: number
}

export interface Sale {
  id: number
  total_price: number
  items_json: string
  created_at: string
}

export interface AnalyticsData {
  todayRevenue: number
  todayOrders: number
  recentSales: Sale[]
}

/// <reference types="vite/client" />

interface CartItem {
  id: number
  name: string
  price: number
  quantity: number
}

interface Product {
  id: number
  barcode: string
  name: string
  price: number
  stock: number
  detail?: string
}

interface PrintData {
  id: string
  items: CartItem[]
  total: number
  time: string
}

interface SaleRow {
  id: number
  total_number: number
  items: string
  created_at: string
}

interface Window {
  api: {
    createSale: (
      cart: CartItem[],
      discount?: { type: 'percent' | 'fixed'; value: number } | null
    ) => Promise<{ success: boolean; error?: string }>
    getSalesAnalytics: () => Promise<{ success: boolean; data; error?: string }>
    getAllSales: () => Promise<{ success: boolean; data; error?: string }>

    printReceipt: (data: PrintData) => Promise<{ success: boolean; error?: string }>

    addProduct: (product: Omit<Product, 'id'>) => Promise<{ success: boolean; error?: string }>
    updateProduct: (product: Product) => Promise<{ success: boolean; error?: string }>
    deleteProduct: (id: number) => Promise<{ success: boolean; error?: string }>
    getAllProducts: () => Promise<{ success: boolean; data: Product[]; error?: string }>
    saveBarcode: (product: Omit<Product, 'id'>) => Promise<{ success: boolean; error?: string }>
  }
}

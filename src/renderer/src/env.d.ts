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

interface Window {
  api: {
    createSale: (cart: CartItem[]) => Promise<{ success: boolean; error?: string }>
    getSalesAnalytics: () => Promise<{ success: boolean; data; error?: string }>
    getAllSales: () => Promise<{ success: boolean; data; error?: string }>

    printReceipt: (data) => Promise<{ success: boolean; error?: string }>

    addProduct: (product: Omit<Product, 'id'>) => Promise<{ success: boolean; error?: string }>
    updateProduct: (product: Product) => Promise<{ success: boolean; error?: string }>
    deleteProduct: (id: number) => Promise<{ success: boolean; error?: string }>
    getAllProducts: () => Promise<{ success: boolean; data; error?: string }>
  }
}

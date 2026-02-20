/// <reference types="vite/client" />

import { CartItem, PrintData, Product } from '../../common/types'

declare global {
  interface Window {
    api: {
      createSale: (
        cart: CartItem[],
        discount?: { type: 'percent' | 'fixed'; value: number } | null
      ) => Promise<{ success: boolean; saleId: number; error?: string }>
      getSalesAnalytics: () => Promise<{ success: boolean; data; error?: string }>
      getAllSales: () => Promise<{ success: boolean; data; error?: string }>

      printReceipt: (data: PrintData) => Promise<{ success: boolean; error?: string }>

      addProduct: (product: Omit<Product, 'id'>) => Promise<{ success: boolean; error?: string }>
      updateProduct: (product: Product) => Promise<{ success: boolean; error?: string }>
      deleteProduct: (id: number) => Promise<{ success: boolean; error?: string }>
      getAllProducts: () => Promise<{ success: boolean; data: Product[]; error?: string }>
      saveBarcode: (product: Omit<Product, 'id'>) => Promise<{ success: boolean; error?: string }>

      getProductsPaginated: (params: {
        page: number
        pageSize: number
        searchItem: string
      }) => Promise<{
        success: boolean
        products?: Product[]
        total?: number
        error?: string
      }>

      voidSale: (saleId) => Promise<{ success: boolean; error?: string }>
    }
  }
}

import { contextBridge, ipcRenderer } from 'electron'
import { electronAPI } from '@electron-toolkit/preload'

// Custom APIs for renderer
const api = {
  addProduct: (product) => ipcRenderer.invoke('add-product', product),
  getAllProducts: () => ipcRenderer.invoke('get-all-products'),
  deleteProduct: (id: number) => ipcRenderer.invoke('delete-product', id),
  updateProduct: (product) => ipcRenderer.invoke('update-product', product),
  createSale: (carItems) => ipcRenderer.invoke('create-sale', carItems),
  getSalesAnalytics: () => ipcRenderer.invoke('get-sale-analytics'),
  getAllSales: () => ipcRenderer.invoke('get-all-sales'),
  printReceipt: (data) => ipcRenderer.invoke('print-receipt', data)
}

// Use `contextBridge` APIs to expose Electron APIs to
// renderer only if context isolation is enabled, otherwise
// just add to the DOM global.
if (process.contextIsolated) {
  try {
    contextBridge.exposeInMainWorld('electron', electronAPI)
    contextBridge.exposeInMainWorld('api', api)
  } catch (error) {
    console.error(error)
  }
} else {
  // @ts-ignore (define in dts)
  window.electron = electronAPI
  // @ts-ignore (define in dts)
  window.api = api
}

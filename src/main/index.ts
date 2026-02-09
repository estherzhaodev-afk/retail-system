import 'dotenv/config'
import { app, shell, BrowserWindow, ipcMain } from 'electron'
import { join } from 'path'
import { electronApp, optimizer, is } from '@electron-toolkit/utils'
import icon from '../../resources/icon.png?asset'
import {
  initDB,
  addProduct,
  getAllProducts,
  deleteProduct,
  updateProduct,
  createSale,
  getSalesAnalytics,
  getAllSales
} from './db'

function createWindow(): void {
  // Create the browser window.
  const mainWindow = new BrowserWindow({
    width: 900,
    height: 670,
    show: false,
    autoHideMenuBar: true,
    ...(process.platform === 'linux' ? { icon } : {}),
    webPreferences: {
      preload: join(__dirname, '../preload/index.js'),
      sandbox: false
    }
  })

  mainWindow.on('ready-to-show', () => {
    mainWindow.show()
  })

  mainWindow.webContents.setWindowOpenHandler((details) => {
    shell.openExternal(details.url)
    return { action: 'deny' }
  })

  // HMR for renderer base on electron-vite cli.
  // Load the remote URL for development or the local html file for production.
  if (is.dev && process.env['ELECTRON_RENDERER_URL']) {
    mainWindow.loadURL(process.env['ELECTRON_RENDERER_URL'])
  } else {
    mainWindow.loadFile(join(__dirname, '../renderer/index.html'))
  }
}

// This method will be called when Electron has finished
// initialization and is ready to create browser windows.
// Some APIs can only be used after this event occurs.
app.whenReady().then(() => {
  //for double check new version
  console.log('**************v1.11**************:', new Date())

  // Set app user model id for windows
  electronApp.setAppUserModelId('com.electron')

  //Call the founction
  initDB()

  // Default open or close DevTools by F12 in development
  // and ignore CommandOrControl + R in production.
  // see https://github.com/alex8088/electron-toolkit/tree/master/packages/utils
  app.on('browser-window-created', (_, window) => {
    optimizer.watchWindowShortcuts(window)
  })

  // IPC test
  ipcMain.on('ping', () => console.log('pong'))

  createWindow()

  //get all products
  ipcMain.handle('get-all-products', () => {
    try {
      const data = getAllProducts()
      return { success: true, data }
    } catch (error) {
      console.error('Get product Failure:', error)
      return []
    }
  })

  ipcMain.handle('add-product', (_event, data) => {
    try {
      const id = addProduct(data)
      return { success: true, id: id }
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : 'Unknown error'
      return { success: false, error: message }
    }
  })

  ipcMain.handle('delete-product', (_event, id) => {
    console.log('Delete request, ID:', id)
    try {
      deleteProduct(id)
      return { success: true }
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : 'Unknown error'
      return { success: false, error: message }
    }
  })

  ipcMain.handle('update-product', (_event, product) => {
    try {
      updateProduct(product)
      return { success: true }
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : 'Unknown error'
      return { success: false, error: message }
    }
  })

  ipcMain.handle('create-sale', (_event, cartItems) => {
    console.log('Check out', cartItems.length, 'products')
    try {
      createSale(cartItems)
      return { success: true }
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : 'Unknown error'
      return { success: false, error: message }
    }
  })

  ipcMain.handle('get-sale-analytics', () => {
    try {
      const data = getSalesAnalytics()
      return { success: true, data }
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : 'Unknown error'
      return { success: false, error: message }
    }
  })

  ipcMain.handle('get-all-sales', () => {
    try {
      const data = getAllSales()
      return { success: true, data }
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : 'Unknown error'
      return { success: false, error: message }
    }
  })

  ipcMain.handle('print-receipt', async (_event, saleData) => {
    const { id, items = [], total, time } = saleData

    const storeName = process.env.STORE_NAME || 'My Awesome Shop'
    const storeAddress = process.env.STORE_ADDRESS || 'Portland, OR'
    const storePhone = process.env.STORE_PHONE || ''

    // GET HTML Receipt
    // 58mm paper size
    const receiptHtml = `
    <html>
    <head>
      <style>
        body { font-family: 'Courier New', monospace; font-size: 12px; margin: 0; padding: 10px; width: 100%; }
        .center { text-align: center; }
        .line { border-bottom: 1px dashed #000; margin: 5px 0; }
        .item { display: flex; justify-content: space-between; margin-bottom: 3px; }
        .total { font-size: 16px; font-weight: bold; text-align: right; margin-top: 10px; }
      </style>
    </head>
    <body>
      <div class="center">
        <h3 class="title">${storeName}</h3>
        <div>${storeAddress}</div>
        <div>${storePhone}</div>
        <p>Order #${id}</p>
        <p>${time}</p>
      </div>
      <div class="line"></div>
      
      ${items
        .map(
          (item) => `
        <div class="item">
          <span>${item.name} x${item.quantity}</span>
          <span>$${((item.price * item.quantity) / 100).toFixed(2)}</span>
        </div>
      `
        )
        .join('')}

      <div class="line"></div>
      
      <div class="total">
        TOTAL: $${(total / 100).toFixed(2)}
      </div>
      
      <div class="center" style="margin-top: 20px;">
        Thank you!<br/>
        See you soon.
      </div>
    </body>
    </html>
  `

    const printWindow = new BrowserWindow({
      show: true,
      width: 300,
      height: 400
    })

    printWindow.loadURL('data:text/html;charset=utf-8,' + encodeURIComponent(receiptHtml))

    return new Promise((resolve) => {
      printWindow.webContents.on('did-finish-load', () => {
        printWindow.webContents.print({ silent: false, deviceName: '' }, (success, errorType) => {
          if (!success) console.error('Print Error', errorType)
          printWindow.close()
          resolve({ success })
        })
      })
    })
  })

  app.on('activate', function () {
    // On macOS it's common to re-create a window in the app when the
    // dock icon is clicked and there are no other windows open.
    if (BrowserWindow.getAllWindows().length === 0) createWindow()
  })
})

// Quit when all windows are closed, except on macOS. There, it's common
// for applications and their menu bar to stay active until the user quits
// explicitly with Cmd + Q.
app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit()
  }
})

// In this file you can include the rest of your app's specific main process
// code. You can also put them in separate files and require them here.

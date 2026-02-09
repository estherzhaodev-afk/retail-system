//import { promises } from 'dns'
import { useState, useEffect, useCallback } from 'react'
import { Product } from './types'
import Inventory from './components/Inventory'
import Cashier from './components/Cashier'
import Dashboard from './components/Dashboard'

function App(): React.JSX.Element {
  const [activeTab, setActiveTab] = useState('cashier')

  const [products, setProducts] = useState<Product[]>([])

  const loadProducts = useCallback(async () => {
    try {
      const res = await window.api.getAllProducts()
      if (res.success) {
        setProducts(res.data)
      } else {
        console.error('Failed to load products:', res.error)
      }
    } catch (error) {
      console.error('Load failed', error)
    }
  }, [])

  useEffect(() => {
    const fetchProducts = async (): Promise<void> => {
      await loadProducts()
    }
    fetchProducts()
  }, [])

  return (
    <div
      style={{
        fontFamily: 'sans-serif',
        height: '100vh',
        display: 'flex',
        flexDirection: 'column'
      }}
    >
      <div style={{ background: '#222', padding: '0 20px', display: 'flex', gap: '1px' }}>
        <TabButton
          label="Cashier (Sell)"
          isActive={activeTab === 'cashier'}
          onClick={() => setActiveTab('cashier')}
        />
        <TabButton
          label="Dashboard"
          isActive={activeTab === 'dashboard'}
          onClick={() => setActiveTab('dashboard')}
        />

        <TabButton
          label="Inventory (Manage)"
          isActive={activeTab === 'inventory'}
          onClick={() => setActiveTab('inventory')}
        />
      </div>

      <div style={{ flex: 1, overflow: 'hidden' }}>
        {activeTab === 'dashboard' && <Dashboard />}
        {activeTab === 'inventory' && <Inventory products={products} onRefresh={loadProducts} />}
        {activeTab === 'cashier' && <Cashier products={products} onRefresh={loadProducts} />}
      </div>
    </div>
  )
}

function TabButton({
  label,
  isActive,
  onClick
}: {
  label: string
  isActive: boolean
  onClick: () => void
}): React.JSX.Element {
  return (
    <button
      onClick={onClick}
      style={{
        padding: '15px 30px',
        background: isActive ? '#f0f0f0' : '#444',
        color: isActive ? 'black' : '#ccc',
        border: 'none',
        cursor: 'pointer',
        fontSize: '1em',
        fontWeight: isActive ? 'bold' : 'normal'
      }}
    >
      {label}
    </button>
  )
}

export default App

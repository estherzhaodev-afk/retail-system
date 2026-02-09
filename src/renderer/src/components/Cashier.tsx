import { useState, useEffect, useMemo } from 'react'
import { Product, CartItem } from '../types'

interface CashierProps {
  products: Product[]
  onRefresh: () => void
}

export default function Cashier({ products, onRefresh }: CashierProps): React.JSX.Element {
  const [cart, setCart] = useState<CartItem[]>([])
  const [lastScanned, setLastScanned] = useState<string>('')
  const [searchTerm, setSearchTerm] = useState('')

  const addToCart = (product: Product): void => {
    setCart((prev) => {
      const existing = prev.find((item) => item.id === product.id)
      if (existing) {
        return prev.map((item) =>
          item.id === product.id ? { ...item, quantity: item.quantity + 1 } : item
        )
      }
      return [...prev, { ...product, quantity: 1 }]
    })
  }

  const removeFromCart = (id: number): void => {
    setCart((prev) => prev.filter((item) => item.id !== id))
  }

  const handleCheckOut = async (): Promise<void> => {
    if (cart.length === 0) return

    if (!confirm(`Confirm total payment: $${(total / 100).toFixed(2)}?`)) return

    try {
      const res = await window.api.createSale(cart)
      if (res.success) {
        const shouldPrint = confirm('Transaction Saved! ✅\n\nDo you want to print the receipt?')

        if (shouldPrint) {
          const printData = {
            id: Date.now().toString().slice(-6),
            items: cart,
            total: cart.reduce((sum, i) => sum + i.price * i.quantity, 0),
            time: new Date().toLocaleString('en-US')
          }

          window.api.printReceipt(printData)
        }

        setCart([])
        onRefresh()
      } else {
        alert('Transaction failure:' + res.error)
      }
    } catch (err) {
      console.error(err)
      alert('System Error')
    }
  }

  const filteredProducts = useMemo(() => {
    if (!searchTerm) return products
    const lowerTerm = searchTerm.toLowerCase()
    return products.filter(
      (p) => p.name.toLowerCase().includes(lowerTerm) || p.barcode.includes(lowerTerm)
    )
  }, [products, searchTerm])

  useEffect(() => {
    let buffer = ''
    let lastKeyTime = Date.now()

    const handleKeyDown = (e: KeyboardEvent): void => {
      const currentTime = Date.now()

      if (currentTime - lastKeyTime > 100) {
        buffer = ''
      }
      lastKeyTime = currentTime

      if (e.key === 'Enter') {
        if (buffer.length > 0) {
          console.log('Scanned Barcode:', buffer)

          const foundProduct = products.find((p) => p.barcode === buffer)

          if (foundProduct) {
            addToCart(foundProduct)
            setLastScanned(`✅ Found: ${foundProduct.name}`)
          } else {
            setLastScanned(`❌ Not Found: ${buffer}`)
          }

          buffer = ''
        }
      } else if (e.key.length === 1) {
        buffer += e.key
      }
    }

    window.addEventListener('keydown', handleKeyDown)

    return () => {
      window.removeEventListener('keydown', handleKeyDown)
    }
  }, [products])

  const total = cart.reduce((sum, item) => sum + item.price * item.quantity, 0)

  return (
    <div style={{ display: 'flex', height: '100%' }}>
      {/* Left: products*/}
      <div style={{ flex: 1, padding: '20px', overflowY: 'auto', background: '#f8f9fa' }}>
        <h2>Menu</h2>
        <div style={{ marginBottom: '20px' }}>
          {/* Search*/}
          <input
            type="text"
            placeholder="🔍 Manual Lookup (Name/Barcode)..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            style={{
              width: '100%',
              padding: '12px',
              fontSize: '1.1em',
              borderRadius: '8px',
              border: '1px solid #ccc',
              marginBottom: '10px'
            }}
          />
          <div style={{ color: '#666', fontSize: '0.9em' }}>
            Showing {filteredProducts.length} products
          </div>
        </div>

        <span style={{ color: lastScanned.includes('❌') ? 'red' : 'green', fontWeight: 'bold' }}>
          {lastScanned}
        </span>
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fill, minmax(120px, 1fr))',
            gap: '15px'
          }}
        >
          {filteredProducts.map((p) => (
            <button
              key={p.id}
              onClick={() => addToCart(p)}
              style={{
                padding: '15px',
                border: '1px solid #ddd',
                borderRadius: '8px',
                background: 'white',
                cursor: 'pointer',
                display: 'flex',
                flexDirection: 'column',
                gap: '5px',
                color: '#333'
              }}
            >
              <strong style={{ fontSize: '1.1em' }}>{p.name}</strong>
              <span style={{ color: '#007bff' }}>${(p.price / 100).toFixed(2)}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Right: Shopping Cart*/}
      <div
        style={{
          width: '350px',
          background: 'white',
          borderLeft: '1px solid #ddd',
          display: 'flex',
          flexDirection: 'column'
        }}
      >
        <div style={{ padding: '20px', background: '#333', color: 'white' }}>
          <h2>Current Order</h2>
        </div>

        {/* Shopping List */}
        <div style={{ flex: 1, overflowY: 'auto', padding: '20px' }}>
          {cart.length === 0 ? (
            <p style={{ color: '#999' }}>Cart is empty</p>
          ) : (
            cart.map((item) => (
              <div
                key={item.id}
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  marginBottom: '15px',
                  borderBottom: '1px solid #060606',
                  paddingBottom: '10px'
                }}
              >
                <div>
                  <div style={{ fontWeight: 'bold', color: 'black' }}>{item.name}</div>
                  <small style={{ color: '#050404' }}>
                    ${(item.price / 100).toFixed(2)} x {item.quantity}
                  </small>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                  <strong>${((item.price * item.quantity) / 100).toFixed(2)}</strong>
                  <button
                    onClick={() => removeFromCart(item.id)}
                    style={{ color: 'red', border: 'none', background: 'none', cursor: 'pointer' }}
                  >
                    ×
                  </button>
                </div>
              </div>
            ))
          )}
        </div>

        {/* Check Out */}
        <div
          style={{
            padding: '20px',
            borderTop: '2px solid #eee',
            background: '#f8f9fa',
            color: '#333'
          }}
        >
          <div
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              fontSize: '1.5em',
              fontWeight: 'bold',
              marginBottom: '15px'
            }}
          >
            <span style={{ color: 'black' }}>Total:</span>
            <span style={{ color: 'black' }}>${(total / 100).toFixed(2)}</span>
          </div>
          <button
            style={{
              width: '100%',
              padding: '15px',
              background: '#28a745',
              color: 'white',
              border: 'none',
              borderRadius: '5px',
              fontSize: '1.2em',
              cursor: 'pointer'
            }}
            onClick={handleCheckOut}
          >
            Checkout
          </button>
        </div>
      </div>
    </div>
  )
}

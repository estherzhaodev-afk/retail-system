import { useState, useRef, useMemo } from 'react'
import { Product } from '../types'

interface InventoryProps {
  products: Product[]
  onRefresh: () => void
}

export default function Inventory({ products, onRefresh }: InventoryProps): React.JSX.Element {
  const [barcode, setBarcode] = useState('')
  const [name, setName] = useState('')
  const [price, setPrice] = useState('')
  const [stock, setStock] = useState('1')
  const [detail, setDetail] = useState('')
  const [editingId, setEditingId] = useState<number | null>(null)
  const [message, setMessage] = useState('')
  const [searchTerm, setSearchTerm] = useState('')

  const nameInputRef = useRef<HTMLInputElement>(null)

  const handleEditClick = (product: Product): void => {
    setEditingId(product.id)
    setBarcode(product.barcode || '')
    setName(product.name)
    setPrice((product.price / 100).toFixed(2))
    setStock(product.stock.toString())
    setDetail(product.detail)
  }

  const handleCancelEdit = (): void => {
    setEditingId(null)
    setBarcode('')
    setName('')
    setPrice('')
    setStock('1')
    setDetail('')
    setMessage('')
  }

  const handleDelete = async (id: number): Promise<void> => {
    if (!confirm('Are you sure?')) return

    const res = await window.api.deleteProduct(id)
    if (res.success) {
      onRefresh()
    }
  }

  const handleSubmit = async (e): Promise<void> => {
    e.preventDefault()

    let finalBarcode = barcode
    if (!finalBarcode || finalBarcode.trim() === '') {
      finalBarcode = `SN${Date.now().toString().slice(-10)}`
      setBarcode(finalBarcode)
    }

    const priceInCents = Math.round(parseFloat(price) * 100)
    const productData = {
      barcode: finalBarcode,
      name,
      price: priceInCents,
      stock: parseInt(stock),
      detail
    }

    try {
      if (!editingId) {
        const fileRes = await window.api.saveBarcode(productData)

        if (!fileRes || !fileRes.success) return
      }

      let res
      if (editingId) {
        res = await window.api.updateProduct({ ...productData, id: editingId })
      } else {
        res = await window.api.addProduct(productData)
      }

      if (res.success) {
        setMessage(editingId ? 'Updated!' : 'Added!')
        handleCancelEdit()
        onRefresh()
      } else {
        setMessage('Error: ' + res.error)
      }
    } catch (err) {
      console.error('Save failed:', err)
      setMessage('Save failed.')
    }
  }

  const handleBarcodeKeyDown = (e: React.KeyboardEvent): void => {
    if (e.key === 'Enter') {
      e.preventDefault()

      const existing = products.find((p) => p.barcode === barcode)
      if (existing && !editingId) {
        if (confirm(`Product "${existing.name}" already exists. Edit it?`)) {
          handleEditClick(existing)
        } else {
          setBarcode('')
        }
      } else {
        nameInputRef.current?.focus()
      }
    }
  }

  const filteredProducts = useMemo(() => {
    if (!searchTerm) return products
    const lowerTerm = searchTerm.toLowerCase()
    return products.filter(
      (p) => p.name.toLowerCase().includes(lowerTerm) || p.barcode.includes(lowerTerm)
    )
  }, [products, searchTerm])

  return (
    <div style={{ display: 'flex', gap: '20px', padding: '20px', height: '100%' }}>
      {/* LEFT */}
      <div style={{ width: '300px', borderRight: '1px solid #ddd', paddingRight: '20px' }}>
        <h2 style={{ color: editingId ? 'orange' : '#333' }}>
          {editingId ? 'Edit Product' : 'Add Product'}
        </h2>
        <form
          onSubmit={handleSubmit}
          style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}
        >
          {/* Barcode Input */}
          <input
            placeholder="Barcode (Scan here)"
            value={barcode}
            onChange={(e) => setBarcode(e.target.value)}
            onKeyDown={handleBarcodeKeyDown}
            autoFocus
            style={{ background: '#f0f0f0' }}
          />
          <input
            ref={nameInputRef}
            placeholder="Name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            required
          />
          <input
            placeholder="Price"
            type="number"
            step="0.01"
            value={price}
            onChange={(e) => setPrice(e.target.value)}
            required
          />
          <input
            placeholder="Stock"
            type="number"
            value={stock}
            onChange={(e) => setStock(e.target.value)}
          />
          <textarea
            placeholder="Detail"
            value={detail}
            onChange={(e) => setDetail(e.target.value)}
          />

          <button
            type="submit"
            style={{
              padding: '10px',
              background: editingId ? 'orange' : '#007bff',
              color: 'white',
              border: 'none'
            }}
          >
            {editingId ? 'Update' : 'Save'}
          </button>
          {editingId && (
            <button type="button" onClick={handleCancelEdit}>
              Cancel
            </button>
          )}
        </form>
        {message && <p style={{ color: 'green' }}>{message}</p>}
      </div>

      {/* RIGHT */}
      <div style={{ flex: 1, overflowY: 'auto' }}>
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            marginBottom: '10px'
          }}
        >
          <h2>Inventory Total: {products.length}</h2>
          <input
            type="text"
            placeholder="🔍 Search name or barcode..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            style={{
              padding: '8px',
              width: '250px',
              borderRadius: '5px',
              border: '1px solid #ccc'
            }}
          />
        </div>
        <table style={{ width: '100%', textAlign: 'left', borderCollapse: 'collapse' }}>
          <thead>
            <tr style={{ borderBottom: '2px solid #ccc' }}>
              <th>Name</th>
              <th>Price</th>
              <th>Stock</th>
              <th>Action</th>
            </tr>
          </thead>
          <tbody>
            {filteredProducts.map((p) => (
              <tr key={p.id} style={{ borderBottom: '1px solid #eee' }}>
                <td>
                  {p.name} <br />
                  <small style={{ color: '#999' }}>{p.barcode}</small>
                </td>

                <td>${(p.price / 100).toFixed(2)}</td>
                <td>{p.stock}</td>

                <td style={{ verticalAlign: 'middle' }}>
                  <div style={{ display: 'flex', gap: '10px' }}>
                    <button
                      onClick={() => handleEditClick(p)}
                      style={{
                        width: '60px',
                        textAlign: 'center',
                        padding: '6px 0',
                        fontSize: '13px',
                        backgroundColor: 'white',
                        border: '1px solid #d1d5db',
                        borderRadius: '6px',
                        color: '#374151',
                        cursor: 'pointer',
                        fontWeight: '500'
                      }}
                    >
                      Edit
                    </button>

                    <button
                      onClick={() => handleDelete(p.id)}
                      style={{
                        width: '60px',
                        textAlign: 'center',
                        padding: '6px 0',
                        fontSize: '13px',
                        backgroundColor: '#fee2e2',
                        border: '1px solid #fecaca',
                        borderRadius: '6px',
                        color: '#ef4444',
                        cursor: 'pointer',
                        fontWeight: '500'
                      }}
                    >
                      Delete
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}

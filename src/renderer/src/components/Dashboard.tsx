import { useState, useEffect } from 'react'
import { AnalyticsData, Sale } from '../../../common/types'

export default function Dashboard(): React.JSX.Element {
  const [data, setData] = useState<AnalyticsData | null>(null)

  //load data
  useEffect(() => {
    const loadData = async (): Promise<void> => {
      const res = await window.api.getSalesAnalytics()
      if (res.success) {
        setData(res.data)
      }
    }
    loadData()
  }, [])

  const handleExport = async (): Promise<void> => {
    if (!confirm('Download full sales history?')) return

    const res = await window.api.getAllSales()

    if (!res.success) {
      console.error('Back End Failure:', res.error)
      alert('Export Failed: ' + res.error)
      return
    }

    const sales = res.data

    let csvContent = 'Order ID,Date,Time,Product Name,Quantity,Unit Price,Line Total\n'

    sales.forEach((sale) => {
      const items = JSON.parse(sale.items_json)

      const dateObj = new Date(sale.created_at.replace(' ', 'T') + 'Z')
      const dateStr = dateObj.toLocaleDateString()
      const timeStr = dateObj.toLocaleTimeString()

      items.forEach((item) => {
        const row = [
          sale.id,
          `"${dateStr}"`,
          `"${timeStr}"`,
          `"${item.name}"`,
          item.quantity,
          (item.price / 100).toFixed(2),
          ((item.price * item.quantity) / 100).toFixed(2)
        ]
        csvContent += row.join(',') + '\n'
      })
    })

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' })
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.setAttribute('href', url)
    link.setAttribute('download', `Sales_Export_${new Date().toISOString().slice(0, 10)}.csv`)
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
  }

  const handleReprint = async (sale: Sale): Promise<void> => {
    const items = JSON.parse(sale.items_json)
    const saleData = {
      id: sale.id,
      items: items.map((i) => ({
        name: i.name,
        quantity: i.quantity,
        price: i.price
      })),
      discount: sale.discount || undefined,
      total: sale.total_price,
      time: new Date(sale.created_at.replace(' ', 'T') + 'Z').toLocaleString()
    }

    const res = await window.api.printReceipt(saleData)
    if (!res.success) {
      alert('Print failed!')
    }
  }

  const handleVoid = async (saleId: number): Promise<void> => {
    if (!confirm('Are you sure you want to VOID Order #${saleId}')) {
      return
    }

    const res = await window.api.voidSale(saleId)
    if (res.success) {
      alert('Order Voided Successfully!')
    } else {
      alert('Failed:' + res.error)
    }

    if (!data) return

    const voidedSale = data.recentSales.find((s) => s.id === saleId)
    if (!voidedSale) return

    setData({
      todayRevenue: data.todayRevenue - voidedSale.total_price,
      todayOrders: data.todayOrders - 1,
      recentSales: data.recentSales.map((s) => (s.id === saleId ? { ...s, status: 'VOID' } : s))
    })
  }

  if (!data) return <div style={{ padding: '20px' }}>Loading...</div>

  return (
    <div
      style={{
        padding: '20px',
        height: '100%',
        overflowY: 'auto',
        background: '#f4f6f9',
        color: '#333'
      }}
    >
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginBottom: '20px'
        }}
      >
        <h2>Dashboard</h2>
        <button
          onClick={handleExport}
          style={{
            padding: '10px 20px',
            background: '#28a745',
            color: 'white',
            border: 'none',
            borderRadius: '5px',
            cursor: 'pointer',
            fontWeight: 'bold'
          }}
        >
          📥 Export to Excel
        </button>
      </div>

      {/* TOP*/}
      <div style={{ display: 'flex', gap: '20px', marginBottom: '30px' }}>
        {/* ~ */}
        <div
          style={{
            flex: 1,
            background: 'white',
            padding: '20px',
            borderRadius: '10px',
            boxShadow: '0 2px 5px rgba(0,0,0,0.05)'
          }}
        >
          <div style={{ color: '#777', fontSize: '0.9em' }}>Today&apos;s Orders</div>
          <div style={{ fontSize: '2em', fontWeight: 'bold', color: '#28a745', marginTop: '5px' }}>
            ${(data.todayRevenue / 100).toFixed(2)}
          </div>
        </div>

        {/* ~*/}
        <div
          style={{
            flex: 1,
            background: 'white',
            padding: '20px',
            borderRadius: '10px',
            boxShadow: '0 2px 5px rgba(0,0,0,0.05)'
          }}
        >
          <div style={{ color: '#777', fontSize: '0.9em' }}> Today’s Orders</div>
          <div style={{ fontSize: '2em', fontWeight: 'bold', color: '#007bff', marginTop: '5px' }}>
            {data.todayOrders}
          </div>
        </div>
      </div>

      {/* ~*/}
      <h3 style={{ marginBottom: '15px' }}>Recent Transactions</h3>
      <div
        style={{
          background: 'white',
          borderRadius: '10px',
          overflow: 'hidden',
          boxShadow: '0 2px 5px rgba(0,0,0,0.05)'
        }}
      >
        <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
          <thead style={{ background: '#f8f9fa', borderBottom: '2px solid #eee' }}>
            <tr>
              <th style={{ padding: '15px' }}>ID</th>
              <th style={{ padding: '15px' }}>Time</th>
              <th style={{ padding: '15px' }}>Items</th>
              <th style={{ padding: '15px' }}>Total</th>
            </tr>
          </thead>
          <tbody>
            {data.recentSales.map((sale: Sale) => {
              const items = JSON.parse(sale.items_json)

              const utcString = sale.created_at.replace(' ', 'T') + 'Z'
              const time = new Date(utcString).toLocaleString('en-US', {
                hour12: true,
                year: 'numeric',
                month: 'numeric',
                day: 'numeric',
                hour: 'numeric',
                minute: 'numeric'
              })
              const isVoid = sale.status === 'VOID'
              return (
                <tr
                  key={sale.id}
                  style={{
                    borderBottom: '1px solid #eee',
                    textDecoration: isVoid ? 'line-through' : 'none'
                  }}
                >
                  <td style={{ padding: '15px', color: '#999' }}>#{sale.id}</td>
                  <td style={{ padding: '15px' }}>{time}</td>

                  <td style={{ padding: '15px' }}>
                    {items.map((i) => (
                      <span
                        key={i.id}
                        style={{
                          display: 'inline-block',
                          background: '#eee',
                          padding: '2px 6px',
                          borderRadius: '4px',
                          fontSize: '0.85em',
                          marginRight: '5px'
                        }}
                      >
                        {i.name} x{i.quantity}
                      </span>
                    ))}
                  </td>
                  <td
                    style={{
                      padding: '15px',
                      fontWeight: 'bold'
                    }}
                  >
                    <div
                      style={{
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center'
                      }}
                    >
                      <span>${(sale.total_price / 100).toFixed(2)}</span>
                      <button
                        style={{
                          marginLeft: '10px',
                          padding: '5px 10px',
                          background: '#007bff',
                          color: 'white',
                          border: 'none',
                          borderRadius: '4px',
                          cursor: 'pointer',
                          fontSize: '0.8em'
                        }}
                        onClick={() => handleReprint(sale)}
                      >
                        Reprint
                      </button>
                      {sale.status !== 'VOID' && (
                        <button
                          className="text-red-600 hover:underline font-medium"
                          onClick={() => handleVoid(sale.id)}
                        >
                          Void
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
        {data.recentSales.length === 0 && (
          <div style={{ padding: '20px', textAlign: 'center', color: '#999' }}>No sales yet.</div>
        )}
      </div>
    </div>
  )
}

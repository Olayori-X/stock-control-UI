'use client'

import { useEffect, useState } from 'react'
import { AlertTriangle, Check, Search } from 'lucide-react'
import type { Session } from '@/lib/auth'
import { getSales, type Sale, type SalesFilters } from '@/lib/api'
import { Status } from '@/components/dashboard/Status'

function todayISO(): string {
  return new Date().toISOString().slice(0, 10)
}

function daysAgoISO(days: number): string {
  const d = new Date()
  d.setDate(d.getDate() - days)
  return d.toISOString().slice(0, 10)
}

export function SalesReport({ session }: { session: Session }) {
  const [from, setFrom] = useState(daysAgoISO(7))
  const [to, setTo] = useState(todayISO())
  const [associateId, setAssociateId] = useState('')
  const [outletId, setOutletId] = useState('')
  const [sku, setSku] = useState('')

  const [sales, setSales] = useState<Sale[]>([])
  const [totalQuantity, setTotalQuantity] = useState(0)
  const [totalValue, setTotalValue] = useState(0)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    load()
  }, [session])

  async function load() {
    setLoading(true)
    setError(null)
    const filters: SalesFilters = {
      from, to,
      salesAssociateId: associateId || undefined,
      outletId: outletId || undefined,
      sku: sku || undefined,
    }
    try {
      const result = await getSales(session, filters)
      setSales(result.sales ?? [])
      setTotalQuantity(result.total_quantity)
      setTotalValue(result.total_value)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load sales')
    } finally {
      setLoading(false)
    }
  }

  function handleFilterSubmit(e: React.FormEvent) {
    e.preventDefault()
    load()
  }

  return (
    <section className="panel activity-panel">
      <form onSubmit={handleFilterSubmit} className="form-grid" style={{ marginBottom: 20 }}>
        <label>From<input type="date" value={from} onChange={(e) => setFrom(e.target.value)} /></label>
        <label>To<input type="date" value={to} onChange={(e) => setTo(e.target.value)} /></label>
        <label>Sales associate ID<input value={associateId} onChange={(e) => setAssociateId(e.target.value)} placeholder="Optional" /></label>
        <label>Outlet ID<input value={outletId} onChange={(e) => setOutletId(e.target.value)} placeholder="Optional" /></label>
        <label>SKU<input value={sku} onChange={(e) => setSku(e.target.value)} placeholder="Optional" /></label>
        <div className="modal-actions" style={{ gridColumn: 'span 2', justifyContent: 'flex-start', marginTop: 0 }}>
          <button type="submit" className="primary-button"><Search size={16} /> Apply filters</button>
        </div>
      </form>

      {!loading && !error && sales.length > 0 && (
        <div className="metric-grid" style={{ gridTemplateColumns: 'repeat(2, 1fr)', marginBottom: 20 }}>
          <div className="metric-card">
            <p>Total quantity sold</p>
            <strong>{totalQuantity.toLocaleString()}</strong>
          </div>
          <div className="metric-card">
            <p>Total sales value</p>
            <strong>{totalValue.toLocaleString(undefined, { style: 'currency', currency: 'NGN' })}</strong>
          </div>
        </div>
      )}

      {loading && <div className="empty-state"><p>Loading…</p></div>}
      {!loading && error && (
        <div className="empty-state"><AlertTriangle size={18} /><strong>Couldn&apos;t load sales</strong><p>{error}</p></div>
      )}
      {!loading && !error && sales.length === 0 && (
        <div className="empty-state"><Check size={18} /><strong>No sales found</strong><p>Try widening the date range or clearing filters.</p></div>
      )}
      {!loading && !error && sales.length > 0 && (
        <div className="table-wrap">
          <table>
            <thead>
              <tr>
                <th>Transaction</th><th>Associate</th><th>Outlet</th><th>SKU</th>
                <th>Qty</th><th>Value</th><th>Geofence</th><th>Date</th>
              </tr>
            </thead>
            <tbody>
              {sales.map((s) => (
                <tr key={s.transaction_id}>
                  <td className="muted-cell">{s.transaction_id.slice(0, 12)}</td>
                  <td>{s.sales_associate_id}</td>
                  <td>{s.outlet_id}</td>
                  <td><strong>{s.sku}</strong></td>
                  <td>{s.quantity}</td>
                  <td>{s.total_value.toLocaleString(undefined, { style: 'currency', currency: 'NGN' })}</td>
                  <td><Status value={s.geofence_status} tone={s.geofence_status === 'PASS' ? 'success' : 'danger'} /></td>
                  <td className="muted-cell">{new Date(s.created_at).toLocaleString()}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </section>
  )
}
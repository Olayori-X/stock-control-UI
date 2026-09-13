'use client'

import { useEffect, useState } from 'react'
import { AlertTriangle, Check, FileCheck } from 'lucide-react'
import type { Session } from '@/lib/auth'
import { getReceipts, type Receipt } from '@/lib/api'

export function ReceiptsSection({ session }: { session: Session }) {
  const [receipts, setReceipts] = useState<Receipt[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    load()
  }, [session])

  async function load() {
    setLoading(true)
    setError(null)
    try {
      setReceipts(await getReceipts(session))
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load receipts')
    } finally {
      setLoading(false)
    }
  }

  return (
    <section className="panel activity-panel" style={{ marginTop: 20 }}>
      <div className="panel-heading">
        <div><h2><FileCheck size={14} style={{ marginRight: 6, verticalAlign: -2 }} />Payment history</h2><p>Receipts for payments you&apos;ve recorded against invoices.</p></div>
      </div>

      {loading && <div className="empty-state"><p>Loading…</p></div>}
      {!loading && error && (
        <div className="empty-state"><AlertTriangle size={18} /><strong>Couldn&apos;t load receipts</strong><p>{error}</p></div>
      )}
      {!loading && !error && receipts.length === 0 && (
        <div className="empty-state"><Check size={18} /><strong>No payments recorded yet</strong><p>Receipts will appear here once you record a payment.</p></div>
      )}
      {!loading && !error && receipts.length > 0 && (
        <div className="table-wrap">
          <table>
            <thead><tr><th>Receipt</th><th>Invoice</th><th>Amount paid</th><th>Paid on</th></tr></thead>
            <tbody>
              {receipts.map((r) => (
                <tr key={r.receipt_id}>
                  <td><strong>{r.receipt_id}</strong></td>
                  <td>{r.invoice_id}</td>
                  <td>{r.amount_paid.toLocaleString(undefined, { style: 'currency', currency: 'NGN' })}</td>
                  <td className="muted-cell">{new Date(r.paid_at).toLocaleString()}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </section>
  )
}
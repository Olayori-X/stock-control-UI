'use client'

import { useEffect, useState } from 'react'
import { AlertTriangle, Check, ReceiptText } from 'lucide-react'
import type { Session } from '@/lib/auth'
import { getOutstandingInvoices, type Invoice } from '@/lib/api'
import { Status } from './Status'
import { RecordPaymentModal } from './RecordPaymentModal'

const statusLabel: Record<Invoice['status'], string> = {
  open: 'Open',
  paid: 'Paid',
  overdue: 'Overdue',
}

const statusTone: Record<Invoice['status'], 'success' | 'warning' | 'danger'> = {
  open: 'warning',
  paid: 'success',
  overdue: 'danger',
}

export function InvoicesSection({ session, onPaymentRecorded }: { 
    session: Session,
    onPaymentRecorded: () => void,
}) {
  const [invoices, setInvoices] = useState<Invoice[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [payingInvoice, setPayingInvoice] = useState<Invoice | null>(null)

  useEffect(() => {
    load()
  }, [session])

  async function load() {
    setLoading(true)
    setError(null)
    try {
      setInvoices(await getOutstandingInvoices(session))
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load invoices')
    } finally {
      setLoading(false)
    }
  }

  function handlePaid(updated: Invoice) {
    setInvoices((prev) =>
      updated.outstanding_value <= 0
        ? prev.filter((inv) => inv.invoice_id !== updated.invoice_id)
        : prev.map((inv) => (inv.invoice_id === updated.invoice_id ? updated : inv))
    )
    onPaymentRecorded?.()
  }

  return (
    <section className="panel activity-panel" style={{ marginTop: 20 }}>
      <div className="panel-heading">
        <div><h2><ReceiptText size={14} style={{ marginRight: 6, verticalAlign: -2 }} />Outstanding invoices</h2><p>Invoices generated when you confirm a pickup request.</p></div>
      </div>

      {loading && <div className="empty-state"><p>Loading…</p></div>}
      {!loading && error && (
        <div className="empty-state"><AlertTriangle size={18} /><strong>Couldn&apos;t load invoices</strong><p>{error}</p></div>
      )}
      {!loading && !error && invoices.length === 0 && (
        <div className="empty-state"><Check size={18} /><strong>Nothing outstanding</strong><p>All your invoices are settled.</p></div>
      )}
      {!loading && !error && invoices.length > 0 && (
        <div className="table-wrap">
          <table>
            <thead><tr><th>Invoice</th><th>Total</th><th>Outstanding</th><th>Due</th><th>Status</th><th /></tr></thead>
            <tbody>
              {invoices.map((inv) => (
                <tr key={inv.invoice_id}>
                  <td><strong>{inv.invoice_id}</strong></td>
                  <td>{inv.total_value.toLocaleString(undefined, { style: 'currency', currency: 'NGN' })}</td>
                  <td>{inv.outstanding_value.toLocaleString(undefined, { style: 'currency', currency: 'NGN' })}</td>
                  <td className="muted-cell">{new Date(inv.due_at).toLocaleDateString()}</td>
                  <td><Status value={statusLabel[inv.status]} tone={statusTone[inv.status]} /></td>
                  <td>
                    <button className="text-button" onClick={() => setPayingInvoice(inv)}>Record payment</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {payingInvoice && (
        <RecordPaymentModal session={session} invoice={payingInvoice} onClose={() => setPayingInvoice(null)} onPaid={handlePaid} />
      )}
    </section>
  )
}
'use client'

import { useState } from 'react'
import { AlertTriangle, Check, X } from 'lucide-react'
import type { Session } from '@/lib/auth'
import { recordPayment, type Invoice } from '@/lib/api'

export function RecordPaymentModal({
  session,
  invoice,
  onClose,
  onPaid,
}: {
  session: Session
  invoice: Invoice
  onClose: () => void
  onPaid: (updated: Invoice) => void
}) {
  const [amount, setAmount] = useState(invoice.outstanding_value.toString())
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError(null)

    const parsed = parseFloat(amount)
    if (isNaN(parsed) || parsed <= 0) {
      setError('Enter a valid amount greater than 0.')
      return
    }
    if (parsed > invoice.outstanding_value) {
      setError(`Amount can't exceed the outstanding balance (${invoice.outstanding_value.toLocaleString(undefined, { style: 'currency', currency: 'NGN' })}).`)
      return
    }

    setSubmitting(true)
    try {
      const result = await recordPayment(session, invoice.invoice_id, parsed)
      onPaid(result.invoice)
      onClose()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to record payment')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="modal-backdrop" role="presentation">
      <section className="modal" role="dialog" aria-modal="true" aria-labelledby="payment-title" style={{ maxWidth: 420 }}>
        <div className="modal-heading">
          <div><span className="eyebrow">{invoice.invoice_id}</span><h2 id="payment-title">Record a payment</h2></div>
          <button className="icon-button" onClick={onClose} aria-label="Close dialog"><X size={18} /></button>
        </div>

        <p style={{ fontSize: 12, color: 'var(--muted)', marginBottom: 16 }}>
          Outstanding balance: <strong style={{ color: 'var(--foreground)' }}>
            {invoice.outstanding_value.toLocaleString(undefined, { style: 'currency', currency: 'NGN' })}
          </strong>
        </p>

        <form onSubmit={handleSubmit}>
          <label style={{ display: 'flex', flexDirection: 'column', gap: 7, fontSize: 11, fontWeight: 700, color: '#5f6c66' }}>
            Amount to pay
            <input
              type="number"
              step="0.01"
              min="0"
              max={invoice.outstanding_value}
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              required
            />
          </label>

          {error && <div className="empty-state" style={{ marginTop: 14 }}><AlertTriangle size={18} /><p>{error}</p></div>}

          <div className="modal-actions">
            <button type="button" className="secondary-button" onClick={onClose}>Cancel</button>
            <button type="submit" className="primary-button" disabled={submitting}>
              {submitting ? 'Recording…' : <><Check size={16} /> Record payment</>}
            </button>
          </div>
        </form>
      </section>
    </div>
  )
}
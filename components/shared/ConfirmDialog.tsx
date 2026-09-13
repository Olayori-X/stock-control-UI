'use client'

import { AlertTriangle, X } from 'lucide-react'

export function ConfirmDialog({
  title,
  message,
  confirmLabel = 'Confirm',
  destructive = false,
  onConfirm,
  onCancel,
}: {
  title: string
  message: string
  confirmLabel?: string
  destructive?: boolean
  onConfirm: () => void
  onCancel: () => void
}) {
  return (
    <div className="modal-backdrop" role="presentation">
      <section className="modal" role="alertdialog" aria-modal="true" aria-labelledby="confirm-title" style={{ maxWidth: 400 }}>
        <div className="modal-heading">
          <div><span className="eyebrow">{destructive ? 'CONFIRM' : 'PLEASE CONFIRM'}</span><h2 id="confirm-title">{title}</h2></div>
          <button className="icon-button" onClick={onCancel} aria-label="Cancel"><X size={18} /></button>
        </div>

        {destructive && (
          <div className="auth-note" style={{ marginBottom: 16 }}>
            <AlertTriangle size={16} />
            <span>{message}</span>
          </div>
        )}
        {!destructive && <p style={{ fontSize: 13, color: 'var(--muted)', marginBottom: 20 }}>{message}</p>}

        <div className="modal-actions">
          <button className="secondary-button" onClick={onCancel}>Cancel</button>
          <button className="primary-button" onClick={onConfirm}>{confirmLabel}</button>
        </div>
      </section>
    </div>
  )
}
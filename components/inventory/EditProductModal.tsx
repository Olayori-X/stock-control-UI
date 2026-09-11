'use client'

import { AlertTriangle, X } from 'lucide-react'
import type { Product } from '@/lib/api'

export function EditProductModal({
  product,
  name,
  saving,
  error,
  onNameChange,
  onSave,
  onClose,
}: {
  product: Product
  name: string
  saving: boolean
  error: string | null
  onNameChange: (v: string) => void
  onSave: () => void
  onClose: () => void
}) {
  return (
    <div className="modal-backdrop" role="presentation">
      <section className="modal" role="dialog" aria-modal="true" aria-labelledby="edit-product-title">
        <div className="modal-heading">
          <div><span className="eyebrow">{product.sku}</span><h2 id="edit-product-title">Edit product</h2></div>
          <button className="icon-button" onClick={onClose} aria-label="Close dialog"><X size={18} /></button>
        </div>
        <div className="form-grid">
          <label>Name<input value={name} onChange={(e) => onNameChange(e.target.value)} /></label>
          {error && <div className="empty-state"><AlertTriangle size={18} /><p>{error}</p></div>}
        </div>
        <div className="modal-actions">
          <button className="secondary-button" onClick={onClose}>Cancel</button>
          <button className="primary-button" onClick={onSave} disabled={saving}>{saving ? 'Saving…' : 'Save changes'}</button>
        </div>
      </section>
    </div>
  )
}
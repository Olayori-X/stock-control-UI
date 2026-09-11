'use client'

import { AlertTriangle, X } from 'lucide-react'

export function AddProductModal({
  sku,
  name,
  saving,
  error,
  onSkuChange,
  onNameChange,
  onSubmit,
  onClose,
}: {
  sku: string
  name: string
  saving: boolean
  error: string | null
  onSkuChange: (v: string) => void
  onNameChange: (v: string) => void
  onSubmit: (e: React.FormEvent) => void
  onClose: () => void
}) {
  return (
    <div className="modal-backdrop" role="presentation">
      <section className="modal" role="dialog" aria-modal="true" aria-labelledby="add-product-title">
        <div className="modal-heading">
          <div><span className="eyebrow">NEW PRODUCT</span><h2 id="add-product-title">Add a product</h2></div>
          <button className="icon-button" onClick={onClose} aria-label="Close dialog"><X size={18} /></button>
        </div>
        <form onSubmit={onSubmit} className="form-grid">
          <label>SKU<input required value={sku} onChange={(e) => onSkuChange(e.target.value)} placeholder="e.g. SKU-1042" /></label>
          <label>Name<input required value={name} onChange={(e) => onNameChange(e.target.value)} placeholder="e.g. Stainless Water Bottle" /></label>
          {error && <div className="empty-state"><AlertTriangle size={18} /><p>{error}</p></div>}
          <div className="modal-actions">
            <button type="button" className="secondary-button" onClick={onClose}>Cancel</button>
            <button type="submit" className="primary-button" disabled={saving}>{saving ? 'Adding…' : 'Add product'}</button>
          </div>
        </form>
      </section>
    </div>
  )
}
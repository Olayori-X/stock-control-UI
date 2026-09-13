'use client'

import { useEffect, useState } from 'react'
import { AlertTriangle, Check, X } from 'lucide-react'
import type { Session } from '@/lib/auth'
import { createPickupRequest, getProducts, type DistributorSearchResult, type PickupRequest, type Product } from '@/lib/api'
import { DistributorPicker } from '@/components/shared/DistributorPicker'

export function NewPickupModal({
  session,
  onClose,
  onCreated,
}: {
  session: Session
  onClose: () => void
  onCreated: (req: PickupRequest) => void
}) {
  const [selectedDistributor, setSelectedDistributor] = useState<DistributorSearchResult | null>(null)

  const [products, setProducts] = useState<Product[]>([])
  const [loadingProducts, setLoadingProducts] = useState(true)
  const [productsError, setProductsError] = useState<string | null>(null)
  const [quantities, setQuantities] = useState<Record<string, number>>({})

  const [submitting, setSubmitting] = useState(false)
  const [formError, setFormError] = useState<string | null>(null)

  // Load the product catalog once, on open.
  useEffect(() => {
    let cancelled = false
    setLoadingProducts(true)
    getProducts(session)
      .then((result) => { if (!cancelled) setProducts(result ?? []) })
      .catch((err) => { if (!cancelled) setProductsError(err instanceof Error ? err.message : 'Failed to load products') })
      .finally(() => { if (!cancelled) setLoadingProducts(false) })
    return () => { cancelled = true }
  }, [session])

  function setQuantity(sku: string, value: number) {
    setQuantities((prev) => ({ ...prev, [sku]: Math.max(0, value) }))
  }

  const selectedProducts = products
    .filter((p) => (quantities[p.sku] ?? 0) > 0)
    .map((p) => ({ sku: p.sku, name: p.name, quantity: quantities[p.sku] }))

  async function handleSubmit() {
    setFormError(null)
    if (!selectedDistributor) {
      setFormError('Select a distributor for this pickup.')
      return
    }
    if (selectedProducts.length === 0) {
      setFormError('Add at least one product with a quantity.')
      return
    }
    setSubmitting(true)
    try {
      const created = await createPickupRequest(session, {
        distributor_id: selectedDistributor.user_id,
        products: selectedProducts,
      })
      onCreated(created)
      onClose()
    } catch (err) {
      setFormError(err instanceof Error ? err.message : 'Failed to create pickup request')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="modal-backdrop" role="presentation">
      <section className="modal" role="dialog" aria-modal="true" aria-labelledby="pickup-title">
        <div className="modal-heading">
          <div><span className="eyebrow">NEW WORKFLOW</span><h2 id="pickup-title">Create a new pickup</h2></div>
          <button className="icon-button" onClick={onClose} aria-label="Close dialog"><X size={18} /></button>
        </div>

        <div className="form-grid">
          <div>
            <label style={{ display: 'block', marginBottom: 4 }}>Distributor</label>
            {selectedDistributor ? (
              <div className="table-search">
                <span style={{ flex: 1 }}>{selectedDistributor.name} — {selectedDistributor.email}</span>
                <button type="button" className="icon-button" onClick={() => setSelectedDistributor(null)} aria-label="Change distributor"><X size={14} /></button>
              </div>
            ) : (
              <DistributorPicker session={session} onSelect={setSelectedDistributor} />
            )}
          </div>

          <div>
            <label style={{ display: 'block', marginBottom: 4 }}>Products</label>
            {loadingProducts && <p className="muted-cell">Loading products…</p>}
            {!loadingProducts && productsError && <p className="muted-cell">{productsError}</p>}
            {!loadingProducts && !productsError && products.length === 0 && <p className="muted-cell">No products available.</p>}
            {!loadingProducts && !productsError && products.length > 0 && (
              <div className="table-wrap">
                <table>
                  <thead><tr><th>SKU</th><th>Name</th><th>Qty</th></tr></thead>
                  <tbody>
                    {products.map((p) => (
                      <tr key={p.sku}>
                        <td><strong>{p.sku}</strong></td>
                        <td>{p.name}</td>
                        <td>
                          <input
                            type="number"
                            min={0}
                            value={quantities[p.sku] ?? 0}
                            onChange={(e) => setQuantity(p.sku, parseInt(e.target.value, 10) || 0)}
                            style={{ width: 64 }}
                          />
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>

          {formError && <div className="empty-state"><AlertTriangle size={18} /><p>{formError}</p></div>}
        </div>

        <div className="modal-actions">
          <button className="secondary-button" onClick={onClose}>Cancel</button>
          <button className="primary-button" onClick={handleSubmit} disabled={submitting}>
            {submitting ? 'Creating…' : <><Check size={16} /> Create pickup</>}
          </button>
        </div>
      </section>
    </div>
  )
}
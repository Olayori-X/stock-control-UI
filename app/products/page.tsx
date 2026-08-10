'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { Boxes, Plus, Pencil, Trash2, Search, AlertTriangle, X, Check } from 'lucide-react'
import { getSession, type Session } from '@/lib/auth'
import { addProduct, deleteProduct, editProduct, getProducts, type Product } from '@/lib/api'

export default function ProductsPage() {
  const router = useRouter()
  const [session, setSessionState] = useState<Session | null | undefined>(undefined)

  const [products, setProducts] = useState<Product[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [query, setQuery] = useState('')

  const [showAdd, setShowAdd] = useState(false)
  const [newSku, setNewSku] = useState('')
  const [newName, setNewName] = useState('')
  const [saving, setSaving] = useState(false)
  const [formError, setFormError] = useState<string | null>(null)

  const [editing, setEditing] = useState<Product | null>(null)
  const [editName, setEditName] = useState('')

  const [deletingSku, setDeletingSku] = useState<string | null>(null)

  useEffect(() => {
    const existing = getSession()
    if (!existing) {
      router.replace('/login')
      return
    }
    setSessionState(existing)
  }, [router])

  useEffect(() => {
    if (!session) return
    loadProducts(session)
  }, [session])

  async function loadProducts(s: Session) {
    setLoading(true)
    setError(null)
    try {
      setProducts(await getProducts(s))
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load products')
    } finally {
      setLoading(false)
    }
  }

  async function handleAdd(e: React.FormEvent) {
    e.preventDefault()
    if (!session) return
    setSaving(true)
    setFormError(null)
    try {
      const created = await addProduct(session, { sku: newSku, name: newName })
      setProducts((prev) => [...prev, created])
      setNewSku('')
      setNewName('')
      setShowAdd(false)
    } catch (err) {
      setFormError(err instanceof Error ? err.message : 'Failed to add product')
    } finally {
      setSaving(false)
    }
  }

  function openEdit(product: Product) {
    setEditing(product)
    setEditName(product.name)
  }

  async function handleEditSave() {
    if (!session || !editing) return
    setSaving(true)
    setFormError(null)
    try {
      const updated = await editProduct(session, { sku: editing.sku, name: editName })
      setProducts((prev) => prev.map((p) => (p.sku === updated.sku ? updated : p)))
      setEditing(null)
    } catch (err) {
      setFormError(err instanceof Error ? err.message : 'Failed to update product')
    } finally {
      setSaving(false)
    }
  }

  async function handleDelete(sku: string) {
    if (!session) return
    setDeletingSku(sku)
    setError(null)
    try {
      await deleteProduct(session, sku)
      setProducts((prev) => prev.filter((p) => p.sku !== sku))
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to delete product')
    } finally {
      setDeletingSku(null)
    }
  }

  if (!session) return null

  const filtered = products.filter(
    (p) => p.sku.toLowerCase().includes(query.toLowerCase()) || p.name.toLowerCase().includes(query.toLowerCase())
  )

  return (
    <div className="content">
      <div className="page-heading">
        <div>
          <div className="eyebrow"><Boxes size={14} /> INVENTORY</div>
          <h1>Products</h1>
          <p>Add, edit, or remove SKUs available to sales associates.</p>
        </div>
        <button className="primary-button" onClick={() => setShowAdd(true)}>
          <Plus size={17} /> New product
        </button>
      </div>

      <section className="panel activity-panel">
        <div className="filter-row">
          <div className="table-search">
            <Search size={15} />
            <input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Search by SKU or name..." />
          </div>
        </div>

        {loading && <div className="empty-state"><p>Loading…</p></div>}
        {!loading && error && (
          <div className="empty-state"><AlertTriangle size={18} /><strong>Couldn&apos;t load products</strong><p>{error}</p></div>
        )}
        {!loading && !error && filtered.length === 0 && (
          <div className="empty-state"><Check size={18} /><strong>No products found</strong><p>Add one to get started.</p></div>
        )}
        {!loading && !error && filtered.length > 0 && (
          <div className="table-wrap">
            <table>
              <thead>
                <tr><th>SKU</th><th>Name</th><th>Updated</th><th /></tr>
              </thead>
              <tbody>
                {filtered.map((product) => (
                  <tr key={product.sku}>
                    <td><strong>{product.sku}</strong></td>
                    <td>{product.name}</td>
                    <td className="muted-cell">{new Date(product.updated_at).toLocaleString()}</td>
                    <td>
                      <button className="icon-button" onClick={() => openEdit(product)} aria-label={`Edit ${product.sku}`}>
                        <Pencil size={15} />
                      </button>
                      <button
                        className="icon-button"
                        onClick={() => handleDelete(product.sku)}
                        disabled={deletingSku === product.sku}
                        aria-label={`Delete ${product.sku}`}
                      >
                        <Trash2 size={15} />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>

      {showAdd && (
        <div className="modal-backdrop" role="presentation">
          <section className="modal" role="dialog" aria-modal="true" aria-labelledby="add-product-title">
            <div className="modal-heading">
              <div><span className="eyebrow">NEW PRODUCT</span><h2 id="add-product-title">Add a product</h2></div>
              <button className="icon-button" onClick={() => setShowAdd(false)} aria-label="Close dialog"><X size={18} /></button>
            </div>
            <form onSubmit={handleAdd} className="form-grid">
              <label>SKU<input required value={newSku} onChange={(e) => setNewSku(e.target.value)} placeholder="e.g. SKU-1042" /></label>
              <label>Name<input required value={newName} onChange={(e) => setNewName(e.target.value)} placeholder="e.g. Stainless Water Bottle" /></label>
              {formError && <div className="empty-state"><AlertTriangle size={18} /><p>{formError}</p></div>}
              <div className="modal-actions">
                <button type="button" className="secondary-button" onClick={() => setShowAdd(false)}>Cancel</button>
                <button type="submit" className="primary-button" disabled={saving}>{saving ? 'Adding…' : 'Add product'}</button>
              </div>
            </form>
          </section>
        </div>
      )}

      {editing && (
        <div className="modal-backdrop" role="presentation">
          <section className="modal" role="dialog" aria-modal="true" aria-labelledby="edit-product-title">
            <div className="modal-heading">
              <div><span className="eyebrow">{editing.sku}</span><h2 id="edit-product-title">Edit product</h2></div>
              <button className="icon-button" onClick={() => setEditing(null)} aria-label="Close dialog"><X size={18} /></button>
            </div>
            <div className="form-grid">
              <label>Name<input value={editName} onChange={(e) => setEditName(e.target.value)} /></label>
              {formError && <div className="empty-state"><AlertTriangle size={18} /><p>{formError}</p></div>}
            </div>
            <div className="modal-actions">
              <button className="secondary-button" onClick={() => setEditing(null)}>Cancel</button>
              <button className="primary-button" onClick={handleEditSave} disabled={saving}>{saving ? 'Saving…' : 'Save changes'}</button>
            </div>
          </section>
        </div>
      )}
    </div>
  )
}
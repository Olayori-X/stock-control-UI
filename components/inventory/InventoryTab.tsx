'use client'

import { useEffect, useState } from 'react'
import { AlertTriangle, Boxes, Check, Pencil, Plus, Search, Trash2 } from 'lucide-react'
import type { Session } from '@/lib/auth'
import { addProduct, deleteProduct, editProduct, getProducts, type Product } from '@/lib/api'
import { AddProductModal } from './AddProductModal'
import { EditProductModal } from './EditProductModal'

export function InventoryTab({ session, role }: { session: Session; role: 'admin' | 'sales' | 'distributor' }) {
  const [products, setProducts] = useState<Product[]>([])
  const [loading, setLoading] = useState(false)
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
    load()
  }, [session])

  async function load() {
    setLoading(true)
    setError(null)
    try {
      setProducts(await getProducts(session) ?? [])
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load products')
    } finally {
      setLoading(false)
    }
  }

  async function handleAdd(e: React.FormEvent) {
    e.preventDefault()
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
    if (!editing) return
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

  const filtered = products.filter(
    (p) => p.sku.toLowerCase().includes(query.toLowerCase()) || p.name.toLowerCase().includes(query.toLowerCase())
  )
  const isAdmin = role === 'admin'

  return (
    <div className="content">
      <div className="page-heading">
        <div>
          <div className="eyebrow"><Boxes size={14} /> INVENTORY</div>
          <h1>Products</h1>
          <p>{isAdmin ? 'Add, edit, or remove SKUs available to sales associates.' : 'Browse available SKUs for building pickup requests.'}</p>
        </div>
        {isAdmin && <button className="primary-button" onClick={() => setShowAdd(true)}><Plus size={17} /> New product</button>}
      </div>

      <section className="panel activity-panel">
        <div className="filter-row">
          <div className="table-search">
            <Search size={15} />
            <input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Search by SKU or name..." />
          </div>
        </div>

        {loading && <div className="empty-state"><p>Loading…</p></div>}
        {!loading && error && <div className="empty-state"><AlertTriangle size={18} /><strong>Couldn&apos;t load products</strong><p>{error}</p></div>}
        {!loading && !error && filtered.length === 0 && (
          <div className="empty-state"><Check size={18} /><strong>No products found</strong><p>{isAdmin ? 'Add one to get started.' : 'Check back once inventory is added.'}</p></div>
        )}
        {!loading && !error && filtered.length > 0 && (
          <div className="table-wrap">
            <table>
              <thead><tr><th>SKU</th><th>Name</th><th>Updated</th>{isAdmin && <th />}</tr></thead>
              <tbody>
                {filtered.map((product) => (
                  <tr key={product.sku}>
                    <td><strong>{product.sku}</strong></td>
                    <td>{product.name}</td>
                    <td className="muted-cell">{new Date(product.updated_at).toLocaleString()}</td>
                    {isAdmin && (
                      <td>
                        <button className="icon-button" onClick={() => openEdit(product)} aria-label={`Edit ${product.sku}`}><Pencil size={15} /></button>
                        <button className="icon-button" onClick={() => handleDelete(product.sku)} disabled={deletingSku === product.sku} aria-label={`Delete ${product.sku}`}><Trash2 size={15} /></button>
                      </td>
                    )}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>

      {showAdd && isAdmin && (
        <AddProductModal
          sku={newSku}
          name={newName}
          saving={saving}
          error={formError}
          onSkuChange={setNewSku}
          onNameChange={setNewName}
          onSubmit={handleAdd}
          onClose={() => setShowAdd(false)}
        />
      )}

      {editing && isAdmin && (
        <EditProductModal
          product={editing}
          name={editName}
          saving={saving}
          error={formError}
          onNameChange={setEditName}
          onSave={handleEditSave}
          onClose={() => setEditing(null)}
        />
      )}
    </div>
  )
}
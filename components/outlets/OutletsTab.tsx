'use client'

import { useEffect, useState } from 'react'
import { AlertTriangle, Check, Pencil, Plus, Search, Store, Trash2 } from 'lucide-react'
import type { Session } from '@/lib/auth'
import { addOutlet, editOutlet, getOutlets, setOutletActive, type Outlet, type OutletInput } from '@/lib/api'
import { OutletFormModal } from './OutletFormModal'

const emptyForm: OutletInput = {
  name: '', address: '', outlet_type: '', phone: '',
  latitude: 0, longitude: 0, area: '', zone: '',
  assigned_sales_associate_id: '', route_day: '', priority: '',
}

export function OutletsTab({ session }: { session: Session }) {
  const [outlets, setOutlets] = useState<Outlet[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [query, setQuery] = useState('')
  const [showInactive, setShowInactive] = useState(false)

  const [showAdd, setShowAdd] = useState(false)
  const [addForm, setAddForm] = useState<OutletInput>(emptyForm)
  const [saving, setSaving] = useState(false)
  const [formError, setFormError] = useState<string | null>(null)

  const [editingOutlet, setEditingOutlet] = useState<Outlet | null>(null)
  const [editForm, setEditForm] = useState<OutletInput>(emptyForm)

  const [togglingId, setTogglingId] = useState<string | null>(null)

  useEffect(() => {
    load()
  }, [session, showInactive])

  async function load() {
    setLoading(true)
    setError(null)
    try {
      setOutlets(await getOutlets(session, showInactive) ?? [])
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load outlets')
    } finally {
      setLoading(false)
    }
  }

  function updateAddForm<K extends keyof OutletInput>(key: K, value: OutletInput[K]) {
    setAddForm((prev) => ({ ...prev, [key]: value }))
  }

  function updateEditForm<K extends keyof OutletInput>(key: K, value: OutletInput[K]) {
    setEditForm((prev) => ({ ...prev, [key]: value }))
  }

  async function handleAdd(e: React.FormEvent) {
    e.preventDefault()
    setSaving(true)
    setFormError(null)
    try {
      const created = await addOutlet(session, addForm)
      setOutlets((prev) => [...prev, created])
      setAddForm(emptyForm)
      setShowAdd(false)
    } catch (err) {
      setFormError(err instanceof Error ? err.message : 'Failed to add outlet')
    } finally {
      setSaving(false)
    }
  }

  function openEdit(outlet: Outlet) {
    setEditingOutlet(outlet)
    setEditForm({
      name: outlet.name,
      address: outlet.address,
      outlet_type: outlet.outlet_type,
      phone: outlet.phone,
      latitude: outlet.latitude,
      longitude: outlet.longitude,
      area: outlet.area,
      zone: outlet.zone,
      assigned_sales_associate_id: outlet.assigned_sales_associate_id,
      route_day: outlet.route_day,
      priority: outlet.priority,
    })
  }

  async function handleEditSave(e: React.FormEvent) {
    e.preventDefault()
    if (!editingOutlet) return
    setSaving(true)
    setFormError(null)
    try {
      const updated = await editOutlet(session, { ...editForm, outlet_id: editingOutlet.outlet_id })
      setOutlets((prev) => prev.map((o) => (o.outlet_id === updated.outlet_id ? updated : o)))
      setEditingOutlet(null)
    } catch (err) {
      setFormError(err instanceof Error ? err.message : 'Failed to update outlet')
    } finally {
      setSaving(false)
    }
  }

  async function handleToggleActive(outlet: Outlet) {
    setTogglingId(outlet.outlet_id)
    setError(null)
    try {
      await setOutletActive(session, outlet.outlet_id, !outlet.active)
      setOutlets((prev) => prev.map((o) => (o.outlet_id === outlet.outlet_id ? { ...o, active: !o.active } : o)))
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update outlet status')
    } finally {
      setTogglingId(null)
    }
  }

  const filtered = outlets.filter(
    (o) => o.name.toLowerCase().includes(query.toLowerCase()) || o.outlet_id.toLowerCase().includes(query.toLowerCase())
  )

  return (
    <div className="content">
      <div className="page-heading">
        <div>
          <div className="eyebrow"><Store size={14} /> OUTLETS</div>
          <h1>Outlets</h1>
          <p>Manage the shops, stores, and warehouses your sales associates visit.</p>
        </div>
        <button className="primary-button" onClick={() => setShowAdd(true)}><Plus size={17} /> New outlet</button>
      </div>

      <section className="panel activity-panel">
        <div className="filter-row">
          <div className="table-search">
            <Search size={15} />
            <input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Search by name or ID..." />
          </div>
          <button className="filter-button" onClick={() => setShowInactive((v) => !v)}>
            {showInactive ? 'Hide inactive' : 'Show inactive'}
          </button>
        </div>

        {loading && <div className="empty-state"><p>Loading…</p></div>}
        {!loading && error && <div className="empty-state"><AlertTriangle size={18} /><strong>Couldn&apos;t load outlets</strong><p>{error}</p></div>}
        {!loading && !error && filtered.length === 0 && (
          <div className="empty-state"><Check size={18} /><strong>No outlets found</strong><p>Add one to get started.</p></div>
        )}
        {!loading && !error && filtered.length > 0 && (
          <div className="table-wrap">
            <table>
              <thead><tr><th>Name</th><th>Area / Zone</th><th>Route day</th><th>Status</th><th /></tr></thead>
              <tbody>
                {filtered.map((outlet) => (
                  <tr key={outlet.outlet_id}>
                    <td><strong>{outlet.name}</strong><span>{outlet.outlet_id.slice(0, 12)}</span></td>
                    <td>{outlet.area || '—'} / {outlet.zone || '—'}</td>
                    <td className="muted-cell">{outlet.route_day || 'Unassigned'}</td>
                    <td>{outlet.active ? <span className="status status-success"><span className="status-dot" />Active</span> : <span className="status status-danger"><span className="status-dot" />Inactive</span>}</td>
                    <td>
                      <button className="icon-button" onClick={() => openEdit(outlet)} aria-label={`Edit ${outlet.name}`}><Pencil size={15} /></button>
                      <button
                        className="icon-button"
                        onClick={() => handleToggleActive(outlet)}
                        disabled={togglingId === outlet.outlet_id}
                        aria-label={outlet.active ? `Deactivate ${outlet.name}` : `Reactivate ${outlet.name}`}
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
        <OutletFormModal
          title="Add an outlet"
          form={addForm}
          saving={saving}
          error={formError}
          onChange={updateAddForm}
          onSubmit={handleAdd}
          onClose={() => setShowAdd(false)}
        />
      )}

      {editingOutlet && (
        <OutletFormModal
          title={`Edit ${editingOutlet.name}`}
          form={editForm}
          saving={saving}
          error={formError}
          onChange={updateEditForm}
          onSubmit={handleEditSave}
          onClose={() => setEditingOutlet(null)}
        />
      )}
    </div>
  )
}
'use client'

import { AlertTriangle, X } from 'lucide-react'
import type { OutletInput } from '@/lib/api'

const routeDays = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday']

export function OutletFormModal({
  title,
  form,
  saving,
  error,
  onChange,
  onSubmit,
  onClose,
}: {
  title: string
  form: OutletInput
  saving: boolean
  error: string | null
  onChange: <K extends keyof OutletInput>(key: K, value: OutletInput[K]) => void
  onSubmit: (e: React.FormEvent) => void
  onClose: () => void
}) {
  return (
    <div className="modal-backdrop" role="presentation">
      <section className="modal" role="dialog" aria-modal="true" aria-labelledby="outlet-form-title">
        <div className="modal-heading">
          <div><span className="eyebrow">OUTLET</span><h2 id="outlet-form-title">{title}</h2></div>
          <button className="icon-button" onClick={onClose} aria-label="Close dialog"><X size={18} /></button>
        </div>
        <form onSubmit={onSubmit} className="form-grid">
          <label>Name<input required value={form.name} onChange={(e) => onChange('name', e.target.value)} placeholder="e.g. Ade Stores, Ikeja" /></label>
          <label>Type<input value={form.outlet_type} onChange={(e) => onChange('outlet_type', e.target.value)} placeholder="e.g. Retail, Warehouse" /></label>
          <label>Address<input value={form.address} onChange={(e) => onChange('address', e.target.value)} placeholder="Street address" /></label>
          <label>Phone<input value={form.phone} onChange={(e) => onChange('phone', e.target.value)} placeholder="+2348012345678" /></label>
          <label>Latitude<input required type="number" step="any" value={form.latitude} onChange={(e) => onChange('latitude', parseFloat(e.target.value) || 0)} /></label>
          <label>Longitude<input required type="number" step="any" value={form.longitude} onChange={(e) => onChange('longitude', parseFloat(e.target.value) || 0)} /></label>
          <label>Area<input value={form.area} onChange={(e) => onChange('area', e.target.value)} /></label>
          <label>Zone<input value={form.zone} onChange={(e) => onChange('zone', e.target.value)} /></label>
          <label>Route day
            <select value={form.route_day} onChange={(e) => onChange('route_day', e.target.value)}>
              <option value="">Unassigned</option>
              {routeDays.map((d) => <option key={d} value={d}>{d}</option>)}
            </select>
          </label>
          <label>Priority<input value={form.priority} onChange={(e) => onChange('priority', e.target.value)} placeholder="e.g. High" /></label>
          <label>Assigned associate ID<input value={form.assigned_sales_associate_id} onChange={(e) => onChange('assigned_sales_associate_id', e.target.value)} placeholder="Sales associate user ID" /></label>

          {error && <div className="empty-state"><AlertTriangle size={18} /><p>{error}</p></div>}

          <div className="modal-actions">
            <button type="button" className="secondary-button" onClick={onClose}>Cancel</button>
            <button type="submit" className="primary-button" disabled={saving}>{saving ? 'Saving…' : 'Save outlet'}</button>
          </div>
        </form>
      </section>
    </div>
  )
}
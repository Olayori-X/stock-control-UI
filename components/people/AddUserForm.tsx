'use client'

import { AlertTriangle, Check, UserPlus } from 'lucide-react'
import type { AddUserInput, Role } from '@/lib/api'

const roleOptions: { value: Role; label: string }[] = [
  { value: 'admin', label: 'Admin' },
  { value: 'sales', label: 'Sales associate' },
  { value: 'distributor', label: 'Distributor' },
]

export function AddUserForm({
  form,
  submitting,
  error,
  success,
  onChange,
  onSubmit,
}: {
  form: AddUserInput
  submitting: boolean
  error: string | null
  success: string | null
  onChange: <K extends keyof AddUserInput>(key: K, value: AddUserInput[K]) => void
  onSubmit: (e: React.FormEvent) => void
}) {
  return (
    <section className="panel" style={{ maxWidth: 520 }}>
      <form onSubmit={onSubmit} className="form-grid">
        <label>Full name<input required value={form.name} onChange={(e) => onChange('name', e.target.value)} placeholder="e.g. Ada Obi" /></label>
        <label>Email<input required type="email" value={form.email} onChange={(e) => onChange('email', e.target.value)} placeholder="ada@example.com" /></label>
        <label>Phone<input required value={form.phone} onChange={(e) => onChange('phone', e.target.value)} placeholder="+2348012345678" /></label>
        <label>Temporary password<input required type="password" value={form.password} onChange={(e) => onChange('password', e.target.value)} placeholder="Set an initial password" /></label>
        <label>Role
          <select value={form.role} onChange={(e) => onChange('role', e.target.value as Role)}>
            {roleOptions.map((r) => <option key={r.value} value={r.value}>{r.label}</option>)}
          </select>
        </label>
        {error && <div className="empty-state"><AlertTriangle size={18} /><strong>Couldn&apos;t add user</strong><p>{error}</p></div>}
        {success && <div className="empty-state"><Check size={18} /><strong>User added</strong><p>{success}</p></div>}
        <div className="modal-actions">
          <button type="submit" className="primary-button" disabled={submitting}>
            {submitting ? 'Adding…' : <><UserPlus size={16} /> Add user</>}
          </button>
        </div>
      </form>
    </section>
  )
}
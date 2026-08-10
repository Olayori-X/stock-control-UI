'use client'

import { useState } from 'react'
import { UserPlus, Check, AlertTriangle } from 'lucide-react'
import { getSession } from '@/lib/auth'
import { addUser, type AddUserInput, type Role } from '@/lib/api'

const roleOptions: { value: Role; label: string }[] = [
  { value: 'admin', label: 'Admin' },
  { value: 'sales', label: 'Sales associate' },
  { value: 'distributor', label: 'Distributor' },
]

const emptyForm: AddUserInput = { name: '', email: '', phone: '', password: '', role: 'sales' }

export default function PeopleAndRolesPage() {
  const [form, setForm] = useState<AddUserInput>(emptyForm)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)

  function update<K extends keyof AddUserInput>(key: K, value: AddUserInput[K]) {
    setForm((prev) => ({ ...prev, [key]: value }))
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    const session = getSession()
    if (!session) return

    setSubmitting(true)
    setError(null)
    setSuccess(null)

    try {
      await addUser(session, form)
      setSuccess(`${form.name} was added as ${form.role}.`)
      setForm(emptyForm)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create user')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="content">
      <div className="page-heading">
        <div>
          <div className="eyebrow"><UserPlus size={14} /> PEOPLE &amp; ROLES</div>
          <h1>Add a user</h1>
          <p>Create accounts for sales associates, distributors, or fellow admins.</p>
        </div>
      </div>

      <section className="panel" style={{ maxWidth: 520 }}>
        <form onSubmit={handleSubmit} className="form-grid">
          <label>
            Full name
            <input required value={form.name} onChange={(e) => update('name', e.target.value)} placeholder="e.g. Ada Obi" />
          </label>
          <label>
            Email
            <input required type="email" value={form.email} onChange={(e) => update('email', e.target.value)} placeholder="ada@example.com" />
          </label>
          <label>
            Phone
            <input required value={form.phone} onChange={(e) => update('phone', e.target.value)} placeholder="+2348012345678" />
          </label>
          <label>
            Temporary password
            <input required type="password" value={form.password} onChange={(e) => update('password', e.target.value)} placeholder="Set an initial password" />
          </label>
          <label>
            Role
            <select value={form.role} onChange={(e) => update('role', e.target.value as Role)}>
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
    </div>
  )
}
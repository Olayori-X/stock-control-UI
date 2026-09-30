'use client'

import { useState } from 'react'
import { AlertTriangle, X } from 'lucide-react'
import type { Session } from '@/lib/auth'
import { editUser, type UserSummary } from '@/lib/api'

export function EditUserModal({
  session,
  user,
  onClose,
  onSaved,
}: {
  session: Session
  user: UserSummary
  onClose: () => void
  onSaved: (updated: UserSummary) => void
}) {
  const [name, setName] = useState(user.name)
  const [email, setEmail] = useState(user.email)
  const [phone, setPhone] = useState(user.phone)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function handleSave(e: React.FormEvent) {
    e.preventDefault()
    setSaving(true)
    setError(null)
    try {
      const updated = await editUser(session, { user_id: user.user_id, name, email, phone })
      onSaved(updated)
      onClose()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update user')
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="modal-backdrop" role="presentation">
      <section className="modal" role="dialog" aria-modal="true" aria-labelledby="edit-user-title" style={{ maxWidth: 420 }}>
        <div className="modal-heading">
          <div><span className="eyebrow">{user.role.toUpperCase()}</span><h2 id="edit-user-title">Edit profile</h2></div>
          <button className="icon-button" onClick={onClose} aria-label="Close dialog"><X size={18} /></button>
        </div>
        <form onSubmit={handleSave} className="form-grid" style={{ gridTemplateColumns: '1fr' }}>
          <label>Full name<input required value={name} onChange={(e) => setName(e.target.value)} /></label>
          <label>Email<input required type="email" value={email} onChange={(e) => setEmail(e.target.value)} /></label>
          <label>Phone<input required value={phone} onChange={(e) => setPhone(e.target.value)} /></label>

          {error && <div className="empty-state"><AlertTriangle size={18} /><p>{error}</p></div>}

          <div className="modal-actions">
            <button type="button" className="secondary-button" onClick={onClose}>Cancel</button>
            <button type="submit" className="primary-button" disabled={saving}>{saving ? 'Saving…' : 'Save changes'}</button>
          </div>
        </form>
      </section>
    </div>
  )
}
'use client'

import { useState } from 'react'
import { AlertTriangle, Check, KeyRound } from 'lucide-react'
import type { Session } from '@/lib/auth'
import { setIntegrationSetting } from '@/lib/api'

export function IntegrationSettingsCard({
  session,
  settingKey,
  label,
  description,
  currentMaskedValue,
  onSaved,
}: {
  session: Session
  settingKey: string
  label: string
  description: string
  currentMaskedValue: string
  onSaved: () => void
}) {
  const [value, setValue] = useState('')
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)

  async function handleSave(e: React.FormEvent) {
    e.preventDefault()
    if (!value.trim()) {
      setError('Enter a spreadsheet ID before saving.')
      return
    }
    setSaving(true)
    setError(null)
    setSuccess(false)
    try {
      await setIntegrationSetting(session, settingKey, value.trim())
      setValue('')
      setSuccess(true)
      onSaved()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save setting')
    } finally {
      setSaving(false)
    }
  }

  return (
    <section className="panel" style={{ marginBottom: 16 }}>
      <div className="panel-heading">
        <div>
          <h2><KeyRound size={14} style={{ marginRight: 6, verticalAlign: -2 }} />{label}</h2>
          <p>{description}</p>
        </div>
      </div>

      <div style={{ margin: '14px 0' }}>
        {currentMaskedValue ? (
          <div className="table-search" style={{ maxWidth: 320 }}>
            <span style={{ flex: 1 }}>Currently set: <strong>{currentMaskedValue}</strong></span>
          </div>
        ) : (
          <p className="muted-cell">Not configured yet — sheet sync is currently disabled for this.</p>
        )}
      </div>

      <form onSubmit={handleSave} className="form-grid" style={{ gridTemplateColumns: '1fr' }}>
        <label>
          {currentMaskedValue ? 'Replace with a new spreadsheet ID' : 'Spreadsheet ID'}
          <input
            value={value}
            onChange={(e) => setValue(e.target.value)}
            placeholder="e.g. 1A2B3C4D5E6F7G8H9I0J-example-id"
          />
        </label>

        {error && <div className="empty-state"><AlertTriangle size={18} /><p>{error}</p></div>}
        {success && <div className="empty-state"><Check size={18} /><p>Saved.</p></div>}

        <div className="modal-actions" style={{ justifyContent: 'flex-start', marginTop: 0 }}>
          <button type="submit" className="primary-button" disabled={saving}>
            {saving ? 'Saving…' : 'Save'}
          </button>
        </div>
      </form>
    </section>
  )
}
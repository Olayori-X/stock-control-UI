'use client'

import { useState } from 'react'
import { AlertTriangle, KeyRound, RefreshCw } from 'lucide-react'
import type { Session } from '@/lib/auth'
import { setPIN, type UserSummary } from '@/lib/api'
import { AssociatePicker } from '@/components/shared/AssociatePicker'
import { ConfirmDialog } from '@/components/shared/ConfirmDialog'
import { PinResultCard } from './PinResultCard'

export function PinManagementTab({ session }: { session: Session }) {
  const [associateId, setAssociateId] = useState('')
  const [pendingName, setPendingName] = useState('')
  const [showConfirm, setShowConfirm] = useState(false)

  const [generating, setGenerating] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [result, setResult] = useState<{ associateName: string; pin: string } | null>(null)

  async function handleGenerate() {
    setShowConfirm(false)
    if (!associateId) return
    setGenerating(true)
    setError(null)
    try {
      const res = await setPIN(session, associateId)
      setResult({ associateName: pendingName, pin: res.pin })
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to generate PIN')
    } finally {
      setGenerating(false)
    }
  }

  return (
    <div className="content">
      <div className="page-heading">
        <div>
          <div className="eyebrow"><KeyRound size={14} /> PIN MANAGEMENT</div>
          <h1>Set or reset a PIN</h1>
          <p>Generate a new 8-digit PIN for a sales associate&apos;s APK login. Resetting replaces any existing PIN.</p>
        </div>
      </div>

      <section className="panel" style={{ maxWidth: 480 }}>
        <label style={{ display: 'block', marginBottom: 4, fontSize: 11, fontWeight: 700, color: '#5f6c66' }}>
          Sales associate
        </label>
        <AssociatePicker
          session={session}
          value={associateId}
          onChange={setAssociateId}
          onSelectDetails={(associate: UserSummary) => setPendingName(associate.name)}
        />

        {error && (
          <div className="empty-state" style={{ marginTop: 16 }}><AlertTriangle size={18} /><p>{error}</p></div>
        )}

        <div className="modal-actions" style={{ justifyContent: 'flex-start', marginTop: 20 }}>
          <button className="primary-button" onClick={() => setShowConfirm(true)} disabled={!associateId || generating}>
            <RefreshCw size={16} /> {generating ? 'Generating…' : 'Generate new PIN'}
          </button>
        </div>
      </section>

      {showConfirm && (
        <ConfirmDialog
          title={`Reset PIN for ${pendingName || 'this associate'}?`}
          message="This immediately invalidates their current PIN, if one exists. They won't be able to log in with the old PIN once this completes."
          confirmLabel="Generate new PIN"
          destructive
          onConfirm={handleGenerate}
          onCancel={() => setShowConfirm(false)}
        />
      )}

      {result && (
        <PinResultCard
          associateName={result.associateName}
          pin={result.pin}
          onDismiss={() => { setResult(null); setAssociateId(''); setPendingName('') }}
        />
      )}
    </div>
  )
}
'use client'

import { useState } from 'react'
import { AlertTriangle, KeyRound, RefreshCw } from 'lucide-react'
import type { Session } from '@/lib/auth'
import { setPIN, type UserSummary } from '@/lib/api'
import { AssociatePicker } from '@/components/shared/AssociatePicker'
import { PinResultCard } from './PinResultCard'

export function PinManagementTab({ session }: { session: Session }) {
  const [associateId, setAssociateId] = useState('')
  const [generating, setGenerating] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const [result, setResult] = useState<{ associateName: string; pin: string } | null>(null)

  async function handleGenerate() {
    if (!associateId) return
    setGenerating(true)
    setError(null)
    try {
      const res = await setPIN(session, associateId)
      // We don't have the associate's name from setPIN's response (it only
      // returns user_id + pin), so AssociatePicker's own resolved selection
      // supplies it — see the associateName prop passed down below.
      setResult({ associateName: pendingName, pin: res.pin })
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to generate PIN')
    } finally {
      setGenerating(false)
    }
  }

  // AssociatePicker only exposes the selected ID upward, not the resolved
  // record — track the name locally via onSelectDetails so the result card
  // can show a human name instead of a raw ID.
  const [pendingName, setPendingName] = useState('')

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
          <button className="primary-button" onClick={handleGenerate} disabled={!associateId || generating}>
            <RefreshCw size={16} /> {generating ? 'Generating…' : 'Generate new PIN'}
          </button>
        </div>
      </section>

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
'use client'

import { useEffect, useState } from 'react'
import { AlertTriangle, Check, Cog, Search } from 'lucide-react'
import type { Session } from '@/lib/auth'
import { getAuditLog, type AuditLogEntry } from '@/lib/api'

function todayISO(): string {
  return new Date().toISOString().slice(0, 10)
}

function daysAgoISO(days: number): string {
  const d = new Date()
  d.setDate(d.getDate() - days)
  return d.toISOString().slice(0, 10)
}

export function AuditLogReport({ session }: { session: Session }) {
  const [from, setFrom] = useState(daysAgoISO(30))
  const [to, setTo] = useState(todayISO())
  const [actorId, setActorId] = useState('')

  const [entries, setEntries] = useState<AuditLogEntry[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    load()
  }, [session])

  async function load() {
    setLoading(true)
    setError(null)
    try {
      setEntries(await getAuditLog(session, { from, to, actorId: actorId || undefined }))
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load audit log')
    } finally {
      setLoading(false)
    }
  }

  function handleFilterSubmit(e: React.FormEvent) {
    e.preventDefault()
    load()
  }

  return (
    <section className="panel activity-panel">
      <form onSubmit={handleFilterSubmit} className="form-grid" style={{ marginBottom: 20 }}>
        <label>From<input type="date" value={from} onChange={(e) => setFrom(e.target.value)} /></label>
        <label>To<input type="date" value={to} onChange={(e) => setTo(e.target.value)} /></label>
        <label>Actor ID<input value={actorId} onChange={(e) => setActorId(e.target.value)} placeholder="Optional — leave blank for everyone" /></label>
        <div className="modal-actions" style={{ gridColumn: 'span 2', justifyContent: 'flex-start', marginTop: 0 }}>
          <button type="submit" className="primary-button"><Search size={16} /> Apply filters</button>
        </div>
      </form>

      {loading && <div className="empty-state"><p>Loading…</p></div>}
      {!loading && error && (
        <div className="empty-state"><AlertTriangle size={18} /><strong>Couldn&apos;t load audit log</strong><p>{error}</p></div>
      )}
      {!loading && !error && entries.length === 0 && (
        <div className="empty-state"><Check size={18} /><strong>No audit entries found</strong><p>Try widening the date range.</p></div>
      )}
      {!loading && !error && entries.length > 0 && (
        <div className="table-wrap">
          <table>
            <thead><tr><th>Actor</th><th>Action</th><th>Target</th><th>Details</th><th>When</th></tr></thead>
            <tbody>
              {entries.map((entry, i) => (
                <tr key={`${entry.created_at}-${i}`}>
                  <td>
                    {entry.actor_id ? (
                      entry.actor_id
                    ) : (
                      <span style={{ display: 'inline-flex', alignItems: 'center', gap: 5, color: 'var(--muted)' }}>
                        <Cog size={13} /> System
                      </span>
                    )}
                  </td>
                  <td><strong>{entry.action}</strong></td>
                  <td>{entry.target || '—'}</td>
                  <td className="muted-cell">{entry.details || '—'}</td>
                  <td className="muted-cell">{new Date(entry.created_at).toLocaleString()}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </section>
  )
}
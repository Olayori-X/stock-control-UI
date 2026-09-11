'use client'

import { useEffect, useState } from 'react'
import { X } from 'lucide-react'
import type { Session } from '@/lib/auth'
import { getUsers, type UserSummary } from '@/lib/api'

// Same search-as-you-type pattern as the distributor picker in
// NewPickupModal, but filtered client-side from the full sales-associate
// list rather than a dedicated search endpoint — see note in the
// conversation this was built from if that ever needs to change to a
// server-side search as the associate list grows.
export function AssociatePicker({
  session,
  value,
  onChange,
}: {
  session: Session
  value: string // assigned_sales_associate_id — empty string means unassigned
  onChange: (associateId: string) => void
}) {
  const [associates, setAssociates] = useState<UserSummary[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [query, setQuery] = useState('')

  useEffect(() => {
    let cancelled = false
    setLoading(true)
    getUsers(session)
      .then((result) => { if (!cancelled) setAssociates(result.sales ?? []) })
      .catch((err) => { if (!cancelled) setError(err instanceof Error ? err.message : 'Failed to load sales associates') })
      .finally(() => { if (!cancelled) setLoading(false) })
    return () => { cancelled = true }
  }, [session])

  const selected = associates.find((a) => a.user_id === value)

  const results = query.trim().length === 0
    ? []
    : associates.filter(
        (a) => a.name.toLowerCase().includes(query.toLowerCase()) || a.email.toLowerCase().includes(query.toLowerCase())
      )

  function select(associate: UserSummary) {
    onChange(associate.user_id)
    setQuery('')
  }

  function clear() {
    onChange('')
    setQuery('')
  }

  if (loading) return <p className="muted-cell">Loading sales associates…</p>
  if (error) return <p className="muted-cell">{error}</p>

  if (selected) {
    return (
      <div className="table-search">
        <span style={{ flex: 1 }}>{selected.name} — {selected.email}</span>
        <button type="button" className="icon-button" onClick={clear} aria-label="Change assigned associate"><X size={14} /></button>
      </div>
    )
  }

  return (
    <div style={{ position: 'relative' }}>
      <input
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        placeholder="Search by name or email..."
        autoComplete="off"
      />
      {query.trim().length > 0 && results.length > 0 && (
        <div className="table-wrap" style={{ marginTop: 6 }}>
          <table>
            <tbody>
              {results.map((a) => (
                <tr key={a.user_id} onClick={() => select(a)} style={{ cursor: 'pointer' }}>
                  <td><strong>{a.name}</strong><span>{a.email}</span></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
      {query.trim().length > 0 && results.length === 0 && (
        <p className="muted-cell">No matching sales associates.</p>
      )}
    </div>
  )
}
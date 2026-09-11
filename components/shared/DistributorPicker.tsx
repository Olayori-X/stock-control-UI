'use client'

import { useEffect, useState } from 'react'
import type { Session } from '@/lib/auth'
import { searchDistributors, type DistributorSearchResult } from '@/lib/api'

export function DistributorPicker({
  session,
  excludeIds = [],
  onSelect,
}: {
  session: Session
  excludeIds?: string[]
  onSelect: (distributor: DistributorSearchResult) => void
}) {
  const [query, setQuery] = useState('')
  const [results, setResults] = useState<DistributorSearchResult[]>([])
  const [searching, setSearching] = useState(false)

  useEffect(() => {
    if (query.trim().length === 0) {
      setResults([])
      return
    }
    let cancelled = false
    setSearching(true)
    const timeout = setTimeout(() => {
      searchDistributors(session, query)
        .then((r) => { if (!cancelled) setResults(r.filter((d) => !excludeIds.includes(d.user_id))) })
        .catch(() => { if (!cancelled) setResults([]) })
        .finally(() => { if (!cancelled) setSearching(false) })
    }, 300)
    return () => { cancelled = true; clearTimeout(timeout) }
  }, [query, session, excludeIds])

  return (
    <div style={{ position: 'relative' }}>
      <input
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        placeholder="Search by name or email..."
        autoComplete="off"
      />
      {searching && <p className="muted-cell">Searching…</p>}
      {!searching && results.length > 0 && (
        <div className="table-wrap" style={{ marginTop: 6 }}>
          <table>
            <tbody>
              {results.map((d) => (
                <tr key={d.user_id} onClick={() => { onSelect(d); setQuery('') }} style={{ cursor: 'pointer' }}>
                  <td><strong>{d.name}</strong><span>{d.email}</span></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
      {!searching && query.trim().length > 0 && results.length === 0 && (
        <p className="muted-cell">No distributors found.</p>
      )}
    </div>
  )
}
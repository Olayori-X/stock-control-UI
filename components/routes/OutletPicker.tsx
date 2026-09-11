'use client'

import { useEffect, useState } from 'react'
import type { Session } from '@/lib/auth'
import { getOutlets, type Outlet } from '@/lib/api'

export function OutletPicker({
  session,
  excludeIds,
  onAdd,
}: {
  session: Session
  excludeIds: string[] // outlets already in the route — hidden from results
  onAdd: (outlet: Outlet) => void
}) {
  const [outlets, setOutlets] = useState<Outlet[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [query, setQuery] = useState('')

  useEffect(() => {
    let cancelled = false
    setLoading(true)
    getOutlets(session)
      .then((result) => { if (!cancelled) setOutlets(result ?? []) })
      .catch((err) => { if (!cancelled) setError(err instanceof Error ? err.message : 'Failed to load outlets') })
      .finally(() => { if (!cancelled) setLoading(false) })
    return () => { cancelled = true }
  }, [session])

  if (loading) return <p className="muted-cell">Loading outlets…</p>
  if (error) return <p className="muted-cell">{error}</p>

  const results = query.trim().length === 0
    ? []
    : outlets.filter(
        (o) => !excludeIds.includes(o.outlet_id) &&
          (o.name.toLowerCase().includes(query.toLowerCase()) || o.area.toLowerCase().includes(query.toLowerCase()))
      )

  return (
    <div style={{ position: 'relative' }}>
      <input
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        placeholder="Search outlets to add..."
        autoComplete="off"
      />
      {query.trim().length > 0 && results.length > 0 && (
        <div className="table-wrap" style={{ marginTop: 6 }}>
          <table>
            <tbody>
              {results.map((o) => (
                <tr key={o.outlet_id} onClick={() => { onAdd(o); setQuery('') }} style={{ cursor: 'pointer' }}>
                  <td><strong>{o.name}</strong><span>{o.area || 'No area set'}</span></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
      {query.trim().length > 0 && results.length === 0 && (
        <p className="muted-cell">No matching outlets.</p>
      )}
    </div>
  )
}
'use client'

import { useEffect, useState } from 'react'
import type { Session } from '@/lib/auth'
import { getOutlets, type Outlet } from '@/lib/api'

export function OutletPicker({
  session,
  excludeIds,
  defaultOwnerId,
  onAdd,
}: {
  session: Session
  excludeIds: string[]
  defaultOwnerId?: string
  onAdd: (outlet: Outlet) => void
}) {
  const [outlets, setOutlets] = useState<Outlet[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [query, setQuery] = useState('')

  useEffect(() => {
    let cancelled = false
    setLoading(true)
    getOutlets(session, false, defaultOwnerId || '')
      .then((result) => { if (!cancelled) setOutlets(result ?? []) })
      .catch((err) => { if (!cancelled) setError(err instanceof Error ? err.message : 'Failed to load outlets') })
      .finally(() => { if (!cancelled) setLoading(false) })
    return () => { cancelled = true }
  }, [session, defaultOwnerId])

  if (loading) return <p className="muted-cell">Loading outlets…</p>
  if (error) return <p className="muted-cell">{error}</p>

  const visible = outlets
    .filter((o) => !excludeIds.includes(o.outlet_id))
    .filter((o) => query.trim() === '' || o.name.toLowerCase().includes(query.toLowerCase()) || o.area.toLowerCase().includes(query.toLowerCase()))

  return (
    <div>
      <input
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        placeholder="Filter outlets..."
        autoComplete="off"
      />
      <div className="table-wrap" style={{ marginTop: 8 }}>
        {visible.length === 0 ? (
          <p className="muted-cell">{outlets.length === 0 ? 'No outlets assigned to this associate.' : 'No matches.'}</p>
        ) : (
          <table>
            <tbody>
              {visible.map((o) => (
                <tr key={o.outlet_id} onClick={() => onAdd(o)} style={{ cursor: 'pointer' }}>
                  <td><strong>{o.name}</strong><span>{o.area || 'No area set'}</span></td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  )
}
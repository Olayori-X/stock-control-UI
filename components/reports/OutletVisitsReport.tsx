'use client'

import { useEffect, useState } from 'react'
import { AlertTriangle, Check, Search } from 'lucide-react'
import type { Session } from '@/lib/auth'
import { getOutletVisits, type OutletVisit } from '@/lib/api'
import { Status } from '@/components/dashboard/Status'

function todayISO(): string {
  return new Date().toISOString().slice(0, 10)
}

function daysAgoISO(days: number): string {
  const d = new Date()
  d.setDate(d.getDate() - days)
  return d.toISOString().slice(0, 10)
}

export function OutletVisitsReport({ session }: { session: Session }) {
  const [from, setFrom] = useState(daysAgoISO(7))
  const [to, setTo] = useState(todayISO())
  const [associateId, setAssociateId] = useState('')

  const [visits, setVisits] = useState<OutletVisit[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    load()
  }, [session])

  async function load() {
    setLoading(true)
    setError(null)
    try {
      setVisits(await getOutletVisits(session, { from, to, salesAssociateId: associateId || undefined }))
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load outlet visits')
    } finally {
      setLoading(false)
    }
  }

  function handleFilterSubmit(e: React.FormEvent) {
    e.preventDefault()
    load()
  }

  const passCount = visits.filter((v) => v.geofence_status === 'PASS').length
  const failCount = visits.length - passCount
  const passRate = visits.length > 0 ? (passCount / visits.length) * 100 : 0

  return (
    <section className="panel activity-panel">
      <form onSubmit={handleFilterSubmit} className="form-grid" style={{ marginBottom: 20 }}>
        <label>From<input type="date" value={from} onChange={(e) => setFrom(e.target.value)} /></label>
        <label>To<input type="date" value={to} onChange={(e) => setTo(e.target.value)} /></label>
        <label>Sales associate ID<input value={associateId} onChange={(e) => setAssociateId(e.target.value)} placeholder="Optional" /></label>
        <div className="modal-actions" style={{ gridColumn: 'span 2', justifyContent: 'flex-start', marginTop: 0 }}>
          <button type="submit" className="primary-button"><Search size={16} /> Apply filters</button>
        </div>
      </form>

      {!loading && !error && visits.length > 0 && (
        <div className="metric-grid" style={{ gridTemplateColumns: 'repeat(3, 1fr)', marginBottom: 20 }}>
          <div className="metric-card">
            <p>Geofence pass rate</p>
            <strong>{passRate.toFixed(1)}%</strong>
          </div>
          <div className="metric-card">
            <p>Passed</p>
            <strong>{passCount}</strong>
          </div>
          <div className="metric-card">
            <p>Failed</p>
            <strong>{failCount}</strong>
          </div>
        </div>
      )}

      {loading && <div className="empty-state"><p>Loading…</p></div>}
      {!loading && error && (
        <div className="empty-state"><AlertTriangle size={18} /><strong>Couldn&apos;t load outlet visits</strong><p>{error}</p></div>
      )}
      {!loading && !error && visits.length === 0 && (
        <div className="empty-state"><Check size={18} /><strong>No visit records found</strong><p>Try widening the date range.</p></div>
      )}
      {!loading && !error && visits.length > 0 && (
        <div className="table-wrap">
          <table>
            <thead>
              <tr><th>Associate</th><th>Outlet</th><th>Route day</th><th>Visited at</th><th>Distance from outlet</th><th>Result</th></tr>
            </thead>
            <tbody>
              {visits.map((v, i) => (
                <tr key={`${v.sales_associate_id}-${v.outlet_id}-${v.visited_at}-${i}`}>
                  <td>{v.sales_associate_id}</td>
                  <td>{v.outlet_id}</td>
                  <td>{v.route_day}</td>
                  <td className="muted-cell">{new Date(v.visited_at).toLocaleString()}</td>
                  <td>{v.distance_from_outlet_m.toFixed(0)} m</td>
                  <td><Status value={v.geofence_status} tone={v.geofence_status === 'PASS' ? 'success' : 'danger'} /></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </section>
  )
}
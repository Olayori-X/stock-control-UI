'use client'

import { useEffect, useState } from 'react'
import { AlertTriangle, Search } from 'lucide-react'
import type { Session } from '@/lib/auth'
import { getRouteEfficiency, type RouteEfficiency } from '@/lib/api'
import { AssociatePicker } from '@/components/shared/AssociatePicker'
import { ROUTE_DAYS } from '@/lib/constants'

export function RouteEfficiencyReport({ session }: { session: Session }) {
  const [associateId, setAssociateId] = useState('')
  const [routeDay, setRouteDay] = useState<string>(ROUTE_DAYS[0])

  const [report, setReport] = useState<RouteEfficiency | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!associateId) {
      setReport(null)
      return
    }
    load()
  }, [associateId, routeDay])

  async function load() {
    if (!associateId) return
    setLoading(true)
    setError(null)
    try {
      setReport(await getRouteEfficiency(session, associateId, routeDay))
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load report')
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
        <div style={{ gridColumn: 'span 1' }}>
          <label style={{ display: 'block', marginBottom: 4, fontSize: 11, fontWeight: 700, color: '#5f6c66' }}>
            Sales associate
          </label>
          <AssociatePicker session={session} value={associateId} onChange={setAssociateId} />
        </div>
        <label>
          Route day
          <select value={routeDay} onChange={(e) => setRouteDay(e.target.value)}>
            {ROUTE_DAYS.map((d) => <option key={d} value={d}>{d}</option>)}
          </select>
        </label>
        <div className="modal-actions" style={{ gridColumn: 'span 2', justifyContent: 'flex-start', marginTop: 0 }}>
          <button type="submit" className="primary-button" disabled={!associateId}><Search size={16} /> Load report</button>
        </div>
      </form>

      {!associateId && <div className="empty-state"><p>Select a sales associate to see their route efficiency report.</p></div>}

      {associateId && loading && <div className="empty-state"><p>Loading…</p></div>}
      {associateId && !loading && error && (
        <div className="empty-state"><AlertTriangle size={18} /><strong>Couldn&apos;t load report</strong><p>{error}</p></div>
      )}

      {associateId && !loading && !error && report && (
        <>
          {report.outlet_count === 0 ? (
            <div className="empty-state"><p>No route plan exists for {routeDay}.</p></div>
          ) : (
            <>
              <div className="metric-grid" style={{ gridTemplateColumns: 'repeat(4, 1fr)', marginBottom: 20 }}>
                <div className="metric-card">
                  <p>Outlets on route</p>
                  <strong>{report.outlet_count}</strong>
                </div>
                <div className="metric-card">
                  <p>Planned distance</p>
                  <strong>{(report.planned_distance_m / 1000).toFixed(1)} km</strong>
                </div>
                <div className="metric-card">
                  <p>Avg. leg distance</p>
                  <strong>{(report.average_leg_distance_m / 1000).toFixed(2)} km</strong>
                </div>
                <div className="metric-card">
                  <p>Dispersion</p>
                  <strong>{(report.dispersion_m / 1000).toFixed(2)} km</strong>
                </div>
              </div>

              <div className="panel" style={{ marginBottom: 16 }}>
                <div className="panel-heading">
                  <div><h2>Area / zone alignment</h2><p>How clustered this route is by area and zone.</p></div>
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 14, marginTop: 16, fontSize: 12 }}>
                  <div>
                    <span className="muted-cell">Dominant area</span>
                    <p style={{ margin: '6px 0 0' }}>{report.dominant_area || '—'} ({report.area_alignment_pct.toFixed(0)}% of stops)</p>
                  </div>
                  <div>
                    <span className="muted-cell">Dominant zone</span>
                    <p style={{ margin: '6px 0 0' }}>{report.dominant_zone || '—'} ({report.zone_alignment_pct.toFixed(0)}% of stops)</p>
                  </div>
                </div>
              </div>

              <div className="panel" style={{ marginBottom: 16 }}>
                <div className="panel-heading">
                  <div><h2>Outliers</h2><p>Outlets significantly further from the route&apos;s centroid than average.</p></div>
                </div>
                {report.outliers.length === 0 ? (
                  <p className="muted-cell" style={{ marginTop: 16 }}>No outliers detected.</p>
                ) : (
                  <div className="table-wrap" style={{ marginTop: 16 }}>
                    <table>
                      <thead><tr><th>Outlet ID</th></tr></thead>
                      <tbody>
                        {report.outliers.map((id) => <tr key={id}><td>{id}</td></tr>)}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>

              <div className="panel">
                <div className="panel-heading">
                  <div>
                    <h2>Backtracking</h2>
                    <p>{report.backtrack_count} potential detour{report.backtrack_count === 1 ? '' : 's'} flagged in this route.</p>
                  </div>
                </div>
                {report.backtrack_legs.length === 0 ? (
                  <p className="muted-cell" style={{ marginTop: 16 }}>No backtracking detected.</p>
                ) : (
                  <div className="table-wrap" style={{ marginTop: 16 }}>
                    <table>
                      <thead><tr><th>Leg</th></tr></thead>
                      <tbody>
                        {report.backtrack_legs.map((leg, i) => <tr key={i}><td>{leg}</td></tr>)}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            </>
          )}
        </>
      )}
    </section>
  )
}
'use client'

import { useEffect, useState } from 'react'
import { AlertTriangle, Search } from 'lucide-react'
import type { Session } from '@/lib/auth'
import { getPlannedVsActual, type PlannedVsActual } from '@/lib/api'
import { AssociatePicker } from '@/components/shared/AssociatePicker'
import { Status } from '@/components/dashboard/Status'

function todayISO(): string {
  return new Date().toISOString().slice(0, 10)
}

export function PlannedVsActualReport({ session }: { session: Session }) {
  const [associateId, setAssociateId] = useState('')
  const [date, setDate] = useState(todayISO())

  const [report, setReport] = useState<PlannedVsActual | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!associateId) {
      setReport(null)
      return
    }
    load()
  }, [associateId])

  async function load() {
    if (!associateId) return
    setLoading(true)
    setError(null)
    try {
      setReport(await getPlannedVsActual(session, associateId, date))
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
        <label>Date<input type="date" value={date} onChange={(e) => setDate(e.target.value)} /></label>
        <div className="modal-actions" style={{ gridColumn: 'span 2', justifyContent: 'flex-start', marginTop: 0 }}>
          <button type="submit" className="primary-button" disabled={!associateId}><Search size={16} /> Load report</button>
        </div>
      </form>

      {!associateId && <div className="empty-state"><p>Select a sales associate to see their planned-vs-actual report.</p></div>}

      {associateId && loading && <div className="empty-state"><p>Loading…</p></div>}
      {associateId && !loading && error && (
        <div className="empty-state"><AlertTriangle size={18} /><strong>Couldn&apos;t load report</strong><p>{error}</p></div>
      )}

      {associateId && !loading && !error && report && (
        <>
          <div className="metric-grid" style={{ gridTemplateColumns: 'repeat(4, 1fr)', marginBottom: 20 }}>
            <div className="metric-card">
              <p>Coverage</p>
              <strong>{report.coverage_pct.toFixed(0)}%</strong>
            </div>
            <div className="metric-card">
              <p>Route adherence</p>
              <strong>{report.route_adherence_pct.toFixed(0)}%</strong>
            </div>
            <div className="metric-card">
              <p>Outlets visited</p>
              <strong>{report.outlets_visited} / {report.outlets_planned}</strong>
            </div>
            <div className="metric-card">
              <p>Sales value</p>
              <strong>{report.sales_value.toLocaleString(undefined, { style: 'currency', currency: 'NGN' })}</strong>
            </div>
          </div>

          <div className="panel" style={{ marginBottom: 16 }}>
            <div className="panel-heading">
              <div><h2>Day summary — {report.route_day}, {new Date(report.date).toLocaleDateString()}</h2></div>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 14, marginTop: 16, fontSize: 12 }}>
              <div>
                <span className="muted-cell">Resumption result</span>
                <div style={{ marginTop: 6 }}>
                  {report.resumption_result ? (
                    <Status value={report.resumption_result} tone={report.resumption_result === 'PASS' ? 'success' : 'danger'} />
                  ) : (
                    <span className="muted-cell">No resumption record</span>
                  )}
                </div>
              </div>
              <div>
                <span className="muted-cell">Resumption time</span>
                <p style={{ margin: '6px 0 0' }}>{report.resumption_time || '—'}</p>
              </div>
              <div>
                <span className="muted-cell">Sales calls</span>
                <p style={{ margin: '6px 0 0' }}>{report.sales_calls}</p>
              </div>
              <div>
                <span className="muted-cell">Productive visits</span>
                <p style={{ margin: '6px 0 0' }}>{report.productive_visits}</p>
              </div>
              <div>
                <span className="muted-cell">Last activity</span>
                <p style={{ margin: '6px 0 0' }}>{report.last_activity ? new Date(report.last_activity).toLocaleString() : '—'}</p>
              </div>
            </div>
          </div>

          <div className="panel">
            <div className="panel-heading">
              <div><h2>Missed outlets</h2><p>Planned but not visited on this day.</p></div>
            </div>
            {report.missed_outlets.length === 0 ? (
              <p className="muted-cell" style={{ marginTop: 16 }}>None — full coverage for this day.</p>
            ) : (
              <div className="table-wrap" style={{ marginTop: 16 }}>
                <table>
                  <thead><tr><th>Outlet ID</th></tr></thead>
                  <tbody>
                    {report.missed_outlets.map((id) => (
                      <tr key={id}><td>{id}</td></tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </>
      )}
    </section>
  )
}
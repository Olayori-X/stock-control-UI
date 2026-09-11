'use client'

import { useEffect, useState } from 'react'
import { AlertTriangle, Check, Search } from 'lucide-react'
import type { Session } from '@/lib/auth'
import { getResumptionLogs, type ResumptionLog } from '@/lib/api'
import { Status } from '@/components/dashboard/Status'

function todayISO(): string {
  return new Date().toISOString().slice(0, 10)
}

function daysAgoISO(days: number): string {
  const d = new Date()
  d.setDate(d.getDate() - days)
  return d.toISOString().slice(0, 10)
}

export function ResumptionReport({ session }: { session: Session }) {
  const [from, setFrom] = useState(daysAgoISO(7))
  const [to, setTo] = useState(todayISO())
  const [associateId, setAssociateId] = useState('')

  const [logs, setLogs] = useState<ResumptionLog[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    load()
  }, [session])

  async function load() {
    setLoading(true)
    setError(null)
    try {
      setLogs(await getResumptionLogs(session, { from, to, salesAssociateId: associateId || undefined }))
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load resumption logs')
    } finally {
      setLoading(false)
    }
  }

  function handleFilterSubmit(e: React.FormEvent) {
    e.preventDefault()
    load()
  }

  const passCount = logs.filter((l) => l.result === 'PASS').length
  const failCount = logs.length - passCount
  const complianceRate = logs.length > 0 ? (passCount / logs.length) * 100 : 0

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

      {!loading && !error && logs.length > 0 && (
        <div className="metric-grid" style={{ gridTemplateColumns: 'repeat(3, 1fr)', marginBottom: 20 }}>
          <div className="metric-card">
            <p>Compliance rate</p>
            <strong>{complianceRate.toFixed(1)}%</strong>
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
        <div className="empty-state"><AlertTriangle size={18} /><strong>Couldn&apos;t load resumption logs</strong><p>{error}</p></div>
      )}
      {!loading && !error && logs.length === 0 && (
        <div className="empty-state"><Check size={18} /><strong>No resumption records found</strong><p>Try widening the date range.</p></div>
      )}
      {!loading && !error && logs.length > 0 && (
        <div className="table-wrap">
          <table>
            <thead>
              <tr><th>Associate</th><th>Date</th><th>Time</th><th>Route day</th><th>Distance to route</th><th>Result</th></tr>
            </thead>
            <tbody>
              {logs.map((log, i) => (
                <tr key={`${log.sales_associate_id}-${log.date}-${i}`}>
                  <td>{log.sales_associate_id}</td>
                  <td className="muted-cell">{new Date(log.date).toLocaleDateString()}</td>
                  <td className="muted-cell">{log.time}</td>
                  <td>{log.route_day}</td>
                  <td>{log.distance_to_route_m.toFixed(0)} m</td>
                  <td><Status value={log.result} tone={log.result === 'PASS' ? 'success' : 'danger'} /></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </section>
  )
}
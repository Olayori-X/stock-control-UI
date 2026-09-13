'use client'

import { useEffect, useState } from 'react'
import { AlertTriangle, Search, ShieldAlert, ShieldCheck } from 'lucide-react'
import type { Session } from '@/lib/auth'
import { getOutsideCoverage, type OutsideCoverageReport as OutsideCoverageReportData } from '@/lib/api'
import { AssociatePicker } from '@/components/shared/AssociatePicker'

// Monday of the current week, as YYYY-MM-DD — matches the backend's
// default when week_start is omitted, so the initial load and an explicit
// "this week" selection agree.
function currentWeekStartISO(): string {
  const now = new Date()
  const day = now.getDay() // 0 = Sunday
  const offset = day === 0 ? 6 : day - 1 // days since Monday
  const monday = new Date(now)
  monday.setDate(now.getDate() - offset)
  return monday.toISOString().slice(0, 10)
}

export function OutsideCoverageReport({ session }: { session: Session }) {
  const [associateId, setAssociateId] = useState('')
  const [weekStart, setWeekStart] = useState(currentWeekStartISO())

  const [report, setReport] = useState<OutsideCoverageReportData | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!associateId) {
      setReport(null)
      return
    }
    load()
  }, [associateId, weekStart])

  async function load() {
    if (!associateId) return
    setLoading(true)
    setError(null)
    try {
      setReport(await getOutsideCoverage(session, associateId, weekStart))
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
        <label>Week starting (Monday)<input type="date" value={weekStart} onChange={(e) => setWeekStart(e.target.value)} /></label>
        <div className="modal-actions" style={{ gridColumn: 'span 2', justifyContent: 'flex-start', marginTop: 0 }}>
          <button type="submit" className="primary-button" disabled={!associateId}><Search size={16} /> Load report</button>
        </div>
      </form>

      {!associateId && <div className="empty-state"><p>Select a sales associate to see their outside-coverage report.</p></div>}

      {associateId && loading && <div className="empty-state"><p>Loading…</p></div>}
      {associateId && !loading && error && (
        <div className="empty-state"><AlertTriangle size={18} /><strong>Couldn&apos;t load report</strong><p>{error}</p></div>
      )}

      {associateId && !loading && !error && report && (
        <>
          <div
            className="panel"
            style={{
              marginBottom: 20,
              display: 'flex', alignItems: 'center', gap: 16,
              background: report.exceeded ? 'var(--rose-soft)' : 'var(--green-soft)',
              borderColor: 'transparent',
            }}
          >
            <div
              style={{
                width: 44, height: 44, borderRadius: 10, display: 'grid', placeItems: 'center', flexShrink: 0,
                color: report.exceeded ? 'var(--rose)' : 'var(--green)',
                background: '#fff',
              }}
            >
              {report.exceeded ? <ShieldAlert size={22} /> : <ShieldCheck size={22} />}
            </div>
            <div>
              <strong style={{ display: 'block', fontSize: 15, color: report.exceeded ? 'var(--rose)' : 'var(--green)' }}>
                {report.exceeded ? 'Threshold exceeded' : 'Within threshold'}
              </strong>
              <span style={{ fontSize: 12, color: 'var(--muted)' }}>
                {report.outside_coverage_pct.toFixed(1)}% outside-coverage (threshold: {report.threshold_pct.toFixed(0)}%)
                for the week of {new Date(report.week_start).toLocaleDateString()} – {new Date(report.week_end).toLocaleDateString()}
              </span>
            </div>
          </div>

          <div className="metric-grid" style={{ gridTemplateColumns: 'repeat(3, 1fr)' }}>
            <div className="metric-card">
              <p>Total pickup value</p>
              <strong>{report.total_pickup_value.toLocaleString(undefined, { style: 'currency', currency: 'NGN' })}</strong>
            </div>
            <div className="metric-card">
              <p>Outside-coverage value</p>
              <strong>{report.outside_coverage_value.toLocaleString(undefined, { style: 'currency', currency: 'NGN' })}</strong>
            </div>
            <div className="metric-card">
              <p>Outside-coverage %</p>
              <strong>{report.outside_coverage_pct.toFixed(1)}%</strong>
            </div>
          </div>
        </>
      )}
    </section>
  )
}
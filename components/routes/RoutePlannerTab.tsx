'use client'

import { useEffect, useState } from 'react'
import { AlertTriangle, Check, MapPin, ShieldCheck } from 'lucide-react'
import type { Session } from '@/lib/auth'
import { approveRoutePlan, deleteRoutePlan, getRoutePlan, setRoutePlan, type Outlet, type RoutePlan, type RoutePlanStop } from '@/lib/api'
import { ROUTE_DAYS } from '@/lib/constants'
import { AssociatePicker } from '@/components/shared/AssociatePicker'
import { OutletPicker } from './OutletPicker'
import { RouteStopsList } from './RouteStopsList'
import { ConfirmDialog } from '../shared/ConfirmDialog'

function toStop(outlet: Outlet, sequence: number): RoutePlanStop {
  return {
    outlet_id: outlet.outlet_id,
    outlet_name: outlet.name,
    latitude: outlet.latitude,
    longitude: outlet.longitude,
    address: outlet.address,
    sequence,
  }
}

export function RoutePlannerTab({ session }: { session: Session }) {
  const [associateId, setAssociateId] = useState('')
  const [routeDay, setRouteDay] = useState<string>(ROUTE_DAYS[0])

  const [plan, setPlan] = useState<RoutePlan | null>(null)
  const [stops, setStops] = useState<RoutePlanStop[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const [saving, setSaving] = useState(false)
  const [saveError, setSaveError] = useState<string | null>(null)
  const [saveSuccess, setSaveSuccess] = useState<string | null>(null)

  const [approving, setApproving] = useState(false)

  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false)
  const [deleting, setDeleting] = useState(false)

  useEffect(() => {
    if (!associateId || !routeDay) {
      setPlan(null)
      setStops([])
      return
    }
    load()
  }, [associateId, routeDay])

  async function load() {
    setLoading(true)
    setError(null)
    setSaveSuccess(null)
    try {
      const result = await getRoutePlan(session, associateId, routeDay)
      setPlan(result)
      setStops(result.stops ?? [])
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load route plan')
    } finally {
      setLoading(false)
    }
  }

  function addStop(outlet: Outlet) {
    setStops((prev) => [...prev, toStop(outlet, prev.length + 1)])
    setSaveSuccess(null)
  }

  function moveUp(index: number) {
    if (index === 0) return
    setStops((prev) => {
      const next = [...prev]
      ;[next[index - 1], next[index]] = [next[index], next[index - 1]]
      return next
    })
    setSaveSuccess(null)
  }

  function moveDown(index: number) {
    setStops((prev) => {
      if (index === prev.length - 1) return prev
      const next = [...prev]
      ;[next[index], next[index + 1]] = [next[index + 1], next[index]]
      return next
    })
    setSaveSuccess(null)
  }

  function removeStop(index: number) {
    setStops((prev) => prev.filter((_, i) => i !== index))
    setSaveSuccess(null)
  }

  async function handleSave() {
    if (stops.length === 0) {
      setSaveError('Add at least one outlet before saving.')
      return
    }
    setSaving(true)
    setSaveError(null)
    setSaveSuccess(null)
    try {
      const updated = await setRoutePlan(session, associateId, routeDay, stops.map((s) => s.outlet_id))
      setPlan(updated)
      setStops(updated.stops ?? [])
      setSaveSuccess('Route plan saved.')
    } catch (err) {
      setSaveError(err instanceof Error ? err.message : 'Failed to save route plan')
    } finally {
      setSaving(false)
    }
  }

  async function handleApprove() {
    setApproving(true)
    setSaveError(null)
    try {
      await approveRoutePlan(session, associateId, routeDay)
      setPlan((prev) => (prev ? { ...prev, approved: true } : prev))
      setSaveSuccess('Route plan approved.')
    } catch (err) {
      setSaveError(err instanceof Error ? err.message : 'Failed to approve route plan')
    } finally {
      setApproving(false)
    }
  }

  async function handleDelete() {
    setShowDeleteConfirm(false)
    setDeleting(true)
    try {
      await deleteRoutePlan(session, associateId, routeDay)
      setStops([])
      setPlan(null)
      setSaveSuccess('Route plan deleted.')
    } catch (err) {
      setSaveError(err instanceof Error ? err.message : 'Failed to delete route plan')
    } finally {
      setDeleting(false)
    }
  }

  return (
    <div className="content">
      <div className="page-heading">
        <div>
          <div className="eyebrow"><MapPin size={14} /> ROUTE PLANNING</div>
          <h1>Plan a route</h1>
          <p>Assemble the day&apos;s outlets for a sales associate, in visit order.</p>
        </div>
      </div>

      <section className="panel" style={{ marginBottom: 20 }}>
        <div className="form-grid">
          <div>
            <label style={{ display: 'block', marginBottom: 4 }}>Sales associate</label>
            <AssociatePicker session={session} value={associateId} onChange={setAssociateId} />
          </div>
          <label>
            Route day
            <select value={routeDay} onChange={(e) => setRouteDay(e.target.value)}>
              {ROUTE_DAYS.map((d) => <option key={d} value={d}>{d}</option>)}
            </select>
          </label>
        </div>
      </section>

      {!associateId && (
        <div className="empty-state"><p>Select a sales associate to plan their route.</p></div>
      )}

      {associateId && (
        <>
          {loading && <div className="empty-state"><p>Loading…</p></div>}
          {!loading && error && (
            <div className="empty-state"><AlertTriangle size={18} /><strong>Couldn&apos;t load route plan</strong><p>{error}</p></div>
          )}

          {!loading && !error && (
            <>
              <section className="panel activity-panel" style={{ marginBottom: 20 }}>
                <div className="panel-heading">
                  <div>
                    <h2>Stops for {routeDay}</h2>
                    <p>Drag order matters — this is the sequence the associate will visit outlets in.</p>
                  </div>
                  {plan?.approved && (
                    <span className="status status-success"><ShieldCheck size={12} />Approved</span>
                  )}
                </div>

                <div style={{ marginTop: 16 }}>
                  <RouteStopsList stops={stops} onMoveUp={moveUp} onMoveDown={moveDown} onRemove={removeStop} />
                </div>

                <div style={{ marginTop: 16 }}>
                  <OutletPicker
                    session={session}
                    excludeIds={stops.map((s) => s.outlet_id)}
                    defaultOwnerId={associateId}  // NEW — prefilters to outlets this associate owns
                    onAdd={addStop}
                  />
                </div>

                {saveError && (
                  <div className="empty-state"><AlertTriangle size={18} /><p>{saveError}</p></div>
                )}
                {saveSuccess && (
                  <div className="empty-state"><Check size={18} /><p>{saveSuccess}</p></div>
                )}

                <div className="modal-actions" style={{ marginTop: 20 }}>
                  <button className="secondary-button" onClick={handleApprove} disabled={approving || plan?.approved || stops.length === 0}>
                    {approving ? 'Approving…' : plan?.approved ? 'Approved' : 'Approve route'}
                  </button>
                  <button className="primary-button" onClick={handleSave} disabled={saving}>
                    {saving ? 'Saving…' : 'Save route'}
                  </button>
                </div>

                <button className="secondary-button" onClick={() => setShowDeleteConfirm(true)} disabled={deleting || stops.length === 0}>
                  {deleting ? 'Deleting…' : 'Delete route'}
                </button>

                {showDeleteConfirm && (
                  <ConfirmDialog
                    title="Delete this route plan?"
                    message="This removes every stop for this associate/day, approved or not."
                    confirmLabel="Delete"
                    destructive
                    onConfirm={handleDelete}
                    onCancel={() => setShowDeleteConfirm(false)}
                  />
                )}
              </section>
            </>
          )}
        </>
      )}
    </div>
  )
}
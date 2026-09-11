'use client'

import { useEffect, useState } from 'react'
import { AlertTriangle, Truck, X } from 'lucide-react'
import type { Session } from '@/lib/auth'
import { assignDistributor, getAssignedDistributors, unassignDistributor, type DistributorAssignment, type DistributorSearchResult } from '@/lib/api'
import { AssociatePicker } from '@/components/shared/AssociatePicker'
import { DistributorPicker } from '@/components/shared/DistributorPicker'

export function AssignmentsTab({ session }: { session: Session }) {
  const [associateId, setAssociateId] = useState('')
  const [assignments, setAssignments] = useState<DistributorAssignment[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const [assigning, setAssigning] = useState(false)
  const [assignError, setAssignError] = useState<string | null>(null)

  const [removingId, setRemovingId] = useState<string | null>(null)

  useEffect(() => {
    if (!associateId) {
      setAssignments([])
      return
    }
    load()
  }, [associateId])

  async function load() {
    setLoading(true)
    setError(null)
    try {
      setAssignments(await getAssignedDistributors(session, associateId))
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load assigned distributors')
    } finally {
      setLoading(false)
    }
  }

  async function handleAssign(distributor: DistributorSearchResult) {
    setAssigning(true)
    setAssignError(null)
    try {
        await assignDistributor(session, associateId, distributor.user_id)
        setAssignments((prev) => [
        ...prev,
        {
            sales_associate_id: associateId,
            distributor_id: distributor.user_id,
            distributor_name: distributor.name,
            created_at: new Date().toISOString(),
        },
        ])
        } catch (err) {
            setAssignError(err instanceof Error ? err.message : 'Failed to assign distributor')
        } finally {
            setAssigning(false)
        }
 }

  async function handleUnassign(distributorId: string) {
    setRemovingId(distributorId)
    setError(null)
    try {
      await unassignDistributor(session, associateId, distributorId)
      setAssignments((prev) => prev.filter((a) => a.distributor_id !== distributorId))
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to remove assignment')
    } finally {
      setRemovingId(null)
    }
  }

  return (
    <div className="content">
      <div className="page-heading">
        <div>
          <div className="eyebrow"><Truck size={14} /> DISTRIBUTOR ASSIGNMENTS</div>
          <h1>Assign distributors</h1>
          <p>Set which distributors a sales associate is covered by — used to track outside-coverage pickups.</p>
        </div>
      </div>

      <section className="panel" style={{ marginBottom: 20 }}>
        <label style={{ display: 'block', marginBottom: 4, fontSize: 11, fontWeight: 700, color: '#5f6c66' }}>
          Sales associate
        </label>
        <AssociatePicker session={session} value={associateId} onChange={setAssociateId} />
      </section>

      {!associateId && (
        <div className="empty-state"><p>Select a sales associate to manage their assigned distributors.</p></div>
      )}

      {associateId && (
        <section className="panel activity-panel">
          <div className="panel-heading">
            <div>
              <h2>Assigned distributors</h2>
              <p>Pickups from distributors not on this list count toward outside-coverage.</p>
            </div>
          </div>

          {loading && <div className="empty-state"><p>Loading…</p></div>}
          {!loading && error && (
            <div className="empty-state"><AlertTriangle size={18} /><strong>Couldn&apos;t load assignments</strong><p>{error}</p></div>
          )}

          {!loading && !error && (
            <>
              {assignments.length === 0 ? (
                <p className="muted-cell" style={{ margin: '16px 0' }}>No distributors assigned yet.</p>
              ) : (
                <div className="table-wrap" style={{ marginTop: 16 }}>
                  <table>
                    <thead><tr><th>Distributor</th><th>Assigned since</th><th /></tr></thead>
                    <tbody>
                        {assignments.map((a) => (
                        <tr key={a.distributor_id}>
                            <td><strong>{a.distributor_name}</strong><span>{a.distributor_id.slice(0, 12)}</span></td>
                            <td className="muted-cell">{new Date(a.created_at).toLocaleDateString()}</td>
                            <td>
                            <button
                                className="icon-button"
                                onClick={() => handleUnassign(a.distributor_id)}
                                disabled={removingId === a.distributor_id}
                                aria-label={`Remove ${a.distributor_name}`}
                                title="Remove assignment"
                            >
                                <X size={15} />
                            </button>
                            </td>
                        </tr>
                        ))}
                    </tbody>
                  </table>
                </div>
              )}

              <div style={{ marginTop: 16 }}>
                <label style={{ display: 'block', marginBottom: 4, fontSize: 11, fontWeight: 700, color: '#5f6c66' }}>
                  Add a distributor
                </label>
                <DistributorPicker
                  session={session}
                  excludeIds={assignments.map((a) => a.distributor_id)}
                  onSelect={handleAssign}
                />
                {assigning && <p className="muted-cell" style={{ marginTop: 6 }}>Assigning…</p>}
                {assignError && (
                  <div className="empty-state" style={{ marginTop: 10 }}><AlertTriangle size={18} /><p>{assignError}</p></div>
                )}
              </div>
            </>
          )}
        </section>
      )}
    </div>
  )
}
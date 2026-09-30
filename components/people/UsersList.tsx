'use client'

import { useState } from 'react'
import { AlertTriangle, Pencil, Power, PowerOff } from 'lucide-react'
import type { Session } from '@/lib/auth'
import { setUserActive, type GroupedUsers, type UserSummary } from '@/lib/api'
import { Status } from '../dashboard/Status'
import { ConfirmDialog } from '../shared/ConfirmDialog'
import { EditUserModal } from './EditUserModal'

export function UsersList({
  session,
  loading,
  error,
  users,
  onUserUpdated,
}: {
  session: Session
  loading: boolean
  error: string | null
  users: GroupedUsers
  onUserUpdated: (updated: UserSummary) => void
}) {
  const [editingUser, setEditingUser] = useState<UserSummary | null>(null)
  const [confirmingUser, setConfirmingUser] = useState<UserSummary | null>(null)
  const [togglingId, setTogglingId] = useState<string | null>(null)
  const [toggleError, setToggleError] = useState<string | null>(null)

  async function handleToggleActive(user: UserSummary) {
    setConfirmingUser(null)
    setTogglingId(user.user_id)
    setToggleError(null)
    try {
      await setUserActive(session, user.user_id, !user.active)
      onUserUpdated({ ...user, active: !user.active })
    } catch (err) {
      setToggleError(err instanceof Error ? err.message : 'Failed to update user status')
    } finally {
      setTogglingId(null)
    }
  }

  return (
    <section className="panel activity-panel" style={{ marginTop: 24 }}>
      <div className="panel-heading"><div><h2>Existing users</h2><p>Grouped by role.</p></div></div>

      {loading && <div className="empty-state"><p>Loading…</p></div>}
      {!loading && error && <div className="empty-state"><AlertTriangle size={18} /><strong>Couldn&apos;t load users</strong><p>{error}</p></div>}
      {toggleError && <div className="empty-state"><AlertTriangle size={18} /><p>{toggleError}</p></div>}

      {!loading && !error && (
        <>
          {([
            ['Admins', users.admins],
            ['Sales associates', users.sales],
            ['Distributors', users.distributors],
            ['Supervisors', users.supervisors],
          ] as const).map(([label, list]) => (
            <div key={label} style={{ marginBottom: 20 }}>
              <h3 style={{ margin: '12px 0 8px' }}>{label} ({list.length})</h3>
              {list.length === 0 ? (
                <p className="muted-cell">None yet.</p>
              ) : (
                <div className="table-wrap">
                  <table>
                    <thead><tr><th>Name</th><th>Email</th><th>Phone</th><th>Verified</th><th>Status</th><th /></tr></thead>
                    <tbody>
                      {list.map((u) => (
                        <tr key={u.user_id} style={{ opacity: u.active ? 1 : 0.55 }}>
                          <td><strong>{u.name}</strong></td>
                          <td>{u.email}</td>
                          <td>{u.phone}</td>
                          <td><Status value={u.verified ? 'Confirmed' : 'Pending'} /></td>
                          <td>{u.active ? <Status value="Confirmed" tone="success" /> : <Status value="Inactive" tone="danger" />}</td>
                          <td>
                            <button className="icon-button" onClick={() => setEditingUser(u)} aria-label={`Edit ${u.name}`} title="Edit profile">
                              <Pencil size={15} />
                            </button>
                            <button
                              className="icon-button"
                              onClick={() => setConfirmingUser(u)}
                              disabled={togglingId === u.user_id}
                              aria-label={u.active ? `Deactivate ${u.name}` : `Reactivate ${u.name}`}
                              title={u.active ? 'Deactivate user' : 'Reactivate user'}
                            >
                              {u.active ? <PowerOff size={15} /> : <Power size={15} />}
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          ))}
        </>
      )}

      {editingUser && (
        <EditUserModal
          session={session}
          user={editingUser}
          onClose={() => setEditingUser(null)}
          onSaved={onUserUpdated}
        />
      )}

      {confirmingUser && (
        <ConfirmDialog
          title={confirmingUser.active ? `Deactivate ${confirmingUser.name}?` : `Reactivate ${confirmingUser.name}?`}
          message={
            confirmingUser.active
              ? "They won't be able to log in until reactivated. Their past pickups, sales, and outlets are kept."
              : "They'll be able to log in again immediately."
          }
          confirmLabel={confirmingUser.active ? 'Deactivate' : 'Reactivate'}
          destructive={confirmingUser.active}
          onConfirm={() => handleToggleActive(confirmingUser)}
          onCancel={() => setConfirmingUser(null)}
        />
      )}
    </section>
  )
}
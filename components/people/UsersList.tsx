'use client'

import { AlertTriangle } from 'lucide-react'
import { Status } from '../dashboard/Status'
import type { GroupedUsers } from '@/lib/api'

export function UsersList({
  loading,
  error,
  users,
}: {
  loading: boolean
  error: string | null
  users: GroupedUsers
}) {
  return (
    <section className="panel activity-panel" style={{ marginTop: 24 }}>
      <div className="panel-heading"><div><h2>Existing users</h2><p>Grouped by role.</p></div></div>
      {loading && <div className="empty-state"><p>Loading…</p></div>}
      {!loading && error && <div className="empty-state"><AlertTriangle size={18} /><strong>Couldn&apos;t load users</strong><p>{error}</p></div>}
      {!loading && !error && (
        <>
          {([
            ['Admins', users.admins],
            ['Sales associates', users.sales],
            ['Distributors', users.distributors],
          ] as const).map(([label, list]) => (
            <div key={label} style={{ marginBottom: 20 }}>
              <h3 style={{ margin: '12px 0 8px' }}>{label} ({list.length})</h3>
              {list.length === 0 ? (
                <p className="muted-cell">None yet.</p>
              ) : (
                <div className="table-wrap">
                  <table>
                    <thead><tr><th>Name</th><th>Email</th><th>Phone</th><th>Status</th></tr></thead>
                    <tbody>
                      {list.map((u) => (
                        <tr key={u.user_id}>
                          <td><strong>{u.name}</strong></td>
                          <td>{u.email}</td>
                          <td>{u.phone}</td>
                          <td><Status value={u.verified ? 'Confirmed' : 'Pending'} /></td>
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
    </section>
  )
}
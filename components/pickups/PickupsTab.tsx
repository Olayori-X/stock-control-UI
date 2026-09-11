'use client'

import { AlertTriangle, Check, PackageCheck, Plus } from 'lucide-react'
import { Status } from '../dashboard/Status'
import type { PickupRequest } from '@/lib/api'

export function PickupsTab({
  loading,
  error,
  requests,
  counterpartLabel,
  onNewPickup,
}: {
  loading: boolean
  error: string | null
  requests: PickupRequest[]
  counterpartLabel: string
  onNewPickup: () => void
}) {
  return (
    <div className="content">
      <div className="page-heading">
        <div>
          <div className="eyebrow"><PackageCheck size={14} /> PICKUPS</div>
          <h1>Your pickup requests</h1>
          <p>Requests you have sent, awaiting distributor confirmation.</p>
        </div>
        <button className="primary-button" onClick={onNewPickup}><Plus size={17} /> New pickup</button>
      </div>
      <section className="panel activity-panel">
        {loading && <div className="empty-state"><p>Loading…</p></div>}
        {!loading && error && (
          <div className="empty-state"><AlertTriangle size={18} /><strong>Couldn&apos;t load requests</strong><p>{error}</p></div>
        )}
        {!loading && !error && requests.length === 0 && (
          <div className="empty-state"><Check size={18} /><strong>You&apos;re all caught up</strong><p>New activity will appear here when it&apos;s ready.</p></div>
        )}
        {!loading && !error && requests.length > 0 && (
          <div className="table-wrap">
            <table>
              <thead><tr><th>Request ID</th><th>{counterpartLabel}</th><th>Items</th><th>Status</th><th>Created</th></tr></thead>
              <tbody>
                {requests.map((req) => (
                  <tr key={req.request_id}>
                    <td><strong>{req.request_id.slice(0, 8)}</strong></td>
                    <td>{req.sales_associate_name}</td>
                    <td>{req.products.length} item{req.products.length === 1 ? '' : 's'}</td>
                    <td><Status value={req.confirmed ? 'Confirmed' : 'Pending'} /></td>
                    <td className="muted-cell">{new Date(req.created_at).toLocaleString()}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </div>
  )
}
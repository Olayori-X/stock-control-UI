'use client'

import { useState } from 'react'
import { AlertTriangle, Boxes, Check, LogOut, PackageCheck } from 'lucide-react'
import type { Session } from '@/lib/auth'
import { Status } from './Status'
import { InvoicesSection } from './InvoicesSection'
import { ReceiptsSection } from './ReceiptsSection'
import type { PickupRequest } from '@/lib/api'

export function DistributorPortal({
  session,
  loading,
  error,
  requests,
  confirmingId,
  onConfirm,
  onLogout,
}: {
  session: Session
  loading: boolean
  error: string | null
  requests: PickupRequest[]
  confirmingId: string | null
  onConfirm: (requestId: string) => void
  onLogout: () => void
}) {
  const pending = requests.filter((r) => !r.confirmed)

  // Bumping this key remounts ReceiptsSection, forcing a fresh fetch —
  // simpler than threading a manual refetch function down through props.
  const [receiptsRefreshKey, setReceiptsRefreshKey] = useState(0)

  return (
    <main className="app-shell">
      <section className="main-panel" style={{ marginLeft: 0, width: '100%' }}>
        <header className="topbar">
          <div className="breadcrumb"><Boxes size={18} /><span>RouteIQ</span><span>/</span><strong>Pickup requests</strong></div>
          <div className="top-actions">
            <button className="icon-button" onClick={onLogout} aria-label="Log out" title="Log out"><LogOut size={17} /></button>
          </div>
        </header>
        <div className="content">
          <div className="page-heading">
            <div>
              <div className="eyebrow"><PackageCheck size={14} /> DISTRIBUTOR PORTAL</div>
              <h1>Pending pickup requests</h1>
              <p>Review incoming requests from sales associates and confirm the ones you can fulfill.</p>
            </div>
          </div>
          <section className="panel activity-panel">
            {loading && <div className="empty-state"><p>Loading…</p></div>}
            {!loading && error && (
              <div className="empty-state"><AlertTriangle size={18} /><strong>Couldn&apos;t load requests</strong><p>{error}</p></div>
            )}
            {!loading && !error && pending.length === 0 && (
              <div className="empty-state"><Check size={18} /><strong>You&apos;re all caught up</strong><p>New pickup requests will appear here.</p></div>
            )}
            {!loading && !error && pending.length > 0 && (
              <div className="table-wrap">
                <table>
                  <thead><tr><th>Request ID</th><th>Sales associate</th><th>Items</th><th>Status</th><th>Created</th><th /></tr></thead>
                  <tbody>
                    {pending.map((req) => (
                      <tr key={req.request_id}>
                        <td><strong>{req.request_id.slice(0, 8)}</strong></td>
                        <td>{req.sales_associate_name}</td>
                        <td>{req.products.length} item{req.products.length === 1 ? '' : 's'}</td>
                        <td><Status value={req.confirmed ? 'Confirmed' : 'Pending'} /></td>
                        <td className="muted-cell">{new Date(req.created_at).toLocaleString()}</td>
                        <td>
                          <button className="text-button" onClick={() => onConfirm(req.request_id)} disabled={confirmingId === req.request_id}>
                            {confirmingId === req.request_id ? 'Confirming…' : 'Confirm'}
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </section>

          <InvoicesSection session={session} onPaymentRecorded={() => setReceiptsRefreshKey((k) => k + 1)} />
          <ReceiptsSection key={receiptsRefreshKey} session={session} />
        </div>
      </section>
    </main>
  )
}
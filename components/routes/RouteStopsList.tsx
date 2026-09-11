'use client'

import { ArrowDown, ArrowUp, X } from 'lucide-react'
import type { RoutePlanStop } from '@/lib/api'

export function RouteStopsList({
  stops,
  onMoveUp,
  onMoveDown,
  onRemove,
}: {
  stops: RoutePlanStop[]
  onMoveUp: (index: number) => void
  onMoveDown: (index: number) => void
  onRemove: (index: number) => void
}) {
  if (stops.length === 0) {
    return <p className="muted-cell">No stops added yet. Search below to add outlets.</p>
  }

  return (
    <div className="table-wrap">
      <table>
        <thead><tr><th>#</th><th>Outlet</th><th>Address</th><th /></tr></thead>
        <tbody>
          {stops.map((stop, index) => (
            <tr key={stop.outlet_id}>
              <td className="muted-cell">{index + 1}</td>
              <td><strong>{stop.outlet_name}</strong></td>
              <td className="muted-cell">{stop.address || '—'}</td>
              <td>
                <button className="icon-button" onClick={() => onMoveUp(index)} disabled={index === 0} aria-label="Move up" title="Move up">
                  <ArrowUp size={15} />
                </button>
                <button className="icon-button" onClick={() => onMoveDown(index)} disabled={index === stops.length - 1} aria-label="Move down" title="Move down">
                  <ArrowDown size={15} />
                </button>
                <button className="icon-button" onClick={() => onRemove(index)} aria-label={`Remove ${stop.outlet_name}`} title="Remove stop">
                  <X size={15} />
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}
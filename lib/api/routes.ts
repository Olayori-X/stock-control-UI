import { authFetch, type Session } from '../auth'
import { unwrap } from './client'

export interface RoutePlanStop {
  outlet_id: string
  outlet_name: string
  latitude: number
  longitude: number
  address: string
  sequence: number
}

export interface RoutePlan {
  sales_associate_id: string
  route_day: string
  approved: boolean
  stops: RoutePlanStop[]
  updated_at: string
}

export async function getRoutePlan(session: Session, salesAssociateId: string, routeDay: string): Promise<RoutePlan> {
  const params = new URLSearchParams({ sales_associate_id: salesAssociateId, route_day: routeDay })
  const res = await authFetch(`/admin/routeplan?${params}`, session)
  return unwrap<RoutePlan>(res)
}

// Replaces the entire day's plan — outletIds order becomes the visit
// sequence. See sqltools.SetRoutePlan on the backend: existing stops for
// this associate/day are deleted, then re-inserted in this order.
export async function setRoutePlan(session: Session, salesAssociateId: string, routeDay: string, outletIds: string[]): Promise<RoutePlan> {
  const res = await authFetch('/admin/routeplan', session, {
    method: 'POST',
    body: JSON.stringify({ sales_associate_id: salesAssociateId, route_day: routeDay, outlet_ids: outletIds }),
  })
  return unwrap<RoutePlan>(res)
}

export async function approveRoutePlan(session: Session, salesAssociateId: string, routeDay: string): Promise<void> {
  const res = await authFetch('/admin/routeplan/approve', session, {
    method: 'POST',
    body: JSON.stringify({ sales_associate_id: salesAssociateId, route_day: routeDay }),
  })
  await unwrap(res)
}
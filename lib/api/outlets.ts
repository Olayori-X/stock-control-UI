import { authFetch, type Session } from '../auth'
import { unwrap } from './client'

export interface Outlet {
  outlet_id: string
  name: string
  address: string
  outlet_type: string
  phone: string
  latitude: number
  longitude: number
  area: string
  zone: string
  assigned_sales_associate_id: string
  route_day: string
  priority: string
  active: boolean
  created_at: string
  updated_at: string
}

export interface OutletInput {
  name: string
  address: string
  outlet_type: string
  phone: string
  latitude: number
  longitude: number
  area: string
  zone: string
  assigned_sales_associate_id: string
  route_day: string
  priority: string
}

export interface EditOutletInput extends OutletInput {
  outlet_id: string
}

export async function getOutlets(session: Session, includeInactive = false, ownerId = ''): Promise<Outlet[]> {
  const base = session.role === 'supervisor' ? '/supervisor/outlets' : '/admin/outlets'

  const params = new URLSearchParams()
  if (includeInactive) params.set('include_inactive', 'true')
  if (ownerId) params.set('assigned_sales_associate_id', ownerId)
  const qs = params.toString()

  const res = await authFetch(`${base}${qs ? `?${qs}` : ''}`, session)
  return unwrap<Outlet[]>(res)
}

export async function getOutletByID(session: Session, outletId: string): Promise<Outlet> {
  const res = await authFetch(`/admin/outletbyid?outlet_id=${encodeURIComponent(outletId)}`, session)
  return unwrap<Outlet>(res)
}

export async function addOutlet(session: Session, input: OutletInput): Promise<Outlet> {
  const res = await authFetch('/admin/addoutlet', session, {
    method: 'POST',
    body: JSON.stringify(input),
  })
  return unwrap<Outlet>(res)
}

export async function editOutlet(session: Session, input: EditOutletInput): Promise<Outlet> {
  const res = await authFetch('/admin/editoutlet', session, {
    method: 'PUT',
    body: JSON.stringify(input),
  })
  return unwrap<Outlet>(res)
}

export async function setOutletActive(session: Session, outletId: string, active: boolean): Promise<void> {
  const res = await authFetch(
    `/admin/deactivateoutlet?outlet_id=${encodeURIComponent(outletId)}&active=${active}`,
    session,
    { method: 'DELETE' }
  )
  await unwrap(res)
}
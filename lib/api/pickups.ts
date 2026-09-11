import { authFetch, type Session } from '../auth'
import { unwrap } from './client'

export interface ProductItem {
  sku: string
  name: string
  quantity: number
}

// NOTE: the Go backend reuses one struct (models.PendingPickupRequest) for
// both distributor and sales views, and `sales_associate_name` does NOT
// always hold the sales associate's name:
//   - GET /distributor/pendingrequests -> sales_associate_name = the sales associate (correct)
//   - GET /sales/unacceptedrequests    -> sales_associate_name = the DISTRIBUTOR's name (mislabeled)
export interface PickupRequest {
  request_id: string
  sales_associate_id: string
  distributor_id: string
  products: ProductItem[]
  confirmed: boolean
  created_at: string
  updated_at: string
  sales_associate_name: string
}

export interface DistributorSearchResult {
  user_id: string
  name: string
  email: string
  phone: string
  role: string
}

export interface CreatePickupRequestInput {
  distributor_id: string
  products: ProductItem[]
}

export async function getUnacceptedPickupRequests(session: Session): Promise<PickupRequest[]> {
  const res = await authFetch('/sales/unacceptedrequests', session)
  return unwrap<PickupRequest[]>(res)
}

export async function getPendingPickupRequests(session: Session): Promise<PickupRequest[]> {
  const res = await authFetch('/distributor/pendingrequests', session)
  return unwrap<PickupRequest[]>(res)
}

export async function confirmPickupRequest(session: Session, requestId: string): Promise<void> {
  const res = await authFetch('/distributor/confirmrequest', session, {
    method: 'POST',
    body: JSON.stringify({ request_id: requestId, distributor_id: session.userId }),
  })
  await unwrap(res)
}

export async function searchDistributors(session: Session, query: string): Promise<DistributorSearchResult[]> {
  const res = await authFetch(`/sales/searchdistributor?query=${encodeURIComponent(query)}`, session)
  const data = await unwrap<{ users: DistributorSearchResult[]; total: number }>(res)
  return data.users ?? []
}

export async function createPickupRequest(session: Session, input: CreatePickupRequestInput): Promise<PickupRequest> {
  const res = await authFetch('/sales/createrequest', session, {
    method: 'POST',
    body: JSON.stringify({
      sales_associate_id: session.userId,
      distributor_id: input.distributor_id,
      products: input.products,
    }),
  })
  return unwrap<PickupRequest>(res)
}
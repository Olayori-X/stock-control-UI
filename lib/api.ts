import { authFetch, type Session } from './auth'

// ── Types matching the Go backend's models package ──────────────────────────
export interface Product {
  sku: string
  name: string
  created_at: string
  updated_at: string
}

export interface ProductItem {
  sku: string
  name: string
  quantity: number
}

// NOTE: the Go backend reuses one struct (models.PendingPickupRequest) for
// both distributor and sales views, and the `sales_associate_name` field
// does NOT always hold the sales associate's name:
//   - GET /distributor/pendingrequests  -> sales_associate_name = the sales associate (correct)
//   - GET /sales/unacceptedrequests     -> sales_associate_name = the DISTRIBUTOR's name (mislabeled)
// See internal/tools/sql/sql_db_functions.go: GetPendingPickupRequests joins
// on distributor_id, GetUnacceptedPickupRequests joins on sales_associate_id
// but both scan into the same `sales_associate_name` column. Handle per call site.
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

async function unwrap<T>(res: Response): Promise<T> {
  if (!res.ok) {
    let message = `Request failed (${res.status})`
    try {
      const body = await res.json()
      if (body?.Message) message = body.Message
    } catch {
      // ignore non-JSON error bodies
    }
    throw new Error(message)
  }
  return res.json()
}

// admin + sales can both hit GET /*/products — same handler either way.
export async function getProducts(session: Session): Promise<Product[]> {
  const path = session.role === 'admin' ? '/admin/products' : '/sales/products'
  const res = await authFetch(path, session)
  return unwrap<Product[]>(res)
}

// Sales associate's own requests that no distributor has confirmed yet.
// `sales_associate_name` on each row is actually the distributor's name here.
export async function getUnacceptedPickupRequests(session: Session): Promise<PickupRequest[]> {
  const res = await authFetch('/sales/unacceptedrequests', session)
  return unwrap<PickupRequest[]>(res)
}

// Requests waiting on this distributor to confirm.
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

export type Role = 'admin' | 'sales' | 'distributor'

export interface AddUserInput {
  name: string
  email: string
  phone: string
  password: string
  role: Role
}

// Assumes /admin/signup returns the generated user_id. Adjust the return
// shape below if your SignupHandler actually returns the full user record.
export interface AddUserResult {
  user_id: string
}

export async function addUser(session: Session, input: AddUserInput): Promise<AddUserResult> {
  const res = await authFetch('/admin/signup', session, {
    method: 'POST',
    body: JSON.stringify(input),
  })
  return unwrap<AddUserResult>(res)
}

export interface AddProductInput {
  sku: string
  name: string
}

export interface EditProductInput {
  sku: string
  name: string
}

export async function addProduct(session: Session, input: AddProductInput): Promise<Product> {
  const res = await authFetch('/admin/addproduct', session, {
    method: 'POST',
    body: JSON.stringify(input),
  })
  return unwrap<Product>(res)
}

// admin + sales both hit GET /*/products via the same handler — see getProducts above.

export async function getProductBySKU(session: Session, sku: string): Promise<Product> {
  const path = `/admin/productbysku?sku=${encodeURIComponent(sku)}`
  const res = await authFetch(path, session)
  return unwrap<Product>(res)
}

export async function editProduct(session: Session, input: EditProductInput): Promise<Product> {
  const res = await authFetch('/admin/editproduct', session, {
    method: 'PUT',
    body: JSON.stringify(input),
  })
  return unwrap<Product>(res)
}

export async function deleteProduct(session: Session, sku: string): Promise<void> {
  const res = await authFetch('/admin/deleteproduct', session, {
    method: 'DELETE',
    body: JSON.stringify({ sku }),
  })
  await unwrap(res)
}

export interface DistributorSearchResult {
  user_id: string
  name: string
  email: string
  phone: string
  role: string
}

export async function searchDistributors(session: Session, query: string): Promise<DistributorSearchResult[]> {
  const res = await authFetch(`/sales/searchdistributor?query=${encodeURIComponent(query)}`, session)
  const data = await unwrap<{ users: DistributorSearchResult[]; total: number }>(res)
  return data.users ?? []
}

export interface CreatePickupRequestInput {
  distributor_id: string
  products: ProductItem[]
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

export interface UserSummary {
  user_id: string
  name: string
  email: string
  phone: string
  role: Role
  verified: boolean
  created_at: string
}

export interface GroupedUsers {
  admins: UserSummary[]
  sales: UserSummary[]
  distributors: UserSummary[]
}

export async function getUsers(session: Session): Promise<GroupedUsers> {
  const res = await authFetch('/admin/users', session)
  const data = await unwrap<GroupedUsers>(res)
  return {
    admins: data.admins ?? [],
    sales: data.sales ?? [],
    distributors: data.distributors ?? [],
  }
}
import { authFetch, type Session } from '../auth'
import { unwrap } from './client'

export interface DistributorAssignment {
  sales_associate_id: string
  distributor_id: string
  distributor_name: string
  created_at: string
}

export async function getAssignedDistributors(session: Session, salesAssociateId: string): Promise<DistributorAssignment[]> {
  const res = await authFetch(`/admin/assigneddistributors?sales_associate_id=${encodeURIComponent(salesAssociateId)}`, session)
  const data = await unwrap<DistributorAssignment[]>(res)
  return data ?? []
}

export async function assignDistributor(session: Session, salesAssociateId: string, distributorId: string): Promise<void> {
  const res = await authFetch('/admin/assigndistributor', session, {
    method: 'POST',
    body: JSON.stringify({ sales_associate_id: salesAssociateId, distributor_id: distributorId }),
  })
  await unwrap(res)
}

export async function unassignDistributor(session: Session, salesAssociateId: string, distributorId: string): Promise<void> {
  const params = new URLSearchParams({ sales_associate_id: salesAssociateId, distributor_id: distributorId })
  const res = await authFetch(`/admin/unassigndistributor?${params}`, session, { method: 'DELETE' })
  await unwrap(res)
}
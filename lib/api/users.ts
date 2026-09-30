import { authFetch, type Session } from '../auth'
import { unwrap } from './client'

export type Role = 'admin' | 'sales' | 'distributor' | 'supervisor'

export interface AddUserInput {
  name: string
  email: string
  phone: string
  password: string
  role: Role
}

export interface AddUserResult {
  user_id: string
}

export interface UserSummary {
  user_id: string
  name: string
  email: string
  phone: string
  role: Role
  verified: boolean
  active: boolean
  created_at: string
}

export interface EditUserInput {
  user_id: string
  name: string
  email: string
  phone: string
}

export interface GroupedUsers {
  admins: UserSummary[]
  sales: UserSummary[]
  distributors: UserSummary[]
  supervisors: UserSummary[]
}



export async function addUser(session: Session, input: AddUserInput): Promise<AddUserResult> {
  const res = await authFetch('/admin/signup', session, {
    method: 'POST',
    body: JSON.stringify(input),
  })
  return unwrap<AddUserResult>(res)
}

export async function getUsers(session: Session): Promise<GroupedUsers> {
  const res = await authFetch('/admin/users', session)
  const data = await unwrap<GroupedUsers>(res)
  return {
    admins: data.admins ?? [],
    sales: data.sales ?? [],
    distributors: data.distributors ?? [],
    supervisors: data.supervisors ?? [],
  }
}

export async function editUser(session: Session, input: EditUserInput): Promise<UserSummary> {
  const res = await authFetch('/admin/edituser', session, {
    method: 'PUT',
    body: JSON.stringify(input),
  })
  return unwrap<UserSummary>(res)
}

export async function setUserActive(session: Session, userId: string, active: boolean): Promise<void> {
  const res = await authFetch(
    `/admin/deactivateuser?user_id=${encodeURIComponent(userId)}&active=${active}`,
    session,
    { method: 'DELETE' }
  )
  await unwrap(res)
}
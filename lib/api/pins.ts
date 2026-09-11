import { authFetch, type Session } from '../auth'
import { unwrap } from './client'

export interface SetPINResult {
  user_id: string
  pin: string
}

// Generates and stores a fresh 8-digit PIN for a sales associate, backend-
// side (SetPINHandler rejects non-sales roles). The plaintext PIN is
// returned exactly once — only the hash is stored, same as passwords — so
// the caller must capture and relay it now; it cannot be retrieved again.
export async function setPIN(session: Session, userId: string): Promise<SetPINResult> {
  const res = await authFetch('/admin/setpin', session, {
    method: 'POST',
    body: JSON.stringify({ user_id: userId }),
  })
  return unwrap<SetPINResult>(res)
}
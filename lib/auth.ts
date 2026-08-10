import { apiConfig, type Role } from './mock-data'

// ── Types matching the Go backend's api.LoginResponse (internal/handlers/auth/login.go) ──
export interface LoginResult {
  code: number
  user_id: string
  role: string
  message: string
  token: string
  verified: boolean
}

export interface Session {
  userId: string
  role: Role
  token: string
  verified: boolean
}

export class AuthError extends Error {}

const SESSION_KEY = 'stockwise_session'

const isRole = (value: string): value is Role =>
  value === 'admin' || value === 'sales' || value === 'distributor'

// ── Login ──────────────────────────────────────────────────────────────────
// Hits POST /auth/login on the Go backend. That handler has no method guard
// and no CORS preflight issues as long as NEXT_PUBLIC_API_BASE_URL points at
// an origin the backend's cors.Handler allows (see cmd/api/main.go AllowedOrigins).
export async function login(email: string, password: string): Promise<Session> {
  const res = await fetch(`${apiConfig.baseUrl}/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password }),
  })

  let body: Partial<LoginResult> & { message?: string } = {}
  try {
    body = await res.json()
  } catch {
    // non-JSON error body — fall through to the generic message below
  }

  if (!res.ok) {
    throw new AuthError(body.message || `Login failed (${res.status})`)
  }

  if (!body.user_id || !body.token || !body.role || !isRole(body.role)) {
    throw new AuthError('Unexpected response from server')
  }

  const session: Session = {
    userId: body.user_id,
    role: body.role,
    token: body.token,
    verified: Boolean(body.verified),
  }

  setSession(session)
  return session
}

// ── Session persistence ───────────────────────────────────────────────────
// localStorage is fine here — this is a real browser app, not a Claude
// artifact sandbox.
export function getSession(): Session | null {
  if (typeof window === 'undefined') return null
  try {
    const raw = window.localStorage.getItem(SESSION_KEY)
    if (!raw) return null
    const parsed = JSON.parse(raw)
    if (!parsed || !isRole(parsed.role) || !parsed.userId || !parsed.token) return null
    return parsed as Session
  } catch {
    return null
  }
}

export function setSession(session: Session): void {
  if (typeof window === 'undefined') return
  window.localStorage.setItem(SESSION_KEY, JSON.stringify(session))
}

export function clearSession(): void {
  if (typeof window === 'undefined') return
  window.localStorage.removeItem(SESSION_KEY)
}

// ── Authenticated fetch ────────────────────────────────────────────────────
// The Go middleware (internal/middleware/authorization.go) reads the caller
// from the `userid` header and the session token from `Authorization` — not
// a Bearer scheme, just the raw token.
export function authFetch(path: string, session: Session, init: RequestInit = {}) {
  return fetch(`${apiConfig.baseUrl}${path}`, {
    ...init,
    headers: {
      ...(init.headers || {}),
      userid: session.userId,
      Authorization: session.token,
      'Content-Type': 'application/json',
    },
  })
}
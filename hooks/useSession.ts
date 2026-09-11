'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { getSession, type Session } from '@/lib/auth'

// Every authenticated page needs the same three states: still checking
// localStorage (undefined), no session so redirecting (null), or a real
// session to render against. This was duplicated in every page before —
// now it's one hook.
export function useSession() {
  const router = useRouter()
  const [session, setSession] = useState<Session | null | undefined>(undefined)

  useEffect(() => {
    const existing = getSession()
    if (!existing) {
      router.replace('/login')
      return
    }
    setSession(existing)
  }, [router])

  return session
}
'use client'

import { useEffect, useState, type FormEvent } from 'react'
import { useRouter } from 'next/navigation'
import { Boxes, LoaderCircle, LogIn, MailCheck } from 'lucide-react'
import { login, getSession, AuthError } from '@/lib/auth'

export default function LoginPage() {
  const router = useRouter()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [needsVerification, setNeedsVerification] = useState(false)

  useEffect(() => {
    if (getSession()) router.replace('/')
  }, [router])

  async function handleSubmit(e: FormEvent) {
    e.preventDefault()
    setError(null)
    setNeedsVerification(false)
    setSubmitting(true)
    try {
      const session = await login(email, password)
      if (!session.verified) {
        setNeedsVerification(true)
      }
      router.push('/')
    } catch (err) {
      setError(err instanceof AuthError ? err.message : 'Something went wrong. Please try again.')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <main className="auth-shell">
      <section className="auth-card">
        <div className="auth-brand">
          <div className="brand-mark"><Boxes size={20} /></div>
          <span>Stockwise</span>
        </div>
        <h1>Sign in</h1>
        <p>Use your work email and password to access your workspace.</p>

        {needsVerification && (
          <div className="auth-note">
            <MailCheck size={16} />
            <span>We sent a fresh verification code to your email. You can continue for now.</span>
          </div>
        )}

        {error && <div className="auth-error">{error}</div>}

        <form className="auth-form" onSubmit={handleSubmit}>
          <label>
            Email
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@company.com"
              autoComplete="email"
              required
            />
          </label>
          <label>
            Password
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              autoComplete="current-password"
              required
            />
          </label>
          <button className="primary-button auth-submit" type="submit" disabled={submitting}>
            {submitting ? <LoaderCircle size={16} className="spin" /> : <LogIn size={16} />}
            {submitting ? 'Signing in…' : 'Sign in'}
          </button>
        </form>
      </section>
    </main>
  )
}
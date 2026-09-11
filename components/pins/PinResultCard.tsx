'use client'

import { useState } from 'react'
import { Check, Copy, ShieldAlert, X } from 'lucide-react'

export function PinResultCard({
  associateName,
  pin,
  onDismiss,
}: {
  associateName: string
  pin: string
  onDismiss: () => void
}) {
  const [copied, setCopied] = useState(false)

  async function handleCopy() {
    try {
      await navigator.clipboard.writeText(pin)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch {
      // Clipboard API can fail (permissions, insecure context) — the PIN
      // is still visible on screen either way, so this isn't fatal.
    }
  }

  return (
    <div className="modal-backdrop" role="presentation">
      <section className="modal" role="dialog" aria-modal="true" aria-labelledby="pin-result-title" style={{ maxWidth: 420 }}>
        <div className="modal-heading">
          <div><span className="eyebrow">NEW PIN</span><h2 id="pin-result-title">PIN for {associateName}</h2></div>
          <button className="icon-button" onClick={onDismiss} aria-label="Close"><X size={18} /></button>
        </div>

        <div className="auth-note" style={{ marginBottom: 18 }}>
          <ShieldAlert size={16} />
          <span>This PIN is shown once and cannot be retrieved again. Relay it to the associate now, then close this dialog.</span>
        </div>

        <div
          style={{
            display: 'flex', alignItems: 'center', justifyContent: 'space-between',
            border: '1px solid var(--line)', borderRadius: 8, padding: '14px 16px', marginBottom: 20,
          }}
        >
          <span style={{ fontSize: 24, fontWeight: 700, letterSpacing: '0.15em', fontVariantNumeric: 'tabular-nums' }}>
            {pin}
          </span>
          <button className="icon-button" onClick={handleCopy} aria-label="Copy PIN" title="Copy PIN">
            {copied ? <Check size={17} /> : <Copy size={17} />}
          </button>
        </div>

        <div className="modal-actions">
          <button className="primary-button" onClick={onDismiss}>I&apos;ve relayed this PIN</button>
        </div>
      </section>
    </div>
  )
}
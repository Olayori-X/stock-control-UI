'use client'

import { useEffect, useState } from 'react'
import { AlertTriangle, Settings2 } from 'lucide-react'
import type { Session } from '@/lib/auth'
import { getIntegrationSettings, type IntegrationSettings } from '@/lib/api'
import { IntegrationSettingsCard } from './IntegrationSettingsCard'

export function SettingsTab({ session }: { session: Session }) {
  const [settings, setSettings] = useState<IntegrationSettings | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    load()
  }, [session])

  async function load() {
    setLoading(true)
    setError(null)
    try {
      setSettings(await getIntegrationSettings(session))
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load settings')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="content">
      <div className="page-heading">
        <div>
          <div className="eyebrow"><Settings2 size={14} /> SETTINGS</div>
          <h1>Integrations</h1>
          <p>Configure the Google Sheets destinations for pickup and sales sync.</p>
        </div>
      </div>

      {loading && <div className="empty-state"><p>Loading…</p></div>}
      {!loading && error && (
        <div className="empty-state"><AlertTriangle size={18} /><strong>Couldn&apos;t load settings</strong><p>{error}</p></div>
      )}
      {!loading && !error && settings && (
        <>
          <IntegrationSettingsCard
            session={session}
            settingKey="PICKUP_REQUESTS_SPREADSHEET_ID"
            label="Pickup Requests Sheet"
            description="Every pickup request created by a sales associate is appended here, along with confirmation status."
            currentMaskedValue={settings.PICKUP_REQUESTS_SPREADSHEET_ID}
            onSaved={load}
          />
          <IntegrationSettingsCard
            session={session}
            settingKey="SALES_SPREADSHEET_ID"
            label="Sales Sheet"
            description="Every sale captured in the field — with GPS, geofence status, and resumption result — is appended here."
            currentMaskedValue={settings.SALES_SPREADSHEET_ID}
            onSaved={load}
          />
        </>
      )}
    </div>
  )
}
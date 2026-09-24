import { authFetch, type Session } from '../auth'
import { unwrap } from './client'

// Backend never returns the real value — GetIntegrationSettingsHandler
// masks it (e.g. "••••3xQ2") so a configured-but-hidden secret can be
// shown as "already set" without ever exposing it over the wire again.
export interface IntegrationSettings {
  PICKUP_REQUESTS_SPREADSHEET_ID: string
  SALES_SPREADSHEET_ID: string
}

export async function getIntegrationSettings(session: Session): Promise<IntegrationSettings> {
  const res = await authFetch('/admin/integrationsettings', session)
  return unwrap<IntegrationSettings>(res)
}

export async function setIntegrationSetting(session: Session, key: string, value: string): Promise<void> {
  const res = await authFetch('/admin/integrationsettings', session, {
    method: 'POST',
    body: JSON.stringify({ key, value }),
  })
  await unwrap(res)
}
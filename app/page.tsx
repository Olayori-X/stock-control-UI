'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { navigation } from '@/lib/mock-data'
import { clearSession } from '@/lib/auth'
import { useSession } from '@/hooks/useSession'
import {
  confirmPickupRequest, getPendingPickupRequests, getUnacceptedPickupRequests,
  type PickupRequest, type Role,
} from '@/lib/api'

import { Sidebar } from '@/components/dashboard/Sidebar'
import { Topbar } from '@/components/dashboard/Topbar'
import { DistributorPortal } from '@/components/dashboard/DistributorPortal'
import { PickupsTab } from '@/components/pickups/PickupsTab'
import { NewPickupModal } from '@/components/pickups/NewPickupModal'
import { InventoryTab } from '@/components/inventory/InventoryTab'
import { PeopleTab } from '@/components/people/PeopleTab'
import { OutletsTab } from '@/components/outlets/OutletsTab'
import { RoutePlannerTab } from '@/components/routes/RoutePlannerTab'
import { AssignmentsTab } from '@/components/assignments/AssignmentsTab'
import { PinManagementTab } from '@/components/pins/PinManagementTab'
import { ReportsTab } from '@/components/reports/ReportsTab'

// Which sidebar sections each role can see. Distributor never reaches this —
// they get a dedicated single-purpose view (DistributorPortal), no sidebar
// at all. Admins do not create pickups, so 'Pickups' is sales-only.
const navByRole: Record<Role, string[]> = {
  admin: ['Outlets', 'Routes', 'Assignments', 'PINs', 'Reports', 'Inventory', 'People & roles'],
  sales: ['Pickups', 'Inventory'],
  distributor: [],
}

export default function Page() {
  const router = useRouter()
  const session = useSession()

  const [activeNav, setActiveNav] = useState('')
  const [mobileOpen, setMobileOpen] = useState(false)
  const [showPickup, setShowPickup] = useState(false)

  const role = session?.role ?? 'admin'
  const currentNav = navByRole[role].includes(activeNav) ? activeNav : navByRole[role][0]

  // Pickup requests: sales' own requests, distributor's pending queue.
  const [pickupRequests, setPickupRequests] = useState<PickupRequest[]>([])
  const [loadingPickups, setLoadingPickups] = useState(false)
  const [pickupError, setPickupError] = useState<string | null>(null)
  const [confirmingId, setConfirmingId] = useState<string | null>(null)
  const counterpartLabel = role === 'distributor' ? 'Sales associate' : 'Distributor'

  useEffect(() => {
    if (!session || session.role === 'admin') return
    loadPickups()
  }, [session])

  async function loadPickups() {
    if (!session) return
    setLoadingPickups(true)
    setPickupError(null)
    const fetcher = session.role === 'sales' ? getUnacceptedPickupRequests : getPendingPickupRequests
    try {
      setPickupRequests(await fetcher(session) ?? [])
    } catch (err) {
      setPickupError(err instanceof Error ? err.message : 'Failed to load pickups')
    } finally {
      setLoadingPickups(false)
    }
  }

  async function handleConfirm(requestId: string) {
    if (!session) return
    setConfirmingId(requestId)
    try {
      await confirmPickupRequest(session, requestId)
      setPickupRequests((prev) => prev.map((r) => (r.request_id === requestId ? { ...r, confirmed: true } : r)))
    } catch (err) {
      setPickupError(err instanceof Error ? err.message : 'Failed to confirm request')
    } finally {
      setConfirmingId(null)
    }
  }

  function handlePickupCreated(req: PickupRequest) {
    setPickupRequests((prev) => [req, ...prev])
  }

  function handleLogout() {
    clearSession()
    router.push('/login')
  }

  if (!session) return null

  if (role === 'distributor') {
    return (
      <DistributorPortal
        loading={loadingPickups}
        error={pickupError}
        requests={pickupRequests}
        confirmingId={confirmingId}
        onConfirm={handleConfirm}
        onLogout={handleLogout}
      />
    )
  }

  const visibleNav = navigation.filter((item) => navByRole[role].includes(item.label))

  return (
    <main className="app-shell">
      <Sidebar
        session={session}
        visibleNav={visibleNav}
        currentNav={currentNav}
        mobileOpen={mobileOpen}
        onSelectNav={(label) => { setActiveNav(label); setMobileOpen(false) }}
        onClose={() => setMobileOpen(false)}
      />
      {mobileOpen && <button className="backdrop" onClick={() => setMobileOpen(false)} aria-label="Close navigation" />}

      <section className="main-panel">
        <Topbar session={session} currentNav={currentNav} onOpenMobileNav={() => setMobileOpen(true)} onLogout={handleLogout} />

        {currentNav === 'Outlets' && role === 'admin' && <OutletsTab session={session} />}

        {currentNav === 'Pickups' && role === 'sales' && (
          <PickupsTab
            loading={loadingPickups}
            error={pickupError}
            requests={pickupRequests}
            counterpartLabel={counterpartLabel}
            onNewPickup={() => setShowPickup(true)}
          />
        )}

        {currentNav === 'Inventory' && <InventoryTab session={session} role={role} />}

        {currentNav === 'Routes' && role === 'admin' && <RoutePlannerTab session={session} />}

        {currentNav === 'Assignments' && role === 'admin' && <AssignmentsTab session={session} />}

        {currentNav === 'PINs' && role === 'admin' && <PinManagementTab session={session} />}

        {currentNav === 'Reports' && role === 'admin' && <ReportsTab session={session} />}

        {currentNav === 'People & roles' && role === 'admin' && <PeopleTab session={session} />}
      </section>

      {showPickup && role === 'sales' && (
        <NewPickupModal session={session} onClose={() => setShowPickup(false)} onCreated={handlePickupCreated} />
      )}
    </main>
  )
}
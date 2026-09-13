import { authFetch, type Session } from '../auth'
import { unwrap } from './client'

// Resolves which route prefix to call — supervisors have their own
// mirrored read-only routes for everything except the audit log, which
// stays admin-only (see getAuditLog below, deliberately not using this).
function reportBase(session: Session): string {
  return session.role === 'supervisor' ? '/supervisor' : '/admin'
}

function buildQuery(params: Record<string, string | undefined>): string {
  const search = new URLSearchParams()
  for (const [key, value] of Object.entries(params)) {
    if (value) search.set(key, value)
  }
  const qs = search.toString()
  return qs ? `?${qs}` : ''
}

// ── Sales ────────────────────────────────────────────────────────────────
export interface Sale {
  transaction_id: string
  sales_associate_id: string
  outlet_id: string
  sku: string
  quantity: number
  unit_value: number
  total_value: number
  latitude: number
  longitude: number
  distance_from_outlet_m: number
  geofence_status: string
  route_day: string
  synced_at: string | null
  created_at: string
}

export interface SalesReportResult {
  sales: Sale[]
  total_quantity: number
  total_value: number
  from: string
  to: string
}

export interface SalesFilters {
  salesAssociateId?: string
  outletId?: string
  sku?: string
  from?: string // YYYY-MM-DD
  to?: string   // YYYY-MM-DD
}

export async function getSales(session: Session, filters: SalesFilters = {}): Promise<SalesReportResult> {
  const qs = buildQuery({
    sales_associate_id: filters.salesAssociateId,
    outlet_id: filters.outletId,
    sku: filters.sku,
    from: filters.from,
    to: filters.to,
  })
  const res = await authFetch(`${reportBase(session)}/sales${qs}`, session)
  return unwrap<SalesReportResult>(res)
}

// ── Resumption logs ─────────────────────────────────────────────────────
export interface ResumptionLog {
  sales_associate_id: string
  route_day: string
  date: string
  time: string
  latitude: number
  longitude: number
  distance_to_route_m: number
  result: 'PASS' | 'FAIL'
  device_ref: string
  created_at: string
}

export async function getResumptionLogs(
  session: Session,
  filters: { salesAssociateId?: string; from?: string; to?: string } = {}
): Promise<ResumptionLog[]> {
  const qs = buildQuery({
    sales_associate_id: filters.salesAssociateId,
    from: filters.from,
    to: filters.to,
  })
  const res = await authFetch(`${reportBase(session)}/resumptionlogs${qs}`, session)
  const data = await unwrap<ResumptionLog[]>(res)
  return data ?? []
}

// ── Outlet visits ────────────────────────────────────────────────────────
export interface OutletVisit {
  sales_associate_id: string
  outlet_id: string
  route_day: string
  visited_at: string
  latitude: number
  longitude: number
  distance_from_outlet_m: number
  geofence_status: 'PASS' | 'FAIL'
  created_at: string
}

export async function getOutletVisits(
  session: Session,
  filters: { salesAssociateId?: string; from?: string; to?: string } = {}
): Promise<OutletVisit[]> {
  const qs = buildQuery({
    sales_associate_id: filters.salesAssociateId,
    from: filters.from,
    to: filters.to,
  })
  const res = await authFetch(`${reportBase(session)}/outletvisits${qs}`, session)
  const data = await unwrap<OutletVisit[]>(res)
  return data ?? []
}

// ── Planned vs actual ───────────────────────────────────────────────────
export interface PlannedVsActual {
  sales_associate_id: string
  route_day: string
  date: string
  outlets_planned: number
  outlets_visited: number
  productive_visits: number
  missed_outlets: string[]
  resumption_time?: string
  resumption_result?: string
  last_activity?: string
  sales_calls: number
  sales_value: number
  coverage_pct: number
  route_adherence_pct: number
}

export async function getPlannedVsActual(session: Session, salesAssociateId: string, date?: string): Promise<PlannedVsActual> {
  const qs = buildQuery({ sales_associate_id: salesAssociateId, date })
  const res = await authFetch(`${reportBase(session)}/plannedvsactual${qs}`, session)
  return unwrap<PlannedVsActual>(res)
}

// ── Route efficiency ────────────────────────────────────────────────────
export interface RouteEfficiency {
  sales_associate_id: string
  route_day: string
  outlet_count: number
  planned_distance_m: number
  average_leg_distance_m: number
  centroid_latitude: number
  centroid_longitude: number
  dispersion_m: number
  outliers: string[]
  backtrack_count: number
  backtrack_legs: string[]
  dominant_area: string
  area_alignment_pct: number
  dominant_zone: string
  zone_alignment_pct: number
}

export async function getRouteEfficiency(session: Session, salesAssociateId: string, routeDay: string): Promise<RouteEfficiency> {
  const qs = buildQuery({ sales_associate_id: salesAssociateId, route_day: routeDay })
  const res = await authFetch(`${reportBase(session)}/routeefficiency${qs}`, session)
  return unwrap<RouteEfficiency>(res)
}

// ── Outside coverage ─────────────────────────────────────────────────────
export interface OutsideCoverageReport {
  sales_associate_id: string
  week_start: string
  week_end: string
  total_pickup_value: number
  outside_coverage_value: number
  outside_coverage_pct: number
  threshold_pct: number
  exceeded: boolean
}

export async function getOutsideCoverage(session: Session, salesAssociateId: string, weekStart?: string): Promise<OutsideCoverageReport> {
  const qs = buildQuery({ sales_associate_id: salesAssociateId, week_start: weekStart })
  const res = await authFetch(`${reportBase(session)}/outsidecoverage${qs}`, session)
  return unwrap<OutsideCoverageReport>(res)
}

// ── Audit log ────────────────────────────────────────────────────────────
// Deliberately NOT using reportBase — the audit log is admin-only (no
// /supervisor/auditlog route exists on the backend), matching the brief's
// role split where "audit" sits under Administrator, not Supervisor/Manager.
export interface AuditLogEntry {
  actor_id: string | null
  action: string
  target: string
  details: string
  created_at: string
}

export async function getAuditLog(
  session: Session,
  filters: { actorId?: string; from?: string; to?: string } = {}
): Promise<AuditLogEntry[]> {
  const qs = buildQuery({ actor_id: filters.actorId, from: filters.from, to: filters.to })
  const res = await authFetch(`/admin/auditlog${qs}`, session)
  const data = await unwrap<AuditLogEntry[]>(res)
  return data ?? []
}
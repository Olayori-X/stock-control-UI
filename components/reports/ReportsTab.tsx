'use client'

import { useState } from 'react'
import { BarChart3 } from 'lucide-react'
import type { Session } from '@/lib/auth'
import { SalesReport } from './SalesReport'
import { ResumptionReport } from './ResumptionReport'
import { OutletVisitsReport } from './OutletVisitsReport'
import { PlannedVsActualReport } from './PlannedVsActualReport'
import { RouteEfficiencyReport } from './RouteEfficiencyReport'

const subViews = ['Sales', 'Resumption', 'Outlet visits', 'Planned vs actual', 'Route efficiency'] as const // remaining: 'Outside coverage', 'Audit log'
type SubView = typeof subViews[number]

export function ReportsTab({ session }: { session: Session }) {
  const [subView, setSubView] = useState<SubView>('Sales')

  return (
    <div className="content">
      <div className="page-heading">
        <div>
          <div className="eyebrow"><BarChart3 size={14} /> REPORTS</div>
          <h1>Reports</h1>
          <p>Sales, field activity, and compliance across your operation.</p>
        </div>
      </div>

      <div className="filter-row" style={{ marginBottom: 20 }}>
        {subViews.map((view) => (
          <button
            key={view}
            className={view === subView ? 'primary-button' : 'secondary-button'}
            onClick={() => setSubView(view)}
          >
            {view}
          </button>
        ))}
      </div>

      {subView === 'Sales' && <SalesReport session={session} />}
      {subView === 'Resumption' && <ResumptionReport session={session} />}
      {subView === 'Outlet visits' && <OutletVisitsReport session={session} />}
      {subView === 'Planned vs actual' && <PlannedVsActualReport session={session} />}
      {subView === 'Route efficiency' && <RouteEfficiencyReport session={session} />}
    </div>
  )
}
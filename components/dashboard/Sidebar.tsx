'use client'

import {
  LayoutDashboard, PackageCheck, Boxes, UsersRound, Store, Map, KeyRound, BarChart3,
  ChevronDown, Settings2, CircleHelp, X, type LucideIcon,
  Truck,
} from 'lucide-react'
import { roles, type IconName } from '@/lib/mock-data'
import type { Session } from '@/lib/auth'

const iconMap: Record<IconName, LucideIcon> = {
  LayoutDashboard, Map, Truck, PackageCheck, Boxes, UsersRound, Store, KeyRound, BarChart3,
}

export function Sidebar({
  session,
  visibleNav,
  currentNav,
  mobileOpen,
  onSelectNav,
  onClose,
}: {
  session: Session
  visibleNav: { label: string; icon: string }[]
  currentNav: string
  mobileOpen: boolean
  onSelectNav: (label: string) => void
  onClose: () => void
}) {
  return (
    <aside className={`sidebar ${mobileOpen ? 'sidebar-open' : ''}`}>
      <div className="brand">
        <div className="brand-mark"><Boxes size={20} /></div>
        <span>Stockwise</span>
        <button className="icon-button mobile-close" onClick={onClose} aria-label="Close menu"><X size={18} /></button>
      </div>
      <div className="workspace">
        <div className="workspace-avatar">N</div>
        <div><strong>Northstar HQ</strong><span>Operations workspace</span></div>
        <ChevronDown size={15} />
      </div>
      <nav className="nav-list" aria-label="Primary navigation">
        {visibleNav.map((item) => {
          const Icon = iconMap[item.icon as IconName]
          return (
            <button
              key={item.label}
              className={currentNav === item.label ? 'nav-item active' : 'nav-item'}
              onClick={() => onSelectNav(item.label)}
            >
              <Icon size={18} /><span>{item.label}</span>
            </button>
          )
        })}
      </nav>
      <div className="sidebar-bottom">
        <button
          className={currentNav === 'Settings' ? 'nav-item active' : 'nav-item'}
          onClick={() => onSelectNav('Settings')}
        >
          <Settings2 size={18} /><span>Settings</span>
        </button>
        {/* ...help-card, user-row unchanged... */}
      </div>
    </aside>
  )
}
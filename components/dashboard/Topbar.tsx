'use client'

import { Bell, LogOut, Menu, Search, ShieldCheck } from 'lucide-react'
import { roles } from '@/lib/mock-data'
import type { Session } from '@/lib/auth'

export function Topbar({
  session,
  currentNav,
  onOpenMobileNav,
  onLogout,
}: {
  session: Session
  currentNav: string
  onOpenMobileNav: () => void
  onLogout: () => void
}) {
  return (
    <header className="topbar">
      <button className="icon-button menu-trigger" onClick={onOpenMobileNav} aria-label="Open menu"><Menu size={20} /></button>
      <div className="breadcrumb"><span>Workspace</span><span>/</span><strong>{currentNav}</strong></div>
      <div className="top-actions">
        <label className="search-box">
          <Search size={17} />
          <input placeholder="Search anything..." aria-label="Search anything" />
          <kbd>⌘ K</kbd>
        </label>
        <button className="icon-button notification" aria-label="Notifications"><Bell size={18} /><i /></button>
        <div className="role-switcher"><ShieldCheck size={16} /><span>{roles[session.role].label}</span></div>
        <button className="icon-button" onClick={onLogout} aria-label="Log out" title="Log out"><LogOut size={17} /></button>
      </div>
    </header>
  )
}
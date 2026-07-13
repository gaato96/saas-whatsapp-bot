'use client'

import React, { useState, useEffect } from 'react'
import Link from 'next/link'
import { DashboardNav } from '@/components/dashboard-nav'
import { DolarWidget } from '@/components/dolar-widget'
import { ArrowLeft, LogOut, Zap, ChevronLeft, ChevronRight } from 'lucide-react'

interface CollapsibleSidebarProps {
  businessId: string
  businessName: string
  rubro: string
  enabledModules: string[]
  isSuperAdmin?: boolean
}

export function CollapsibleSidebar({ businessId, businessName, rubro, enabledModules, isSuperAdmin = false }: CollapsibleSidebarProps) {
  const [collapsed, setCollapsed] = useState(false)

  // Persist collapse state across navigation
  useEffect(() => {
    const stored = localStorage.getItem('sidebar-collapsed')
    if (stored === 'true') setCollapsed(true)
  }, [])

  const toggle = () => {
    setCollapsed(prev => {
      localStorage.setItem('sidebar-collapsed', String(!prev))
      return !prev
    })
  }

  return (
    <aside
      className={`hidden lg:flex border-r border-zinc-800 bg-zinc-950/40 backdrop-blur-md flex-col justify-between sticky top-0 h-screen overflow-y-auto transition-all duration-300 ease-in-out ${
        collapsed ? 'w-[68px] p-3' : 'w-64 p-5'
      }`}
    >
      <div className={`space-y-7 ${collapsed ? 'space-y-5' : ''}`}>

        {/* Logo ZapFlow */}
        {!collapsed ? (
          <div className="flex items-center gap-2.5 px-1.5 py-1">
            <div className="h-7 w-7 rounded-lg bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center shadow-lg shadow-emerald-500/25 shrink-0">
              <Zap className="h-4 w-4 text-white fill-white" />
            </div>
            <div>
              <span className="font-black text-sm tracking-tight text-white block leading-none">ZapFlow</span>
              <span className="text-[10px] text-zinc-500 font-bold block mt-0.5 truncate max-w-[140px]">
                {businessName}
              </span>
            </div>
          </div>
        ) : (
          <div className="flex items-center justify-center h-8 w-8 mx-auto rounded-lg bg-gradient-to-br from-emerald-500 to-teal-600 shadow-md">
            <Zap className="h-4.5 w-4.5 text-white fill-white" />
          </div>
        )}

        {/* Dolar Widget */}
        {!collapsed && <DolarWidget />}

        {/* Menú de Navegación */}
        <DashboardNav
          businessId={businessId}
          rubro={rubro}
          enabledModules={enabledModules}
          collapsed={collapsed}
        />
      </div>

      {/* Footer Sidebar */}
      <div className={`pt-4 border-t border-zinc-800 flex flex-col gap-2 ${collapsed ? 'items-center' : ''}`}>
        {!collapsed ? (
          <>
            {isSuperAdmin && (
              <Link
                href="/admin"
                className="flex items-center gap-2 text-xs text-zinc-500 hover:text-zinc-300 transition-colors"
              >
                <ArrowLeft className="h-3.5 w-3.5" />
                <span>Volver a Superadmin</span>
              </Link>
            )}
            <div className="flex items-center justify-between pt-1 border-t border-zinc-800">
              <span className="text-[10px] text-zinc-500 flex items-center gap-1">
                <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" />
                Bot Activo
              </span>
              <Link href="/login" className="text-[10px] text-zinc-400 hover:text-white flex items-center gap-1 transition-colors">
                <LogOut className="h-3 w-3" />
                <span>Salir</span>
              </Link>
            </div>
          </>
        ) : (
          <>
            {isSuperAdmin && (
              <Link href="/admin" title="Volver a Superadmin" className="text-zinc-500 hover:text-zinc-300 transition-colors">
                <ArrowLeft className="h-4 w-4" />
              </Link>
            )}
          </>
        )}

        {/* Toggle button */}
        <button
          onClick={toggle}
          title={collapsed ? 'Expandir sidebar' : 'Colapsar sidebar'}
          className={`mt-2 flex items-center justify-center h-7 w-7 rounded-lg border border-zinc-800 bg-zinc-900 text-zinc-400 hover:text-white hover:bg-zinc-800 transition-all cursor-pointer ${collapsed ? 'mx-auto' : 'self-end'}`}
        >
          {collapsed ? <ChevronRight className="h-3.5 w-3.5" /> : <ChevronLeft className="h-3.5 w-3.5" />}
        </button>
      </div>
    </aside>
  )
}

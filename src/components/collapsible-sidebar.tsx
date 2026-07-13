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
}

export function CollapsibleSidebar({ businessId, businessName, rubro, enabledModules }: CollapsibleSidebarProps) {
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
        <div className={`flex items-center gap-2.5 pt-1 ${collapsed ? 'justify-center' : ''}`}>
          <div className="h-8 w-8 rounded-xl bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center shadow-lg shadow-emerald-500/20 shrink-0">
            <Zap className="h-4 w-4 text-white fill-white" />
          </div>
          {!collapsed && (
            <div>
              <span className="text-sm font-black text-white tracking-tight">ZapFlow</span>
              <span className="block text-[9px] text-emerald-400 font-bold uppercase tracking-widest">Business Hub</span>
            </div>
          )}
        </div>

        {/* Datos del negocio */}
        {!collapsed && (
          <div className="px-3 py-2.5 rounded-xl bg-zinc-800/40 border border-zinc-800 space-y-0.5">
            <span className="text-[9px] uppercase font-bold tracking-wider text-zinc-500">Negocio activo</span>
            <h2 className="font-bold text-xs text-white truncate max-w-[180px]" title={businessName}>
              {businessName}
            </h2>
            <span className="inline-block bg-emerald-500/10 border border-emerald-500/20 text-[9px] px-1.5 py-0.5 rounded text-emerald-400 font-bold">
              {rubro}
            </span>
          </div>
        )}

        {/* Widget Dólar Blue (solo iPhones, solo cuando expandido) */}
        {rubro === 'iPhones' && !collapsed && (
          <div className="px-1">
            <DolarWidget />
          </div>
        )}

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
            <Link
              href="/admin"
              className="flex items-center gap-2 text-xs text-zinc-500 hover:text-zinc-300 transition-colors"
            >
              <ArrowLeft className="h-3.5 w-3.5" />
              <span>Volver a Superadmin</span>
            </Link>
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
          <Link href="/admin" title="Volver a Superadmin" className="text-zinc-500 hover:text-zinc-300 transition-colors">
            <ArrowLeft className="h-4 w-4" />
          </Link>
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

import React from 'react'
import { createClient } from '@/lib/supabase/server'
import { CollapsibleSidebar } from '@/components/collapsible-sidebar'
import { MobileNav } from '@/components/mobile-nav'
import { LogOut, Zap } from 'lucide-react'
import { ThemeToggle } from '@/components/theme-toggle'
import Link from 'next/link'


interface DashboardLayoutProps {
  children: React.ReactNode
  params: Promise<{ businessId: string }>
}

export default async function DashboardLayout({ children, params }: DashboardLayoutProps) {
  const { businessId } = await params
  let businessName = 'Panel de Control'
  let rubro = 'Personalizado'
  let enabledModules: string[] = ['chat', 'clients', 'ai_config', 'business_config', 'whatsapp_config', 'crm', 'catalog', 'agenda']
  let isSuperAdmin = false

  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    
    if (user) {
      const { data: profile } = await supabase
        .from('profiles')
        .select('role')
        .eq('id', user.id)
        .single()
      isSuperAdmin = profile?.role === 'superadmin'
    }

    const { data } = await supabase
      .from('businesses')
      .select('name, rubro, enabled_modules')
      .eq('id', businessId)
      .single()

    if (data) {
      businessName = data.name
      rubro = data.rubro
      if (data.enabled_modules) {
        enabledModules = data.enabled_modules
      }
    }
  } catch {
    if (businessId === 'demo-business-id') {
      businessName = 'Pizzería Bella (Demo)'
      rubro = 'Comida'
      enabledModules = ['chat', 'clients', 'crm_premium', 'ai_config', 'business_config', 'whatsapp_config', 'crm', 'catalog']
    } else if (businessId === 'demo-zapas-id' || businessId === 'zapas-premium') {
      businessName = 'Zapas Premium (Demo)'
      rubro = 'E-commerce'
      enabledModules = ['chat', 'clients', 'crm_premium', 'ai_config', 'business_config', 'whatsapp_config', 'crm', 'catalog', 'dolar_widget']
    }
  }

  return (
    <div className="flex min-h-screen bg-zinc-900 text-zinc-100 font-sans">

      {/* =====================
          SIDEBAR — solo desktop (collapsible)
          ===================== */}
      <CollapsibleSidebar
        businessId={businessId}
        businessName={businessName}
        rubro={rubro}
        enabledModules={enabledModules}
        isSuperAdmin={isSuperAdmin}
      />

      {/* =====================
          ÁREA DE CONTENIDO
          ===================== */}
      <div className="flex-1 flex flex-col min-h-screen min-w-0">

        {/* Header — visible en todos los tamaños */}
        <header className="sticky top-0 z-30 h-14 border-b border-zinc-800 px-4 lg:px-6 flex items-center justify-between bg-zinc-900/80 backdrop-blur-md safe-top">

          {/* Mobile: Logo + Nombre negocio */}
          <div className="flex items-center gap-3 lg:hidden">
            <div className="h-7 w-7 rounded-lg bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center shadow-lg shadow-emerald-500/20 shrink-0">
              <Zap className="h-3.5 w-3.5 text-white fill-white" />
            </div>
            <span className="font-black text-sm text-white tracking-tight">ZapFlow</span>
            <span className="text-xs text-zinc-500 font-medium truncate max-w-[120px]">{businessName}</span>
          </div>

          {/* Desktop: label */}
          <div className="hidden lg:block text-xs font-semibold text-zinc-400">
            ERP / CRM en Tiempo Real
          </div>

          {/* Acciones del header */}
          <div className="flex items-center gap-2 lg:gap-4">
            <ThemeToggle />
            <div className="hidden sm:flex items-center gap-2 bg-emerald-500/10 border border-emerald-500/20 px-2.5 py-1 rounded-full">
              <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 animate-ping" />
              <span className="text-[10px] text-emerald-400 font-bold font-mono">Bot Activo</span>
            </div>
            {/* Mobile: logout link */}
            <Link href="/login" className="lg:hidden text-zinc-500 hover:text-white transition-colors p-1">
              <LogOut className="h-4 w-4" />
            </Link>
          </div>
        </header>

        {/* Contenido principal */}
        <main className="flex-1 p-4 lg:p-8 overflow-y-auto pb-24 lg:pb-8">
          {children}
        </main>

        {/* =====================
            BOTTOM NAV — solo mobile
            ===================== */}
        <MobileNav businessId={businessId} rubro={rubro} enabledModules={enabledModules} />
      </div>
    </div>
  )
}

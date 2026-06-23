import React from 'react'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import { DashboardNav } from '@/components/dashboard-nav'
import { ArrowLeft, LogOut } from 'lucide-react'
import { ThemeToggle } from '@/components/theme-toggle'

interface DashboardLayoutProps {
  children: React.ReactNode
  params: Promise<{ businessId: string }>
}

export default async function DashboardLayout({ children, params }: DashboardLayoutProps) {
  const { businessId } = await params
  let businessName = 'Panel de Control'
  let rubro = 'Personalizado'
  let enabledModules: string[] = ['chat', 'clients', 'ai_config', 'business_config', 'whatsapp_config', 'crm', 'catalog', 'agenda']

  try {
    const supabase = await createClient()
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
  } catch (err) {
    console.log("No se pudo obtener información del negocio, usando demo defaults.")
    if (businessId === 'demo-business-id') {
      businessName = 'Pizzería Bella (Demo)'
      rubro = 'Comida'
      enabledModules = ['chat', 'clients', 'ai_config', 'business_config', 'whatsapp_config', 'crm', 'catalog']
    } else if (businessId === 'demo-zapas-id' || businessId === 'zapas-premium') {
      businessName = 'Zapas Premium (Demo)'
      rubro = 'E-commerce'
      enabledModules = ['chat', 'clients', 'ai_config', 'business_config', 'whatsapp_config', 'crm', 'catalog']
    }
  }

  return (
    <div className="flex min-h-screen bg-zinc-900 text-zinc-100 font-sans">
      {/* SIDEBAR CLIENTE / TENANT */}
      <aside className="w-64 border-r border-zinc-800 bg-zinc-950/40 backdrop-blur-md flex flex-col justify-between p-6">
        <div className="space-y-8">
          {/* Logo / Nombre del Negocio */}
          <div className="space-y-1">
            <span className="text-[10px] uppercase font-bold tracking-wider text-emerald-400">Negocio SaaS</span>
            <div className="flex items-center gap-2">
              <span className="h-6 w-6 rounded bg-gradient-to-tr from-emerald-600 to-teal-500 flex items-center justify-center font-black text-xs text-white">
                W
              </span>
              <h2 className="font-bold text-sm text-white truncate max-w-[180px]" title={businessName}>
                {businessName}
              </h2>
            </div>
            <span className="inline-block bg-zinc-800 border border-zinc-700 text-[10px] px-1.5 py-0.5 rounded text-zinc-400 font-medium">
              Rubro: {rubro}
            </span>
          </div>

          {/* Menú de Navegación del Dashboard */}
          <DashboardNav businessId={businessId} rubro={rubro} enabledModules={enabledModules} />
        </div>

        {/* Footer Sidebar */}
        <div className="pt-4 border-t border-zinc-800 flex flex-col gap-2">
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
        </div>
      </aside>

      {/* ÁREA DE CONTENIDO */}
      <main className="flex-1 flex flex-col min-h-screen bg-zinc-900/60">
        <header className="h-16 border-b border-zinc-800 px-8 flex items-center justify-between bg-zinc-900/40 backdrop-blur-md">
          <div className="text-xs font-semibold text-zinc-400">
            ERP / CRM en Tiempo Real
          </div>
          <div className="flex items-center gap-4">
            <ThemeToggle />
            <div className="flex items-center gap-2 bg-emerald-500/10 border border-emerald-500/20 px-2.5 py-1 rounded-full">
              <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 animate-ping" />
              <span className="text-[10px] text-emerald-400 font-bold font-mono">WhatsApp Webhook Activo</span>
            </div>
          </div>
        </header>
        <div className="flex-1 p-8 overflow-y-auto">
          {children}
        </div>
      </main>
    </div>
  )
}

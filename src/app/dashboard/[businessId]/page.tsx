import React from 'react'
import { createClient } from '@/lib/supabase/server'
import { RealtimeOrders } from '@/components/realtime-orders'
import { redirect } from 'next/navigation'
import { ShoppingBag, Package, Briefcase, BookOpen, Smartphone, Clock, Flame, Truck, Package2, Wrench } from 'lucide-react'

interface DashboardPageProps {
  params: Promise<{ businessId: string }>
}

// ── Configuración por rubro ───────────────────────────────────────────────────
function getRubroPageConfig(rubro: string) {
  switch (rubro) {
    case 'Comida':
      return {
        icon: ShoppingBag,
        title: 'Toma de Pedidos',
        subtitle: 'Tiempo real — los pedidos del bot aparecen automáticamente',
        processingLabel: 'en cocina',
        processingIcon: Flame,
        shippedLabel: 'en camino',
        shippedIcon: Truck,
      }
    case 'E-commerce':
      return {
        icon: Package,
        title: 'Ventas en Tiempo Real',
        subtitle: 'Tiempo real — los pedidos del bot aparecen automáticamente',
        processingLabel: 'preparando',
        processingIcon: Package2,
        shippedLabel: 'enviados',
        shippedIcon: Truck,
      }
    case 'iPhones':
      return {
        icon: Smartphone,
        title: 'Ventas en Tiempo Real',
        subtitle: 'Tiempo real — las ventas del bot aparecen automáticamente',
        processingLabel: 'preparando',
        processingIcon: Package2,
        shippedLabel: 'enviados',
        shippedIcon: Truck,
      }
    case 'Agencia':
      return {
        icon: Briefcase,
        title: 'Proyectos y Consultas',
        subtitle: 'Tiempo real — las solicitudes del bot aparecen automáticamente',
        processingLabel: 'en proceso',
        processingIcon: Wrench,
        shippedLabel: 'entregados',
        shippedIcon: Truck,
      }
    case 'Cursos':
      return {
        icon: BookOpen,
        title: 'Inscripciones en Tiempo Real',
        subtitle: 'Tiempo real — las inscripciones del bot aparecen automáticamente',
        processingLabel: 'en curso',
        processingIcon: BookOpen,
        shippedLabel: 'completados',
        shippedIcon: null,
      }
    default:
      return {
        icon: ShoppingBag,
        title: 'Operaciones en Tiempo Real',
        subtitle: 'Tiempo real — las operaciones del bot aparecen automáticamente',
        processingLabel: 'en proceso',
        processingIcon: Wrench,
        shippedLabel: 'enviados',
        shippedIcon: Truck,
      }
  }
}

export default async function DashboardPage({ params }: DashboardPageProps) {
  const { businessId } = await params
  let initialOrders: any[] = []
  let enabledModules: string[] = ['crm', 'catalog', 'chat', 'clients']
  let businessRubro = 'Comida'

  try {
    const supabase = await createClient()
    const { data: biz } = await supabase
      .from('businesses')
      .select('rubro, enabled_modules')
      .eq('id', businessId)
      .single()

    if (biz) {
      enabledModules = biz.enabled_modules || []
      businessRubro = biz.rubro
    } else {
      if (businessId === 'demo-peluqueria-id') {
        enabledModules = ['agenda', 'catalog', 'chat', 'clients', 'ai_config', 'business_config', 'whatsapp_config']
      } else if (businessId === 'demo-business-id' || businessId === 'demo-restaurante-id') {
        enabledModules = ['crm', 'catalog', 'chat', 'clients', 'ai_config', 'business_config', 'whatsapp_config']
      }
    }

    const hasCRM = enabledModules.includes('crm')
    const hasAgenda = enabledModules.includes('agenda')

    if (!hasCRM && hasAgenda) {
      redirect(`/dashboard/${businessId}/agenda`)
    }

    const { data } = await supabase
      .from('orders_bookings')
      .select('id, business_id, customer_name, customer_phone, delivery_address, notes, status, payment_method, payment_status, total, items, created_at')
      .eq('business_id', businessId)
      .order('created_at', { ascending: false })
      .limit(300)

    initialOrders = data || []
  } catch (err) {
    console.log("No se pudieron cargar órdenes o validar módulos, cargando defaults.", err)
  }

  const cfg = getRubroPageConfig(businessRubro)
  const PageIcon = cfg.icon

  // Estadísticas rápidas
  const activeOrders = initialOrders.filter(o => ['pending_payment', 'confirmed', 'processing', 'shipped'].includes(o.status))
  const pendingCount = initialOrders.filter(o => o.status === 'pending_payment').length
  const processingCount = initialOrders.filter(o => o.status === 'processing').length
  const shippedCount = initialOrders.filter(o => o.status === 'shipped').length

  const ProcessingIcon = cfg.processingIcon
  const ShippedIcon = cfg.shippedIcon

  return (
    <div className="space-y-5">

      {/* Header con estadísticas rápidas */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-lg font-black text-white flex items-center gap-2">
            <PageIcon className="h-5 w-5 text-emerald-400" />
            {cfg.title}
          </h1>
          <p className="text-xs text-zinc-500 mt-0.5">
            {cfg.subtitle}
          </p>
        </div>

        {/* Chips de estadísticas */}
        <div className="flex flex-wrap items-center gap-2">
          <div className="flex items-center gap-1.5 bg-zinc-900/60 border border-zinc-800 rounded-xl px-3 py-1.5">
            <div className="h-1.5 w-1.5 rounded-full bg-emerald-400 animate-pulse" />
            <span className="text-[10px] font-bold text-zinc-300">
              <span className="text-white">{activeOrders.length}</span> activos
            </span>
          </div>
          {pendingCount > 0 && (
            <div className="flex items-center gap-1 bg-amber-500/10 border border-amber-500/20 rounded-xl px-2.5 py-1.5">
              <Clock className="h-3 w-3 text-amber-400" />
              <span className="text-[10px] font-bold text-amber-400">{pendingCount} pendientes</span>
            </div>
          )}
          {processingCount > 0 && ProcessingIcon && (
            <div className="flex items-center gap-1 bg-purple-500/10 border border-purple-500/20 rounded-xl px-2.5 py-1.5">
              <ProcessingIcon className="h-3 w-3 text-purple-400" />
              <span className="text-[10px] font-bold text-purple-400">{processingCount} {cfg.processingLabel}</span>
            </div>
          )}
          {shippedCount > 0 && ShippedIcon && (
            <div className="flex items-center gap-1 bg-teal-500/10 border border-teal-500/20 rounded-xl px-2.5 py-1.5">
              <ShippedIcon className="h-3 w-3 text-teal-400" />
              <span className="text-[10px] font-bold text-teal-400">{shippedCount} {cfg.shippedLabel}</span>
            </div>
          )}
        </div>
      </div>

      {/* Componente de Pedidos */}
      <RealtimeOrders businessId={businessId} initialOrders={initialOrders} rubro={businessRubro} />
    </div>
  )
}

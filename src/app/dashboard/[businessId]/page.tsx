import React from 'react'
import { createClient } from '@/lib/supabase/server'
import { RealtimeOrders } from '@/components/realtime-orders'
import { redirect } from 'next/navigation'
import { ShoppingBag, Flame, Truck, Clock } from 'lucide-react'

interface DashboardPageProps {
  params: Promise<{ businessId: string }>
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
      .select('id, business_id, customer_name, customer_phone, delivery_address, status, payment_method, payment_status, total, items, created_at')
      .eq('business_id', businessId)
      .order('created_at', { ascending: false })
      .limit(300) // Optimizado para 200-300 pedidos por noche

    initialOrders = data || []
  } catch (err) {
    console.log("No se pudieron cargar órdenes o validar módulos, cargando defaults.", err)
  }

  // Estadísticas rápidas para el header (solo estados activos)
  const activeOrders = initialOrders.filter(o => ['pending_payment', 'confirmed', 'processing', 'shipped'].includes(o.status))
  const pendingCount = initialOrders.filter(o => o.status === 'pending_payment').length
  const cookingCount = initialOrders.filter(o => o.status === 'processing').length
  const shippedCount = initialOrders.filter(o => o.status === 'shipped').length

  return (
    <div className="space-y-5">

      {/* Header con estadísticas rápidas */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-lg font-black text-white flex items-center gap-2">
            <ShoppingBag className="h-5 w-5 text-emerald-400" />
            Toma de Pedidos
          </h1>
          <p className="text-xs text-zinc-500 mt-0.5">
            Tiempo real — los pedidos del bot aparecen automáticamente
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
          {cookingCount > 0 && (
            <div className="flex items-center gap-1 bg-purple-500/10 border border-purple-500/20 rounded-xl px-2.5 py-1.5">
              <Flame className="h-3 w-3 text-purple-400" />
              <span className="text-[10px] font-bold text-purple-400">{cookingCount} en cocina</span>
            </div>
          )}
          {shippedCount > 0 && (
            <div className="flex items-center gap-1 bg-teal-500/10 border border-teal-500/20 rounded-xl px-2.5 py-1.5">
              <Truck className="h-3 w-3 text-teal-400" />
              <span className="text-[10px] font-bold text-teal-400">{shippedCount} en camino</span>
            </div>
          )}
        </div>
      </div>

      {/* Componente de Pedidos */}
      <RealtimeOrders businessId={businessId} initialOrders={initialOrders} />
    </div>
  )
}

import React from 'react'
import { createClient } from '@/lib/supabase/server'
import { RealtimeOrders } from '@/components/realtime-orders'

import { redirect } from 'next/navigation'

interface DashboardPageProps {
  params: Promise<{ businessId: string }>
}

export default async function DashboardPage({ params }: DashboardPageProps) {
  const { businessId } = await params
  let initialOrders: any[] = []
  let enabledModules: string[] = ['crm', 'catalog', 'chat', 'clients']

  try {
    const supabase = await createClient()
    const { data: biz } = await supabase
      .from('businesses')
      .select('rubro, enabled_modules')
      .eq('id', businessId)
      .single()

    if (biz) {
      enabledModules = biz.enabled_modules || []
    } else {
      // Mapear demos para pruebas locales
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
      .select('id, business_id, customer_phone, status, payment_method, payment_status, total, items, created_at')
      .eq('business_id', businessId)
      .order('created_at', { ascending: false })

    initialOrders = data || []
  } catch (err) {
    console.log("No se pudieron cargar órdenes o validar módulos, cargando defaults.", err)
  }

  return (
    <div className="space-y-6">
      {/* Encabezado */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-white">Monitoreo de Pedidos / Turnos (CRM)</h1>
          <p className="text-xs text-zinc-500">
            Visualiza los pedidos que el Bot de IA va cerrando. Avanza sus estados según la preparación y entrega.
          </p>
        </div>
      </div>

      {/* Tablero Kanban */}
      <RealtimeOrders businessId={businessId} initialOrders={initialOrders} />
    </div>
  )
}

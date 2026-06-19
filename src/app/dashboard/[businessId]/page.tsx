import React from 'react'
import { createClient } from '@/lib/supabase/server'
import { RealtimeOrders } from '@/components/realtime-orders'

interface DashboardPageProps {
  params: Promise<{ businessId: string }>
}

export default async function DashboardPage({ params }: DashboardPageProps) {
  const { businessId } = await params
  let initialOrders: any[] = []

  try {
    const supabase = await createClient()
    const { data } = await supabase
      .from('orders_bookings')
      .select('id, business_id, customer_phone, status, payment_method, total, items, created_at')
      .eq('business_id', businessId)
      .order('created_at', { ascending: false })

    initialOrders = data || []
  } catch (err) {
    console.log("No se pudieron cargar órdenes desde base de datos, cargando demo en cliente.")
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

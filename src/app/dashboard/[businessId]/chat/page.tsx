import React from 'react'
import { createClient } from '@/lib/supabase/server'
import { LiveChat } from '@/components/live-chat'

interface ChatPageProps {
  params: Promise<{ businessId: string }>
}

export default async function ChatPage({ params }: ChatPageProps) {
  const { businessId } = await params
  let initialSessions: any[] = []

  try {
    const supabase = await createClient()
    const { data } = await supabase
      .from('chat_sessions')
      .select('id, customer_phone, last_interaction, status, customer_name, notes, is_archived, nickname, contact_details')
      .eq('business_id', businessId)
      .order('last_interaction', { ascending: false })

    initialSessions = data || []
  } catch (err) {
    console.log("No se pudieron cargar sesiones de chat desde base de datos, cargando demo en cliente.")
  }

  return (
    <div className="space-y-6">
      {/* Encabezado */}
      <div>
        <h1 className="text-xl font-bold text-white">Live Chat & Takeover (Centro de Control)</h1>
        <p className="text-xs text-zinc-500">
          Visualiza los historiales de chat de los clientes. Toma el control manual de una conversación para pausar las respuestas del bot e intervenir como asesor.
        </p>
      </div>

      {/* Caja de Chat */}
      <LiveChat businessId={businessId} initialSessions={initialSessions} />
    </div>
  )
}

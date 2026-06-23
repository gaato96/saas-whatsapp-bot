import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function POST(req: Request) {
  try {
    const supabase = await createClient()
    
    // Verificar autenticación
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
    }

    const { sessionId, messageText } = await req.json()
    if (!sessionId || !messageText) {
      return NextResponse.json({ error: 'Faltan parámetros' }, { status: 400 })
    }

    // 1. Obtener la sesión y el teléfono del cliente
    const { data: session, error: sessionError } = await supabase
      .from('chat_sessions')
      .select('business_id, customer_phone')
      .eq('id', sessionId)
      .single()

    if (sessionError || !session) {
      return NextResponse.json({ error: 'Sesión no encontrada' }, { status: 404 })
    }

    // 2. Obtener la configuración de WhatsApp del negocio
    const { data: business, error: businessError } = await supabase
      .from('businesses')
      .select('whatsapp_config')
      .eq('id', session.business_id)
      .single()

    if (businessError || !business) {
      return NextResponse.json({ error: 'Negocio no encontrado' }, { status: 404 })
    }

    const { access_token, phone_number_id } = business.whatsapp_config || {}
    if (!access_token || !phone_number_id) {
      return NextResponse.json({ error: 'Configuración de WhatsApp incompleta' }, { status: 400 })
    }

    // 3. Enviar el mensaje a la API de WhatsApp de Meta
    const waSendUrl = `https://graph.facebook.com/v22.0/${phone_number_id}/messages`
    const waPayload = {
      messaging_product: 'whatsapp',
      recipient_type: 'individual',
      to: session.customer_phone,
      type: 'text',
      text: { body: messageText },
    }

    console.log(`Enviando mensaje de agente a WhatsApp: ${session.customer_phone}`)
    const waResponse = await fetch(waSendUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${access_token}`,
      },
      body: JSON.stringify(waPayload),
    })

    if (!waResponse.ok) {
      const waErrText = await waResponse.text()
      console.error('Error de WhatsApp API:', waErrText)
      return NextResponse.json({ error: `Error de WhatsApp: ${waErrText}` }, { status: 500 })
    }

    // 4. Guardar en el historial de chat con sender 'agent'
    const { data: newHistory, error: historyError } = await supabase
      .from('chat_history')
      .insert({
        session_id: sessionId,
        sender: 'agent',
        message_text: messageText,
      })
      .select()
      .single()

    if (historyError) {
      console.error('Error al insertar en chat_history:', historyError)
      return NextResponse.json({ error: 'Error al registrar el mensaje en base de datos' }, { status: 500 })
    }

    return NextResponse.json({ success: true, message: newHistory })
  } catch (err: any) {
    console.error('Error en POST /api/chat/send:', err)
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}

import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

/**
 * POST /api/whatsapp/send-status
 * 
 * Envía un mensaje de WhatsApp al cliente cuando el pedido cambia de estado.
 * Usado principalmente para el estado "shipped" (Enviado).
 * 
 * Body: { orderId, businessId, customerPhone, status, customerName? }
 */
export async function POST(req: NextRequest) {
  try {
    const { orderId, businessId, customerPhone, status } = await req.json()

    if (!orderId || !businessId || !customerPhone || !status) {
      return NextResponse.json({ error: 'Faltan parámetros requeridos.' }, { status: 400 })
    }

    // Solo enviamos mensaje para el estado "shipped"
    if (status !== 'shipped') {
      return NextResponse.json({ success: true, skipped: true, reason: 'Estado sin mensaje automático.' })
    }

    // Obtener credenciales de WhatsApp del negocio
    const supabase = await createClient()
    const { data: business, error: bizError } = await supabase
      .from('businesses')
      .select('whatsapp_config, name')
      .eq('id', businessId)
      .single()

    if (bizError || !business) {
      return NextResponse.json({ error: 'No se encontró el negocio.' }, { status: 404 })
    }

    const config = business.whatsapp_config
    if (!config?.phone_number_id || !config?.access_token) {
      return NextResponse.json({ 
        success: false, 
        error: 'WhatsApp no configurado para este negocio.' 
      }, { status: 422 })
    }

    // Preparar el número de teléfono (quitar +, espacios, guiones)
    const cleanPhone = customerPhone.replace(/[\s\-\+\(\)]/g, '')

    // Mensaje de notificación de pedido enviado
    const messageText = `🛵 ¡Tu pedido ya está en camino! Por favor estate atento/a a la llegada. ¡Muchas gracias por tu pedido! 🙏\n\n_ZapFlow — ${business.name}_`

    // Llamada a WhatsApp Cloud API (Meta Graph API v22.0)
    const waResponse = await fetch(
      `https://graph.facebook.com/v22.0/${config.phone_number_id}/messages`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${config.access_token}`,
        },
        body: JSON.stringify({
          messaging_product: 'whatsapp',
          recipient_type: 'individual',
          to: cleanPhone,
          type: 'text',
          text: {
            preview_url: false,
            body: messageText,
          },
        }),
      }
    )

    const waData = await waResponse.json()

    if (!waResponse.ok) {
      console.error('[ZapFlow WA] Error al enviar mensaje:', waData)
      return NextResponse.json({ 
        success: false, 
        error: 'Error en WhatsApp API', 
        details: waData 
      }, { status: 502 })
    }

    // Guardar el mensaje en el historial de chat (opcional, para trazabilidad)
    try {
      const { data: session } = await supabase
        .from('chat_sessions')
        .select('id')
        .eq('business_id', businessId)
        .eq('customer_phone', customerPhone)
        .single()

      if (session?.id) {
        await supabase.from('chat_history').insert({
          session_id: session.id,
          sender: 'bot',
          message_text: messageText,
        })
      }
    } catch {
      // No crítico si falla el guardado del historial
      console.warn('[ZapFlow WA] No se pudo guardar en historial de chat.')
    }

    return NextResponse.json({ 
      success: true, 
      messageId: waData.messages?.[0]?.id,
      phone: cleanPhone 
    })

  } catch (err) {
    console.error('[ZapFlow WA] Error interno:', err)
    return NextResponse.json({ error: 'Error interno del servidor.' }, { status: 500 })
  }
}

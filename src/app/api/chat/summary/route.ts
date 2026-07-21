import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { ai } from '@/lib/gemini'

export async function POST(request: NextRequest) {
  try {
    const { sessionId } = await request.json()
    if (!sessionId) {
      return NextResponse.json({ error: 'Falta el ID de sesión (sessionId).' }, { status: 400 })
    }

    const supabase = await createClient()

    // 1. Obtener mensajes históricos del chat en orden cronológico
    const { data: messages, error } = await supabase
      .from('chat_history')
      .select('sender, message_text, timestamp')
      .eq('session_id', sessionId)
      .order('timestamp', { ascending: true })

    if (error) throw error

    if (!messages || messages.length === 0) {
      return NextResponse.json({ summary: 'No hay mensajes registrados en esta conversación para generar un resumen.' })
    }

    // 2. Formatear la conversación para el prompt
    const conversationText = messages
      .map(m => {
        const senderLabel = m.sender === 'customer' 
          ? 'Cliente' 
          : m.sender === 'agent' 
            ? 'Agente Humano' 
            : 'Bot IA'
        return `[${new Date(m.timestamp).toLocaleTimeString()}] ${senderLabel}: ${m.message_text}`
      })
      .join('\n')

    // 3. Consultar a Gemini para generar el resumen ejecutivo
    const prompt = `Analiza y resume la siguiente conversación de soporte y ventas por WhatsApp en español.
Proporciona un resumen ejecutivo conciso estructurado exactamente con el siguiente formato de viñetas (máximo 4 viñetas):
- **Cliente:** (Breve descripción de quién es el cliente y qué necesita o consulta)
- **Acordado:** (Detalles de lo que se vendió, ordenó, agendó o resolvió, con precios y horarios si los hay)
- **Pendiente:** (Pasos siguientes requeridos por el dueño del negocio o el agente)

Conversación:
"""
${conversationText}
"""`

    const response = await ai.models.generateContent({
      model: 'gemini-3.6-flash',
      contents: prompt,
    })

    const summaryText = response.text || 'No se pudo generar un resumen de la conversación.'

    return NextResponse.json({ summary: summaryText })
  } catch (err: any) {
    console.error('Error al generar resumen con Gemini:', err)
    return NextResponse.json({ error: err.message || 'Error interno al procesar el resumen con IA.' }, { status: 500 })
  }
}

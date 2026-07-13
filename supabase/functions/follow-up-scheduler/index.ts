// =========================================================================
// SUPABASE EDGE FUNCTION: follow-up-scheduler
// Cron: cada 30 minutos revisa sesiones sin pedido y envía seguimiento.
// =========================================================================

import { serve } from "https://deno.land/std@0.224.0/http/server.ts"
import { createClient } from "https://esm.sh/@supabase/supabase-js@2"

const SUPABASE_URL = Deno.env.get("SUPABASE_URL") || ""
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") || ""
const GEMINI_API_KEY = Deno.env.get("GEMINI_API_KEY") || ""
const GEMINI_MODEL = "gemini-2.5-flash"

const supabaseAdmin = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY)

async function generateFollowupWithAI(
  businessName: string,
  rubro: string,
  chatHistory: { sender: string; message_text: string }[]
): Promise<string> {
  const historyText = chatHistory
    .slice(-6)
    .map(h => `${h.sender === "customer" ? "Cliente" : "Bot"}: ${h.message_text}`)
    .join("\n")

  const prompt = `Eres el asistente virtual de "${businessName}" (rubro: ${rubro}).
Un cliente tuvo la siguiente conversacion contigo hace unas horas pero no concretó ningun pedido o reserva:

--- CONVERSACION ---
${historyText}
--- FIN ---

Tu tarea: Escribe UN UNICO mensaje de seguimiento breve, amigable y natural en español para WhatsApp.
El objetivo es retomar la conversacion de forma calida y ofrecer ayuda, sin presionar.
Usa emojis con moderacion. No menciones que eres una IA. Maximo 2-3 oraciones.
Responde SOLO con el texto del mensaje, sin comillas ni explicaciones adicionales.`

  const geminiUrl = `https://generativelanguage.googleapis.com/v1beta/models/${GEMINI_MODEL}:generateContent?key=${GEMINI_API_KEY}`
  const response = await fetch(geminiUrl, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      contents: [{ role: "user", parts: [{ text: prompt }] }],
      generationConfig: { temperature: 0.7, maxOutputTokens: 200 }
    })
  })

  if (!response.ok) throw new Error(`Gemini error: ${await response.text()}`)
  const data = await response.json()
  return data.candidates?.[0]?.content?.parts?.[0]?.text?.trim() || ""
}

async function sendWhatsAppMessage(phoneId: string, waToken: string, to: string, message: string): Promise<boolean> {
  const url = `https://graph.facebook.com/v22.0/${phoneId}/messages`
  const response = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json", Authorization: `Bearer ${waToken}` },
    body: JSON.stringify({
      messaging_product: "whatsapp",
      recipient_type: "individual",
      to,
      type: "text",
      text: { body: message }
    })
  })
  return response.ok
}

serve(async (req) => {
  const authHeader = req.headers.get("Authorization") || ""
  const cronSecret = Deno.env.get("CRON_SECRET") || ""
  if (cronSecret && authHeader !== `Bearer ${cronSecret}`) {
    return new Response("Unauthorized", { status: 401 })
  }

  console.log("[FOLLOW-UP] Iniciando scheduler...")
  const now = new Date()
  const nowIso = now.toISOString()
  let totalProcessed = 0, totalSent = 0, totalSkipped = 0

  try {
    const { data: rubroDataList, error: rubroErr } = await supabaseAdmin
      .from("business_rubro_data")
      .select("business_id, custom_metadata")

    if (rubroErr) throw rubroErr

    const enabledBusinesses = (rubroDataList || []).filter(
      r => r.custom_metadata?.followup_enabled === true
    )

    console.log(`[FOLLOW-UP] Negocios activos: ${enabledBusinesses.length}`)

    for (const { business_id, custom_metadata: meta } of enabledBusinesses) {
      const followupHours = Number(meta.followup_hours) || 3
      const followupMode: string = meta.followup_mode || "ai"
      const followupFixedMessage: string = meta.followup_fixed_message || ""

      const maxAgeMs = 23 * 60 * 60 * 1000
      const minAgeMs = followupHours * 60 * 60 * 1000
      const cutoffEarliest = new Date(now.getTime() - maxAgeMs).toISOString()
      const cutoffLatest = new Date(now.getTime() - minAgeMs).toISOString()

      const { data: business } = await supabaseAdmin
        .from("businesses")
        .select("id, name, rubro, whatsapp_config")
        .eq("id", business_id)
        .maybeSingle()

      if (!business?.whatsapp_config?.access_token || !business?.whatsapp_config?.phone_number_id) {
        console.warn(`[FOLLOW-UP] Negocio ${business_id}: sin WhatsApp config.`)
        continue
      }

      const waToken: string = business.whatsapp_config.access_token
      const phoneId: string = business.whatsapp_config.phone_number_id

      const { data: sessions } = await supabaseAdmin
        .from("chat_sessions")
        .select("id, customer_phone, last_interaction, followup_sent_at")
        .eq("business_id", business_id)
        .eq("status", "bot_handling")
        .gte("last_interaction", cutoffEarliest)
        .lte("last_interaction", cutoffLatest)

      if (!sessions || sessions.length === 0) continue

      console.log(`[FOLLOW-UP] ${business.name}: ${sessions.length} sesiones candidatas.`)

      for (const session of sessions) {
        totalProcessed++

        // No re-enviar si ya hubo follow-up en las últimas 24 hs
        if (session.followup_sent_at) {
          const hoursSince = (now.getTime() - new Date(session.followup_sent_at).getTime()) / 3600000
          if (hoursSince < 24) { totalSkipped++; continue }
        }

        // Saltar si ya hay pedido reciente
        const { data: orders } = await supabaseAdmin
          .from("orders_bookings")
          .select("id")
          .eq("business_id", business_id)
          .eq("customer_phone", session.customer_phone)
          .gte("created_at", cutoffEarliest)
          .limit(1)

        if (orders && orders.length > 0) { totalSkipped++; continue }

        // Generar mensaje
        let followupMessage = ""
        if (followupMode === "fixed") {
          if (!followupFixedMessage) { totalSkipped++; continue }
          followupMessage = followupFixedMessage
        } else {
          const { data: history } = await supabaseAdmin
            .from("chat_history")
            .select("sender, message_text")
            .eq("session_id", session.id)
            .order("timestamp", { ascending: false })
            .limit(6)

          try {
            followupMessage = await generateFollowupWithAI(
              business.name,
              business.rubro,
              history ? [...history].reverse() : []
            )
          } catch (aiErr) {
            console.error(`[FOLLOW-UP] Error IA sesión ${session.id}:`, aiErr)
            totalSkipped++
            continue
          }

          if (!followupMessage) { totalSkipped++; continue }
        }

        // Enviar
        console.log(`[FOLLOW-UP] Enviando a ${session.customer_phone}: "${followupMessage.slice(0, 60)}..."`)
        const sent = await sendWhatsAppMessage(phoneId, waToken, session.customer_phone, followupMessage)

        if (sent) {
          totalSent++
          await supabaseAdmin.from("chat_history").insert({
            session_id: session.id,
            sender: "bot",
            message_text: `[Follow-up automatico]: ${followupMessage}`,
            timestamp: nowIso
          })
          await supabaseAdmin
            .from("chat_sessions")
            .update({ followup_sent_at: nowIso })
            .eq("id", session.id)
          console.log(`[FOLLOW-UP] Enviado OK - sesion ${session.id}`)
        } else {
          console.error(`[FOLLOW-UP] Fallo enviando a ${session.customer_phone}`)
        }
      }
    }
  } catch (err) {
    console.error("[FOLLOW-UP] Error general:", err)
    return new Response(JSON.stringify({ error: String(err) }), {
      status: 500,
      headers: { "Content-Type": "application/json" }
    })
  }

  const summary = { processed: totalProcessed, sent: totalSent, skipped: totalSkipped }
  console.log("[FOLLOW-UP] Finalizado:", summary)
  return new Response(JSON.stringify(summary), { headers: { "Content-Type": "application/json" } })
})

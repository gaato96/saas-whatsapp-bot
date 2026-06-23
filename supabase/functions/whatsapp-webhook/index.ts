// =========================================================================
// SUPABASE EDGE FUNCTION: whatsapp-webhook
// CENTRAL MULTI-TENANT WEBHOOK FOR WHATSAPP CLOUD API & GOOGLE GEMINI
// =========================================================================

// Modelos de Gemini en orden de prioridad — nombres verificados contra la API de Google.
// Si el principal se satura (503/429/404), se pasa automáticamente al siguiente.
const GEMINI_MODELS = [
  "gemini-2.5-flash",      // Principal: máxima calidad (puede saturarse en picos)
  "gemini-2.5-flash-lite", // Fallback 1: versión ligera del mismo modelo
  "gemini-2.0-flash",      // Fallback 2: estable, siempre disponible, en ciclo de soporte activo
]

import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from "https://esm.sh/@supabase/supabase-js@2"

// Helper: llama a Gemini con fallback automático entre modelos si alguno está sobrecargado (503/429)
async function callGeminiWithFallback(body: object, apiKey: string, timeoutMs = 15000): Promise<any> {
  let lastError: Error | null = null
  for (const model of GEMINI_MODELS) {
    const geminiUrl = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`
    const controller = new AbortController()
    const timeoutId = setTimeout(() => controller.abort(), timeoutMs)
    try {
      console.log(`Intentando con modelo: ${model}`)
      const response = await fetch(geminiUrl, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
        signal: controller.signal
      })
      clearTimeout(timeoutId)
      if (response.status === 503 || response.status === 429 || response.status === 404) {
        const errText = await response.text()
        console.warn(`Modelo ${model} respondió ${response.status}. Cambiando al siguiente modelo...`)
        lastError = new Error(`${model} error ${response.status}: ${errText.slice(0, 200)}`)
        continue
      }
      if (!response.ok) {
        const errText = await response.text()
        throw new Error(`Error de Gemini API con modelo ${model}: ${errText}`)
      }
      const data = await response.json()
      console.log(`Respuesta exitosa con modelo: ${model}`)
      return data
    } catch (err: any) {
      clearTimeout(timeoutId)
      if (err.name === "AbortError") {
        console.warn(`Timeout con modelo ${model}. Cambiando al siguiente...`)
        lastError = new Error(`Timeout con modelo ${model}`)
        continue
      }
      // Si es un error de red/código, intentar con el siguiente modelo
      if (lastError || GEMINI_MODELS.indexOf(model) < GEMINI_MODELS.length - 1) {
        console.warn(`Error con modelo ${model}: ${err.message}. Cambiando al siguiente...`)
        lastError = err
        continue
      }
      throw err
    }
  }
  throw lastError || new Error("Todos los modelos de Gemini fallaron")
}

// Variables de entorno de Supabase
const SUPABASE_URL = Deno.env.get("SUPABASE_URL") || ""
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") || ""

// API KEY centralizada de Google Gemini 2.5 Flash
const GEMINI_API_KEY = Deno.env.get("GEMINI_API_KEY") || 
  (typeof process !== "undefined" ? (process.env as any)?.GEMINI_API_KEY : "") || 
  "";

// Inicializar Supabase con privilegios administrativos
const supabaseAdmin = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY)

// CORS headers para llamadas desde el navegador (si aplica)
const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
}

/**
 * 1. CONSTRUCTOR DINÁMICO DEL SYSTEM PROMPT PARA GEMINI
 * Inyecta las reglas del rubro, configuración del negocio y catálogo con stock.
 */
function buildSystemPrompt(businessName: string, rubro: string, rubroConfig: any, products: any[]) {
  // Serializar el catálogo de productos con stock actual
  const catalogText = products.length > 0
    ? products.map(p => `- ID: ${p.id} | Nombre: ${p.name} | Descripción: ${p.description || "Sin descripción"} | Precio: $${p.price} | Stock Disponible: ${p.stock}`).join("\n")
    : "No hay productos o servicios registrados en este momento.";

  // Generar contexto específico del rubro
  let rubroPrompt = "";
  
  if (rubro === "Comida") {
    rubroPrompt = `
- Tu rubro es Restaurante / Delivery de Comida.
- Horarios de cocina: ${rubroConfig.kitchen_hours || "No especificados"}.
- Costo de envío: $${rubroConfig.delivery_cost || "0.00"}.
- Zonas de envío admitidas: ${rubroConfig.shipping_zones || "Todas"}.
- Tiempo estimado de entrega: ${rubroConfig.estimated_time || "A convenir"}.
- Datos bancarios para transferencia: Alias: ${rubroConfig.bank_details?.alias || "N/A"}, CBU: ${rubroConfig.bank_details?.cbu || "N/A"}, Titular: ${rubroConfig.bank_details?.titular || "N/A"}.

FLUJO ESPECÍFICO DE PEDIDO DE COMIDA:
1. Saluda cordialmente e invita al cliente a ver el menú (lista de productos).
2. Pregunta qué desea ordenar. Agrega los productos solicitados al carrito.
3. IMPORTANTE: Valida que la cantidad solicitada sea menor o igual al "Stock Disponible". Si no hay suficiente stock, advierte al usuario inmediatamente.
4. Cuando el cliente diga que finalizó, pídele su dirección completa de envío y calcula el total de la compra (Suma total de ítems + Costo de envío).
5. Pregunta cómo desea pagar (Efectivo o Transferencia).
6. Si elige Transferencia: Muestra los datos de transferencia bancaria y pídele que por favor te envíe una captura del comprobante por este chat. Deja el estado como pendiente de verificación.
7. Si elige Efectivo: Infórmale que pagará al recibir el pedido.
8. Una vez y SOLO cuando tengas: productos (con IDs del catálogo), cantidades, dirección de entrega y método de pago, debes confirmar el pedido e imprimir obligatoriamente la etiqueta de cierre de orden en una nueva línea al final del mensaje (sin formato adicional):
   [ORDER_JSON: {"items": [{"product_id": "UUID", "name": "Nombre", "qty": 1, "price": 10.50}], "payment_method": "transfer" o "cash", "total": Total}]
`;
  } else if (rubro === "Peluquería") {
    rubroPrompt = `
- Tu rubro es Peluquería / Estética.
- Estilistas/Especialistas disponibles: ${rubroConfig.specialists || "Personal del local"}.
- Duración promedio del servicio: ${rubroConfig.average_duration || "30"} minutos.
- Política de cancelación: ${rubroConfig.cancellation_policy || "No especificada"}.

FLUJO ESPECÍFICO DE TURNO:
1. Saluda y muestra los servicios disponibles con sus precios correspondientes.
2. Pídele al cliente que elija un servicio y el especialista de su preferencia.
3. Pregúntale la fecha y el horario deseados de forma conversacional.
4. Al confirmar los datos, debes cerrar la reserva. Los turnos también se registran como un ítem de servicio. Genera la etiqueta final de confirmación:
   [ORDER_JSON: {"items": [{"product_id": "UUID_DEL_SERVICIO", "name": "Servicio con Profesional y Horario", "qty": 1, "price": Precio}], "payment_method": "cash", "total": Total}]
`;
  } else if (rubro === "Agencia") {
    rubroPrompt = `
- Tu rubro es Agencia de Servicios (por ejemplo: marketing, desarrollo, automatizaciones, consultoría).
- Especialidades/Servicios de la Agencia: ${rubroConfig?.agency_specialties || "No especificadas"}.
- Tipo de Agencia: ${rubroConfig?.agency_type || "Servicios profesionales"}.
- Tipo de reunión: ${rubroConfig?.meeting_type || "virtual"}.
- Link de reserva (Calendly/Google Calendar/etc.): ${rubroConfig?.booking_link || "No configurado"}.

FLUJO ESPECÍFICO DE RESERVAS/CONTACTO:
1. Saluda cordialmente y responde dudas sobre los servicios y especialidades de la agencia.
2. Indaga brevemente y de forma conversacional sobre las necesidades del cliente.
3. Invita al cliente a agendar una llamada/videollamada de asesoramiento/consulta utilizando el link de reserva provisto.
4. IMPORTANTE: Comparte el siguiente enlace de reserva de forma clara y atractiva para que el cliente pueda programar su reunión: ${rubroConfig?.booking_link || "Link no disponible"}.
5. Si no hay catálogo de servicios registrados, tu prioridad absoluta es guiar al cliente para que agende mediante el Link de Reserva.
`;
  } else {
    // Rubro general, e-commerce, o personalizado
    rubroPrompt = `
- Tu rubro comercial es: ${rubro}.
- Configuración adicional: ${JSON.stringify(rubroConfig)}

FLUJO GENERAL DE VENTA / ATENCIÓN:
1. Responde dudas sobre los productos y servicios del catálogo.
2. Si el usuario desea comprar o contratar, agrégalo al carrito conversacional respetando el stock disponible.
3. Pídele su información de entrega o modalidad.
4. Define el método de pago (Efectivo o Transferencia).
5. Al concretar la venta, imprime la etiqueta al final en una nueva línea:
   [ORDER_JSON: {"items": [{"product_id": "UUID", "name": "Nombre", "qty": 1, "price": 10.00}], "payment_method": "transfer" o "cash", "total": Total}]
`;
  }

  // Retornar el System Prompt consolidado
  return `
Eres el asistente virtual interactivo e inteligente de "${businessName}". Tu rol es responder consultas de los clientes a través de WhatsApp.

REGLAS GENERALES DE COMPORTAMIENTO:
- Actúa ÚNICAMENTE basándote en la información provista del negocio y su catálogo de productos.
- Si un cliente te pregunta por un producto que no está en el catálogo, o información comercial que no posees, indícale amablemente que no tienes esa información en este momento. NO inventes datos.
- Responde de forma concisa, cálida y directa. Los mensajes deben ser fáciles de leer en dispositivos móviles (utiliza negritas para destacar precios, nombres de productos o pasos clave).
- Mantén el hilo de la conversación (memoria de lo que el cliente va pidiendo) mediante el historial que se te provee.
- Si el cliente es confuso, es grosero o solicita explícitamente hablar con una persona/humano, escribe la etiqueta exacta al final de tu mensaje: [HUMAN_REQUIRED]

REGLAS DE FORMATO PARA WHATSAPP (OBLIGATORIO):
- NUNCA uses el formato Markdown de enlaces [texto](url). WhatsApp NO lo soporta y hace que la URL aparezca duplicada en la pantalla del usuario.
- Cuando debas compartir un enlace, escríbelo siempre de forma directa en el texto. Ejemplo CORRECTO: "Agendá tu reunión aquí: https://calendly.com/ejemplo" — Ejemplo INCORRECTO: "[Agendá aquí](https://calendly.com/ejemplo)"

CATÁLOGO DE PRODUCTOS / SERVICIOS DISPONIBLES:
${catalogText}

${rubroPrompt}

IMPORTANTE: Reemplaza "UUID" en la etiqueta de orden por el ID de catálogo exacto de 36 caracteres provisto en el catálogo. La etiqueta [ORDER_JSON: ...] debe imprimirse en una sola línea al final y ser un JSON válido.
`;
}

// Helper para convertir ArrayBuffer a Base64 en bloques para evitar RangeError y optimizar velocidad
function arrayBufferToBase64(buffer: ArrayBuffer): string {
  const bytes = new Uint8Array(buffer);
  let binary = "";
  const len = bytes.byteLength;
  const chunk = 8000;
  for (let i = 0; i < len; i += chunk) {
    binary += String.fromCharCode.apply(
      null,
      bytes.subarray(i, i + chunk) as any
    );
  }
  return btoa(binary);
}

// =========================================================================
// 2. TRANSCRIPCIÓN DE AUDIO CON GEMINI
// Descarga el archivo de voz enviado por WhatsApp y lo transcribe con IA.
// =========================================================================
async function transcribeAudio(mediaId: string, waToken: string): Promise<string> {
  // Paso 1: Obtener la URL de descarga del archivo de audio en los servidores de Meta
  const controller1 = new AbortController()
  const timeoutId1 = setTimeout(() => controller1.abort(), 6000) // 6 segundos de timeout
  let mediaInfoRes
  try {
    mediaInfoRes = await fetch(`https://graph.facebook.com/v22.0/${mediaId}`, {
      headers: { Authorization: `Bearer ${waToken}` },
      signal: controller1.signal
    })
  } catch (err: any) {
    throw new Error(`Timeout o error de red al obtener info de audio de Meta: ${err.message}`)
  } finally {
    clearTimeout(timeoutId1)
  }

  if (!mediaInfoRes.ok) {
    const err = await mediaInfoRes.text()
    throw new Error(`No se pudo obtener la info del audio de Meta: ${err}`)
  }
  const mediaInfo = await mediaInfoRes.json()
  const mediaUrl: string = mediaInfo.url
  // Limpiar el tipo mime (ej: "audio/ogg; codecs=opus" -> "audio/ogg") ya que Gemini es sensible a los codecs en el string
  const mimeType = (mediaInfo.mime_type || "audio/ogg").split(";")[0].trim()

  // Paso 2: Descargar el binario del archivo de audio
  const controller2 = new AbortController()
  const timeoutId2 = setTimeout(() => controller2.abort(), 8000) // 8 segundos de timeout
  let audioDownloadRes
  try {
    audioDownloadRes = await fetch(mediaUrl, {
      headers: { Authorization: `Bearer ${waToken}` },
      signal: controller2.signal
    })
  } catch (err: any) {
    throw new Error(`Timeout o error de red al descargar audio de Meta: ${err.message}`)
  } finally {
    clearTimeout(timeoutId2)
  }

  if (!audioDownloadRes.ok) {
    throw new Error(`No se pudo descargar el archivo de audio: ${await audioDownloadRes.text()}`)
  }
  const audioBuffer = await audioDownloadRes.arrayBuffer()
  const audioBase64 = arrayBufferToBase64(audioBuffer)

  // Paso 3: Enviar el audio a Gemini para transcripción
  // Transcribir con fallback automático entre modelos Gemini
  const transcriptionPayload = {
    contents: [{
      role: "user",
      parts: [
        {
          inline_data: {
            mime_type: mimeType,
            data: audioBase64
          }
        },
        {
          text: "Transcribe este mensaje de voz en español de forma exacta. Devuelve únicamente el texto transcripto sin comentarios adicionales."
        }
      ]
    }]
  }

  const geminiData = await callGeminiWithFallback(transcriptionPayload, GEMINI_API_KEY, 15000)
  const transcript = geminiData.candidates?.[0]?.content?.parts?.[0]?.text?.trim() || ""
  return transcript
}

serve(async (req) => {
  // Manejar preflight de CORS
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders })
  }

  const url = new URL(req.url)
  const queryBusinessId = url.searchParams.get("business_id")

  // ==========================================
  // A. VALIDACIÓN DE WEBHOOK EN META (GET)
  // ==========================================
  if (req.method === "GET") {
    const mode = url.searchParams.get("hub.mode")
    const token = url.searchParams.get("hub.verify_token")
    const challenge = url.searchParams.get("hub.challenge")

    if (mode === "subscribe" && token && challenge) {
      let dbVerifyToken = Deno.env.get("META_VERIFY_TOKEN") // Token de verificación global por defecto

      // Si se especificó un business_id en la URL, validar el token específico de ese negocio
      if (queryBusinessId) {
        const { data: business } = await supabaseAdmin
          .from("businesses")
          .select("whatsapp_config")
          .eq("id", queryBusinessId)
          .single()
        
        if (business?.whatsapp_config?.verify_token) {
          dbVerifyToken = business.whatsapp_config.verify_token
        }
      }

      if (token === dbVerifyToken) {
        console.log("Webhook verificado exitosamente.")
        return new Response(challenge, {
          status: 200,
          headers: { "Content-Type": "text/plain" },
        })
      } else {
        console.error("Tokens de verificación no coinciden.")
        return new Response("Prohibido", { status: 403 })
      }
    }
    return new Response("Parámetros faltantes", { status: 400 })
  }

  // ==========================================
  // B. RECEPCIÓN Y ENRUTAMIENTO DE MENSAJES (POST)
  // ==========================================
  if (req.method === "POST") {
    let body: any = null
    try {
      body = await req.json()
    } catch (err) {
      console.error("Error al parsear JSON del payload:", err)
      return new Response("JSON inválido", { status: 400 })
    }

    if (!body) {
      return new Response("Payload vacío", { status: 200 })
    }

    // Procesar en segundo plano para responderle a Meta en menos de 3 segundos
    const processPromise = (async () => {
      // 1. Forzar una pausa corta para permitir que la respuesta 200 OK se envíe y limpie el socket de Meta
      await new Promise(resolve => setTimeout(resolve, 100))

      try {
        // 2. Registrar log inicial en segundo plano y obtener su ID
        let currentLogId = null
        try {
          const { data: logRes, error: logErr } = await supabaseAdmin
            .from("webhook_logs")
            .insert({
              method: "POST",
              url: req.url,
              payload: body
            })
            .select("id")
            .single()
          
          if (!logErr && logRes) {
            currentLogId = logRes.id
          }
        } catch (logErr) {
          console.error("Error al registrar log inicial:", logErr)
        }

        // 3. Validar estructura del mensaje
        const entry = body.entry?.[0]
        const change = entry?.changes?.[0]
        const value = change?.value

        if (!value) {
          console.log("Formato de payload desconocido o vacío")
          return
        }

        // Ignorar notificaciones de estado (lectura, entrega)
        if (value.statuses) {
          return
        }

        const messageObj = value.messages?.[0]
        if (!messageObj) {
          console.log("Sin mensajes nuevos en el payload")
          return
        }

        // 4. Control de duplicados en segundo plano: consultar logs recientes y comparar en JS
        const messageId = messageObj.id
        if (messageId && currentLogId) {
          try {
            const { data: recentLogs } = await supabaseAdmin
              .from("webhook_logs")
              .select("id, payload")
              .order("created_at", { ascending: false })
              .limit(20)
            
            const isDuplicate = recentLogs?.some(log => 
              log.id !== currentLogId && 
              log.payload?.entry?.[0]?.changes?.[0]?.value?.messages?.[0]?.id === messageId
            )
            
            if (isDuplicate) {
              console.log(`Mensaje duplicado detectado en JS (ID: ${messageId}). Cancelando procesamiento de este hilo.`)
              return
            }
          } catch (dupErr) {
            console.error("Error buscando duplicados:", dupErr)
          }
        }

        const customerPhone = messageObj.from
        const phoneId = value.metadata?.phone_number_id // ID del teléfono Meta receptor
        const messageType = messageObj.type // "text", "audio", "image", etc.

        let messageText = ""
        let isAudioTranscription = false

        if (messageType === "text") {
          messageText = messageObj.text?.body?.trim() || ""
        } else if (messageType === "audio") {
          // Procesar mensaje de voz: descargar y transcribir con Gemini
          const mediaId = messageObj.audio?.id
          console.log(`Mensaje de audio recibido de ${customerPhone}. Media ID: ${mediaId}`)
          // Marcamos como pendiente; el token de WhatsApp se obtiene después de buscar el negocio
          messageText = `__AUDIO_PENDING__:${mediaId}`
          isAudioTranscription = true
        } else {
          // Ignorar otros tipos (imagen, video, documento, sticker, etc.)
          console.log(`Tipo de mensaje no soportado: "${messageType}". Ignorando.`)
          return
        }

        if (!messageText) {
          console.log("Mensaje sin contenido ignorado")
          return
        }

        console.log(`Mensaje entrante de: ${customerPhone} al número receptor Meta: ${phoneId}. Tipo: ${messageType}`)

        // 2. Buscar negocio en base de datos usando el Phone Number ID de Meta
        let business = null
        let businessId = queryBusinessId

        if (phoneId) {
          const { data, error } = await supabaseAdmin
            .from("businesses")
            .select("id, name, rubro, whatsapp_config")
            .eq("whatsapp_config->>phone_number_id", phoneId)
            .maybeSingle()

          if (!error && data) {
            business = data
            businessId = data.id
          }
        }

        // Fallback a buscar por ID directo si venía en los parámetros de la URL
        if (!business && businessId) {
          const { data, error } = await supabaseAdmin
            .from("businesses")
            .select("id, name, rubro, whatsapp_config")
            .eq("id", businessId)
            .maybeSingle()
          
          if (!error && data) {
            business = data
          }
        }

        if (!business) {
          console.error(`Error: No se encontró ningún negocio configurado para el Phone Number ID: ${phoneId} o Business ID: ${businessId}`)
          return
        }

        // 3. Obtener metadata de rubro y catálogo de productos activos
        const { data: rubroData } = await supabaseAdmin
          .from("business_rubro_data")
          .select("custom_metadata")
          .eq("business_id", business.id)
          .maybeSingle()

        const { data: products } = await supabaseAdmin
          .from("products_services")
          .select("id, name, description, price, stock")
          .eq("business_id", business.id)
          .eq("is_active", true)

        const rubroConfig = rubroData?.custom_metadata || {}
        const activeProducts = products || []

        // 4. Recuperar o crear la sesión de conversación
        let { data: session } = await supabaseAdmin
          .from("chat_sessions")
          .select("id, status")
          .eq("business_id", business.id)
          .eq("customer_phone", customerPhone)
          .maybeSingle()

        if (!session) {
          const { data: newSession, error: createSessionError } = await supabaseAdmin
            .from("chat_sessions")
            .insert({
              business_id: business.id,
              customer_phone: customerPhone,
              status: "bot_handling",
              last_interaction: new Date().toISOString()
            })
            .select()
            .single()

          if (createSessionError) {
            console.error("Error creando sesión:", createSessionError)
            return
          }
          session = newSession
        }

        // Si el chat está bloqueado por takeover humano, ignoramos las peticiones para no interferir con el agente
        if (session.status === "human_required") {
          console.log(`Sesión de ${customerPhone} está en modo manual (Agente Humano). Ignorando respuesta del bot.`)
          return
        }

        // 5a. Si el mensaje era un audio, transcribirlo ahora que tenemos el token
        if (isAudioTranscription && messageText.startsWith("__AUDIO_PENDING__:")) {
          const mediaId = messageText.replace("__AUDIO_PENDING__:", "")
          const waToken = business.whatsapp_config?.access_token
          if (!waToken) {
            console.error("No hay access_token configurado para transcribir audio.")
            return
          }
          try {
            console.log(`Transcribiendo audio con Gemini... Media ID: ${mediaId}`)
            const transcript = await transcribeAudio(mediaId, waToken)
            if (!transcript) {
              console.warn("Transcripción vacía, ignorando mensaje de audio.")
              return
            }
            messageText = transcript
            console.log(`Audio transcripto con éxito: "${messageText}"`)
          } catch (audioErr) {
            console.error("Error transcribiendo audio:", audioErr)
            // Notificar al cliente que no se pudo procesar el audio
            const waToken2 = business.whatsapp_config?.access_token
            if (waToken2 && phoneId) {
              await fetch(`https://graph.facebook.com/v22.0/${phoneId}/messages`, {
                method: "POST",
                headers: { "Content-Type": "application/json", Authorization: `Bearer ${waToken2}` },
                body: JSON.stringify({
                  messaging_product: "whatsapp",
                  to: customerPhone,
                  type: "text",
                  text: { body: "Lo siento, no pude procesar tu mensaje de voz en este momento. Por favor, escribe tu consulta por texto. 🙏" }
                })
              })
            }
            return
          }
        }

        // 5b. Guardar el mensaje entrante del cliente en el historial
        const storedText = isAudioTranscription ? `🎙️ [Mensaje de voz transcripto]: ${messageText}` : messageText
        await supabaseAdmin.from("chat_history").insert({
          session_id: session.id,
          sender: "customer",
          message_text: storedText,
          timestamp: new Date().toISOString()
        })

        // Actualizar la última fecha de interacción de la sesión
        await supabaseAdmin
          .from("chat_sessions")
          .update({ last_interaction: new Date().toISOString() })
          .eq("id", session.id)

        // 6. Cargar historial de chat reciente (Últimos 10 mensajes)
        const { data: rawHistory } = await supabaseAdmin
          .from("chat_history")
          .select("sender, message_text, timestamp")
          .eq("session_id", session.id)
          .order("timestamp", { ascending: false })
          .limit(10)

        const chatHistory = rawHistory ? [...rawHistory].reverse() : []

        // 7. Construir System Prompt dinámico
        const systemPrompt = buildSystemPrompt(business.name, business.rubro, rubroConfig, activeProducts)

        // Formatear el historial en la estructura de roles de la API de Gemini
        const contents = chatHistory.map(h => ({
          role: h.sender === "customer" ? "user" : "model",
          parts: [{ text: h.message_text }]
        }))

        // ==========================================
        // C. CONEXIÓN CON LA API DE GEMINI 2.5 FLASH
        // ==========================================
        const callGemini = async (conversationContents: any[]) => {
          const payload = {
            contents: conversationContents,
            systemInstruction: {
              parts: [{ text: systemPrompt }]
            },
            generationConfig: {
              temperature: 0.2,
              maxOutputTokens: 1000
            }
          }

          // Usar fallback automático entre modelos si el principal está saturado
          const data = await callGeminiWithFallback(payload, GEMINI_API_KEY, 15000)
          return data.candidates?.[0]?.content?.parts?.[0]?.text || ""
        }

        console.log("Invocando a Gemini 2.5 Flash...")
        let aiResponse = await callGemini(contents)
        console.log("Respuesta de Gemini recibida:", aiResponse)

        // ==========================================
        // D. PROCESAMIENTO DE ACCIONES Y AUTOCORRECCIÓN
        // ==========================================
        let userFacingMessage = aiResponse
        let isHumanRequired = false
        let orderToCreate = null

        // Evaluar si la IA solicita pasar al agente humano
        if (userFacingMessage.includes("[HUMAN_REQUIRED]")) {
          isHumanRequired = true
          userFacingMessage = userFacingMessage.replace("[HUMAN_REQUIRED]", "").trim()
        }

        // Evaluar si la IA generó una etiqueta de orden cerrada
        const orderJsonRegex = /\[ORDER_JSON:\s*({.*?})\]/s
        const match = userFacingMessage.match(orderJsonRegex)
        if (match) {
          try {
            orderToCreate = JSON.parse(match[1])
            // Remover la etiqueta cruda del mensaje que va al cliente de WhatsApp
            userFacingMessage = userFacingMessage.replace(orderJsonRegex, "").trim()
            console.log(`Orden parseada con éxito para procesar:`, orderToCreate)
          } catch (jsonErr) {
            console.error("Error parseando etiqueta de orden JSON de Gemini:", jsonErr)
          }
        }

        // Si hay una orden, ejecutar el checkout transaccional en la DB
        if (orderToCreate) {
          console.log("Ejecutando proceso de checkout automático en Supabase...")
          
          // Llamada a la función PostgreSQL process_automatic_checkout
          const { data: checkoutResult, error: rpcErr } = await supabaseAdmin.rpc(
            "process_automatic_checkout",
            {
              p_business_id: business.id,
              p_customer_phone: customerPhone,
              p_payment_method: orderToCreate.payment_method,
              p_total: orderToCreate.total,
              p_items: orderToCreate.items
            }
          )

          if (rpcErr || !checkoutResult?.success) {
            const errorMsg = rpcErr?.message || checkoutResult?.error || "Error al verificar stock o crear el pedido."
            console.warn(`[AUTOCORRECCIÓN] Fallo de stock detectado: ${errorMsg}`)

            // Inyectar el fallo en el historial del chat y forzar una re-evaluación con Gemini
            const correctionMessage = `SISTEMA: El pedido no se pudo procesar debido a este error: "${errorMsg}". Informa amablemente al usuario de esta situación para que cambie la cantidad o el producto. Tu catálogo actual refleja el stock real.`
            
            const correctedContents = [
              ...contents,
              { role: "model", parts: [{ text: aiResponse }] },
              { role: "user", parts: [{ text: correctionMessage }] }
            ]

            console.log("Invocando re-evaluación en Gemini por error de stock...")
            const correctedAiResponse = await callGemini(correctedContents)
            userFacingMessage = correctedAiResponse.replace(orderJsonRegex, "").replace("[HUMAN_REQUIRED]", "").trim()
            console.log("Respuesta corregida de Gemini:", userFacingMessage)
          } else {
            console.log(`Pedido creado exitosamente con ID: ${checkoutResult.order_id}`)
          }
        }

        // Si se detectó requerimiento humano, actualizar la sesión
        if (isHumanRequired) {
          await supabaseAdmin
            .from("chat_sessions")
            .update({ status: "human_required" })
            .eq("id", session.id)
          
          console.log(`La sesión de ${customerPhone} ha sido transferida a un agente humano.`)
        }

        // 8. Guardar la respuesta final de la IA en el historial
        await supabaseAdmin.from("chat_history").insert({
          session_id: session.id,
          sender: "bot",
          message_text: userFacingMessage,
          timestamp: new Date().toISOString()
        })

        // ==========================================
        // E. ENVÍO DE MENSAJE DE VUELTA A WHATSAPP
        // ==========================================
        const waToken = business.whatsapp_config?.access_token
        if (waToken && phoneId) {
          const waSendUrl = `https://graph.facebook.com/v22.0/${phoneId}/messages`
          
          const waPayload = {
            messaging_product: "whatsapp",
            recipient_type: "individual",
            to: customerPhone,
            type: "text",
            text: { body: userFacingMessage },
          }

          console.log(`Despachando mensaje de WhatsApp a ${customerPhone}...`)
          const waResponse = await fetch(waSendUrl, {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              Authorization: `Bearer ${waToken}`,
            },
            body: JSON.stringify(waPayload),
          })

          if (!waResponse.ok) {
            const waErrText = await waResponse.text()
            console.error(`Error en la API de envío de WhatsApp Meta: ${waErrText}`)
          } else {
            console.log("Mensaje de WhatsApp enviado con éxito.")
          }
        } else {
          console.warn("Advertencia: El negocio no tiene configurado un 'access_token' o 'phone_number_id' de WhatsApp. Se omitió el envío externo.")
        }
      } catch (err: any) {
        console.error("Fallo general en la ejecución del Webhook POST (segundo plano):", err)
        // Registrar el error en logs
        try {
          await supabaseAdmin.from("webhook_logs").insert({
            method: "POST",
            url: req.url,
            payload: body,
            error_message: err.message
          })
        } catch (logErr) {
          console.error("Error al registrar log de error:", logErr)
        }
        // CRÍTICO: Siempre enviar un mensaje de cortesía al usuario para que NUNCA quede en silencio
        try {
          const errValue = body?.entry?.[0]?.changes?.[0]?.value
          const errMsgObj = errValue?.messages?.[0]
          const errPhone = errMsgObj?.from
          const errPhoneId = errValue?.metadata?.phone_number_id
          if (errPhone && errPhoneId) {
            const { data: errBiz } = await supabaseAdmin
              .from("businesses")
              .select("whatsapp_config")
              .eq("whatsapp_config->>phone_number_id", errPhoneId)
              .maybeSingle()
            const errToken = errBiz?.whatsapp_config?.access_token
            if (errToken) {
              await fetch(`https://graph.facebook.com/v22.0/${errPhoneId}/messages`, {
                method: "POST",
                headers: { "Content-Type": "application/json", Authorization: `Bearer ${errToken}` },
                body: JSON.stringify({
                  messaging_product: "whatsapp",
                  to: errPhone,
                  type: "text",
                  text: { body: "Disculpá, estoy teniendo dificultades técnicas en este momento. Por favor, intentá de nuevo en unos segundos. 🙏" }
                })
              })
              console.log("Mensaje de cortesía de error enviado al usuario.")
            }
          }
        } catch (notifyErr) {
          console.error("No se pudo enviar el mensaje de cortesía de error:", notifyErr)
        }
      }
    })()

    if (typeof EdgeRuntime !== "undefined") {
      (EdgeRuntime as any).waitUntil(processPromise)
    }

    return new Response("Mensaje recibido", { status: 200 })
  }

  return new Response("Método no soportado", { status: 405 })
})

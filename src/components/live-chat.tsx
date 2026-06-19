'use client'

import React, { useEffect, useState, useRef } from 'react'
import { createClient } from '@/lib/supabase/client'

interface Session {
  id: string
  customer_phone: string
  last_interaction: string
  status: 'bot_handling' | 'human_required'
}

interface Message {
  id: string
  session_id: string
  sender: 'bot' | 'customer' | 'agent'
  message_text: string
  timestamp: string
}

interface LiveChatProps {
  businessId: string
  initialSessions: Session[]
}

export function LiveChat({ businessId, initialSessions }: LiveChatProps) {
  const supabase = createClient()
  const [sessions, setSessions] = useState<Session[]>(initialSessions)
  const [selectedSessionId, setSelectedSessionId] = useState<string | null>(
    initialSessions[0]?.id || null
  )
  const [messages, setMessages] = useState<Message[]>([])
  const [newMessage, setNewMessage] = useState('')
  const [dbConnected, setDbConnected] = useState(true)
  const messagesEndRef = useRef<HTMLDivElement>(null)

  // Demo Fallback
  useEffect(() => {
    if (businessId === 'demo-business-id' && initialSessions.length === 0) {
      setDbConnected(false)
      const demoSessions: Session[] = [
        {
          id: 'session-demo-1',
          customer_phone: '5491138293849',
          last_interaction: new Date().toISOString(),
          status: 'human_required',
        },
        {
          id: 'session-demo-2',
          customer_phone: '5491129384729',
          last_interaction: new Date(Date.now() - 600000).toISOString(),
          status: 'bot_handling',
        },
      ]
      setSessions(demoSessions)
      setSelectedSessionId(demoSessions[0].id)
      
      setMessages([
        {
          id: 'm1',
          session_id: 'session-demo-1',
          sender: 'customer',
          message_text: 'Hola, me gustaría ordenar una hamburguesa con papas.',
          timestamp: new Date(Date.now() - 300000).toISOString(),
        },
        {
          id: 'm2',
          session_id: 'session-demo-1',
          sender: 'bot',
          message_text: '¡Hola! Claro, con gusto. Tenemos la Hamburguesa Triple Cheese ($2100) y Papas Fritas ($350). ¿Deseas agregar algo más?',
          timestamp: new Date(Date.now() - 250000).toISOString(),
        },
        {
          id: 'm3',
          session_id: 'session-demo-1',
          sender: 'customer',
          message_text: 'Sí, las papas medianas y una coca. ¿Tienen a domicilio?',
          timestamp: new Date(Date.now() - 200000).toISOString(),
        },
        {
          id: 'm4',
          session_id: 'session-demo-1',
          sender: 'bot',
          message_text: 'Sí, hacemos envíos. El costo es de $150. ¿Me podrías indicar tu dirección exacta por favor?',
          timestamp: new Date(Date.now() - 150000).toISOString(),
        },
        {
          id: 'm5',
          session_id: 'session-demo-1',
          sender: 'customer',
          message_text: 'Quiero hablar con un agente para consultarle sobre un ingrediente.',
          timestamp: new Date(Date.now() - 100000).toISOString(),
        },
        {
          id: 'm6',
          session_id: 'session-demo-1',
          sender: 'bot',
          message_text: 'Entendido. Un momento, por favor. Transferiré este chat a un asesor humano.',
          timestamp: new Date(Date.now() - 95000).toISOString(),
        }
      ])
    }
  }, [businessId, initialSessions])

  // Desplazar automáticamente el chat hacia abajo
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }

  useEffect(() => {
    scrollToBottom()
  }, [messages])

  // Cargar hilos históricos
  useEffect(() => {
    if (!selectedSessionId) return

    if (!dbConnected || businessId === 'demo-business-id') {
      // Cargar mensajes mock correspondientes según el talle/producto (Hamburguesa vs Zapatillas)
      if (selectedSessionId === 'session-demo-1') {
        setMessages([
          {
            id: 'm1',
            session_id: 'session-demo-1',
            sender: 'customer',
            message_text: 'Hola, me gustaría ordenar una hamburguesa con papas.',
            timestamp: new Date(Date.now() - 300000).toISOString(),
          },
          {
            id: 'm2',
            session_id: 'session-demo-1',
            sender: 'bot',
            message_text: '¡Hola! Claro, con gusto. Tenemos la Hamburguesa Triple Cheese ($2100) y Papas Fritas ($350). ¿Deseas agregar algo más?',
            timestamp: new Date(Date.now() - 250000).toISOString(),
          },
          {
            id: 'm3',
            session_id: 'session-demo-1',
            sender: 'customer',
            message_text: 'Sí, las papas medianas y una coca. ¿Tienen a domicilio?',
            timestamp: new Date(Date.now() - 200000).toISOString(),
          },
          {
            id: 'm4',
            session_id: 'session-demo-1',
            sender: 'bot',
            message_text: 'Sí, hacemos envíos. El costo es de $150. ¿Me podrías indicar tu dirección exacta por favor?',
            timestamp: new Date(Date.now() - 150000).toISOString(),
          },
          {
            id: 'm5',
            session_id: 'session-demo-1',
            sender: 'customer',
            message_text: 'Quiero hablar con un agente para consultarle sobre un ingrediente.',
            timestamp: new Date(Date.now() - 100000).toISOString(),
          },
          {
            id: 'm6',
            session_id: 'session-demo-1',
            sender: 'bot',
            message_text: 'Entendido. Un momento, por favor. Transferiré este chat a un asesor humano.',
            timestamp: new Date(Date.now() - 95000).toISOString(),
          }
        ])
      } else if (selectedSessionId === 'session-demo-2') {
        setMessages([
          {
            id: 'z1',
            session_id: 'session-demo-2',
            sender: 'customer',
            message_text: 'Hola, buenas tardes. ¿Tienen zapatillas Nike Air Max talle 41?',
            timestamp: new Date(Date.now() - 600000).toISOString(),
          },
          {
            id: 'z2',
            session_id: 'session-demo-2',
            sender: 'bot',
            message_text: '¡Hola! Sí, disponemos de stock en **Nike Air Max** color Negro y Blanco en talle 41. Su valor es de **$85.000**. ¿Te gustaría reservar unas?',
            timestamp: new Date(Date.now() - 550000).toISOString(),
          },
          {
            id: 'z3',
            session_id: 'session-demo-2',
            sender: 'customer',
            message_text: 'Buenísimo, me interesan las negras. ¿Hacen envíos a Belgrano?',
            timestamp: new Date(Date.now() - 500000).toISOString(),
          },
          {
            id: 'z4',
            session_id: 'session-demo-2',
            sender: 'bot',
            message_text: '¡Excelente! Sí, hacemos envíos a Belgrano. El costo de envío a tu zona es de **$1.200**, o bien envío **gratis** si agregas unas medias o producto extra de nuestro catálogo. ¿Confirmamos la reserva de las zapatillas?',
            timestamp: new Date(Date.now() - 450000).toISOString(),
          },
          {
            id: 'z5',
            session_id: 'session-demo-2',
            sender: 'customer',
            message_text: 'De una, confirmemos las zapatillas solas. Dirección: Av. Cabildo 1500, 4B. Pago por transferencia.',
            timestamp: new Date(Date.now() - 400000).toISOString(),
          },
          {
            id: 'z6',
            session_id: 'session-demo-2',
            sender: 'bot',
            message_text: '¡Perfecto! Agendado. El total de tu pedido es **$86.200** (Zapatillas + Envío). Para abonar, realiza la transferencia a:\n\n* **Alias**: TIENDA.ZAPAS.GO\n* **CBU**: 0170093847293847293847\n* **Titular**: Juan Manuel Zapatillas S.A.\n\nPor favor, envíame el comprobante por este chat para que el dueño valide el pago y despache tu pedido.',
            timestamp: new Date(Date.now() - 350000).toISOString(),
          }
        ])
      }
      return
    }

    const loadMessages = async () => {
      const { data } = await supabase
        .from('chat_history')
        .select('*')
        .eq('session_id', selectedSessionId)
        .order('timestamp', { ascending: true })

      setMessages(data || [])
    }

    loadMessages()
  }, [selectedSessionId, dbConnected, businessId, supabase])

  // Suscripción Realtime en Supabase para Chats
  useEffect(() => {
    if (businessId === 'demo-business-id') return

    // 1. Escuchar actualizaciones en las sesiones de este negocio
    const sessionsChannel = supabase
      .channel(`live_sessions_${businessId}`)
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'chat_sessions', filter: `business_id=eq.${businessId}` },
        (payload) => {
          console.log('[Realtime Chat] Cambio en sesión:', payload)
          if (payload.eventType === 'INSERT') {
            const newSession = payload.new as Session
            setSessions((prev) => [newSession, ...prev])
          } else if (payload.eventType === 'UPDATE') {
            const updated = payload.new as Session
            setSessions((prev) => prev.map((s) => (s.id === updated.id ? updated : s)))
          }
        }
      )
      .subscribe()

    // 2. Escuchar inserciones en el historial de chat
    const historyChannel = supabase
      .channel(`live_history_${businessId}`)
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'chat_history' },
        (payload) => {
          const newMsg = payload.new as Message
          // Si el mensaje pertenece al chat seleccionado, añadirlo al feed
          if (newMsg.session_id === selectedSessionId) {
            setMessages((prev) => [...prev, newMsg])
          }
          
          // Actualizar la fecha de última interacción en la lista de la barra lateral
          setSessions((prev) =>
            prev.map((s) =>
              s.id === newMsg.session_id
                ? { ...s, last_interaction: newMsg.timestamp }
                : s
            ).sort((a, b) => new Date(b.last_interaction).getTime() - new Date(a.last_interaction).getTime())
          )
        }
      )
      .subscribe()

    return () => {
      supabase.removeChannel(sessionsChannel)
      supabase.removeChannel(historyChannel)
    }
  }, [businessId, selectedSessionId, supabase])

  // Cambiar estado del takeover (Bot vs Humano)
  const handleToggleTakeover = async (session: Session) => {
    const nextStatus = session.status === 'bot_handling' ? 'human_required' : 'bot_handling'
    
    if (!dbConnected || businessId === 'demo-business-id') {
      setSessions((prev) =>
        prev.map((s) => (s.id === session.id ? { ...s, status: nextStatus } : s))
      )
      
      // Agregar un mensaje informando del cambio de estado en la interfaz
      const sysMsg: Message = {
        id: Math.random().toString(),
        session_id: session.id,
        sender: 'bot',
        message_text: nextStatus === 'human_required' 
          ? '⚠️ Control Manual Activado: Las respuestas automáticas de la IA han sido pausadas.'
          : '🤖 Control del Bot Reestablecido: La IA volverá a contestar los mensajes entrantes.',
        timestamp: new Date().toISOString(),
      }
      setMessages(prev => [...prev, sysMsg])
      return
    }

    const { error } = await supabase
      .from('chat_sessions')
      .update({ status: nextStatus })
      .eq('id', session.id)

    if (error) {
      console.error('Error actualizando estado de sesión:', error)
    }
  }

  // Enviar mensaje como Agente Humano
  const handleSendAgentMessage = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!newMessage.trim() || !selectedSessionId) return

    const msgText = newMessage.trim()
    setNewMessage('')

    if (!dbConnected || businessId === 'demo-business-id') {
      const mockMsg: Message = {
        id: Math.random().toString(),
        session_id: selectedSessionId,
        sender: 'agent',
        message_text: msgText,
        timestamp: new Date().toISOString(),
      }
      setMessages((prev) => [...prev, mockMsg])
      
      // Simular respuesta del cliente tras 2 segundos para testing
      setTimeout(() => {
        const mockCustomerResponse: Message = {
          id: Math.random().toString(),
          session_id: selectedSessionId,
          sender: 'customer',
          message_text: 'Excelente, muchas gracias por contestarme.',
          timestamp: new Date().toISOString(),
        }
        setMessages((prev) => [...prev, mockCustomerResponse])
      }, 2000)
      return
    }

    // Insertar el mensaje del agente en Supabase.
    // El trigger de base de datos o la lógica de negocio notificará a WhatsApp, y realtime actualizará la pantalla.
    const { error } = await supabase.from('chat_history').insert({
      session_id: selectedSessionId,
      sender: 'agent',
      message_text: msgText,
    })

    if (error) {
      console.error("Error al enviar mensaje:", error)
      alert("No se pudo enviar el mensaje.")
    }
  }

  const currentSession = sessions.find((s) => s.id === selectedSessionId)

  return (
    <div className="border border-zinc-900 bg-zinc-950/60 rounded-2xl overflow-hidden grid grid-cols-1 md:grid-cols-3 h-[650px] shadow-sm">
      
      {/* 1. SECCIÓN IZQUIERDA: LISTA DE CONVERSACIONES */}
      <div className="border-r border-zinc-900 flex flex-col h-full bg-zinc-950">
        <div className="p-4 border-b border-zinc-900 flex justify-between items-center bg-zinc-950/40">
          <span className="text-xs font-bold uppercase tracking-wider text-zinc-400">Chats Recientes</span>
          <span className="text-[10px] text-zinc-600 font-bold">Total: {sessions.length}</span>
        </div>
        <div className="flex-1 overflow-y-auto divide-y divide-zinc-900/40">
          {sessions.length === 0 ? (
            <div className="p-8 text-center text-xs text-zinc-600 font-medium">Sin chats de clientes activos</div>
          ) : (
            sessions.map((s) => {
              const isHuman = s.status === 'human_required'
              const isSelected = s.id === selectedSessionId
              
              return (
                <button
                  key={s.id}
                  onClick={() => setSelectedSessionId(s.id)}
                  className={`w-full text-left p-4 hover:bg-zinc-900/20 transition-all flex flex-col gap-2 relative border-l-4 ${
                    isSelected ? 'bg-zinc-900/40 border-l-purple-500' : 'border-l-transparent'
                  } ${
                    isHuman && !isSelected ? 'bg-red-500/[0.03] border-l-red-500/60' : ''
                  }`}
                >
                  <div className="flex items-center justify-between w-full">
                    <span className="font-bold text-xs text-zinc-200 font-mono">
                      📞 {s.customer_phone}
                    </span>
                    <span className="text-[9px] text-zinc-500">
                      {new Date(s.last_interaction).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </span>
                  </div>
                  
                  <div className="flex items-center justify-between w-full">
                    {isHuman ? (
                      <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded text-[9px] font-extrabold uppercase tracking-wide bg-red-500/10 border border-red-500/20 text-red-400">
                        <span className="h-1.5 w-1.5 rounded-full bg-red-400 animate-pulse" />
                        Agente Requerido
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[9px] font-medium bg-zinc-900 border border-zinc-800 text-zinc-500">
                        🤖 Bot Atendiendo
                      </span>
                    )}
                  </div>
                </button>
              )
            })
          )}
        </div>
      </div>

      {/* 2. SECCIÓN DERECHA: CONVERSACIÓN ACTIVA */}
      <div className="col-span-2 flex flex-col h-full bg-zinc-950/20 relative">
        {currentSession ? (
          <>
            {/* Header del Chat */}
            <div className="p-4 border-b border-zinc-900 bg-zinc-950/60 flex items-center justify-between">
              <div>
                <span className="font-bold text-xs text-white">Cliente: {currentSession.customer_phone}</span>
                <div className="flex items-center gap-1.5 mt-0.5">
                  <span className={`h-1.5 w-1.5 rounded-full ${currentSession.status === 'human_required' ? 'bg-red-400 animate-pulse' : 'bg-purple-400'}`} />
                  <span className="text-[10px] text-zinc-500">
                    {currentSession.status === 'human_required' ? 'Monitoreando en modo manual' : 'El Bot Gemini está respondiendo automáticamente'}
                  </span>
                </div>
              </div>
              
              <button
                onClick={() => handleToggleTakeover(currentSession)}
                className={`rounded-lg px-3.5 py-1.5 text-xs font-bold border transition-all ${
                  currentSession.status === 'human_required'
                    ? 'bg-red-500/10 border-red-500/20 text-red-400 hover:bg-red-500/20 shadow-md shadow-red-500/5'
                    : 'bg-zinc-900 border-zinc-800 text-zinc-400 hover:text-white'
                }`}
              >
                {currentSession.status === 'human_required' ? '🤖 Habilitar Bot' : '👨‍💼 Tomar Control'}
              </button>
            </div>

            {/* Ventana de Mensajes con scroll forzado y altura máxima fija */}
            <div className="flex-1 h-[480px] max-h-[480px] overflow-y-auto p-5 space-y-4 bg-zinc-950/5">
              {messages.map((m) => {
                const isCustomer = m.sender === 'customer'
                const isBot = m.sender === 'bot'
                const isAgent = m.sender === 'agent'
                
                let bubbleStyle = ''
                let containerStyle = 'flex flex-col'
                
                if (isCustomer) {
                  containerStyle += ' items-start'
                  bubbleStyle = 'bg-zinc-900 text-zinc-100 rounded-bl-none border border-zinc-850'
                } else if (isBot) {
                  containerStyle += ' items-end'
                  // Si el mensaje es una notificación de sistema interna (empieza con ⚠️ o 🤖)
                  const isSys = m.message_text.startsWith('⚠️') || m.message_text.startsWith('🤖')
                  bubbleStyle = isSys
                    ? 'bg-zinc-900/30 border border-zinc-850 text-zinc-400 italic rounded-lg py-1.5 px-3 max-w-lg text-center'
                    : 'bg-purple-950/35 border border-purple-900/30 text-purple-200 rounded-br-none'
                } else if (isAgent) {
                  containerStyle += ' items-end'
                  bubbleStyle = 'bg-blue-600 text-white rounded-br-none shadow-md shadow-blue-500/5'
                }

                return (
                  <div key={m.id} className={containerStyle}>
                    <div className="flex items-center gap-1.5 mb-1 px-1">
                      {isCustomer && <span className="text-[9px] font-bold text-zinc-400">👤 Cliente</span>}
                      {isBot && !m.message_text.startsWith('⚠️') && !m.message_text.startsWith('🤖') && (
                        <span className="text-[9px] font-bold text-purple-400">🤖 Bot Gemini</span>
                      )}
                      {isAgent && <span className="text-[9px] font-bold text-blue-400">👨‍💼 Agente</span>}
                      <span className="text-[9px] text-zinc-600">
                        {new Date(m.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </span>
                    </div>
                    <div className={`p-3 rounded-2xl text-xs max-w-md whitespace-pre-wrap leading-relaxed ${bubbleStyle}`}>
                      {m.message_text}
                    </div>
                  </div>
                )
              })}
              <div ref={messagesEndRef} />
            </div>

            {/* Input de Envío */}
            <form onSubmit={handleSendAgentMessage} className="p-4 border-t border-zinc-900 bg-zinc-950/60 flex gap-2">
              <input
                type="text"
                value={newMessage}
                onChange={(e) => setNewMessage(e.target.value)}
                placeholder={
                  currentSession.status === 'bot_handling' 
                    ? "⚠️ Presiona 'Tomar Control' para responder manualmente..." 
                    : "Escribe un mensaje de respuesta (se enviará por WhatsApp)..."
                }
                disabled={currentSession.status === 'bot_handling'}
                className="flex-1 rounded-xl border border-zinc-850 bg-zinc-900/40 px-3.5 py-2.5 text-xs text-white placeholder-zinc-600 focus:border-purple-500 focus:outline-none transition-all disabled:opacity-40"
              />
              <button
                type="submit"
                disabled={currentSession.status === 'bot_handling' || !newMessage.trim()}
                className="rounded-xl bg-purple-650 px-5 py-2.5 text-xs font-bold text-white hover:bg-purple-600 disabled:opacity-40 transition-colors shadow-lg shadow-purple-600/10"
              >
                Enviar
              </button>
            </form>
          </>
        ) : (
          <div className="flex-1 flex items-center justify-center text-xs text-zinc-650 font-medium">
            Selecciona una conversación del listado lateral para auditar el chat.
          </div>
        )}
      </div>
    </div>
  )
}

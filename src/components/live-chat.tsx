'use client'

import React, { useEffect, useState, useRef, useCallback } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Archive, Trash2, Sparkles, X, ArchiveRestore, RefreshCw, CheckCircle, ArrowLeft } from 'lucide-react'

interface Session {
  id: string
  customer_phone: string
  last_interaction: string
  status: 'bot_handling' | 'human_required'
  customer_name?: string
  is_archived?: boolean
}

interface Message {
  id: string
  session_id: string
  sender: 'bot' | 'customer' | 'agent'
  message_text: string
  media_url?: string | null
  media_type?: string | null
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
  const [mobileView, setMobileView] = useState<'list' | 'chat'>('list')

  // Ref que siempre apunta al sessionId activo — evita closures stale en el canal Realtime
  const selectedSessionIdRef = useRef<string | null>(initialSessions[0]?.id || null)

  // Wrapper para cambiar de sesión: actualiza estado Y ref de forma síncrona
  const selectSession = useCallback((id: string | null) => {
    selectedSessionIdRef.current = id
    setSelectedSessionId(id)
    if (id) {
      setMobileView('chat')
    } else {
      setMobileView('list')
    }
  }, [])
  const [messages, setMessages] = useState<Message[]>([])
  const [newMessage, setNewMessage] = useState('')
  const [dbConnected, setDbConnected] = useState(true)
  const messagesEndRef = useRef<HTMLDivElement>(null)

  // Nuevos estados para archivar, borrar y resumen IA
  const [showArchived, setShowArchived] = useState(false)
  const [isGeneratingSummary, setIsGeneratingSummary] = useState(false)
  const [chatSummary, setChatSummary] = useState('')
  const [showSummaryPanel, setShowSummaryPanel] = useState(false)

  // Demo Fallback
  useEffect(() => {
    if (businessId === 'demo-business-id' && initialSessions.length === 0) {
      const timer = setTimeout(() => {
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
      }, 0)
      return () => clearTimeout(timer)
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
      const timer = setTimeout(() => {
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
      }, 0)
      return () => clearTimeout(timer)
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
  // IMPORTANTE: los canales se crean UNA SOLA VEZ y usan `selectedSessionIdRef.current`
  // (no el estado) para filtrar mensajes. Esto evita el closure stale que causaba
  // que mensajes se perdieran al cambiar de sesión.
  useEffect(() => {
    if (businessId === 'demo-business-id') return

    // 1. Escuchar cambios en sesiones de este negocio
    const sessionsChannel = supabase
      .channel(`live_sessions_${businessId}`)
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'chat_sessions', filter: `business_id=eq.${businessId}` },
        (payload) => {
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

    // 2. Escuchar nuevos mensajes — canal persistente sin re-suscripción al cambiar sesión
    const historyChannel = supabase
      .channel(`live_history_${businessId}`)
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'chat_history' },
        (payload) => {
          const newMsg = payload.new as Message

          // Usar la REF (no el estado) para saber qué sesión está activa en este momento
          if (newMsg.session_id === selectedSessionIdRef.current) {
            setMessages((prev) => {
              if (prev.some((m) => m.id === newMsg.id)) return prev
              return [...prev, newMsg]
            })
          }

          // Actualizar timestamp en la lista lateral y reordenar
          setSessions((prev) =>
            prev
              .map((s) =>
                s.id === newMsg.session_id
                  ? { ...s, last_interaction: newMsg.timestamp }
                  : s
              )
              .sort((a, b) => new Date(b.last_interaction).getTime() - new Date(a.last_interaction).getTime())
          )
        }
      )
      .subscribe()

    return () => {
      supabase.removeChannel(sessionsChannel)
      supabase.removeChannel(historyChannel)
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [businessId, supabase]) // ← selectedSessionId ELIMINADO a propósito: usamos el ref

  // Polling automático cada 5 segundos como fallback de tiempo real
  useEffect(() => {
    if (!dbConnected || businessId === 'demo-business-id') return

    const pollInterval = setInterval(async () => {
      // 1. Recargar lista de sesiones
      const { data: sessionsData } = await supabase
        .from('chat_sessions')
        .select('*')
        .order('last_interaction', { ascending: false })
      
      if (sessionsData) {
        setSessions(prev => {
          if (JSON.stringify(prev) !== JSON.stringify(sessionsData)) {
            return sessionsData
          }
          return prev
        })
      }

      // 2. Recargar mensajes de la sesión activa
      const currentSessionId = selectedSessionIdRef.current
      if (currentSessionId) {
        const { data: messagesData } = await supabase
          .from('chat_history')
          .select('*')
          .eq('session_id', currentSessionId)
          .order('timestamp', { ascending: true })
        
        if (messagesData) {
          setMessages(prev => {
            if (JSON.stringify(prev) !== JSON.stringify(messagesData)) {
              return messagesData
            }
            return prev
          })
        }
      }
    }, 5000)

    return () => clearInterval(pollInterval)
  }, [dbConnected, businessId, supabase])

  // Cambiar estado del takeover (Bot vs Humano)
  const handleToggleTakeover = async (session: Session) => {
    const nextStatus = session.status === 'bot_handling' ? 'human_required' : 'bot_handling'
    
    if (!dbConnected || businessId === 'demo-business-id') {
      setSessions((prev) =>
        prev.map((s) => (s.id === session.id ? { ...s, status: nextStatus } : s))
      )
      
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

  // Archivar o Desarchivar chat
  const handleToggleArchive = async (session: Session) => {
    const nextArchived = !session.is_archived

    if (!dbConnected || businessId === 'demo-business-id') {
      setSessions((prev) =>
        prev.map((s) => (s.id === session.id ? { ...s, is_archived: nextArchived } : s))
      )
      
      if (nextArchived && selectedSessionId === session.id) {
        const remaining = sessions.filter((s) => s.id !== session.id && !s.is_archived)
        setSelectedSessionId(remaining[0]?.id || null)
      }
      return
    }

    try {
      const { error } = await supabase
        .from('chat_sessions')
        .update({ is_archived: nextArchived })
        .eq('id', session.id)

      if (error) throw error

      setSessions((prev) =>
        prev.map((s) => (s.id === session.id ? { ...s, is_archived: nextArchived } : s))
      )

      if (nextArchived && selectedSessionId === session.id) {
        const remaining = sessions.filter((s) => s.id !== session.id && (showArchived ? s.is_archived : !s.is_archived))
        setSelectedSessionId(remaining[0]?.id || null)
      }
    } catch (err) {
      console.error('Error al archivar chat:', err)
      alert('Error al archivar la sesión de chat.')
    }
  }

  // Cerrar y limpiar conversación
  const handleDeleteChat = async (sessionId: string) => {
    if (!confirm('¿Estás seguro de que deseas cerrar esta conversación? El historial de chat se limpiará y, si el cliente vuelve a escribir, la conversación e IA iniciarán un nuevo pedido desde cero.')) {
      return
    }

    if (!dbConnected || businessId === 'demo-business-id') {
      setSessions((prev) => prev.filter((s) => s.id !== sessionId))
      setSelectedSessionId(null)
      setChatSummary('')
      setShowSummaryPanel(false)
      return
    }

    try {
      const { error } = await supabase
        .from('chat_sessions')
        .delete()
        .eq('id', sessionId)

      if (error) throw error

      setSessions((prev) => prev.filter((s) => s.id !== sessionId))
      setSelectedSessionId(null)
      setChatSummary('')
      setShowSummaryPanel(false)
    } catch (err) {
      console.error('Error al eliminar chat:', err)
      alert('Error al eliminar el chat de la base de datos.')
    }
  }

  // Generar resumen con Gemini
  const handleGenerateSummary = async (sessionId: string) => {
    setIsGeneratingSummary(true)
    setChatSummary('')
    setShowSummaryPanel(true)

    try {
      if (!dbConnected || businessId === 'demo-business-id') {
        await new Promise((resolve) => setTimeout(resolve, 1500))
        setChatSummary(`- **Cliente:** Interesado en ordenar una hamburguesa con papas y refresco. Pregunta por costo de envío.
- **Acordado:** El bot le pasó las opciones (Triple Cheese, Papas) y detalló el costo de envío de $150. El cliente pidió hablar con un humano.
- **Pendiente:** El cliente solicitó hablar con un asesor para consultar sobre un ingrediente de la hamburguesa. Requiere atención manual.`);
        setIsGeneratingSummary(false)
        return
      }

      const res = await fetch('/api/chat/summary', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ sessionId })
      })

      const data = await res.json()
      if (data.error) throw new Error(data.error)
      setChatSummary(data.summary)
    } catch (err) {
      console.error('Error al generar resumen:', err)
      const msg = err instanceof Error ? err.message : 'Error de conexión'
      setChatSummary(`❌ Error al generar resumen: ${msg}`)
    } finally {
      setIsGeneratingSummary(false)
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

    try {
      const res = await fetch('/api/chat/send', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ sessionId: selectedSessionId, messageText: msgText })
      })
      const data = await res.json()
      
      if (!res.ok || data.error) {
        throw new Error(data.error || 'Error al enviar el mensaje')
      }

      if (data.success && data.message) {
        setMessages((prev) => {
          if (prev.some((m) => m.id === data.message.id)) return prev
          return [...prev, data.message]
        })
      }
    } catch (err: any) {
      console.error("Error al enviar mensaje:", err)
      alert(`No se pudo enviar el mensaje: ${err.message}`)
    }
  }

  const currentSession = sessions.find((s) => s.id === selectedSessionId)
  const filteredSessions = sessions.filter(
    (s) => (showArchived ? s.is_archived === true : !s.is_archived)
  )

  return (
    <div className="border border-zinc-900 bg-zinc-950/60 rounded-2xl overflow-hidden flex h-[600px] md:h-[650px] shadow-sm font-sans w-full">
      
      {/* 1. SECCIÓN IZQUIERDA: LISTA DE CONVERSACIONES */}
      <div className={`${mobileView === 'chat' ? 'hidden md:flex' : 'flex'} flex-col w-full md:w-80 shrink-0 border-r border-zinc-900 h-full bg-zinc-950`}>
        <div className="p-2 border-b border-zinc-900 flex bg-zinc-950/45 gap-1 shrink-0">
          <button
            onClick={() => { setShowArchived(false); selectSession(sessions.find(s => !s.is_archived)?.id || null); }}
            className={`flex-1 py-2 text-center text-[10px] uppercase font-bold rounded-lg transition-all ${!showArchived ? 'bg-zinc-900 text-white border border-zinc-800' : 'text-zinc-500 hover:text-zinc-350'}`}
          >
            Activos
          </button>
          <button
            onClick={() => { setShowArchived(true); selectSession(sessions.find(s => s.is_archived)?.id || null); }}
            className={`flex-1 py-2 text-center text-[10px] uppercase font-bold rounded-lg transition-all ${showArchived ? 'bg-zinc-900 text-white border border-zinc-800' : 'text-zinc-500 hover:text-zinc-350'}`}
          >
            Archivados
          </button>
        </div>
        <div className="flex-1 overflow-y-auto divide-y divide-zinc-900/40">
          {filteredSessions.length === 0 ? (
            <div className="p-8 text-center text-xs text-zinc-600 font-medium">Sin chats en esta sección</div>
          ) : (
            filteredSessions.map((s) => {
              const isHuman = s.status === 'human_required'
              const isSelected = s.id === selectedSessionId
              const displayName = s.customer_name || `Cliente (${s.customer_phone.substring(0, 7)}...)`
              
              return (
                <button
                  key={s.id}
                  onClick={() => selectSession(s.id)}
                  className={`w-full text-left p-4 hover:bg-zinc-900/20 transition-all flex flex-col gap-2 relative border-l-4 ${
                    isSelected ? 'bg-zinc-900/40 border-l-purple-500' : 'border-l-transparent'
                  } ${
                    isHuman && !isSelected ? 'bg-red-500/[0.03] border-l-red-500/60' : ''
                  }`}
                >
                  <div className="flex items-center justify-between w-full">
                    <span className="font-bold text-xs text-zinc-200 truncate max-w-[140px]" title={displayName}>
                      {displayName}
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
      <div className={`${mobileView === 'list' ? 'hidden md:flex' : 'flex'} flex-1 flex-col h-full bg-zinc-950/20 relative min-w-0`}>
        {currentSession ? (
          <>
            {/* Header del Chat */}
            <div className="p-3 md:p-4 border-b border-zinc-900 bg-zinc-950/60 flex flex-col sm:flex-row sm:items-center justify-between gap-3 shrink-0">
              <div className="flex items-center gap-2.5 min-w-0">
                {/* Botón Atrás para móvil */}
                <button
                  onClick={() => setMobileView('list')}
                  title="Volver a la lista"
                  className="md:hidden p-1.5 text-zinc-400 hover:text-white rounded-lg bg-zinc-900 border border-zinc-800 shrink-0 cursor-pointer"
                >
                  <ArrowLeft className="h-4 w-4" />
                </button>
                <div className="min-w-0">
                  <span className="font-bold text-xs text-white block truncate">
                    {currentSession.customer_name ? `${currentSession.customer_name} (${currentSession.customer_phone})` : currentSession.customer_phone}
                  </span>
                  <div className="flex items-center gap-1.5 mt-0.5">
                    <span className={`h-1.5 w-1.5 rounded-full shrink-0 ${currentSession.status === 'human_required' ? 'bg-red-400 animate-pulse' : 'bg-purple-400'}`} />
                    <span className="text-[10px] text-zinc-500 truncate">
                      {currentSession.status === 'human_required' ? 'Monitoreando en modo manual' : 'El Bot Gemini está respondiendo automáticamente'}
                    </span>
                  </div>
                </div>
              </div>
              
              {/* Contenedor de Botones — responsive */}
              <div className="flex items-center gap-1.5 flex-wrap">
                <button
                  onClick={() => handleGenerateSummary(currentSession.id)}
                  title="Generar Resumen de Chat con IA"
                  className="rounded-lg border border-purple-500/20 bg-purple-500/5 hover:bg-purple-500/10 p-1.5 text-[10px] font-bold text-purple-400 transition-all flex items-center gap-1 cursor-pointer"
                >
                  <Sparkles className="h-3.5 w-3.5 shrink-0" />
                  <span className="hidden sm:inline">Resumen IA</span>
                </button>

                <button
                  onClick={() => handleToggleArchive(currentSession)}
                  title={currentSession.is_archived ? "Desarchivar Conversación" : "Archivar Conversación"}
                  className="rounded-lg border border-zinc-800 bg-zinc-900 p-1.5 text-zinc-400 hover:text-white hover:bg-zinc-800 transition-all cursor-pointer"
                >
                  {currentSession.is_archived ? <ArchiveRestore className="h-3.5 w-3.5" /> : <Archive className="h-3.5 w-3.5" />}
                </button>

                <button
                  onClick={() => handleDeleteChat(currentSession.id)}
                  title="Cerrar Conversación (Finalizar y reiniciar chat)"
                  className="rounded-lg border border-emerald-900/30 bg-emerald-950/10 px-2 py-1.5 text-emerald-400 hover:text-emerald-350 hover:bg-emerald-950/30 transition-all cursor-pointer flex items-center gap-1 text-[10px] font-bold shadow-sm"
                >
                  <CheckCircle className="h-3.5 w-3.5 text-emerald-400 shrink-0" />
                  <span className="hidden sm:inline">Cerrar</span>
                </button>

                <button
                  onClick={() => handleToggleTakeover(currentSession)}
                  className={`rounded-lg px-2.5 py-1.5 text-[10px] font-bold border transition-all cursor-pointer ${
                    currentSession.status === 'human_required'
                      ? 'bg-red-500/10 border-red-500/20 text-red-400 hover:bg-red-500/20 shadow-md'
                      : 'bg-zinc-900 border-zinc-800 text-zinc-400 hover:text-white'
                  }`}
                >
                  {currentSession.status === 'human_required' ? '🤖 Activar Bot' : '👨‍💼 Manual'}
                </button>
              </div>
            </div>

            {/* Layout dividido para chat y panel de resumen */}
            <div className="flex-1 flex overflow-hidden min-h-0 relative">
              {/* Ventana de Mensajes */}
              <div className="flex-1 flex flex-col h-full bg-zinc-950/5 min-h-0">
                <div className="flex-1 overflow-y-auto p-4 md:p-5 space-y-4 min-h-0">
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
                          {m.media_url && m.media_type?.startsWith('image/') && (
                            <div className="mb-2 rounded-lg overflow-hidden border border-zinc-800 bg-zinc-950/20 max-w-full">
                              {/* eslint-disable-next-line @next/next/no-img-element */}
                              <img
                                src={m.media_url}
                                alt="Adjunto"
                                className="max-w-xs h-auto max-h-48 object-contain cursor-zoom-in rounded-lg hover:opacity-90 transition-opacity"
                                onClick={() => window.open(m.media_url || undefined, '_blank')}
                              />
                            </div>
                          )}
                          {m.media_url && !m.media_type?.startsWith('image/') && (
                            <div className="mb-2 p-3 rounded-xl border border-zinc-800 bg-zinc-950 flex items-center gap-3">
                              <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-zinc-900 border border-zinc-800 font-extrabold text-[10px] text-zinc-400 uppercase">
                                {m.media_type?.split('/')[1] || 'DOC'}
                              </span>
                              <div className="flex flex-col gap-0.5">
                                <span className="text-[10px] text-zinc-500 font-semibold truncate max-w-[180px]">
                                  Archivo adjunto
                                </span>
                                <a
                                  href={m.media_url || undefined}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="text-emerald-400 font-bold hover:underline flex items-center gap-1 text-[11px]"
                                >
                                  📄 Ver / Descargar Documento
                                </a>
                              </div>
                            </div>
                          )}
                          <div>{m.message_text}</div>
                        </div>
                      </div>
                    )
                  })}
                  <div ref={messagesEndRef} />
                </div>

                {/* Input de Envío */}
                <form onSubmit={handleSendAgentMessage} className="p-4 border-t border-zinc-900 bg-zinc-950/60 flex gap-2 shrink-0">
                  <input
                    type="text"
                    value={newMessage}
                    onChange={(e) => setNewMessage(e.target.value)}
                    placeholder={
                      currentSession.status === 'bot_handling' 
                        ? "⚠️ Presiona 'Manual' para responder..." 
                        : "Escribe un mensaje de respuesta (se enviará por WhatsApp)..."
                    }
                    disabled={currentSession.status === 'bot_handling'}
                    className="flex-1 rounded-xl border border-zinc-850 bg-zinc-900/40 px-3.5 py-2.5 text-xs text-white placeholder-zinc-650 focus:border-purple-500 focus:outline-none transition-all disabled:opacity-40"
                  />
                  <button
                    type="submit"
                    disabled={currentSession.status === 'bot_handling' || !newMessage.trim()}
                    className="rounded-xl bg-purple-650 px-5 py-2.5 text-xs font-bold text-white hover:bg-purple-600 disabled:opacity-40 transition-colors shadow-lg shadow-purple-600/10 cursor-pointer shrink-0"
                  >
                    Enviar
                  </button>
                </form>
              </div>

              {/* Panel de Resumen de IA en el lado derecho */}
              {showSummaryPanel && (
                <div className="absolute lg:relative inset-y-0 right-0 z-10 w-full sm:w-80 border-l border-zinc-900 bg-zinc-950 flex flex-col justify-between h-full min-h-0">
                  <div className="p-4 border-b border-zinc-900 flex justify-between items-center bg-zinc-950/45 shrink-0">
                    <div className="flex items-center gap-1.5 text-xs font-bold text-purple-400">
                      <Sparkles className="h-4 w-4 animate-pulse" />
                      <span>Resumen de Conversación</span>
                    </div>
                    <button 
                      onClick={() => setShowSummaryPanel(false)}
                      className="text-zinc-500 hover:text-white transition-colors cursor-pointer"
                    >
                      <X className="h-4 w-4" />
                    </button>
                  </div>
                  
                  <div className="flex-1 p-4 overflow-y-auto text-xs text-zinc-350 space-y-4 min-h-0">
                    {isGeneratingSummary ? (
                      <div className="flex flex-col items-center justify-center py-20 space-y-3">
                        <RefreshCw className="h-5 w-5 text-purple-500 animate-spin" />
                        <span className="text-[10px] text-zinc-500 tracking-wider uppercase font-semibold">Generando Resumen...</span>
                      </div>
                    ) : (
                      <div className="whitespace-pre-wrap leading-relaxed bg-zinc-950/40 border border-zinc-900 p-3.5 rounded-xl text-[11px]">
                        {chatSummary}
                      </div>
                    )}
                  </div>

                  <div className="p-3 border-t border-zinc-900 bg-zinc-950/40 shrink-0">
                    <button
                      onClick={() => handleGenerateSummary(currentSession.id)}
                      disabled={isGeneratingSummary}
                      className="w-full py-2 text-center text-[10px] uppercase tracking-wider font-bold rounded-lg border border-purple-500/20 bg-purple-500/5 text-purple-450 hover:bg-purple-500/10 transition-colors disabled:opacity-50 cursor-pointer"
                    >
                      Actualizar Resumen
                    </button>
                  </div>
                </div>
              )}
            </div>
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

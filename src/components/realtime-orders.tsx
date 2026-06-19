'use client'

import React, { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'

interface Order {
  id: string
  business_id: string
  customer_phone: string
  status: 'pending_payment' | 'confirmed' | 'processing' | 'completed' | 'cancelled'
  payment_method: 'transfer' | 'cash'
  total: number
  items: Array<{
    product_id?: string
    name: string
    qty: number
    price: number
  }>
  created_at: string
}

interface RealtimeOrdersProps {
  businessId: string
  initialOrders: Order[]
}

const STATUS_COLUMNS = [
  { key: 'pending_payment', label: 'Pendiente Pago ⏳', color: 'border-amber-500/10 bg-amber-500/5 text-amber-400' },
  { key: 'confirmed', label: 'Confirmado ✅', color: 'border-blue-500/10 bg-blue-500/5 text-blue-400' },
  { key: 'processing', label: 'En Preparación 🛠️', color: 'border-purple-500/10 bg-purple-500/5 text-purple-400' },
  { key: 'completed', label: 'Completado 🎉', color: 'border-emerald-500/10 bg-emerald-500/5 text-emerald-400' },
]

export function RealtimeOrders({ businessId, initialOrders }: RealtimeOrdersProps) {
  const supabase = createClient()
  const [orders, setOrders] = useState<Order[]>(initialOrders)
  const [dbConnected, setDbConnected] = useState(true)
  const [toastMessage, setToastMessage] = useState<string | null>(null)

  // Demo fallback check
  useEffect(() => {
    if (businessId === 'demo-business-id' && initialOrders.length === 0) {
      setDbConnected(false)
      setOrders([
        {
          id: 'order-1',
          business_id: 'demo-business-id',
          customer_phone: '5491138293849',
          status: 'pending_payment',
          payment_method: 'transfer',
          total: 2450.0,
          items: [{ name: 'Hamburguesa Triple Cheese', qty: 1, price: 2100 }, { name: 'Papas Fritas Medianas', qty: 1, price: 350 }],
          created_at: new Date(Date.now() - 5 * 60000).toISOString(),
        },
        {
          id: 'order-2',
          business_id: 'demo-business-id',
          customer_phone: '5491129384729',
          status: 'confirmed',
          payment_method: 'cash',
          total: 1500.0,
          items: [{ name: 'Pizza Muzzarella Individual', qty: 1, price: 1500 }],
          created_at: new Date(Date.now() - 25 * 60000).toISOString(),
        },
      ])
    }
  }, [businessId, initialOrders])

  // Desencadenar sonido de notificación
  const playNotificationSound = () => {
    try {
      const audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)()
      
      // Beep 1
      const osc1 = audioCtx.createOscillator()
      const gain1 = audioCtx.createGain()
      osc1.connect(gain1)
      gain1.connect(audioCtx.destination)
      osc1.frequency.setValueAtTime(587.33, audioCtx.currentTime) // D5
      gain1.gain.setValueAtTime(0.08, audioCtx.currentTime)
      osc1.start()
      osc1.stop(audioCtx.currentTime + 0.1)

      // Beep 2
      setTimeout(() => {
        const osc2 = audioCtx.createOscillator()
        const gain2 = audioCtx.createGain()
        osc2.connect(gain2)
        gain2.connect(audioCtx.destination)
        osc2.frequency.setValueAtTime(880.00, audioCtx.currentTime) // A5
        gain2.gain.setValueAtTime(0.08, audioCtx.currentTime)
        osc2.start()
        osc2.stop(audioCtx.currentTime + 0.25)
      }, 120)
    } catch (e) {
      console.log('No se pudo reproducir el sonido de notificación:', e)
    }
  }

  // Suscripción Realtime en Supabase
  useEffect(() => {
    if (businessId === 'demo-business-id') return

    console.log(`[Realtime] Escuchando cambios para el negocio: ${businessId}`)
    
    const channel = supabase
      .channel(`db_realtime_orders_${businessId}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'orders_bookings',
          filter: `business_id=eq.${businessId}`,
        },
        (payload) => {
          console.log('[Realtime] Payload recibido:', payload)
          
          if (payload.eventType === 'INSERT') {
            const newOrder = payload.new as Order
            setOrders((prev) => [newOrder, ...prev])
            
            // Mostrar Toast visual y reproducir alerta acústica
            setToastMessage(`🔔 Nuevo pedido recibido de: ${newOrder.customer_phone}`)
            playNotificationSound()
            
            // Auto-ocultar notificación
            setTimeout(() => {
              setToastMessage(null)
            }, 6000)

          } else if (payload.eventType === 'UPDATE') {
            const updated = payload.new as Order
            setOrders((prev) => prev.map((o) => (o.id === updated.id ? updated : o)))
          } else if (payload.eventType === 'DELETE') {
            const deletedId = payload.old.id
            setOrders((prev) => prev.filter((o) => o.id !== deletedId))
          }
        }
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [businessId, supabase])

  // Modificar estado de la orden
  const handleUpdateStatus = async (orderId: string, nextStatus: Order['status']) => {
    // Modo demo local
    if (!dbConnected || businessId === 'demo-business-id') {
      setOrders((prev) => prev.map((o) => (o.id === orderId ? { ...o, status: nextStatus } : o)))
      return
    }

    const { error } = await supabase
      .from('orders_bookings')
      .update({ status: nextStatus })
      .eq('id', orderId)

    if (error) {
      console.error('Error al transicionar la orden:', error)
      alert('Error en base de datos al guardar estado.')
    }
  }

  return (
    <div className="space-y-6 relative">
      
      {/* 1. NOTIFICACIÓN VISUAL TOAST FLOTANTE */}
      {toastMessage && (
        <div className="fixed top-6 right-6 z-50 flex items-center gap-3 bg-zinc-900 border border-purple-500/40 text-white py-3.5 px-5 rounded-xl shadow-2xl shadow-purple-500/10 animate-bounce duration-500">
          <span className="h-2 w-2 rounded-full bg-purple-400 animate-ping" />
          <p className="text-xs font-bold tracking-wide">{toastMessage}</p>
          <button 
            onClick={() => setToastMessage(null)} 
            className="text-xs text-zinc-500 hover:text-white ml-2 font-mono"
          >
            ×
          </button>
        </div>
      )}

      {/* Alerta de demo */}
      {!dbConnected && (
        <div className="p-3 bg-zinc-900/60 border border-zinc-800 text-zinc-400 rounded-xl text-xs flex justify-between items-center">
          <span className="flex items-center gap-2">
            <span className="h-1.5 w-1.5 rounded-full bg-amber-500 animate-pulse" />
            Entorno local de demostración. Puedes simular el ingreso de pedidos creados por la IA de WhatsApp.
          </span>
          <button 
            onClick={() => {
              const mockNew: Order = {
                id: `order-mock-${Math.floor(Math.random() * 1000)}`,
                business_id: businessId,
                customer_phone: `54911${Math.floor(10000000 + Math.random() * 90000000)}`,
                status: 'pending_payment',
                payment_method: 'transfer',
                total: 3900.00,
                items: [
                  { name: 'Pizza Muzzarella Individual', qty: 2, price: 1500 },
                  { name: 'Papas Fritas Medianas', qty: 2, price: 350 },
                  { name: 'Costo Delivery', qty: 1, price: 200 }
                ],
                created_at: new Date().toISOString()
              }
              // Agregar, gatillar alerta visual y auditiva
              setOrders(prev => [mockNew, ...prev])
              setToastMessage(`🔔 Nuevo pedido recibido de: ${mockNew.customer_phone}`)
              playNotificationSound()
              setTimeout(() => setToastMessage(null), 5000)
            }}
            className="rounded-lg bg-purple-650 px-3 py-1.5 text-xs font-bold text-white hover:bg-purple-600 transition-colors shadow-lg shadow-purple-600/10"
          >
            + Simular Pedido de Chatbot
          </button>
        </div>
      )}

      {/* Grid del Kanban */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 items-start">
        {STATUS_COLUMNS.map((col) => {
          const colOrders = orders.filter((o) => o.status === col.key)
          
          return (
            <div key={col.key} className="border border-zinc-900 bg-zinc-950/60 rounded-2xl flex flex-col shadow-sm">
              {/* Header Columna */}
              <div className="p-4 border-b border-zinc-900 flex justify-between items-center bg-zinc-950/40 rounded-t-2xl">
                <span className="text-xs font-bold text-zinc-300 tracking-wider uppercase">{col.label}</span>
                <span className="text-[10px] bg-zinc-900 border border-zinc-850 text-zinc-400 px-2 py-0.5 rounded-full font-bold">
                  {colOrders.length}
                </span>
              </div>
              
              {/* Contenedor de Tarjetas */}
              <div className="p-3 space-y-3 min-h-[500px] max-h-[700px] overflow-y-auto bg-zinc-950/10">
                {colOrders.length === 0 ? (
                  <div className="text-center py-16 text-[10px] text-zinc-600 font-medium">Sin pedidos en esta fase</div>
                ) : (
                  colOrders.map((order) => (
                    <div 
                      key={order.id} 
                      className={`border border-zinc-900 bg-zinc-950/90 p-4 rounded-xl space-y-3.5 shadow-md hover:border-zinc-800 transition-colors duration-200 relative overflow-hidden`}
                    >
                      {/* Línea de color de estado superior */}
                      <div className={`absolute top-0 left-0 right-0 h-0.5 ${
                        order.status === 'pending_payment' ? 'bg-amber-500' :
                        order.status === 'confirmed' ? 'bg-blue-500' :
                        order.status === 'processing' ? 'bg-purple-500' : 'bg-emerald-500'
                      }`} />

                      {/* Header de la Tarjeta */}
                      <div className="flex items-center justify-between text-[10px] border-b border-zinc-900/60 pb-2">
                        <span className="font-mono text-zinc-300 font-bold bg-zinc-900 px-2 py-0.5 rounded border border-zinc-850">
                          📞 {order.customer_phone}
                        </span>
                        <span className="text-zinc-500 font-semibold">
                          {new Date(order.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </span>
                      </div>
                      
                      {/* Detalle de Artículos */}
                      <div className="space-y-1.5">
                        {order.items?.map((item, i) => (
                          <div key={i} className="flex justify-between text-xs text-zinc-300">
                            <span className="font-medium text-zinc-400"><strong className="text-zinc-200">x{item.qty}</strong> {item.name}</span>
                            <span className="text-zinc-500 font-mono text-[11px]">${(item.price * item.qty).toFixed(2)}</span>
                          </div>
                        ))}
                      </div>

                      {/* Resumen Total y Pago */}
                      <div className="flex items-center justify-between text-xs pt-2.5 border-t border-zinc-900/60">
                        <div className="flex items-center gap-1.5">
                          <span className={`text-[9px] px-2 py-0.5 rounded font-bold ${
                            order.payment_method === 'transfer' 
                              ? 'bg-blue-500/10 border border-blue-500/20 text-blue-400' 
                              : 'bg-emerald-500/10 border border-emerald-500/20 text-emerald-400'
                          }`}>
                            {order.payment_method === 'transfer' ? 'Transferencia' : 'Efectivo'}
                          </span>
                        </div>
                        <span className="font-extrabold text-white font-mono text-sm">${Number(order.total).toFixed(2)}</span>
                      </div>

                      {/* Controles de Estado de Pedido */}
                      <div className="flex justify-end gap-1.5 pt-2 border-t border-zinc-900/30">
                        {order.status === 'pending_payment' && (
                          <>
                            <button
                              onClick={() => handleUpdateStatus(order.id, 'cancelled')}
                              className="px-2 py-1 text-[9px] font-bold border border-red-900/30 text-red-400 rounded-lg hover:bg-red-950/20 transition-all"
                            >
                              Rechazar
                            </button>
                            <button
                              onClick={() => handleUpdateStatus(order.id, 'confirmed')}
                              className="px-2.5 py-1 text-[9px] font-bold bg-blue-600 text-white rounded-lg hover:bg-blue-500 transition-all shadow-md shadow-blue-600/10"
                            >
                              Validar Pago
                            </button>
                          </>
                        )}
                        {order.status === 'confirmed' && (
                          <button
                            onClick={() => handleUpdateStatus(order.id, 'processing')}
                            className="w-full py-1.5 text-[9px] font-bold bg-purple-600 text-white rounded-lg hover:bg-purple-500 transition-all shadow-md shadow-purple-600/10"
                          >
                            Enviar a Preparación 🛠️
                          </button>
                        )}
                        {order.status === 'processing' && (
                          <button
                            onClick={() => handleUpdateStatus(order.id, 'completed')}
                            className="w-full py-1.5 text-[9px] font-bold bg-emerald-600 text-white rounded-lg hover:bg-emerald-500 transition-all shadow-md shadow-emerald-600/10"
                          >
                            Marcar Entregado ✔️
                          </button>
                        )}
                        {order.status === 'completed' && (
                          <div className="text-center w-full py-1 bg-zinc-900 border border-zinc-800 rounded-lg">
                            <span className="text-[10px] text-emerald-400/80 font-bold tracking-wider uppercase">
                              Completado ✓
                            </span>
                          </div>
                        )}
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}

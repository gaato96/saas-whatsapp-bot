'use client'

import React, { useEffect, useState, useMemo, useCallback, useRef } from 'react'
import { createClient } from '@/lib/supabase/client'
import {
  LayoutGrid, List, Search, X, RefreshCw, MapPin, Phone, User,
  Clock, ChevronRight, CheckCircle, Truck, Flame, CreditCard, Banknote,
  AlertTriangle, Plus, Filter
} from 'lucide-react'

// ============================================================
// TIPOS
// ============================================================
interface OrderItem {
  product_id?: string
  name: string
  qty: number
  price: number
  notes?: string
}

interface Order {
  id: string
  business_id: string
  customer_name?: string
  customer_phone: string
  delivery_address?: string
  notes?: string
  status: 'pending_payment' | 'confirmed' | 'processing' | 'shipped' | 'completed' | 'cancelled'
  payment_method: 'transfer' | 'cash'
  total: number
  items: OrderItem[]
  payment_status?: 'pending' | 'paid'
  created_at: string
}

type ViewMode = 'cards' | 'kanban'
type StatusFilter = 'all' | Order['status']

interface RealtimeOrdersProps {
  businessId: string
  initialOrders: Order[]
  rubro?: string
}

// ============================================================
// LABELS POR RUBRO — solo sobrescriben lo necesario
// ============================================================
function getRubroLabels(rubro?: string): Partial<Record<keyof typeof STATUS_CONFIG, { label: string; emoji: string }>> {
  switch (rubro) {
    case 'E-commerce':
    case 'iPhones':
      return {
        processing: { label: 'Preparando', emoji: '📦' },
        shipped:    { label: 'Enviado',     emoji: '🚚' },
        completed:  { label: 'Entregado',  emoji: '✅' },
      }
    case 'Agencia':
      return {
        confirmed:  { label: 'Aceptado',   emoji: '📋' },
        processing: { label: 'En Proceso', emoji: '⚙️' },
        shipped:    { label: 'Entregado',  emoji: '📤' },
        completed:  { label: 'Cerrado',    emoji: '🏁' },
      }
    case 'Cursos':
      return {
        processing: { label: 'En Curso',   emoji: '🎓' },
        shipped:    { label: 'Completado', emoji: '🏆' },
        completed:  { label: 'Cerrado',    emoji: '✅' },
      }
    default:
      return {}
  }
}

type StatusConfigEntry = { label: string; emoji: string; color: string; bg: string; border: string; headerBg: string; bar: string }
type MutableStatusConfig = Record<keyof typeof STATUS_CONFIG, StatusConfigEntry>

function getMergedStatusConfig(rubro?: string): MutableStatusConfig {
  const overrides = getRubroLabels(rubro)
  // Creamos una copia completamente mutable (sin as const)
  const result: MutableStatusConfig = {
    pending_payment: { ...STATUS_CONFIG.pending_payment },
    confirmed:       { ...STATUS_CONFIG.confirmed },
    processing:      { ...STATUS_CONFIG.processing },
    shipped:         { ...STATUS_CONFIG.shipped },
    completed:       { ...STATUS_CONFIG.completed },
    cancelled:       { ...STATUS_CONFIG.cancelled },
  }
  for (const key of Object.keys(overrides) as Array<keyof typeof STATUS_CONFIG>) {
    if (overrides[key]) {
      result[key] = { ...result[key], ...overrides[key]! }
    }
  }
  return result
}

// ============================================================
// CONSTANTES DE ESTADO
// ============================================================
const STATUS_CONFIG = {
  pending_payment: {
    label: 'Pendiente',
    emoji: '⏳',
    color: 'text-amber-400',
    bg: 'bg-amber-500/10',
    border: 'border-amber-500/20',
    headerBg: 'bg-amber-500/5',
    bar: 'bg-amber-500',
  },
  confirmed: {
    label: 'Confirmado',
    emoji: '✅',
    color: 'text-blue-400',
    bg: 'bg-blue-500/10',
    border: 'border-blue-500/20',
    headerBg: 'bg-blue-500/5',
    bar: 'bg-blue-500',
  },
  processing: {
    label: 'En Cocina',
    emoji: '🔥',
    color: 'text-purple-400',
    bg: 'bg-purple-500/10',
    border: 'border-purple-500/20',
    headerBg: 'bg-purple-500/5',
    bar: 'bg-purple-500',
  },
  shipped: {
    label: 'Enviado',
    emoji: '🛵',
    color: 'text-teal-400',
    bg: 'bg-teal-500/10',
    border: 'border-teal-500/20',
    headerBg: 'bg-teal-500/5',
    bar: 'bg-teal-500',
  },
  completed: {
    label: 'Completado',
    emoji: '🎉',
    color: 'text-emerald-400',
    bg: 'bg-emerald-500/10',
    border: 'border-emerald-500/20',
    headerBg: 'bg-emerald-500/5',
    bar: 'bg-emerald-500',
  },
  cancelled: {
    label: 'Cancelado',
    emoji: '❌',
    color: 'text-red-400',
    bg: 'bg-red-500/10',
    border: 'border-red-500/20',
    headerBg: 'bg-red-500/5',
    bar: 'bg-red-500',
  },
} as const

const KANBAN_COLUMNS: Array<Order['status']> = ['pending_payment', 'confirmed', 'processing', 'shipped']

// ============================================================
// UTILIDADES
// ============================================================
function timeAgo(dateStr: string): string {
  const now = Date.now()
  const then = new Date(dateStr).getTime()
  const diff = Math.floor((now - then) / 1000)
  if (diff < 60) return `${diff}s`
  if (diff < 3600) return `${Math.floor(diff / 60)}min`
  return `${Math.floor(diff / 3600)}h ${Math.floor((diff % 3600) / 60)}min`
}

function isOlderThan(dateStr: string, minutes: number): boolean {
  return Date.now() - new Date(dateStr).getTime() > minutes * 60 * 1000
}

// ============================================================
// TARJETA DE PEDIDO — Compartida entre ambas vistas
// ============================================================
interface OrderCardProps {
  order: Order
  onUpdateStatus: (id: string, status: Order['status']) => Promise<void>
  onValidateTransfer: (id: string) => Promise<void>
  onConfirmPayment: (id: string) => Promise<void>
  isNew?: boolean
  compact?: boolean
  rubro?: string
}

function OrderCard({ order, onUpdateStatus, onValidateTransfer, onConfirmPayment, isNew, compact, rubro }: OrderCardProps) {
  const cfg = STATUS_CONFIG[order.status] || STATUS_CONFIG.cancelled
  const isUrgent = order.status !== 'completed' && order.status !== 'cancelled' && isOlderThan(order.created_at, 30)

  return (
    <div
      className={`relative border rounded-xl overflow-hidden transition-all duration-200 hover:shadow-lg ${
        isNew ? 'new-order-ring order-card-enter' : ''
      } ${
        isUrgent
          ? 'border-red-500/30 bg-red-950/5'
          : `border-zinc-800 bg-zinc-950/70`
      }`}
    >
      {/* Barra de color de estado */}
      <div className={`absolute top-0 left-0 right-0 h-0.5 ${cfg.bar}`} />

      <div className={`p-3.5 space-y-2.5 ${compact ? 'p-3' : 'p-3.5'}`}>

        {/* Header: nombre + hora */}
        <div className="flex items-start justify-between gap-2">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-1.5">
              <User className="h-3 w-3 text-zinc-500 shrink-0" />
              <span className="text-xs font-bold text-zinc-100 truncate">
                {order.customer_name || `Cliente ${order.customer_phone.slice(-4)}`}
              </span>
              {isUrgent && (
                <span className="shrink-0 text-[9px] bg-red-500/15 border border-red-500/30 text-red-400 px-1.5 py-0.5 rounded font-bold">
                  URGENTE
                </span>
              )}
            </div>
            <div className="flex items-center gap-1 mt-0.5">
              <Phone className="h-2.5 w-2.5 text-zinc-600" />
              <span className="text-[10px] text-zinc-500 font-mono">{order.customer_phone}</span>
            </div>
          </div>
          <div className="text-right shrink-0">
            <span className="text-[10px] text-zinc-500 font-mono flex items-center gap-1">
              <Clock className="h-2.5 w-2.5" />
              {timeAgo(order.created_at)}
            </span>
            <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded ${cfg.bg} ${cfg.border} ${cfg.color} border mt-0.5 inline-block`}>
              {cfg.emoji} {cfg.label}
            </span>
          </div>
        </div>

        {/* Dirección de entrega */}
        {order.delivery_address && (
          <div className="flex items-start gap-1.5 bg-zinc-900 border border-zinc-800 rounded-lg px-2.5 py-2">
            <MapPin className="h-3.5 w-3.5 text-emerald-400 mt-0.5 shrink-0" />
            <div className="flex-1 min-w-0">
              <span className="block text-[9px] uppercase font-extrabold text-zinc-500 tracking-wider">Dirección de Entrega</span>
              <span className="text-xs font-semibold text-zinc-200 leading-relaxed break-words">{order.delivery_address}</span>
            </div>
          </div>
        )}

        {/* Observaciones generales del pedido */}
        {order.notes && (
          <div className="flex items-start gap-1.5 bg-zinc-900 border border-zinc-700 rounded-lg px-2.5 py-2">
            <span className="text-[10px] font-extrabold mt-0.5 shrink-0">📝</span>
            <div className="flex-1 min-w-0">
              <span className="block text-[9px] uppercase font-extrabold text-zinc-400 tracking-wider">Observaciones</span>
              <span className="text-xs font-medium text-zinc-200 leading-relaxed break-words">{order.notes}</span>
            </div>
          </div>
        )}

        {/* Items del pedido */}
        <div className="space-y-1">
          {order.items?.map((item, i) => (
            <div key={i} className="flex justify-between items-start gap-2">
              <div className="flex-1 min-w-0">
                <span className="text-[11px] text-zinc-300">
                  <strong className="text-zinc-100 font-bold">×{item.qty}</strong> {item.name}
                </span>
                {item.notes && (
                  <div className="text-[10px] text-zinc-400 font-medium mt-0.5 leading-relaxed bg-zinc-800/60 px-2 py-0.5 rounded border border-zinc-700/60">
                    Obs: {item.notes}
                  </div>
                )}
              </div>
              <span className="text-[11px] text-zinc-500 font-mono shrink-0">
                ${(item.price * item.qty).toLocaleString('es-AR')}
              </span>
            </div>
          ))}
        </div>

        {/* Total + pago */}
        <div className="flex items-center justify-between pt-2 border-t border-zinc-800/60">
          <div className="flex items-center gap-1.5">
            {order.payment_method === 'transfer' ? (
              <span className="flex items-center gap-1 text-[9px] px-1.5 py-0.5 rounded border bg-blue-500/10 border-blue-500/20 text-blue-400 font-bold">
                <CreditCard className="h-2.5 w-2.5" /> Transferencia
              </span>
            ) : (
              <span className="flex items-center gap-1 text-[9px] px-1.5 py-0.5 rounded border bg-emerald-500/10 border-emerald-500/20 text-emerald-400 font-bold">
                <Banknote className="h-2.5 w-2.5" /> Efectivo
              </span>
            )}
            <span className={`text-[9px] px-1.5 py-0.5 rounded border font-bold ${
              order.payment_status === 'paid'
                ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400'
                : 'bg-amber-500/10 border-amber-500/20 text-amber-400'
            }`}>
              {order.payment_status === 'paid' ? 'Cobrado ✓' : 'Sin cobrar'}
            </span>
          </div>
          <span className="font-extrabold text-white font-mono text-sm">
            ${Number(order.total).toLocaleString('es-AR')}
          </span>
        </div>

        {/* Acciones de estado */}
        <OrderActions
          order={order}
          onUpdateStatus={onUpdateStatus}
          onValidateTransfer={onValidateTransfer}
          onConfirmPayment={onConfirmPayment}
          rubro={rubro}
        />
      </div>
    </div>
  )
}

// ============================================================
// ACCIONES POR ESTADO
// ============================================================
interface OrderActionsProps {
  order: Order
  onUpdateStatus: (id: string, status: Order['status']) => Promise<void>
  onValidateTransfer: (id: string) => Promise<void>
  onConfirmPayment: (id: string) => Promise<void>
  rubro?: string
}

function OrderActions({ order, onUpdateStatus, onValidateTransfer, onConfirmPayment, rubro }: OrderActionsProps) {
  const [loading, setLoading] = useState(false)

  const handle = async (fn: () => Promise<void>) => {
    setLoading(true)
    try { await fn() } finally { setLoading(false) }
  }

  if (order.status === 'pending_payment') {
    return (
      <div className="flex gap-1.5 pt-1">
        <button
          disabled={loading}
          onClick={() => handle(() => onUpdateStatus(order.id, 'cancelled'))}
          className="flex-1 py-1.5 text-[10px] font-bold border border-red-900/40 text-red-400 rounded-lg hover:bg-red-950/20 transition-all disabled:opacity-50 cursor-pointer"
        >
          Rechazar
        </button>
        <button
          disabled={loading}
          onClick={() => handle(() => onValidateTransfer(order.id))}
          className="flex-[2] py-1.5 text-[10px] font-bold bg-blue-600 text-white rounded-lg hover:bg-blue-500 transition-all shadow-md shadow-blue-600/10 disabled:opacity-50 cursor-pointer"
        >
          {loading ? '...' : '✓ Confirmar Pago'}
        </button>
      </div>
    )
  }

  if (order.status === 'confirmed') {
    // El label del botón depende del rubro
    const processingLabel = (() => {
      switch (rubro) {
        case 'E-commerce': return 'Preparar Pedido 📦'
        case 'iPhones': return 'Preparar Equipo 📦'
        case 'Agencia': return 'Iniciar Proyecto ⚙️'
        case 'Cursos': return 'Activar Alumno 🎓'
        default: return 'Enviar a Cocina'
      }
    })()
    return (
      <button
        disabled={loading}
        onClick={() => handle(() => onUpdateStatus(order.id, 'processing'))}
        className="w-full py-1.5 text-[10px] font-bold bg-purple-600 text-white rounded-lg hover:bg-purple-500 transition-all shadow-md shadow-purple-600/10 flex items-center justify-center gap-1.5 disabled:opacity-50 cursor-pointer"
      >
        <Flame className="h-3 w-3" />
        {loading ? '...' : processingLabel}
      </button>
    )
  }

  if (order.status === 'processing') {
    const shippedLabel = (() => {
      switch (rubro) {
        case 'E-commerce': return 'Marcar Enviado 🚚'
        case 'iPhones': return 'Marcar Enviado 🚚'
        case 'Agencia': return 'Marcar Entregado 📤'
        case 'Cursos': return 'Marcar Completado 🏆'
        default: return 'Marcar Enviado 🛵'
      }
    })()
    return (
      <button
        disabled={loading}
        onClick={() => handle(() => onUpdateStatus(order.id, 'shipped'))}
        className="w-full py-1.5 text-[10px] font-bold bg-teal-600 text-white rounded-lg hover:bg-teal-500 transition-all shadow-md shadow-teal-600/10 flex items-center justify-center gap-1.5 disabled:opacity-50 cursor-pointer"
      >
        <Truck className="h-3 w-3" />
        {loading ? 'Actualizando...' : shippedLabel}
      </button>
    )
  }

  if (order.status === 'shipped') {
    return (
      <div className="space-y-1.5">
        <button
          disabled={loading}
          onClick={() => handle(() => onUpdateStatus(order.id, 'completed'))}
          className="w-full py-1.5 text-[10px] font-bold bg-emerald-600 text-white rounded-lg hover:bg-emerald-500 transition-all flex items-center justify-center gap-1.5 disabled:opacity-50 cursor-pointer"
        >
          <CheckCircle className="h-3 w-3" />
          {loading ? '...' : 'Marcar Entregado ✔'}
        </button>
        {order.payment_method === 'cash' && order.payment_status !== 'paid' && (
          <button
            disabled={loading}
            onClick={() => handle(() => onConfirmPayment(order.id))}
            className="w-full py-1.5 text-[10px] font-bold border border-emerald-500/30 text-emerald-400 rounded-lg hover:bg-emerald-500/10 transition-all disabled:opacity-50 cursor-pointer"
          >
            Confirmar Cobro Efectivo 💵
          </button>
        )}
      </div>
    )
  }

  if (order.status === 'completed') {
    return (
      <div className="space-y-1.5">
        <div className="w-full text-center py-1 bg-emerald-500/5 border border-emerald-500/20 rounded-lg">
          <span className="text-[10px] text-emerald-400 font-bold">Entregado ✓</span>
        </div>
        {order.payment_method === 'cash' && order.payment_status !== 'paid' && (
          <button
            disabled={loading}
            onClick={() => handle(() => onConfirmPayment(order.id))}
            className="w-full py-1.5 text-[10px] font-bold bg-emerald-600 text-white rounded-lg hover:bg-emerald-500 transition-all disabled:opacity-50 cursor-pointer"
          >
            Confirmar Cobro Efectivo 💵
          </button>
        )}
      </div>
    )
  }

  return null
}

// ============================================================
// COMPONENTE PRINCIPAL
// ============================================================
export function RealtimeOrders({ businessId, initialOrders, rubro }: RealtimeOrdersProps) {
  const statusConfig = getMergedStatusConfig(rubro)
  const supabase = createClient()
  const [orders, setOrders] = useState<Order[]>(initialOrders)
  const [dbConnected, setDbConnected] = useState(true)
  const [toastMessage, setToastMessage] = useState<string | null>(null)
  const [newOrderIds, setNewOrderIds] = useState<Set<string>>(new Set())

  // Vista y filtros
  const [viewMode, setViewMode] = useState<ViewMode>(() => {
    if (typeof window !== 'undefined') {
      return (localStorage.getItem('zapflow-view-mode') as ViewMode) || 'cards'
    }
    return 'cards'
  })
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('all')
  const [searchQuery, setSearchQuery] = useState('')

  // Demo fallback
  useEffect(() => {
    if (businessId === 'demo-business-id' && initialOrders.length === 0) {
      setDbConnected(false)
      setOrders([
        {
          id: 'order-1',
          business_id: 'demo-business-id',
          customer_name: 'Juan Pérez',
          customer_phone: '5491138293849',
          delivery_address: 'Av. Corrientes 1234, Piso 3 Dto B, CABA',
          status: 'pending_payment',
          payment_method: 'transfer',
          total: 2450.0,
          items: [
            { name: 'Hamburguesa Triple Cheese', qty: 1, price: 2100, notes: 'Sin cebolla, con doble cheddar' },
            { name: 'Papas Fritas Medianas', qty: 1, price: 350 }
          ],
          created_at: new Date(Date.now() - 5 * 60000).toISOString(),
        },
        {
          id: 'order-2',
          business_id: 'demo-business-id',
          customer_name: 'María Gómez',
          customer_phone: '5491129384729',
          delivery_address: 'Pasaje Rivarola 456, Palermo',
          status: 'processing',
          payment_method: 'cash',
          payment_status: 'pending',
          total: 1500.0,
          items: [{ name: 'Pizza Muzzarella Individual', qty: 1, price: 1500, notes: 'Bien cocida' }],
          created_at: new Date(Date.now() - 25 * 60000).toISOString(),
        },
        {
          id: 'order-3',
          business_id: 'demo-business-id',
          customer_name: 'Carlos Rodríguez',
          customer_phone: '5491150391029',
          delivery_address: 'Medrano 890, Villa Crespo',
          status: 'shipped',
          payment_method: 'transfer',
          payment_status: 'paid',
          total: 3900.0,
          items: [
            { name: 'Pizza Napolitana Grande', qty: 1, price: 3200 },
            { name: 'Gaseosa 500ml', qty: 2, price: 350 }
          ],
          created_at: new Date(Date.now() - 45 * 60000).toISOString(),
        },
      ])
    }
  }, [businessId, initialOrders])

  // Sonido de notificación
  const playNotificationSound = useCallback(() => {
    try {
      const audioCtx = new (window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext)()
      const osc1 = audioCtx.createOscillator()
      const gain1 = audioCtx.createGain()
      osc1.connect(gain1)
      gain1.connect(audioCtx.destination)
      osc1.frequency.setValueAtTime(587.33, audioCtx.currentTime)
      gain1.gain.setValueAtTime(0.08, audioCtx.currentTime)
      osc1.start()
      osc1.stop(audioCtx.currentTime + 0.1)
      setTimeout(() => {
        const osc2 = audioCtx.createOscillator()
        const gain2 = audioCtx.createGain()
        osc2.connect(gain2)
        gain2.connect(audioCtx.destination)
        osc2.frequency.setValueAtTime(880.00, audioCtx.currentTime)
        gain2.gain.setValueAtTime(0.08, audioCtx.currentTime)
        osc2.start()
        osc2.stop(audioCtx.currentTime + 0.25)
      }, 120)
    } catch { /* silencioso */ }
  }, [])

  // Realtime Supabase
  useEffect(() => {
    if (businessId === 'demo-business-id') return

    const channel = supabase
      .channel(`db_orders_${businessId}`)
      .on('postgres_changes', {
        event: '*',
        schema: 'public',
        table: 'orders_bookings',
        filter: `business_id=eq.${businessId}`,
      }, (payload) => {
        if (payload.eventType === 'INSERT') {
          const newOrder = payload.new as Order
          setOrders(prev => [newOrder, ...prev])
          setNewOrderIds(prev => new Set([...prev, newOrder.id]))
          setToastMessage(`🔔 Nuevo pedido de: ${newOrder.customer_name || newOrder.customer_phone}`)
          playNotificationSound()
          setTimeout(() => setToastMessage(null), 6000)
          setTimeout(() => setNewOrderIds(prev => { const s = new Set(prev); s.delete(newOrder.id); return s }), 3000)
        } else if (payload.eventType === 'UPDATE') {
          const updated = payload.new as Order
          setOrders(prev => prev.map(o => o.id === updated.id ? updated : o))
        } else if (payload.eventType === 'DELETE') {
          setOrders(prev => prev.filter(o => o.id !== payload.old.id))
        }
      })
      .subscribe()

    return () => { supabase.removeChannel(channel) }
  }, [businessId, supabase, playNotificationSound])

  // Toggle de vista con persistencia
  const toggleView = useCallback((mode: ViewMode) => {
    setViewMode(mode)
    localStorage.setItem('zapflow-view-mode', mode)
  }, [])

  // Actualizar estado + llamar WhatsApp si es shipped
  const handleUpdateStatus = useCallback(async (orderId: string, nextStatus: Order['status']) => {
    if (!dbConnected || businessId === 'demo-business-id') {
      setOrders(prev => prev.map(o => o.id === orderId ? { ...o, status: nextStatus } : o))
      return
    }

    const { error } = await supabase
      .from('orders_bookings')
      .update({ status: nextStatus })
      .eq('id', orderId)

    if (error) { alert('Error al actualizar el pedido.'); return }

    // Si el pedido pasa a "Enviado", enviar mensaje WhatsApp
    if (nextStatus === 'shipped') {
      const order = orders.find(o => o.id === orderId)
      if (order) {
        try {
          const res = await fetch('/api/whatsapp/send-status', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              orderId,
              businessId,
              customerPhone: order.customer_phone,
              status: 'shipped',
            }),
          })
          const data = await res.json()
          if (data.success) {
            setToastMessage(`✅ Mensaje enviado a ${order.customer_name || order.customer_phone}`)
          } else {
            setToastMessage(`⚠️ Pedido marcado enviado, pero falló el mensaje WA`)
          }
          setTimeout(() => setToastMessage(null), 5000)
        } catch {
          console.warn('[ZapFlow] Error al enviar mensaje WhatsApp de pedido enviado')
        }
      }
    }
  }, [dbConnected, businessId, supabase, orders])

  const handleValidateTransfer = useCallback(async (orderId: string) => {
    if (!dbConnected || businessId === 'demo-business-id') {
      setOrders(prev => prev.map(o => o.id === orderId ? { ...o, status: 'confirmed', payment_status: 'paid' } : o))
      return
    }
    await supabase.from('orders_bookings').update({ status: 'confirmed', payment_status: 'paid' }).eq('id', orderId)
  }, [dbConnected, businessId, supabase])

  const handleConfirmPayment = useCallback(async (orderId: string) => {
    if (!dbConnected || businessId === 'demo-business-id') {
      setOrders(prev => prev.map(o => o.id === orderId ? { ...o, payment_status: 'paid' } : o))
      return
    }
    await supabase.from('orders_bookings').update({ payment_status: 'paid' }).eq('id', orderId)
  }, [dbConnected, businessId, supabase])

  // Filtrado y búsqueda (memoized)
  const filteredOrders = useMemo(() => {
    let result = orders.filter(o => o.status !== 'cancelled')

    // Ocultar completados de más de 4 horas en la vista principal
    result = result.filter(o => {
      if (o.status === 'completed') return !isOlderThan(o.created_at, 240)
      return true
    })

    // Filtro de estado
    if (statusFilter !== 'all') {
      result = result.filter(o => o.status === statusFilter)
    }

    // Búsqueda
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase()
      result = result.filter(o =>
        (o.customer_name || '').toLowerCase().includes(q) ||
        o.customer_phone.includes(q) ||
        (o.delivery_address || '').toLowerCase().includes(q) ||
        o.items.some(i => i.name.toLowerCase().includes(q))
      )
    }

    // Ordenar: activos primero (más antiguos = más urgentes), luego completed
    result.sort((a, b) => {
      const activeStatuses = ['pending_payment', 'confirmed', 'processing', 'shipped']
      const aActive = activeStatuses.includes(a.status)
      const bActive = activeStatuses.includes(b.status)
      if (aActive && !bActive) return -1
      if (!aActive && bActive) return 1
      if (aActive && bActive) return new Date(a.created_at).getTime() - new Date(b.created_at).getTime()
      return new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
    })

    return result
  }, [orders, statusFilter, searchQuery])

  // Contadores por estado — solo incluye completed recientes (últimas 24h)
  const counters = useMemo(() => {
    const c: Record<string, number> = {}
    orders.forEach(o => {
      // Excluir completed más viejos de 24h del contador de chips
      if (o.status === 'completed' && isOlderThan(o.created_at, 1440)) return
      c[o.status] = (c[o.status] || 0) + 1
    })
    return c
  }, [orders])

  // Paginación en vista de tarjetas
  const CARDS_PER_PAGE = 30
  const [visibleCount, setVisibleCount] = useState(CARDS_PER_PAGE)
  const visibleOrders = useMemo(() => filteredOrders.slice(0, visibleCount), [filteredOrders, visibleCount])

  // Mock order para demo
  const addMockOrder = () => {
    const mockOrder: Order = {
      id: `order-mock-${Date.now()}`,
      business_id: businessId,
      customer_name: `Cliente ${Math.floor(Math.random() * 999)}`,
      customer_phone: `54911${Math.floor(10000000 + Math.random() * 90000000)}`,
      delivery_address: 'Corrientes 1234, CABA',
      status: 'pending_payment',
      payment_method: Math.random() > 0.5 ? 'transfer' : 'cash',
      total: 3900.00,
      items: [
        { name: 'Pizza Muzzarella Individual', qty: 2, price: 1500, notes: 'Bien cocida' },
        { name: 'Papas Fritas', qty: 1, price: 350 },
        { name: 'Costo Delivery', qty: 1, price: 200 }
      ],
      payment_status: 'pending',
      created_at: new Date().toISOString(),
    }
    setOrders(prev => [mockOrder, ...prev])
    setNewOrderIds(prev => new Set([...prev, mockOrder.id]))
    setToastMessage(`🔔 Nuevo pedido de: ${mockOrder.customer_name}`)
    playNotificationSound()
    setTimeout(() => setToastMessage(null), 5000)
    setTimeout(() => setNewOrderIds(prev => { const s = new Set(prev); s.delete(mockOrder.id); return s }), 3000)
  }

  const activeCount = orders.filter(o => ['pending_payment', 'confirmed', 'processing', 'shipped'].includes(o.status)).length

  return (
    <div className="space-y-4 relative">

      {/* ====== TOAST ====== */}
      {toastMessage && (
        <div className="fixed top-4 right-4 z-50 flex items-center gap-3 bg-zinc-900 border border-emerald-500/40 text-white py-3 px-4 rounded-xl shadow-2xl shadow-emerald-500/10 animate-bounce max-w-xs">
          <span className="h-2 w-2 rounded-full bg-emerald-400 animate-ping shrink-0" />
          <p className="text-xs font-bold flex-1">{toastMessage}</p>
          <button onClick={() => setToastMessage(null)} className="text-zinc-500 hover:text-white ml-1 shrink-0">×</button>
        </div>
      )}

      {/* ====== DEMO BANNER ====== */}
      {!dbConnected && (
        <div className="p-3 bg-zinc-900/60 border border-zinc-800 text-zinc-400 rounded-xl text-xs flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2">
          <span className="flex items-center gap-2">
            <span className="h-1.5 w-1.5 rounded-full bg-amber-500 animate-pulse shrink-0" />
            Modo demo activo — los datos no se guardan en la base de datos
          </span>
          <button
            onClick={addMockOrder}
            className="shrink-0 rounded-lg bg-emerald-600 px-3 py-1.5 text-xs font-bold text-white hover:bg-emerald-500 transition-colors"
          >
            + Simular Pedido
          </button>
        </div>
      )}

      {/* ====== CONTROLES: FILTROS + BÚSQUEDA + TOGGLE VISTA ====== */}
      <div className="flex flex-col gap-3">

        {/* Fila 1: Búsqueda + toggle */}
        <div className="flex items-center gap-2">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-zinc-500" />
            <input
              type="text"
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              placeholder="Buscar por nombre, teléfono, dirección..."
              className="w-full bg-zinc-950/60 border border-zinc-800 rounded-xl pl-8 pr-8 py-2 text-xs text-zinc-200 placeholder-zinc-600 focus:outline-none focus:border-emerald-500/50 transition-colors"
            />
            {searchQuery && (
              <button onClick={() => setSearchQuery('')} className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-500 hover:text-white">
                <X className="h-3 w-3" />
              </button>
            )}
          </div>

          {/* Toggle de vista */}
          <div className="flex items-center gap-1 bg-zinc-900/60 border border-zinc-800 rounded-xl p-1">
            <button
              onClick={() => toggleView('cards')}
              title="Vista de tarjetas"
              className={`p-1.5 rounded-lg transition-all ${viewMode === 'cards' ? 'bg-emerald-500/20 text-emerald-400' : 'text-zinc-500 hover:text-zinc-300'}`}
            >
              <List className="h-4 w-4" />
            </button>
            <button
              onClick={() => toggleView('kanban')}
              title="Vista Kanban"
              className={`p-1.5 rounded-lg transition-all ${viewMode === 'kanban' ? 'bg-emerald-500/20 text-emerald-400' : 'text-zinc-500 hover:text-zinc-300'}`}
            >
              <LayoutGrid className="h-4 w-4" />
            </button>
          </div>
        </div>

        {/* Fila 2: Filtros de estado + contador total */}
        <div className="flex items-center gap-1.5 flex-wrap">
          <Filter className="h-3 w-3 text-zinc-600 shrink-0" />
          <button
            onClick={() => setStatusFilter('all')}
            className={`text-[10px] font-bold px-2.5 py-1 rounded-lg border transition-all ${
              statusFilter === 'all'
                ? 'bg-zinc-700 border-zinc-600 text-white'
                : 'border-zinc-800 text-zinc-500 hover:text-zinc-300 hover:border-zinc-700'
            }`}
          >
            Todos
            <span className="ml-1 bg-zinc-800 px-1 py-0.5 rounded text-[9px]">{activeCount}</span>
          </button>
          {(['pending_payment', 'confirmed', 'processing', 'shipped', 'completed'] as const).map(status => {
            const cfg = statusConfig[status]
            const count = counters[status] || 0
            if (count === 0 && statusFilter !== status) return null
            return (
              <button
                key={status}
                onClick={() => setStatusFilter(statusFilter === status ? 'all' : status)}
                className={`text-[10px] font-bold px-2.5 py-1 rounded-lg border transition-all ${
                  statusFilter === status
                    ? `${cfg.bg} ${cfg.border} ${cfg.color}`
                    : `border-zinc-800 text-zinc-500 hover:text-zinc-300 hover:border-zinc-700`
                }`}
              >
                {cfg.emoji} {cfg.label}
                <span className="ml-1 opacity-60 text-[9px]">{count}</span>
              </button>
            )
          })}
        </div>
      </div>

      {/* ====== VISTA: TARJETAS (Lista unificada) ====== */}
      {viewMode === 'cards' && (
        <div className="space-y-3">
          {filteredOrders.length === 0 ? (
            <div className="text-center py-16 text-zinc-600">
              <div className="text-3xl mb-2">
                {rubro === 'iPhones' ? '📱' : rubro === 'E-commerce' ? '📦' : rubro === 'Agencia' ? '💼' : rubro === 'Cursos' ? '🎓' : '🍽️'}
              </div>
              <p className="text-sm font-medium">Sin {rubro === 'Agencia' ? 'proyectos' : rubro === 'Cursos' ? 'inscripciones' : 'pedidos'} activos</p>
              <p className="text-xs text-zinc-700 mt-1">
                {searchQuery ? 'Ninguno coincide con la búsqueda' : 'Las operaciones del bot aparecerán acá en tiempo real'}
              </p>
            </div>
          ) : (
            <>
              <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-3">
                {visibleOrders.map(order => (
                  <OrderCard
                    key={order.id}
                    order={order}
                    onUpdateStatus={handleUpdateStatus}
                    onValidateTransfer={handleValidateTransfer}
                    onConfirmPayment={handleConfirmPayment}
                    isNew={newOrderIds.has(order.id)}
                    rubro={rubro}
                  />
                ))}
              </div>
              {filteredOrders.length > visibleCount && (
                <button
                  onClick={() => setVisibleCount(prev => prev + CARDS_PER_PAGE)}
                  className="w-full py-2.5 border border-zinc-800 rounded-xl text-xs text-zinc-500 hover:text-zinc-300 hover:border-zinc-700 transition-all flex items-center justify-center gap-2"
                >
                  <RefreshCw className="h-3.5 w-3.5" />
                  Ver más ({filteredOrders.length - visibleCount} pedidos)
                </button>
              )}
            </>
          )}
        </div>
      )}

      {/* ====== VISTA: KANBAN ====== */}
      {viewMode === 'kanban' && (
        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4 items-start">
          {KANBAN_COLUMNS.map(colStatus => {
            const cfg = statusConfig[colStatus]
            const colOrders = filteredOrders.filter(o => o.status === colStatus)

            return (
              <div key={colStatus} className="border border-zinc-800 bg-zinc-950/40 rounded-2xl flex flex-col shadow-sm">
                {/* Header columna */}
                <div className={`p-3.5 border-b border-zinc-800 flex items-center justify-between rounded-t-2xl ${cfg.headerBg}`}>
                  <span className={`text-[10px] font-black uppercase tracking-wider ${cfg.color}`}>
                    {cfg.emoji} {cfg.label}
                  </span>
                  <span className={`text-[10px] px-2 py-0.5 rounded-full border font-bold ${cfg.bg} ${cfg.border} ${cfg.color}`}>
                    {colOrders.length}
                  </span>
                </div>

                {/* Tarjetas */}
                <div className="p-2.5 space-y-2.5 min-h-[300px] max-h-[calc(100vh-280px)] overflow-y-auto">
                  {colOrders.length === 0 ? (
                    <div className="text-center py-12 text-[10px] text-zinc-700">Sin pedidos</div>
                  ) : (
                    colOrders.map(order => (
                      <OrderCard
                        key={order.id}
                        order={order}
                        onUpdateStatus={handleUpdateStatus}
                        onValidateTransfer={handleValidateTransfer}
                        onConfirmPayment={handleConfirmPayment}
                        isNew={newOrderIds.has(order.id)}
                        compact
                        rubro={rubro}
                      />
                    ))
                  )}
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}

'use client'

import React, { useState, useEffect, use, useMemo } from 'react'
import { createClient } from '@/lib/supabase/client'
import Link from 'next/link'
import {
  BarChart2, Users, ShoppingBag, TrendingUp, Star, Clock,
  AlertCircle, Search, Download, Send, MessageSquare,
  Crown, RefreshCw, UserX, UserCheck, Megaphone, X, ChevronRight
} from 'lucide-react'

// ─── Types ────────────────────────────────────────────────────────────────────
interface CRMCustomer {
  phone: string
  name: string
  nickname?: string
  totalOrders: number
  totalSpent: number
  lastOrderDate: string | null
  lastInteraction: string | null
  sessionId: string
  sessionStatus: string
  segment: 'vip' | 'recurrente' | 'nuevo' | 'inactivo'
  ltv: number
  avgTicket: number
  lastInteractionHoursAgo: number
  isOpenWindow: boolean  // last message < 24hs (Meta window)
}

interface Metrics {
  totalCustomers: number
  activeToday: number
  totalRevenue: number
  avgOrderValue: number
  vipCount: number
  inactiveCount: number
}

interface CRMPageProps {
  params: Promise<{ businessId: string }>
}

// ─── Segmentación ────────────────────────────────────────────────────────────
function getSegment(totalOrders: number, lastOrderDate: string | null): CRMCustomer['segment'] {
  if (!lastOrderDate) return 'nuevo'
  const daysSince = Math.floor((Date.now() - new Date(lastOrderDate).getTime()) / 86400000)
  if (totalOrders >= 5 && daysSince <= 30) return 'vip'
  if (totalOrders >= 2 && daysSince <= 60) return 'recurrente'
  if (daysSince > 60) return 'inactivo'
  return 'nuevo'
}

const SEGMENT_CONFIG = {
  vip:       { label: 'VIP',       color: 'text-amber-400',   bg: 'bg-amber-500/10',   border: 'border-amber-500/30',   icon: Crown },
  recurrente:{ label: 'Recurrente',color: 'text-emerald-400', bg: 'bg-emerald-500/10', border: 'border-emerald-500/30', icon: RefreshCw },
  nuevo:     { label: 'Nuevo',     color: 'text-blue-400',    bg: 'bg-blue-500/10',    border: 'border-blue-500/30',    icon: UserCheck },
  inactivo:  { label: 'Inactivo',  color: 'text-zinc-400',    bg: 'bg-zinc-800/40',    border: 'border-zinc-700',       icon: UserX },
}

// ─── Component ────────────────────────────────────────────────────────────────
export default function CRMPage({ params }: CRMPageProps) {
  const { businessId } = use(params)
  const supabase = createClient()

  const [isLoading, setIsLoading] = useState(true)
  const [hasAccess, setHasAccess] = useState(true)
  const [customers, setCustomers] = useState<CRMCustomer[]>([])
  const [metrics, setMetrics] = useState<Metrics | null>(null)
  const [searchQuery, setSearchQuery] = useState('')
  const [activeSegment, setActiveSegment] = useState<CRMCustomer['segment'] | 'todos'>('todos')
  const [selectedCustomer, setSelectedCustomer] = useState<CRMCustomer | null>(null)

  // Broadcast
  const [broadcastOpen, setBroadcastOpen] = useState(false)
  const [broadcastMsg, setBroadcastMsg] = useState('')
  const [isSendingBroadcast, setIsSendingBroadcast] = useState(false)
  const [broadcastResult, setBroadcastResult] = useState<{ sent: number; failed: number } | null>(null)

  // ── Fetch data ──────────────────────────────────────────────────────────────
  useEffect(() => {
    const fetchData = async () => {
      setIsLoading(true)
      try {
        const { data: bizData, error: bizError } = await supabase
          .from('businesses')
          .select('enabled_modules')
          .eq('id', businessId)
          .single()

        if (bizError || !bizData) {
          setHasAccess(false)
          setIsLoading(false)
          return
        }

        const modules = bizData.enabled_modules || []
        if (!modules.includes('crm_premium')) {
          setHasAccess(false)
          setIsLoading(false)
          return
        }

        const [sessionsRes, ordersRes] = await Promise.all([
          supabase
            .from('chat_sessions')
            .select('id, customer_phone, customer_name, nickname, last_interaction, status')
            .eq('business_id', businessId),
          supabase
            .from('orders_bookings')
            .select('customer_phone, total, created_at, status')
            .eq('business_id', businessId)
            .in('status', ['confirmed', 'completed', 'delivered', 'pending'])
        ])

        const sessions = sessionsRes.data || []
        const orders = ordersRes.data || []

        const now = Date.now()

        const enriched: CRMCustomer[] = sessions.map(s => {
          const customerOrders = orders.filter(o => o.customer_phone === s.customer_phone)
          const totalOrders = customerOrders.length
          const totalSpent = customerOrders.reduce((sum, o) => sum + (Number(o.total) || 0), 0)
          const sortedOrders = [...customerOrders].sort(
            (a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
          )
          const lastOrderDate = sortedOrders[0]?.created_at || null
          const lastInteractionMs = s.last_interaction ? new Date(s.last_interaction).getTime() : 0
          const lastInteractionHoursAgo = (now - lastInteractionMs) / 3600000
          const isOpenWindow = lastInteractionHoursAgo < 24

          return {
            phone: s.customer_phone,
            name: s.customer_name || s.customer_phone,
            nickname: s.nickname,
            totalOrders,
            totalSpent,
            lastOrderDate,
            lastInteraction: s.last_interaction,
            sessionId: s.id,
            sessionStatus: s.status,
            segment: getSegment(totalOrders, lastOrderDate),
            ltv: totalSpent,
            avgTicket: totalOrders > 0 ? totalSpent / totalOrders : 0,
            lastInteractionHoursAgo,
            isOpenWindow,
          }
        })

        setCustomers(enriched)

        const totalRevenue = enriched.reduce((s, c) => s + c.totalSpent, 0)
        const allTickets = enriched.filter(c => c.totalOrders > 0)
        setMetrics({
          totalCustomers: enriched.length,
          activeToday: enriched.filter(c => c.lastInteractionHoursAgo < 24).length,
          totalRevenue,
          avgOrderValue: allTickets.length > 0
            ? allTickets.reduce((s, c) => s + c.avgTicket, 0) / allTickets.length : 0,
          vipCount: enriched.filter(c => c.segment === 'vip').length,
          inactiveCount: enriched.filter(c => c.segment === 'inactivo').length,
        })
      } catch (err) {
        console.error('Error cargando CRM:', err)
      } finally {
        setIsLoading(false)
      }
    }
    fetchData()
  }, [businessId])

  // ── Filtered list ───────────────────────────────────────────────────────────
  const filtered = useMemo(() => {
    return customers
      .filter(c => activeSegment === 'todos' || c.segment === activeSegment)
      .filter(c => {
        if (!searchQuery) return true
        const q = searchQuery.toLowerCase()
        return c.name.toLowerCase().includes(q) ||
          c.phone.includes(q) ||
          (c.nickname || '').toLowerCase().includes(q)
      })
      .sort((a, b) => b.ltv - a.ltv)
  }, [customers, activeSegment, searchQuery])

  // ── Broadcast handler ───────────────────────────────────────────────────────
  const openWindowContacts = useMemo(() =>
    customers.filter(c => c.isOpenWindow), [customers])

  const handleBroadcast = async () => {
    if (!broadcastMsg.trim() || openWindowContacts.length === 0) return
    setIsSendingBroadcast(true)
    setBroadcastResult(null)
    try {
      // Get WA config from business
      const { data: biz } = await supabase
        .from('businesses')
        .select('whatsapp_config')
        .eq('id', businessId)
        .single()

      const waToken = biz?.whatsapp_config?.access_token
      const phoneId = biz?.whatsapp_config?.phone_number_id

      if (!waToken || !phoneId) {
        alert('No hay configuración de WhatsApp activa.')
        return
      }

      let sent = 0
      let failed = 0

      for (const contact of openWindowContacts) {
        try {
          const res = await fetch(`https://graph.facebook.com/v22.0/${phoneId}/messages`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              Authorization: `Bearer ${waToken}`,
            },
            body: JSON.stringify({
              messaging_product: 'whatsapp',
              recipient_type: 'individual',
              to: contact.phone,
              type: 'text',
              text: { body: broadcastMsg },
            }),
          })
          if (res.ok) {
            sent++
            // Register in chat history
            await supabase.from('chat_history').insert({
              session_id: contact.sessionId,
              sender: 'bot',
              message_text: `📢 [Broadcast]: ${broadcastMsg}`,
              timestamp: new Date().toISOString(),
            })
          } else {
            failed++
          }
        } catch {
          failed++
        }
      }

      setBroadcastResult({ sent, failed })
      setBroadcastMsg('')
    } finally {
      setIsSendingBroadcast(false)
    }
  }

  // ── Export CSV ──────────────────────────────────────────────────────────────
  const handleExportCSV = () => {
    const rows = [
      ['Nombre', 'Teléfono', 'Segmento', 'Pedidos', 'LTV ($)', 'Ticket Prom. ($)', 'Último Pedido'],
      ...filtered.map(c => [
        c.nickname || c.name,
        c.phone,
        SEGMENT_CONFIG[c.segment].label,
        c.totalOrders,
        c.ltv.toFixed(2),
        c.avgTicket.toFixed(2),
        c.lastOrderDate ? new Date(c.lastOrderDate).toLocaleDateString('es-AR') : '-',
      ])
    ]
    const csv = rows.map(r => r.join(',')).join('\n')
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `crm-clientes-${new Date().toISOString().slice(0, 10)}.csv`
    a.click()
    URL.revokeObjectURL(url)
  }

  // ─── Render ─────────────────────────────────────────────────────────────────
  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-24">
        <div className="text-center space-y-3">
          <div className="w-8 h-8 border-2 border-emerald-500 border-t-transparent rounded-full animate-spin mx-auto" />
          <p className="text-xs text-zinc-500">Cargando CRM...</p>
        </div>
      </div>
    )
  }

  if (!hasAccess) {
    return (
      <div className="flex items-center justify-center py-24">
        <div className="text-center max-w-sm p-6 bg-zinc-950/40 border border-zinc-800 rounded-2xl space-y-4">
          <div className="w-12 h-12 bg-red-500/10 border border-red-500/20 text-red-450 rounded-2xl flex items-center justify-center mx-auto">
            <AlertCircle className="h-6 w-6" />
          </div>
          <h2 className="text-sm font-bold text-white uppercase tracking-wider">Acceso Restringido</h2>
          <p className="text-xs text-zinc-400 leading-relaxed">
            El módulo <strong>CRM Premium</strong> no está activo para este negocio. Comuníquese con el Administrador para solicitar el acceso.
          </p>
          <Link
            href={`/dashboard/${businessId}`}
            className="inline-flex items-center justify-center px-4 py-2 bg-zinc-900 border border-zinc-800 rounded-xl text-xs text-white font-semibold hover:bg-zinc-800 transition-all"
          >
            Volver al Panel
          </Link>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6 font-sans">

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3">
        <div>
          <h1 className="text-xl font-bold text-white flex items-center gap-2">
            <BarChart2 className="h-5 w-5 text-emerald-500" />
            CRM Premium
          </h1>
          <p className="text-xs text-zinc-500 mt-0.5">
            Vista 360° de clientes, segmentación automática y broadcast masivo.
          </p>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          <button
            onClick={handleExportCSV}
            className="flex items-center gap-1.5 px-3 py-2 rounded-xl border border-zinc-800 text-xs text-zinc-400 hover:text-white hover:border-zinc-600 transition-all cursor-pointer min-h-[36px]"
          >
            <Download className="h-3.5 w-3.5" />
            <span className="hidden sm:inline">Exportar CSV</span>
            <span className="sm:hidden">CSV</span>
          </button>
          <button
            onClick={() => setBroadcastOpen(true)}
            className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-xs text-white font-semibold transition-all cursor-pointer shadow-lg shadow-emerald-600/20 min-h-[36px]"
          >
            <Megaphone className="h-3.5 w-3.5" />
            Broadcast
            <span className="bg-white/20 rounded-full px-1.5 py-0.5 text-[9px] font-bold">
              {openWindowContacts.length}
            </span>
          </button>
        </div>
      </div>

      {/* Métricas */}
      {metrics && (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
          {[
            { label: 'Total Clientes',   value: metrics.totalCustomers,                          icon: Users,       color: 'text-blue-400' },
            { label: 'Activos hoy',      value: metrics.activeToday,                             icon: MessageSquare, color: 'text-emerald-400' },
            { label: 'Revenue total',    value: `$${(metrics.totalRevenue).toLocaleString('es-AR', { maximumFractionDigits: 0 })}`, icon: TrendingUp, color: 'text-emerald-400' },
            { label: 'Ticket promedio',  value: `$${metrics.avgOrderValue.toLocaleString('es-AR', { maximumFractionDigits: 0 })}`, icon: ShoppingBag, color: 'text-purple-400' },
            { label: 'Clientes VIP',     value: metrics.vipCount,                                icon: Crown,       color: 'text-amber-400' },
            { label: 'Inactivos',        value: metrics.inactiveCount,                           icon: AlertCircle, color: 'text-zinc-500' },
          ].map(m => {
            const Icon = m.icon
            return (
              <div key={m.label} className="bg-zinc-950/30 border border-zinc-800 rounded-2xl p-4 space-y-2">
                <div className="flex items-center justify-between">
                  <p className="text-[9px] text-zinc-500 uppercase font-bold tracking-wider">{m.label}</p>
                  <Icon className={`h-3.5 w-3.5 ${m.color}`} />
                </div>
                <p className={`text-xl font-black ${m.color}`}>{m.value}</p>
              </div>
            )
          })}
        </div>
      )}

      {/* Segmentos + Búsqueda */}
      <div className="space-y-3">
        {/* Filter chips — horizontal scroll on mobile */}
        <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-none -mx-1 px-1">
          {(['todos', 'vip', 'recurrente', 'nuevo', 'inactivo'] as const).map(seg => {
            const cfg = seg === 'todos' ? null : SEGMENT_CONFIG[seg]
            const count = seg === 'todos' ? customers.length : customers.filter(c => c.segment === seg).length
            return (
              <button
                key={seg}
                onClick={() => setActiveSegment(seg)}
                className={`flex items-center gap-1.5 px-3 py-2 rounded-xl border text-[11px] font-semibold transition-all cursor-pointer whitespace-nowrap shrink-0 min-h-[36px] ${
                  activeSegment === seg
                    ? seg === 'todos'
                      ? 'bg-white/10 border-white/20 text-white'
                      : `${cfg!.bg} ${cfg!.border} ${cfg!.color}`
                    : 'bg-transparent border-zinc-800 text-zinc-500 hover:border-zinc-600 hover:text-zinc-300'
                }`}
              >
                {cfg && <cfg.icon className="h-3 w-3" />}
                {seg === 'todos' ? 'Todos' : cfg!.label}
                <span className="bg-zinc-800 rounded-full px-1.5 text-[9px]">{count}</span>
              </button>
            )
          })}
        </div>
        {/* Search */}
        <div className="relative w-full">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-zinc-500" />
          <input
            type="text"
            placeholder="Buscar cliente..."
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-3 py-2.5 bg-zinc-900/40 border border-zinc-800 rounded-xl text-xs text-white placeholder-zinc-600 focus:border-emerald-500 focus:outline-none"
          />
        </div>
      </div>

      {/* Tabla de clientes (Solo Desktop) */}
      <div className="hidden md:block bg-zinc-950/20 border border-zinc-800 rounded-2xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-xs">
            <thead>
              <tr className="border-b border-zinc-800 bg-zinc-950/40">
                <th className="text-left px-4 py-3 text-[9px] font-black uppercase tracking-widest text-zinc-500">Cliente</th>
                <th className="text-left px-4 py-3 text-[9px] font-black uppercase tracking-widest text-zinc-500">Segmento</th>
                <th className="text-right px-4 py-3 text-[9px] font-black uppercase tracking-widest text-zinc-500">Pedidos</th>
                <th className="text-right px-4 py-3 text-[9px] font-black uppercase tracking-widest text-zinc-500">LTV</th>
                <th className="text-right px-4 py-3 text-[9px] font-black uppercase tracking-widest text-zinc-500">Ticket Prom.</th>
                <th className="text-center px-4 py-3 text-[9px] font-black uppercase tracking-widest text-zinc-500">Ventana</th>
                <th className="text-right px-4 py-3 text-[9px] font-black uppercase tracking-widest text-zinc-500">Acciones</th>
              </tr>
            </thead>
            <tbody>
              {filtered.length === 0 ? (
                <tr>
                  <td colSpan={7} className="text-center py-16 text-zinc-600 text-xs">
                    No hay clientes con ese filtro.
                  </td>
                </tr>
              ) : filtered.map(c => {
                const seg = SEGMENT_CONFIG[c.segment]
                const SegIcon = seg.icon
                return (
                  <tr
                    key={c.phone}
                    onClick={() => setSelectedCustomer(c)}
                    className="border-b border-zinc-900 hover:bg-zinc-900/30 transition-colors cursor-pointer group"
                  >
                    {/* Cliente */}
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2.5">
                        <div className="w-8 h-8 rounded-full bg-gradient-to-br from-emerald-600 to-teal-700 flex items-center justify-center shrink-0">
                          <span className="text-[10px] font-black text-white">
                            {(c.nickname || c.name).charAt(0).toUpperCase()}
                          </span>
                        </div>
                        <div>
                          <p className="font-semibold text-white">{c.nickname || c.name}</p>
                          <p className="text-zinc-500 text-[10px]">{c.phone}</p>
                        </div>
                      </div>
                    </td>

                    {/* Segmento */}
                    <td className="px-4 py-3">
                      <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full border text-[10px] font-bold ${seg.bg} ${seg.border} ${seg.color}`}>
                        <SegIcon className="h-2.5 w-2.5" />
                        {seg.label}
                      </span>
                    </td>

                    {/* Pedidos */}
                    <td className="px-4 py-3 text-right font-mono text-zinc-300">{c.totalOrders}</td>

                    {/* LTV */}
                    <td className="px-4 py-3 text-right font-mono font-bold text-emerald-400">
                      ${c.ltv.toLocaleString('es-AR', { maximumFractionDigits: 0 })}
                    </td>

                    {/* Ticket prom */}
                    <td className="px-4 py-3 text-right font-mono text-zinc-400">
                      ${c.avgTicket.toLocaleString('es-AR', { maximumFractionDigits: 0 })}
                    </td>

                    {/* Ventana 24hs */}
                    <td className="px-4 py-3 text-center">
                      {c.isOpenWindow ? (
                        <span className="inline-flex items-center gap-1 text-[9px] font-bold text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 px-2 py-0.5 rounded-full">
                          <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                          Abierta
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 text-[9px] font-bold text-zinc-600 bg-zinc-900/40 border border-zinc-800 px-2 py-0.5 rounded-full">
                          <Clock className="h-2.5 w-2.5" />
                          Cerrada
                        </span>
                      )}
                    </td>

                    {/* Acciones */}
                    <td className="px-4 py-3 text-right">
                      <div className="flex items-center justify-end gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                        <Link
                          href={`/dashboard/${businessId}/chat`}
                          onClick={e => e.stopPropagation()}
                          className="p-1.5 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-zinc-400 hover:text-white transition-colors"
                          title="Abrir chat"
                        >
                          <MessageSquare className="h-3.5 w-3.5" />
                        </Link>
                        <button
                          onClick={e => { e.stopPropagation(); setSelectedCustomer(c) }}
                          className="p-1.5 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-zinc-400 hover:text-white transition-colors"
                          title="Ver perfil"
                        >
                          <ChevronRight className="h-3.5 w-3.5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* ── Tarjetas mobile (Solo Mobile) ── */}
      <div className="md:hidden space-y-3">
        {filtered.length === 0 ? (
          <div className="text-center py-12 text-zinc-600 text-xs">No hay clientes con ese filtro.</div>
        ) : filtered.map(c => {
          const seg = SEGMENT_CONFIG[c.segment]
          const SegIcon = seg.icon
          return (
            <button
              key={c.phone}
              onClick={() => setSelectedCustomer(c)}
              className="w-full text-left bg-zinc-950/40 border border-zinc-800 rounded-2xl p-4 flex items-center gap-3 hover:border-zinc-700 transition-all active:scale-[0.98]"
            >
              <div className="w-10 h-10 rounded-full bg-gradient-to-br from-emerald-600 to-teal-700 flex items-center justify-center shrink-0">
                <span className="text-sm font-black text-white">
                  {(c.nickname || c.name).charAt(0).toUpperCase()}
                </span>
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between gap-2">
                  <p className="font-bold text-sm text-white truncate">{c.nickname || c.name}</p>
                  <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full border text-[9px] font-bold shrink-0 ${seg.bg} ${seg.border} ${seg.color}`}>
                    <SegIcon className="h-2.5 w-2.5" />
                    {seg.label}
                  </span>
                </div>
                <p className="text-[10px] text-zinc-500 mt-0.5">{c.phone}</p>
                <div className="flex items-center gap-3 mt-1.5">
                  <span className="text-[10px] text-zinc-400"><span className="font-bold text-emerald-400">${c.ltv.toLocaleString('es-AR', { maximumFractionDigits: 0 })}</span> LTV</span>
                  <span className="text-[10px] text-zinc-500">{c.totalOrders} pedidos</span>
                  {c.isOpenWindow && <span className="text-[10px] text-emerald-400 flex items-center gap-1"><span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse inline-block" />Ventana abierta</span>}
                </div>
              </div>
              <ChevronRight className="h-4 w-4 text-zinc-600 shrink-0" />
            </button>
          )
        })}
      </div>

      {/* ── Panel Vista 360° — Bottom sheet mobile, side panel desktop ── */}
      {selectedCustomer && (
        <div className="fixed inset-0 z-50 flex items-end md:justify-end">
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setSelectedCustomer(null)} />
          {/* Mobile: bottom sheet | Desktop: right panel */}
          <div className="relative w-full md:max-w-sm bg-zinc-950 md:border-l border-t md:border-t-0 border-zinc-800 rounded-t-3xl md:rounded-none md:h-full max-h-[90vh] md:max-h-full overflow-y-auto shadow-2xl">
            {/* Drag handle on mobile */}
            <div className="md:hidden w-12 h-1 bg-zinc-800 rounded-full mx-auto mt-3 mb-1" />
            <div className="p-5 space-y-5">
              {/* Header panel */}
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-emerald-600 to-teal-700 flex items-center justify-center">
                    <span className="text-lg font-black text-white">
                      {(selectedCustomer.nickname || selectedCustomer.name).charAt(0).toUpperCase()}
                    </span>
                  </div>
                  <div>
                    <p className="font-bold text-white">{selectedCustomer.nickname || selectedCustomer.name}</p>
                    <p className="text-xs text-zinc-500">{selectedCustomer.phone}</p>
                  </div>
                </div>
                <button
                  onClick={() => setSelectedCustomer(null)}
                  className="p-1.5 rounded-xl text-zinc-500 hover:text-white hover:bg-zinc-800 transition-colors cursor-pointer"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>

              {/* Segmento */}
              {(() => {
                const seg = SEGMENT_CONFIG[selectedCustomer.segment]
                const SegIcon = seg.icon
                return (
                  <div className={`flex items-center gap-2 p-3 rounded-xl border ${seg.bg} ${seg.border}`}>
                    <SegIcon className={`h-4 w-4 ${seg.color}`} />
                    <div>
                      <p className={`text-xs font-bold ${seg.color}`}>{seg.label}</p>
                      <p className="text-[10px] text-zinc-500">Clasificación automática por comportamiento</p>
                    </div>
                  </div>
                )
              })()}

              {/* KPIs del cliente */}
              <div className="grid grid-cols-3 gap-2">
                {[
                  { label: 'Pedidos', value: selectedCustomer.totalOrders, color: 'text-blue-400' },
                  { label: 'LTV', value: `$${selectedCustomer.ltv.toLocaleString('es-AR', { maximumFractionDigits: 0 })}`, color: 'text-emerald-400' },
                  { label: 'Ticket prom.', value: `$${selectedCustomer.avgTicket.toLocaleString('es-AR', { maximumFractionDigits: 0 })}`, color: 'text-purple-400' },
                ].map(k => (
                  <div key={k.label} className="bg-zinc-900/40 border border-zinc-800 rounded-xl p-3 text-center">
                    <p className={`text-base font-black ${k.color}`}>{k.value}</p>
                    <p className="text-[9px] text-zinc-500 uppercase font-bold tracking-wider mt-0.5">{k.label}</p>
                  </div>
                ))}
              </div>

              {/* Última actividad */}
              <div className="space-y-2">
                <p className="text-[9px] font-black uppercase tracking-widest text-zinc-500">Actividad</p>
                <div className="space-y-2 text-xs">
                  <div className="flex justify-between items-center p-2.5 bg-zinc-900/30 rounded-xl border border-zinc-900">
                    <span className="text-zinc-400">Último mensaje</span>
                    <span className="text-white font-medium">
                      {selectedCustomer.lastInteraction
                        ? `${Math.round(selectedCustomer.lastInteractionHoursAgo)}hs atrás`
                        : '—'}
                    </span>
                  </div>
                  <div className="flex justify-between items-center p-2.5 bg-zinc-900/30 rounded-xl border border-zinc-900">
                    <span className="text-zinc-400">Último pedido</span>
                    <span className="text-white font-medium">
                      {selectedCustomer.lastOrderDate
                        ? new Date(selectedCustomer.lastOrderDate).toLocaleDateString('es-AR')
                        : 'Sin pedidos'}
                    </span>
                  </div>
                  <div className="flex justify-between items-center p-2.5 bg-zinc-900/30 rounded-xl border border-zinc-900">
                    <span className="text-zinc-400">Ventana Meta (24hs)</span>
                    <span className={`font-bold ${selectedCustomer.isOpenWindow ? 'text-emerald-400' : 'text-zinc-600'}`}>
                      {selectedCustomer.isOpenWindow ? '✓ Abierta' : '✗ Cerrada'}
                    </span>
                  </div>
                  <div className="flex justify-between items-center p-2.5 bg-zinc-900/30 rounded-xl border border-zinc-900">
                    <span className="text-zinc-400">Estado del chat</span>
                    <span className={`font-bold text-[10px] px-2 py-0.5 rounded-full ${
                      selectedCustomer.sessionStatus === 'human_required'
                        ? 'bg-amber-500/20 text-amber-400'
                        : 'bg-zinc-800 text-zinc-400'
                    }`}>
                      {selectedCustomer.sessionStatus === 'human_required' ? 'Agente Humano' : 'Bot activo'}
                    </span>
                  </div>
                </div>
              </div>

              {/* Acciones */}
              <div className="space-y-2 pt-2">
                <p className="text-[9px] font-black uppercase tracking-widest text-zinc-500">Acciones rápidas</p>
                <Link
                  href={`/dashboard/${businessId}/chat`}
                  className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold transition-all"
                >
                  <MessageSquare className="h-3.5 w-3.5" />
                  Abrir conversación
                </Link>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ── Modal Broadcast ── */}
      {broadcastOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" onClick={() => setBroadcastOpen(false)} />
          <div className="relative w-full max-w-md bg-zinc-950 border border-zinc-800 rounded-2xl shadow-2xl p-6 space-y-4">
            <div className="flex items-start justify-between">
              <div>
                <h3 className="font-bold text-white flex items-center gap-2">
                  <Megaphone className="h-4 w-4 text-emerald-400" />
                  Broadcast masivo
                </h3>
                <p className="text-[11px] text-zinc-500 mt-0.5">
                  Enviar a <strong className="text-emerald-400">{openWindowContacts.length} contactos</strong> con ventana activa (&lt;24hs)
                </p>
              </div>
              <button
                onClick={() => { setBroadcastOpen(false); setBroadcastResult(null) }}
                className="p-1.5 rounded-xl text-zinc-500 hover:text-white hover:bg-zinc-800 transition-colors cursor-pointer"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            {openWindowContacts.length === 0 ? (
              <div className="p-4 rounded-xl bg-amber-500/10 border border-amber-500/20 text-xs text-amber-300">
                No hay conversaciones con ventana activa en este momento. Un contacto tiene ventana activa cuando su último mensaje fue hace menos de 24 horas.
              </div>
            ) : (
              <>
                <textarea
                  rows={4}
                  placeholder="Escribe el mensaje a enviar a todos los contactos activos..."
                  value={broadcastMsg}
                  onChange={e => setBroadcastMsg(e.target.value)}
                  className="w-full bg-zinc-900/60 border border-zinc-800 rounded-xl px-3 py-2.5 text-xs text-white placeholder-zinc-600 focus:border-emerald-500 focus:outline-none resize-none"
                />

                <div className="p-3 rounded-xl bg-zinc-900/40 border border-zinc-800 text-[11px] text-zinc-500">
                  ⚠️ Solo se puede enviar a conversaciones abiertas (&lt;24hs) para no violar las políticas de Meta.
                </div>

                {broadcastResult && (
                  <div className="p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-xs text-emerald-300">
                    ✅ Enviado a <strong>{broadcastResult.sent}</strong> contactos.
                    {broadcastResult.failed > 0 && ` ❌ Fallaron: ${broadcastResult.failed}`}
                  </div>
                )}

                <button
                  onClick={handleBroadcast}
                  disabled={!broadcastMsg.trim() || isSendingBroadcast}
                  className="w-full flex items-center justify-center gap-2 py-3 rounded-xl bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 text-white text-xs font-bold transition-all cursor-pointer"
                >
                  {isSendingBroadcast ? (
                    <><div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" /> Enviando...</>
                  ) : (
                    <><Send className="h-3.5 w-3.5" /> Enviar a {openWindowContacts.length} contactos</>
                  )}
                </button>
              </>
            )}
          </div>
        </div>
      )}

    </div>
  )
}

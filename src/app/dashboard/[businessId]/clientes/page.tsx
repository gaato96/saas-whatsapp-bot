'use client'

import React, { useState, useEffect, use, useMemo } from 'react'
import { createClient } from '@/lib/supabase/client'
import {
  Users, Phone, MessageSquare, Bot, AlertCircle, ShoppingCart,
  ShieldAlert, Search, Star, MapPin, Tag, StickyNote, X, Save
} from 'lucide-react'
import Link from 'next/link'

interface ContactDetails {
  address?: string
  neighborhood?: string
  delivery_notes?: string
  preferences?: string
}

interface Customer {
  id: string
  name: string
  nickname?: string
  phone: string
  lastInteraction: string
  totalOrders: number
  totalSpent: number
  status: 'bot_handling' | 'human_required'
  notes?: string
  contactDetails?: ContactDetails
}

interface ClientesPageProps {
  params: Promise<{ businessId: string }>
}

export default function ClientesPage({ params }: ClientesPageProps) {
  const { businessId } = use(params)
  const supabase = createClient()

  const [isLoading, setIsLoading] = useState(true)
  const [dbConnected, setDbConnected] = useState(true)
  const [customers, setCustomers] = useState<Customer[]>([])
  const [searchQuery, setSearchQuery] = useState('')
  const [togglingId, setTogglingId] = useState<string | null>(null)

  // Modal de edición
  const [editingCustomer, setEditingCustomer] = useState<Customer | null>(null)
  const [editNickname, setEditNickname] = useState('')
  const [editName, setEditName] = useState('')
  const [editNotes, setEditNotes] = useState('')
  const [editAddress, setEditAddress] = useState('')
  const [editNeighborhood, setEditNeighborhood] = useState('')
  const [editDeliveryNotes, setEditDeliveryNotes] = useState('')
  const [editPreferences, setEditPreferences] = useState('')
  const [isSaving, setIsSaving] = useState(false)

  useEffect(() => {
    const fetchCustomers = async () => {
      setIsLoading(true)
      try {
        const { data: chatSessions, error: chatError } = await supabase
          .from('chat_sessions')
          .select('id, customer_phone, last_interaction, status, customer_name, notes, nickname, contact_details')
          .eq('business_id', businessId)

        if (chatError) throw chatError

        const { data: orders, error: ordersError } = await supabase
          .from('orders_bookings')
          .select('customer_phone, total, status')
          .eq('business_id', businessId)

        if (ordersError) throw ordersError

        const orderSummaryByPhone: { [phone: string]: { count: number; total: number } } = {}
        if (orders) {
          orders.forEach(o => {
            if (!orderSummaryByPhone[o.customer_phone]) {
              orderSummaryByPhone[o.customer_phone] = { count: 0, total: 0 }
            }
            if (o.status !== 'cancelled') {
              orderSummaryByPhone[o.customer_phone].count += 1
              orderSummaryByPhone[o.customer_phone].total += Number(o.total)
            }
          })
        }

        const consolidated: Customer[] = (chatSessions || []).map((session, idx) => {
          const phone = session.customer_phone
          const orderSum = orderSummaryByPhone[phone] || { count: 0, total: 0 }
          const details: ContactDetails = session.contact_details || {}

          return {
            id: session.id,
            name: session.customer_name || `Cliente #${idx + 1}`,
            nickname: session.nickname || '',
            phone,
            lastInteraction: new Date(session.last_interaction).toLocaleString('es-ES', {
              day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit'
            }),
            totalOrders: orderSum.count,
            totalSpent: orderSum.total,
            status: session.status,
            notes: session.notes || '',
            contactDetails: details,
          }
        })

        consolidated.sort((a, b) => b.totalSpent - a.totalSpent)
        setCustomers(consolidated)
      } catch (err: any) {
        console.warn("Fallo cargando clientes. Demo activo.", err)
        setDbConnected(false)
        setCustomers([
          { id: 'c1', name: 'Juan Pérez', nickname: 'Juancho', phone: '+54 9 11 3829-3849', lastInteraction: 'Hoy, 10:15 hs', totalOrders: 7, totalSpent: 12400, status: 'bot_handling', notes: 'Siempre pide picante extra.', contactDetails: { address: 'Corrientes 1234', neighborhood: 'Palermo', delivery_notes: 'Timbre no funciona, llamar al llegar', preferences: 'Sin cebolla siempre' } },
          { id: 'c2', name: 'María Gómez', nickname: 'Mari', phone: '+54 9 11 4982-1209', lastInteraction: 'Hoy, 14:32 hs', totalOrders: 5, totalSpent: 8900, status: 'bot_handling', notes: 'Prefiere retirar en local.', contactDetails: { neighborhood: 'Villa Crespo' } },
          { id: 'c3', name: 'Esteban Quinteros', phone: '+54 9 11 5012-3294', lastInteraction: 'Ayer, 17:05 hs', totalOrders: 3, totalSpent: 5200, status: 'human_required', notes: 'Preguntó por planes corporativos.' },
          { id: 'c4', name: 'Clara Domínguez', phone: '+54 9 11 2093-8392', lastInteraction: '17 Jun, 09:12 hs', totalOrders: 0, totalSpent: 0, status: 'bot_handling' },
        ])
      } finally {
        setIsLoading(false)
      }
    }
    fetchCustomers()
  }, [businessId, supabase])

  // Búsqueda filtrada
  const filteredCustomers = useMemo(() => {
    if (!searchQuery.trim()) return customers
    const q = searchQuery.toLowerCase()
    return customers.filter(c =>
      c.name.toLowerCase().includes(q) ||
      (c.nickname || '').toLowerCase().includes(q) ||
      c.phone.includes(q) ||
      (c.contactDetails?.neighborhood || '').toLowerCase().includes(q) ||
      (c.notes || '').toLowerCase().includes(q)
    )
  }, [customers, searchQuery])

  const toggleBotStatus = async (customerId: string, currentStatus: Customer['status']) => {
    setTogglingId(customerId)
    const nextStatus = currentStatus === 'bot_handling' ? 'human_required' : 'bot_handling'
    try {
      if (!dbConnected || businessId.startsWith('demo-') || businessId === 'zapas-premium') {
        setTimeout(() => {
          setCustomers(prev => prev.map(c => c.id === customerId ? { ...c, status: nextStatus } : c))
          setTogglingId(null)
        }, 400)
        return
      }
      const { error } = await supabase.from('chat_sessions').update({ status: nextStatus }).eq('id', customerId)
      if (error) throw error
      setCustomers(prev => prev.map(c => c.id === customerId ? { ...c, status: nextStatus } : c))
    } catch { alert("Error al actualizar estado del chatbot.") }
    finally { setTogglingId(null) }
  }

  const handleEditClick = (c: Customer) => {
    setEditingCustomer(c)
    setEditNickname(c.nickname || '')
    setEditName(c.name.startsWith('Cliente #') ? '' : c.name)
    setEditNotes(c.notes || '')
    setEditAddress(c.contactDetails?.address || '')
    setEditNeighborhood(c.contactDetails?.neighborhood || '')
    setEditDeliveryNotes(c.contactDetails?.delivery_notes || '')
    setEditPreferences(c.contactDetails?.preferences || '')
  }

  const handleSaveEdit = async () => {
    if (!editingCustomer) return
    setIsSaving(true)

    const finalName = editName.trim() || editingCustomer.name
    const newContactDetails: ContactDetails = {
      address: editAddress.trim() || undefined,
      neighborhood: editNeighborhood.trim() || undefined,
      delivery_notes: editDeliveryNotes.trim() || undefined,
      preferences: editPreferences.trim() || undefined,
    }

    try {
      if (!dbConnected || businessId.startsWith('demo-') || businessId === 'zapas-premium') {
        setCustomers(prev => prev.map(c =>
          c.id === editingCustomer.id
            ? { ...c, name: finalName, nickname: editNickname.trim(), notes: editNotes, contactDetails: newContactDetails }
            : c
        ))
        setEditingCustomer(null)
        return
      }

      const { error } = await supabase
        .from('chat_sessions')
        .update({
          customer_name: finalName,
          nickname: editNickname.trim() || null,
          notes: editNotes,
          contact_details: newContactDetails,
        })
        .eq('id', editingCustomer.id)

      if (error) throw error

      setCustomers(prev => prev.map(c =>
        c.id === editingCustomer.id
          ? { ...c, name: finalName, nickname: editNickname.trim(), notes: editNotes, contactDetails: newContactDetails }
          : c
      ))
      setEditingCustomer(null)
    } catch { alert("No se pudo guardar los datos del cliente.") }
    finally { setIsSaving(false) }
  }

  return (
    <div className="space-y-5 font-sans">

      {/* Banner demo */}
      {!dbConnected && (
        <div className="p-3 bg-zinc-900/60 border border-zinc-800 text-zinc-400 rounded-xl text-xs flex items-center gap-2">
          <AlertCircle className="h-4 w-4 text-emerald-500 shrink-0" />
          <span><strong>Clientes Demo:</strong> Datos de ejemplo interactivos cargados en memoria local.</span>
        </div>
      )}

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-lg font-black text-white flex items-center gap-2">
            <Users className="h-5 w-5 text-emerald-400" />
            Contactos Frecuentes
          </h1>
          <p className="text-xs text-zinc-500 mt-0.5">
            Guardá apodo, dirección y preferencias de cada cliente para agilizar pedidos recurrentes.
          </p>
        </div>
        {/* Buscador */}
        <div className="relative max-w-xs w-full">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-zinc-500" />
          <input
            type="text"
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            placeholder="Buscar cliente..."
            className="w-full bg-zinc-950/60 border border-zinc-800 rounded-xl pl-8 pr-8 py-2 text-xs text-zinc-200 placeholder-zinc-600 focus:outline-none focus:border-emerald-500/50 transition-colors"
          />
          {searchQuery && (
            <button onClick={() => setSearchQuery('')} className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-500 hover:text-white">
              <X className="h-3 w-3" />
            </button>
          )}
        </div>
      </div>

      {/* Lista de Clientes */}
      {isLoading ? (
        <div className="text-center py-20 text-xs text-zinc-500">Cargando directorio de clientes...</div>
      ) : filteredCustomers.length === 0 ? (
        <div className="text-center py-20 text-xs text-zinc-600">
          {searchQuery ? 'Ningún cliente coincide con la búsqueda.' : 'No hay clientes registrados aún.'}
        </div>
      ) : (
        <>
          {/* Vista móvil: Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-3 lg:hidden">
            {filteredCustomers.map(c => (
              <div key={c.id} className="border border-zinc-800 bg-zinc-950/60 rounded-xl p-4 space-y-3">
                <div className="flex items-start justify-between gap-2">
                  <div className="flex items-center gap-2.5 min-w-0">
                    <div className="h-9 w-9 rounded-full bg-emerald-500/10 text-emerald-400 flex items-center justify-center font-black text-sm uppercase shrink-0">
                      {(c.nickname || c.name).substring(0, 2)}
                    </div>
                    <div className="min-w-0">
                      <div className="flex items-center gap-1.5">
                        <span className="font-bold text-sm text-white truncate">
                          {c.nickname ? c.nickname : c.name}
                        </span>
                        {c.nickname && (
                          <span className="text-[9px] text-zinc-500 truncate hidden sm:inline">({c.name})</span>
                        )}
                      </div>
                      <div className="flex items-center gap-1 mt-0.5">
                        <Phone className="h-2.5 w-2.5 text-zinc-600" />
                        <span className="text-[10px] text-zinc-500 font-mono">{c.phone}</span>
                      </div>
                    </div>
                  </div>
                  <button
                    onClick={() => toggleBotStatus(c.id, c.status)}
                    disabled={togglingId === c.id}
                    className={`shrink-0 p-1.5 rounded-lg border text-[9px] font-bold transition-colors ${
                      c.status === 'bot_handling'
                        ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400'
                        : 'bg-red-500/10 border-red-500/20 text-red-400 animate-pulse'
                    }`}
                  >
                    {c.status === 'bot_handling' ? <Bot className="h-3.5 w-3.5" /> : <ShieldAlert className="h-3.5 w-3.5" />}
                  </button>
                </div>

                {/* Detalles de contacto */}
                {(c.contactDetails?.neighborhood || c.contactDetails?.address) && (
                  <div className="flex items-start gap-1.5 bg-zinc-900/50 rounded-lg px-2.5 py-2">
                    <MapPin className="h-3 w-3 text-zinc-600 mt-0.5 shrink-0" />
                    <div>
                      {c.contactDetails.neighborhood && (
                        <div className="text-[10px] text-zinc-400 font-medium">{c.contactDetails.neighborhood}</div>
                      )}
                      {c.contactDetails.address && (
                        <div className="text-[10px] text-zinc-500">{c.contactDetails.address}</div>
                      )}
                    </div>
                  </div>
                )}
                {c.notes && (
                  <div className="flex items-start gap-1.5 bg-amber-500/5 rounded-lg px-2.5 py-2">
                    <StickyNote className="h-3 w-3 text-amber-500/70 mt-0.5 shrink-0" />
                    <span className="text-[10px] text-zinc-400 italic leading-relaxed line-clamp-2">{c.notes}</span>
                  </div>
                )}

                <div className="flex items-center justify-between pt-2 border-t border-zinc-800">
                  <div className="flex items-center gap-2">
                    <span className="text-[10px] text-zinc-500">{c.totalOrders} pedidos</span>
                    {c.totalSpent > 0 && (
                      <span className="text-[10px] font-bold text-emerald-400 flex items-center gap-0.5">
                        <ShoppingCart className="h-2.5 w-2.5" />
                        ${c.totalSpent.toLocaleString('es-AR')}
                      </span>
                    )}
                  </div>
                  <div className="flex gap-1.5">
                    <button
                      onClick={() => handleEditClick(c)}
                      className="text-[10px] font-bold px-2 py-1 border border-zinc-800 text-zinc-400 hover:text-white hover:bg-zinc-800 rounded-lg transition-all"
                    >
                      ✏️ Editar
                    </button>
                    <Link
                      href={`/dashboard/${businessId}/chat`}
                      className="text-[10px] font-bold px-2 py-1 border border-zinc-800 text-zinc-300 hover:text-white hover:bg-zinc-800 rounded-lg transition-all flex items-center gap-1"
                    >
                      <MessageSquare className="h-3 w-3" />
                      Chat
                    </Link>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Vista desktop: Tabla */}
          <div className="hidden lg:block border border-zinc-800 bg-zinc-950/20 rounded-2xl overflow-hidden">
            <div className="p-4 border-b border-zinc-800 bg-zinc-950/40 flex items-center justify-between">
              <span className="text-xs font-bold uppercase tracking-wider text-zinc-400">
                Directorio de Clientes
              </span>
              <span className="text-[10px] text-zinc-500">{filteredCustomers.length} contactos</span>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b border-zinc-800 text-[10px] uppercase tracking-wider text-zinc-500 bg-zinc-950/40 font-semibold">
                    <th className="px-5 py-3.5">Contacto</th>
                    <th className="px-5 py-3.5">Teléfono</th>
                    <th className="px-5 py-3.5">Dirección / Barrio</th>
                    <th className="px-5 py-3.5 text-center">Pedidos</th>
                    <th className="px-5 py-3.5 text-center">Gastado</th>
                    <th className="px-5 py-3.5 text-center">Bot</th>
                    <th className="px-5 py-3.5 text-right">Acciones</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-zinc-900/40 text-xs">
                  {filteredCustomers.map(c => (
                    <tr key={c.id} className="hover:bg-zinc-900/10 transition-colors">
                      <td className="px-5 py-3.5">
                        <div className="flex items-center gap-2.5">
                          <div className="h-8 w-8 rounded-full bg-emerald-500/10 text-emerald-400 flex items-center justify-center font-black text-xs uppercase shrink-0">
                            {(c.nickname || c.name).substring(0, 2)}
                          </div>
                          <div>
                            <div className="flex items-center gap-1.5">
                              <span className="font-bold text-white">
                                {c.nickname || c.name}
                              </span>
                              {c.nickname && (
                                <span className="text-[9px] text-zinc-500">({c.name})</span>
                              )}
                            </div>
                            {c.notes && (
                              <div className="text-[9px] text-zinc-500 italic mt-0.5 max-w-[200px] truncate flex items-center gap-0.5">
                                <StickyNote className="h-2.5 w-2.5 text-amber-500/60 shrink-0" />
                                {c.notes}
                              </div>
                            )}
                            {c.contactDetails?.preferences && (
                              <div className="text-[9px] text-purple-400/70 mt-0.5 flex items-center gap-0.5">
                                <Tag className="h-2.5 w-2.5 shrink-0" />
                                {c.contactDetails.preferences}
                              </div>
                            )}
                          </div>
                        </div>
                      </td>
                      <td className="px-5 py-3.5 font-mono text-zinc-400 text-[11px]">
                        <div className="flex items-center gap-1">
                          <Phone className="h-3 w-3 text-zinc-600" />
                          {c.phone}
                        </div>
                      </td>
                      <td className="px-5 py-3.5">
                        {c.contactDetails?.neighborhood || c.contactDetails?.address ? (
                          <div className="flex items-start gap-1">
                            <MapPin className="h-3 w-3 text-zinc-600 mt-0.5 shrink-0" />
                            <div>
                              {c.contactDetails?.neighborhood && (
                                <div className="text-[11px] text-zinc-300 font-medium">{c.contactDetails.neighborhood}</div>
                              )}
                              {c.contactDetails?.address && (
                                <div className="text-[10px] text-zinc-500">{c.contactDetails.address}</div>
                              )}
                            </div>
                          </div>
                        ) : (
                          <span className="text-zinc-700 text-[10px]">—</span>
                        )}
                      </td>
                      <td className="px-5 py-3.5 text-center font-bold text-zinc-200">{c.totalOrders}</td>
                      <td className="px-5 py-3.5 text-center">
                        {c.totalSpent > 0 ? (
                          <span className="inline-flex items-center gap-1 text-emerald-400 font-bold bg-emerald-500/5 px-2 py-0.5 rounded border border-emerald-500/10 font-mono text-[11px]">
                            <ShoppingCart className="h-2.5 w-2.5" />
                            ${c.totalSpent.toLocaleString('es-AR')}
                          </span>
                        ) : (
                          <span className="text-zinc-700 text-[10px]">—</span>
                        )}
                      </td>
                      <td className="px-5 py-3.5 text-center">
                        <button
                          onClick={() => toggleBotStatus(c.id, c.status)}
                          disabled={togglingId === c.id}
                          className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-[10px] font-bold border transition-colors cursor-pointer ${
                            c.status === 'bot_handling'
                              ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400 hover:bg-emerald-500/20'
                              : 'bg-red-500/10 border-red-500/20 text-red-400 animate-pulse hover:bg-red-500/20'
                          }`}
                        >
                          {c.status === 'bot_handling'
                            ? <><Bot className="h-3 w-3" /> Activo</>
                            : <><ShieldAlert className="h-3 w-3" /> Manual</>
                          }
                        </button>
                      </td>
                      <td className="px-5 py-3.5 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          <button
                            onClick={() => handleEditClick(c)}
                            className="inline-flex items-center gap-1 rounded-lg border border-zinc-800 text-zinc-400 hover:text-white bg-zinc-900/60 hover:bg-zinc-800 px-2 py-1.5 text-[11px] font-bold transition-all cursor-pointer"
                          >
                            ✏️ Editar
                          </button>
                          <Link
                            href={`/dashboard/${businessId}/chat`}
                            className="inline-flex items-center gap-1 rounded-lg border border-zinc-800 text-zinc-300 hover:text-white bg-zinc-900 hover:bg-zinc-850 px-2 py-1.5 text-[11px] font-bold transition-all"
                          >
                            <MessageSquare className="h-3 w-3 text-zinc-500" />
                            Chat
                          </Link>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </>
      )}

      {/* ====== MODAL DE EDICIÓN ====== */}
      {editingCustomer && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-end sm:items-center justify-center p-0 sm:p-4 z-50">
          <div className="bg-zinc-950 border border-zinc-800 rounded-t-2xl sm:rounded-2xl p-5 w-full sm:max-w-lg space-y-4 max-h-[90vh] overflow-y-auto shadow-2xl">
            <div className="flex items-center justify-between border-b border-zinc-800 pb-3">
              <div>
                <h3 className="text-sm font-black text-white">Editar Contacto</h3>
                <p className="text-[10px] text-zinc-500 mt-0.5">{editingCustomer.phone}</p>
              </div>
              <button onClick={() => setEditingCustomer(null)} className="text-zinc-500 hover:text-white p-1 cursor-pointer">
                <X className="h-4 w-4" />
              </button>
            </div>

            <div className="space-y-4">

              {/* Identidad */}
              <div>
                <label className="block text-[9px] text-emerald-400 uppercase font-black tracking-wider mb-2 flex items-center gap-1">
                  <Star className="h-3 w-3" /> Identidad
                </label>
                <div className="grid grid-cols-2 gap-2.5">
                  <div>
                    <label className="block text-[10px] text-zinc-500 mb-1">Apodo / Alias</label>
                    <input
                      type="text"
                      maxLength={20}
                      value={editNickname}
                      onChange={e => setEditNickname(e.target.value)}
                      placeholder="Ej: Juancho"
                      className="block w-full rounded-lg border border-zinc-800 bg-zinc-900 px-3 py-2 text-xs text-white placeholder-zinc-600 focus:border-emerald-500 focus:outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] text-zinc-500 mb-1">Nombre completo</label>
                    <input
                      type="text"
                      value={editName}
                      onChange={e => setEditName(e.target.value)}
                      placeholder="Ej: Juan Pérez"
                      className="block w-full rounded-lg border border-zinc-800 bg-zinc-900 px-3 py-2 text-xs text-white placeholder-zinc-600 focus:border-emerald-500 focus:outline-none"
                    />
                  </div>
                </div>
              </div>

              {/* Dirección */}
              <div>
                <label className="block text-[9px] text-blue-400 uppercase font-black tracking-wider mb-2 flex items-center gap-1">
                  <MapPin className="h-3 w-3" /> Dirección de Entrega
                </label>
                <div className="grid grid-cols-2 gap-2.5 mb-2.5">
                  <div>
                    <label className="block text-[10px] text-zinc-500 mb-1">Calle y número</label>
                    <input
                      type="text"
                      value={editAddress}
                      onChange={e => setEditAddress(e.target.value)}
                      placeholder="Ej: Corrientes 1234, 3°B"
                      className="block w-full rounded-lg border border-zinc-800 bg-zinc-900 px-3 py-2 text-xs text-white placeholder-zinc-600 focus:border-emerald-500 focus:outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] text-zinc-500 mb-1">Barrio / Zona</label>
                    <input
                      type="text"
                      value={editNeighborhood}
                      onChange={e => setEditNeighborhood(e.target.value)}
                      placeholder="Ej: Palermo"
                      className="block w-full rounded-lg border border-zinc-800 bg-zinc-900 px-3 py-2 text-xs text-white placeholder-zinc-600 focus:border-emerald-500 focus:outline-none"
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-[10px] text-zinc-500 mb-1">Indicaciones de entrega</label>
                  <input
                    type="text"
                    value={editDeliveryNotes}
                    onChange={e => setEditDeliveryNotes(e.target.value)}
                    placeholder="Ej: Timbre roto, llamar al llegar"
                    className="block w-full rounded-lg border border-zinc-800 bg-zinc-900 px-3 py-2 text-xs text-white placeholder-zinc-600 focus:border-emerald-500 focus:outline-none"
                  />
                </div>
              </div>

              {/* Preferencias */}
              <div>
                <label className="block text-[9px] text-purple-400 uppercase font-black tracking-wider mb-2 flex items-center gap-1">
                  <Tag className="h-3 w-3" /> Preferencias
                </label>
                <input
                  type="text"
                  value={editPreferences}
                  onChange={e => setEditPreferences(e.target.value)}
                  placeholder="Ej: Sin cebolla, extra salsa picante"
                  className="block w-full rounded-lg border border-zinc-800 bg-zinc-900 px-3 py-2 text-xs text-white placeholder-zinc-600 focus:border-emerald-500 focus:outline-none"
                />
              </div>

              {/* Notas internas */}
              <div>
                <label className="block text-[9px] text-amber-400 uppercase font-black tracking-wider mb-2 flex items-center gap-1">
                  <StickyNote className="h-3 w-3" /> Notas Internas (CRM)
                </label>
                <textarea
                  value={editNotes}
                  onChange={e => setEditNotes(e.target.value)}
                  placeholder="Ej: Cliente VIP, siempre pide los viernes. Tiene un perro en casa."
                  rows={3}
                  className="block w-full rounded-lg border border-zinc-800 bg-zinc-900 px-3 py-2 text-xs text-white placeholder-zinc-600 focus:border-emerald-500 focus:outline-none resize-none"
                />
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-2 border-t border-zinc-800">
              <button
                onClick={() => setEditingCustomer(null)}
                className="rounded-lg border border-zinc-800 px-4 py-2 text-xs font-semibold text-zinc-400 hover:bg-zinc-900 transition-colors cursor-pointer"
              >
                Cancelar
              </button>
              <button
                onClick={handleSaveEdit}
                disabled={isSaving}
                className="rounded-lg bg-emerald-600 px-4 py-2 text-xs font-bold text-white hover:bg-emerald-500 transition-colors disabled:opacity-50 cursor-pointer flex items-center gap-1.5"
              >
                <Save className="h-3.5 w-3.5" />
                {isSaving ? 'Guardando...' : 'Guardar Contacto'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

'use client'

import React, { useState, useEffect, use } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Users, Phone, MessageSquare, Bot, AlertCircle, ShoppingCart, ShieldAlert } from 'lucide-react'
import Link from 'next/link'

interface Customer {
  id: string
  name: string
  phone: string
  lastInteraction: string
  totalOrders: number
  totalSpent: number
  status: 'bot_handling' | 'human_required'
  notes?: string
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
  
  // Estados de carga para acciones rápidas
  const [togglingId, setTogglingId] = useState<string | null>(null)

  // Estados para modal de edición
  const [editingCustomer, setEditingCustomer] = useState<Customer | null>(null)
  const [newName, setNewName] = useState('')
  const [newNotes, setNewNotes] = useState('')
  const [isSaving, setIsSaving] = useState(false)

  useEffect(() => {
    const fetchCustomers = async () => {
      setIsLoading(true)
      try {
        // Obtenemos sesiones de chat y órdenes para consolidar el listado de clientes
        const { data: chatSessions, error: chatError } = await supabase
          .from('chat_sessions')
          .select('id, customer_phone, last_interaction, status, customer_name, notes')
          .eq('business_id', businessId)

        if (chatError) throw chatError

        const { data: orders, error: ordersError } = await supabase
          .from('orders_bookings')
          .select('customer_phone, total, status')
          .eq('business_id', businessId)

        if (ordersError) throw ordersError

        // Agrupar órdenes por teléfono del cliente
        const orderSummaryByPhone: { [phone: string]: { count: number, total: number } } = {}
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

        // Construir listado consolidado
        const consolidatedCustomers: Customer[] = (chatSessions || []).map((session, idx) => {
          const phone = session.customer_phone
          const orderSum = orderSummaryByPhone[phone] || { count: 0, total: 0 }
          
          return {
            id: session.id,
            name: session.customer_name || `Cliente #${idx + 1}`,
            phone: phone,
            lastInteraction: new Date(session.last_interaction).toLocaleString('es-ES', {
              day: 'numeric',
              month: 'short',
              hour: '2-digit',
              minute: '2-digit'
            }),
            totalOrders: orderSum.count,
            totalSpent: orderSum.total,
            status: session.status,
            notes: session.notes || ''
          }
        })

        // Ordenar por facturación histórica descendente
        consolidatedCustomers.sort((a, b) => b.totalSpent - a.totalSpent)
        setCustomers(consolidatedCustomers)
      } catch (err: any) {
        console.warn("Fallo cargando clientes de base de datos. Usando datos demo.", err)
        setDbConnected(false)

        // Cargar clientes de demostración
        setCustomers([
          {
            id: 'c1',
            name: 'Juan Pérez',
            phone: '+54 9 11 3829-3849',
            lastInteraction: 'Hoy, 10:15 hs',
            totalOrders: 3,
            totalSpent: 5100.00,
            status: 'bot_handling',
            notes: 'Cliente de Palermo. Siempre pide salsa picante extra.'
          },
          {
            id: 'c2',
            name: 'María Gómez',
            phone: '+54 9 11 4982-1209',
            lastInteraction: 'Hoy, 14:32 hs',
            totalOrders: 5,
            totalSpent: 8900.00,
            status: 'bot_handling',
            notes: 'Frecuente. Prefiere retirar por sucursal.'
          },
          {
            id: 'c3',
            name: 'Esteban Quinteros',
            phone: '+54 9 11 5012-3294',
            lastInteraction: 'Ayer, 17:05 hs',
            totalOrders: 1,
            totalSpent: 3200.00,
            status: 'human_required',
            notes: 'Interesado en planes corporativos de membresía.'
          },
          {
            id: 'c4',
            name: 'Clara Domínguez',
            phone: '+54 9 11 2093-8392',
            lastInteraction: '17 Jun, 09:12 hs',
            totalOrders: 0,
            totalSpent: 0.00,
            status: 'bot_handling',
            notes: 'Solo consultó por horarios.'
          },
          {
            id: 'c5',
            name: 'Pedro Díaz',
            phone: '+54 9 11 9832-7483',
            lastInteraction: '15 Jun, 16:20 hs',
            totalOrders: 1,
            totalSpent: 1000.00,
            status: 'bot_handling',
            notes: ''
          }
        ])
      } finally {
        setIsLoading(false)
      }
    }

    const loadRefreshed = async () => {
      await fetchCustomers()
    }
    loadRefreshed()
  }, [businessId, supabase])

  // Modificar el estado del bot (Takeover)
  const toggleBotStatus = async (customerId: string, currentStatus: 'bot_handling' | 'human_required') => {
    setTogglingId(customerId)
    const nextStatus = currentStatus === 'bot_handling' ? 'human_required' : 'bot_handling'
    
    try {
      if (!dbConnected || businessId.startsWith('demo-') || businessId === 'zapas-premium') {
        setTimeout(() => {
          setCustomers(prev => prev.map(c => c.id === customerId ? { ...c, status: nextStatus } : c))
          setTogglingId(null)
        }, 500)
        return
      }

      const { error } = await supabase
        .from('chat_sessions')
        .update({ status: nextStatus })
        .eq('id', customerId)

      if (error) throw error
      setCustomers(prev => prev.map(c => c.id === customerId ? { ...c, status: nextStatus } : c))
    } catch (err) {
      console.error(err)
      alert("Error al actualizar estado del chatbot.")
    } finally {
      setTogglingId(null)
    }
  }

  // Cargar datos para edición de alias/notas
  const handleEditClick = (c: Customer) => {
    setEditingCustomer(c)
    setNewName(c.name.startsWith('Cliente #') ? '' : c.name)
    setNewNotes(c.notes || '')
  }

  // Guardar alias/notas
  const handleSaveEdit = async () => {
    if (!editingCustomer) return
    setIsSaving(true)

    const finalName = newName.trim() || editingCustomer.name

    try {
      if (!dbConnected || businessId.startsWith('demo-') || businessId === 'zapas-premium') {
        setCustomers(prev => prev.map(c => c.id === editingCustomer.id ? { ...c, name: finalName, notes: newNotes } : c))
        setEditingCustomer(null)
        return
      }

      const { error } = await supabase
        .from('chat_sessions')
        .update({
          customer_name: finalName,
          notes: newNotes
        })
        .eq('id', editingCustomer.id)

      if (error) throw error

      setCustomers(prev => prev.map(c => c.id === editingCustomer.id ? { ...c, name: finalName, notes: newNotes } : c))
      setEditingCustomer(null)
    } catch (err) {
      console.error("Error al guardar anotación:", err)
      alert("No se pudo guardar la anotación de cliente.")
    } finally {
      setIsSaving(false)
    }
  }

  return (
    <div className="space-y-6 font-sans">
      {/* Alerta demo */}
      {!dbConnected && (
        <div className="p-3 bg-zinc-900/60 border border-zinc-800 text-zinc-400 rounded-xl text-xs flex items-center gap-2">
          <AlertCircle className="h-4 w-4 text-emerald-500" />
          <span><strong>Clientes Demo Activos:</strong> Listado consolidado interactivo cargado en memoria local.</span>
        </div>
      )}

      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-white flex items-center gap-2">
            <Users className="h-5 w-5 text-emerald-500" />
            Directorio de Clientes Frecuentes
          </h1>
          <p className="text-xs text-zinc-500">
            Visualiza a las personas que han interactuado con tu negocio. Revisa su facturación acumulada, agrega notas internas o interviene pausando el bot.
          </p>
        </div>
      </div>

      {/* Tabla de Clientes */}
      <div className="border border-zinc-800 bg-zinc-950/20 rounded-2xl overflow-hidden shadow-sm">
        <div className="p-4 border-b border-zinc-800 bg-zinc-950/40 flex items-center justify-between">
          <span className="text-xs font-bold uppercase tracking-wider text-zinc-400">Listado de Clientes</span>
          <span className="text-[10px] text-zinc-500">Filtro automático por facturación histórica descendente.</span>
        </div>

        <div className="overflow-x-auto">
          {isLoading ? (
            <div className="text-center py-20 text-xs text-zinc-500">Cargando directorio de clientes...</div>
          ) : customers.length === 0 ? (
            <div className="text-center py-20 text-xs text-zinc-650">No hay clientes registrados aún.</div>
          ) : (
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-zinc-800 text-[10px] uppercase tracking-wider text-zinc-500 bg-zinc-950/40 font-semibold">
                  <th className="px-6 py-4">Nombre / Alias</th>
                  <th className="px-6 py-4">Teléfono WhatsApp</th>
                  <th className="px-6 py-4 text-center">Última Actividad</th>
                  <th className="px-6 py-4 text-center">Órdenes</th>
                  <th className="px-6 py-4 text-center">Total Gastado</th>
                  <th className="px-6 py-4 text-center">Estado de IA</th>
                  <th className="px-6 py-4 text-right">Acciones</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-900/40 text-xs">
                {customers.map((c) => (
                  <tr key={c.id} className="hover:bg-zinc-900/10 transition-colors group">
                    
                    {/* 1. Nombre y Notas */}
                    <td className="px-6 py-4 text-white">
                      <div className="flex items-center gap-2 font-bold">
                        <div className="h-7 w-7 rounded-full bg-emerald-500/10 text-emerald-400 flex items-center justify-center font-bold text-xs uppercase">
                          {c.name.substring(0, 2)}
                        </div>
                        <span>{c.name}</span>
                      </div>
                      {c.notes && (
                        <div className="text-[10px] text-zinc-500 italic mt-1 max-w-[220px] truncate" title={c.notes}>
                          📝 {c.notes}
                        </div>
                      )}
                    </td>

                    {/* 2. Teléfono */}
                    <td className="px-6 py-4 font-mono text-zinc-300">
                      <div className="flex items-center gap-1.5 text-zinc-400">
                        <Phone className="h-3 w-3 text-zinc-500" />
                        <span>{c.phone}</span>
                      </div>
                    </td>

                    {/* 3. Última Interacción */}
                    <td className="px-6 py-4 text-center text-zinc-400 font-mono">
                      {c.lastInteraction}
                    </td>

                    {/* 4. Órdenes */}
                    <td className="px-6 py-4 text-center font-bold text-zinc-200">
                      {c.totalOrders}
                    </td>

                    {/* 5. Total Gastado */}
                    <td className="px-6 py-4 text-center">
                      <span className="inline-flex items-center gap-1 text-emerald-400 font-bold bg-emerald-500/5 px-2 py-0.5 rounded border border-emerald-500/10 font-mono">
                        <ShoppingCart className="h-3 w-3" />
                        ${c.totalSpent.toFixed(2)}
                      </span>
                    </td>

                    {/* 6. Estado de IA */}
                    <td className="px-6 py-4 text-center">
                      <button
                        onClick={() => toggleBotStatus(c.id, c.status)}
                        disabled={togglingId === c.id}
                        className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-bold border transition-colors cursor-pointer ${
                          c.status === 'bot_handling'
                            ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400 hover:bg-emerald-500/20'
                            : 'bg-red-500/10 border-red-500/20 text-red-400 animate-pulse hover:bg-red-500/20'
                        }`}
                        title="Pausar o reactivar respuestas del bot."
                      >
                        {c.status === 'bot_handling' ? (
                          <>
                            <Bot className="h-3.5 w-3.5" />
                            <span>Bot Activo</span>
                          </>
                        ) : (
                          <>
                            <ShieldAlert className="h-3.5 w-3.5" />
                            <span>Humano Requerido</span>
                          </>
                        )}
                      </button>
                    </td>

                    {/* 7. Acciones */}
                    <td className="px-6 py-4 text-right space-x-2">
                      <button
                        onClick={() => handleEditClick(c)}
                        className="inline-flex items-center gap-1 rounded-lg border border-zinc-800 text-zinc-400 hover:text-white bg-zinc-900/60 hover:bg-zinc-800 px-2 py-1.5 text-[11px] font-bold transition-all cursor-pointer"
                      >
                        ✏️ Notas / Alias
                      </button>
                      <Link
                        href={`/dashboard/${businessId}/chat`}
                        className="inline-flex items-center gap-1 rounded-lg border border-zinc-800 text-zinc-300 hover:text-white bg-zinc-900 hover:bg-zinc-850 px-2.5 py-1.5 text-[11px] font-bold transition-all"
                      >
                        <MessageSquare className="h-3.5 w-3.5 text-zinc-500" />
                        <span>Abrir Chat</span>
                      </Link>
                    </td>

                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>

      {/* Modal para Editar Notas y Alias */}
      {editingCustomer && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-zinc-950 border border-zinc-900 rounded-2xl p-6 max-w-md w-full space-y-4 text-white">
            <div className="flex items-center justify-between border-b border-zinc-900 pb-3">
              <h3 className="text-sm font-bold text-white uppercase tracking-wider">Notas y Alias del Cliente</h3>
              <button 
                onClick={() => setEditingCustomer(null)}
                className="text-zinc-500 hover:text-white cursor-pointer"
              >
                ✕
              </button>
            </div>
            
            <div className="space-y-3">
              <div>
                <label className="block text-[10px] text-zinc-500 uppercase font-bold tracking-wider">Alias / Nombre Personalizado</label>
                <input
                  type="text"
                  value={newName}
                  onChange={(e) => setNewName(e.target.value)}
                  placeholder="Ej: Juan de Palermo"
                  className="mt-1.5 block w-full rounded-lg border border-zinc-800 bg-zinc-900 px-3 py-2 text-xs text-white placeholder-zinc-650 focus:border-purple-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-[10px] text-zinc-550 uppercase font-bold tracking-wider">Notas Internas de CRM</label>
                <textarea
                  value={newNotes}
                  onChange={(e) => setNewNotes(e.target.value)}
                  placeholder="Ej: Prefiere delivery rápido. Alérgico a la cebolla."
                  rows={4}
                  className="mt-1.5 block w-full rounded-lg border border-zinc-800 bg-zinc-900 px-3 py-2 text-xs text-white placeholder-zinc-650 focus:border-purple-500 focus:outline-none resize-none"
                />
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <button
                onClick={() => setEditingCustomer(null)}
                className="rounded-lg border border-zinc-800 px-4 py-2 text-xs font-semibold hover:bg-zinc-900 transition-colors cursor-pointer"
              >
                Cancelar
              </button>
              <button
                onClick={handleSaveEdit}
                disabled={isSaving}
                className="rounded-lg bg-purple-600 px-4 py-2 text-xs font-bold text-white hover:bg-purple-500 transition-colors disabled:opacity-50 cursor-pointer"
              >
                {isSaving ? 'Guardando...' : 'Guardar Anotación'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

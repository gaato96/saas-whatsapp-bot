'use client'

import React, { useState, useEffect, use } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Calendar as CalendarIcon, Clock, User, ChevronLeft, ChevronRight, AlertCircle, PlusCircle, UserCheck } from 'lucide-react'

interface Booking {
  id: string
  customer_name: string
  customer_phone: string
  time: string
  date: string // YYYY-MM-DD
  service: string
  specialist?: string
  status: 'pending_payment' | 'confirmed' | 'completed' | 'cancelled'
  price: number
}

interface AgendaPageProps {
  params: Promise<{ businessId: string }>
}

export default function AgendaPage({ params }: AgendaPageProps) {
  const { businessId } = use(params)
  const supabase = createClient()

  const [isLoading, setIsLoading] = useState(true)
  const [dbConnected, setDbConnected] = useState(true)
  
  // Calendario y fechas
  const [currentDate, setCurrentDate] = useState(new Date())
  const [selectedDate, setSelectedDate] = useState<Date>(new Date())
  
  // Reservas/Turnos
  const [bookings, setBookings] = useState<Booking[]>([])
  
  // Modal para agregar turno rápido
  const [showAddModal, setShowAddModal] = useState(false)
  const [newClientName, setNewClientName] = useState('')
  const [newClientPhone, setNewClientPhone] = useState('')
  const [newTime, setNewTime] = useState('12:00')
  const [newService, setNewService] = useState('')
  const [newSpecialist, setNewSpecialist] = useState('')
  const [newPrice, setNewPrice] = useState('')

  // Obtener turnos
  useEffect(() => {
    const fetchBookings = async () => {
      setIsLoading(true)
      try {
        // Obtenemos los registros de la tabla orders_bookings
        // En un esquema real, filtramos o parseamos los bookings
        const { data, error } = await supabase
          .from('orders_bookings')
          .select('*')
          .eq('business_id', businessId)

        if (error) throw error

        // Mapear los pedidos de la base de datos a objetos de agenda
        const mappedBookings: Booking[] = (data || []).map((order: any) => {
          // Intentar decodificar los ítems
          const items = Array.isArray(order.items) ? order.items : []
          const firstItem = items[0] || {}
          
          // Asumir que la fecha de la cita es la fecha de creación para esta demo,
          // o buscar en campos adicionales
          const orderDate = new Date(order.created_at)
          const dateStr = orderDate.toISOString().split('T')[0]
          const timeStr = orderDate.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })

          return {
            id: order.id,
            customer_name: order.customer_name || `Cliente (${order.customer_phone.substring(0, 8)}...)`,
            customer_phone: order.customer_phone,
            date: dateStr,
            time: timeStr,
            service: firstItem.name || 'Consulta General',
            specialist: firstItem.specialist || undefined,
            status: order.status,
            price: Number(order.total)
          }
        })

        setBookings(mappedBookings)
      } catch (err: any) {
        console.warn("Fallo cargando citas de Supabase. Cargando datos demo.", err)
        setDbConnected(false)
        
        // Cargar citas demo interesantes
        const todayStr = new Date().toISOString().split('T')[0]
        
        const yesterday = new Date()
        yesterday.setDate(yesterday.getDate() - 1)
        const yesterdayStr = yesterday.toISOString().split('T')[0]

        const tomorrow = new Date()
        tomorrow.setDate(tomorrow.getDate() + 1)
        const tomorrowStr = tomorrow.toISOString().split('T')[0]

        setBookings([
          {
            id: 'b1',
            customer_name: 'Juan Pérez',
            customer_phone: '+54 9 11 3829-3849',
            date: todayStr,
            time: '10:00',
            service: 'Corte Clásico & Afeitado',
            specialist: 'Carlos Ortiz (Barbero)',
            status: 'confirmed',
            price: 1800
          },
          {
            id: 'b2',
            customer_name: 'María Gómez',
            customer_phone: '+54 9 11 4982-1209',
            date: todayStr,
            time: '14:30',
            service: 'Tintura Completa & Lavado',
            specialist: 'Sofía Gómez (Colorista)',
            status: 'confirmed',
            price: 4500
          },
          {
            id: 'b3',
            customer_name: 'Esteban Quinteros',
            customer_phone: '+54 9 11 5012-3294',
            date: todayStr,
            time: '17:00',
            service: 'Tratamiento Capilar Keratina',
            specialist: 'Carlos Ortiz (Barbero)',
            status: 'pending_payment',
            price: 3200
          },
          {
            id: 'b4',
            customer_name: 'Clara Domínguez',
            customer_phone: '+54 9 11 2093-8392',
            date: tomorrowStr,
            time: '09:00',
            service: 'Corte de Puntas & Peinado',
            specialist: 'Sofía Gómez (Colorista)',
            status: 'confirmed',
            price: 2500
          },
          {
            id: 'b5',
            customer_name: 'Pedro Díaz',
            customer_phone: '+54 9 11 9832-7483',
            date: yesterdayStr,
            time: '16:00',
            service: 'Corte de Barba Express',
            specialist: 'Carlos Ortiz (Barbero)',
            status: 'completed',
            price: 1000
          }
        ])
      } finally {
        setIsLoading(false)
      }
    }

    fetchBookings()
  }, [businessId, supabase])

  // Lógica del Calendario
  const year = currentDate.getFullYear()
  const month = currentDate.getMonth()

  const firstDayOfMonth = new Date(year, month, 1).getDay()
  const daysInMonth = new Date(year, month + 1, 0).getDate()

  const monthNames = [
    'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
    'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'
  ]

  const prevMonth = () => {
    setCurrentDate(new Date(year, month - 1, 1))
  }

  const nextMonth = () => {
    setCurrentDate(new Date(year, month + 1, 1))
  }

  const handleDayClick = (day: number) => {
    setSelectedDate(new Date(year, month, day))
  }

  const getBookingsForDate = (dateStr: string) => {
    return bookings.filter(b => b.date === dateStr)
  }

  const selectedDateStr = selectedDate.toISOString().split('T')[0]
  const selectedDayBookings = getBookingsForDate(selectedDateStr)

  // Crear reserva manual rápida
  const handleAddBooking = (e: React.FormEvent) => {
    e.preventDefault()
    if (!newClientName || !newService) return

    const newBooking: Booking = {
      id: `booking-mock-${Math.floor(Math.random() * 1000)}`,
      customer_name: newClientName,
      customer_phone: newClientPhone || '+54 9 11 0000-0000',
      date: selectedDateStr,
      time: newTime,
      service: newService,
      specialist: newSpecialist || undefined,
      status: 'confirmed',
      price: newPrice ? Number(newPrice) : 0
    }

    setBookings(prev => [...prev, newBooking])
    
    // Limpiar form
    setNewClientName('')
    setNewClientPhone('')
    setNewTime('12:00')
    setNewService('')
    setNewSpecialist('')
    setNewPrice('')
    setShowAddModal(false)
  }

  return (
    <div className="space-y-6">
      {/* Alerta demo */}
      {!dbConnected && (
        <div className="p-3 bg-zinc-900/60 border border-zinc-800 text-zinc-400 rounded-xl text-xs flex items-center gap-2">
          <AlertCircle className="h-4 w-4 text-emerald-500" />
          <span><strong>Calendario Demo Activo:</strong> Puedes simular la carga y reserva de turnos en tiempo real.</span>
        </div>
      )}

      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-white flex items-center gap-2">
            <CalendarIcon className="h-5 w-5 text-emerald-500" />
            Agenda y Reserva de Turnos
          </h1>
          <p className="text-xs text-zinc-500">
            Monitorea los turnos que agenda el bot de WhatsApp o añade citas de forma manual en el calendario interactivo.
          </p>
        </div>
        <button
          onClick={() => setShowAddModal(true)}
          className="rounded-xl bg-emerald-600 px-4 py-2.5 text-xs font-bold text-white hover:bg-emerald-500 transition-all shadow-lg shadow-emerald-600/10 flex items-center gap-2"
        >
          <PlusCircle className="h-4 w-4" />
          <span>Agendar Turno Manual</span>
        </button>
      </div>

      {isLoading ? (
        <div className="flex items-center justify-center py-20 text-xs text-zinc-500">
          Cargando agenda de turnos...
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          
          {/* PANEL DEL CALENDARIO */}
          <div className="lg:col-span-2 bg-zinc-950/20 border border-zinc-800 rounded-2xl p-6 space-y-4">
            
            {/* Control del Mes */}
            <div className="flex items-center justify-between">
              <h2 className="text-sm font-bold text-white uppercase tracking-wider">
                {monthNames[month]} {year}
              </h2>
              <div className="flex items-center gap-1">
                <button
                  onClick={prevMonth}
                  className="p-1.5 rounded-lg border border-zinc-850 hover:bg-zinc-800 text-zinc-400 hover:text-white transition-colors"
                >
                  <ChevronLeft className="h-4 w-4" />
                </button>
                <button
                  onClick={nextMonth}
                  className="p-1.5 rounded-lg border border-zinc-850 hover:bg-zinc-800 text-zinc-400 hover:text-white transition-colors"
                >
                  <ChevronRight className="h-4 w-4" />
                </button>
              </div>
            </div>

            {/* Cuadrícula de Días */}
            <div>
              {/* Días de la semana */}
              <div className="grid grid-cols-7 gap-1 text-center text-[10px] font-bold text-zinc-500 uppercase tracking-widest pb-2">
                <span>Dom</span>
                <span>Lun</span>
                <span>Mar</span>
                <span>Mie</span>
                <span>Jue</span>
                <span>Vie</span>
                <span>Sab</span>
              </div>

              {/* Días del mes */}
              <div className="grid grid-cols-7 gap-1.5">
                {/* Espacios vacíos antes del día 1 */}
                {Array.from({ length: firstDayOfMonth }).map((_, idx) => (
                  <div key={`empty-${idx}`} className="h-16" />
                ))}

                {/* Días calendario */}
                {Array.from({ length: daysInMonth }).map((_, idx) => {
                  const dayNum = idx + 1
                  const thisDate = new Date(year, month, dayNum)
                  const thisDateStr = thisDate.toISOString().split('T')[0]
                  const hasAppointments = getBookingsForDate(thisDateStr).length > 0
                  const isSelected = selectedDate.getDate() === dayNum && selectedDate.getMonth() === month && selectedDate.getFullYear() === year
                  const isToday = new Date().getDate() === dayNum && new Date().getMonth() === month && new Date().getFullYear() === year

                  return (
                    <button
                      key={`day-${dayNum}`}
                      onClick={() => handleDayClick(dayNum)}
                      className={`h-16 rounded-xl border flex flex-col justify-between p-2 text-left transition-all relative group ${
                        isSelected
                          ? 'border-emerald-500 bg-emerald-500/10 text-white'
                          : isToday
                          ? 'border-zinc-700 bg-zinc-850/50 text-zinc-200'
                          : 'border-zinc-850 hover:border-zinc-700 hover:bg-zinc-900/20 text-zinc-400'
                      }`}
                    >
                      <span className={`text-xs font-bold ${isSelected ? 'text-emerald-400' : ''}`}>
                        {dayNum}
                      </span>
                      {hasAppointments && (
                        <div className="flex items-center gap-1">
                          <span className={`h-1.5 w-1.5 rounded-full ${isSelected ? 'bg-emerald-400' : 'bg-emerald-500 animate-pulse'}`} />
                          <span className="text-[8px] text-zinc-500 font-mono hidden md:inline">
                            {getBookingsForDate(thisDateStr).length} turnos
                          </span>
                        </div>
                      )}
                    </button>
                  )
                })}
              </div>
            </div>

          </div>

          {/* DETALLES DEL DÍA SELECCIONADO */}
          <div className="bg-zinc-950/20 border border-zinc-800 rounded-2xl p-6 flex flex-col justify-between space-y-4">
            <div>
              <div className="border-b border-zinc-850 pb-3 flex items-center justify-between">
                <div>
                  <span className="text-[10px] uppercase font-bold tracking-wider text-emerald-400">Detalle de Turnos</span>
                  <h2 className="text-xs font-bold text-white uppercase tracking-wider">
                    {selectedDate.toLocaleDateString('es-ES', { weekday: 'long', day: 'numeric', month: 'long' })}
                  </h2>
                </div>
                <span className="text-xs font-mono font-bold bg-zinc-850 px-2 py-0.5 rounded text-zinc-400">
                  {selectedDayBookings.length} Reservas
                </span>
              </div>

              {/* Lista de Turnos */}
              <div className="mt-4 space-y-3 max-h-[360px] overflow-y-auto pr-1">
                {selectedDayBookings.length === 0 ? (
                  <div className="text-center py-16 text-xs text-zinc-500 space-y-2">
                    <CalendarIcon className="h-8 w-8 text-zinc-700 mx-auto" />
                    <p>No hay citas registradas para este día.</p>
                  </div>
                ) : (
                  selectedDayBookings.map((b) => (
                    <div
                      key={b.id}
                      className={`p-3.5 border rounded-xl flex flex-col gap-2 transition-all ${
                        b.status === 'confirmed'
                          ? 'border-emerald-900/30 bg-emerald-950/5'
                          : b.status === 'pending_payment'
                          ? 'border-yellow-900/30 bg-yellow-950/5'
                          : 'border-zinc-850 bg-zinc-900/20'
                      }`}
                    >
                      <div className="flex items-start justify-between">
                        <div>
                          <span className="text-xs font-bold text-white flex items-center gap-1.5">
                            <Clock className="h-3.5 w-3.5 text-zinc-500" />
                            {b.time} hs
                          </span>
                          <span className="text-[11px] font-bold text-zinc-300 block mt-1">{b.service}</span>
                          {b.specialist && (
                            <span className="text-[9px] text-zinc-500 block">Atiende: {b.specialist}</span>
                          )}
                        </div>
                        <span
                          className={`text-[9px] font-bold px-1.5 py-0.5 rounded border ${
                            b.status === 'confirmed'
                              ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400'
                              : b.status === 'pending_payment'
                              ? 'bg-yellow-500/10 border-yellow-500/20 text-yellow-400'
                              : b.status === 'completed'
                              ? 'bg-blue-500/10 border-blue-500/20 text-blue-400'
                              : 'bg-zinc-800 border-zinc-700 text-zinc-500'
                          }`}
                        >
                          {b.status === 'confirmed'
                            ? 'Confirmado'
                            : b.status === 'pending_payment'
                            ? 'Falta Pago'
                            : b.status === 'completed'
                            ? 'Completado'
                            : 'Cancelado'}
                        </span>
                      </div>

                      <div className="flex items-center justify-between border-t border-zinc-850/50 pt-2 text-[10px] text-zinc-400">
                        <span className="flex items-center gap-1">
                          <User className="h-3 w-3 text-zinc-500" />
                          {b.customer_name}
                        </span>
                        <span className="font-mono text-zinc-500">{b.customer_phone}</span>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>

            <div className="pt-2 border-t border-zinc-850">
              <span className="text-[9px] text-zinc-500 block text-center leading-relaxed">
                El bot de IA utiliza la agenda para bloquear turnos ya existentes y recomendar horarios libres a los clientes.
              </span>
            </div>
          </div>

        </div>
      )}

      {/* MODAL PARA AGENDAR TURNO MANUAL */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <div className="w-full max-w-md bg-zinc-900 border border-zinc-800 rounded-2xl p-6 space-y-4 shadow-xl">
            <div className="flex items-center justify-between border-b border-zinc-800 pb-2">
              <h3 className="text-xs font-bold uppercase tracking-wider text-white">Agendar Cita / Reserva</h3>
              <button
                onClick={() => setShowAddModal(false)}
                className="text-zinc-500 hover:text-white text-xs font-bold"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleAddBooking} className="space-y-4 text-xs">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[10px] text-zinc-500 uppercase font-bold tracking-wider">Cliente Name</label>
                  <input
                    type="text"
                    required
                    className="mt-1 block w-full rounded-lg border border-zinc-800 bg-zinc-950 px-2.5 py-2 text-white focus:border-emerald-500 focus:outline-none"
                    placeholder="Ej: Marcelo Ramos"
                    value={newClientName}
                    onChange={(e) => setNewClientName(e.target.value)}
                  />
                </div>
                <div>
                  <label className="block text-[10px] text-zinc-500 uppercase font-bold tracking-wider">Teléfono</label>
                  <input
                    type="text"
                    className="mt-1 block w-full rounded-lg border border-zinc-800 bg-zinc-950 px-2.5 py-2 text-white focus:border-emerald-500 focus:outline-none"
                    placeholder="Ej: +54 9 11 3290-2810"
                    value={newClientPhone}
                    onChange={(e) => setNewClientPhone(e.target.value)}
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[10px] text-zinc-500 uppercase font-bold tracking-wider">Hora</label>
                  <input
                    type="time"
                    required
                    className="mt-1 block w-full rounded-lg border border-zinc-800 bg-zinc-950 px-2.5 py-2 text-white focus:border-emerald-500 focus:outline-none"
                    value={newTime}
                    onChange={(e) => setNewTime(e.target.value)}
                  />
                </div>
                <div>
                  <label className="block text-[10px] text-zinc-500 uppercase font-bold tracking-wider">Precio ($)</label>
                  <input
                    type="number"
                    className="mt-1 block w-full rounded-lg border border-zinc-800 bg-zinc-950 px-2.5 py-2 text-white focus:border-emerald-500 focus:outline-none"
                    placeholder="Ej: 1800"
                    value={newPrice}
                    onChange={(e) => setNewPrice(e.target.value)}
                  />
                </div>
              </div>

              <div>
                <label className="block text-[10px] text-zinc-500 uppercase font-bold tracking-wider">Servicio / Motivo</label>
                <input
                  type="text"
                  required
                  className="mt-1 block w-full rounded-lg border border-zinc-800 bg-zinc-950 px-2.5 py-2 text-white focus:border-emerald-500 focus:outline-none"
                  placeholder="Ej: Corte de Pelo y Lavado"
                  value={newService}
                  onChange={(e) => setNewService(e.target.value)}
                />
              </div>

              <div>
                <label className="block text-[10px] text-zinc-500 uppercase font-bold tracking-wider">Especialista / Profesional</label>
                <input
                  type="text"
                  className="mt-1 block w-full rounded-lg border border-zinc-800 bg-zinc-950 px-2.5 py-2 text-white focus:border-emerald-500 focus:outline-none"
                  placeholder="Ej: Carlos Ortiz"
                  value={newSpecialist}
                  onChange={(e) => setNewSpecialist(e.target.value)}
                />
              </div>

              <div className="flex justify-end pt-2 border-t border-zinc-800">
                <button
                  type="submit"
                  className="rounded-xl bg-white text-black px-4 py-2 font-bold hover:bg-zinc-200 transition-colors"
                >
                  Agendar Turno
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  )
}

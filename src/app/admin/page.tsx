import React from 'react'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'

// Datos demo para pre-visualizar el panel si la base de datos no está poblada o en demo mode
const DEMO_BUSINESSES = [
  {
    id: 'demo-restaurante-id',
    name: 'Pizzería Napolitana Bella',
    rubro: 'Comida',
    whatsapp_config: { phone_number_id: '109283748293' },
    created_at: '2026-06-15T10:00:00Z',
    subscription_price: 150.00,
    expiration_date: new Date(Date.now() + 15 * 24 * 60 * 60 * 1000).toISOString(), // Activo
  },
  {
    id: 'demo-peluqueria-id',
    name: 'Barbería y Estética Royal',
    rubro: 'Peluquería',
    whatsapp_config: { phone_number_id: '209384729384' },
    created_at: '2026-06-16T14:30:00Z',
    subscription_price: 120.00,
    expiration_date: new Date(Date.now() + 20 * 24 * 60 * 60 * 1000).toISOString(), // Activo
  },
  {
    id: 'demo-ecommerce-id',
    name: 'TechStore - Accesorios',
    rubro: 'E-commerce',
    whatsapp_config: { phone_number_id: '304982738495' },
    created_at: '2026-06-17T09:15:00Z',
    subscription_price: 250.00,
    expiration_date: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString(), // Vencido
  },
]

export default async function AdminDashboard() {
  let businesses = []
  let dbConnected = true
  let errorMsg = ''
  
  // Métricas del SaaS
  let activeTenants = 0
  let expiredTenants = 0
  let totalMRR = 0
  let arpu = 0
  let churnRate = 0

  try {
    const supabase = await createClient()
    
    // 1. Obtener negocios con datos de suscripción
    const { data, error } = await supabase
      .from('businesses')
      .select('id, name, rubro, whatsapp_config, created_at, subscription_price, expiration_date, enabled_modules')
      .order('created_at', { ascending: false })

    if (error) throw error
    businesses = data || []
  } catch (err: any) {
    dbConnected = false
    errorMsg = err.message
    businesses = DEMO_BUSINESSES // Usar demo en caso de no tener configurado Supabase aún
  }

  // Calcular métricas del SaaS
  const now = new Date()
  businesses.forEach((biz: any) => {
    const expDate = biz.expiration_date ? new Date(biz.expiration_date) : null
    const isActive = expDate ? expDate > now : false
    const price = Number(biz.subscription_price) || 0

    if (isActive) {
      activeTenants++
      totalMRR += price
    } else {
      expiredTenants++
    }
  })

  const totalTenants = businesses.length
  if (activeTenants > 0) {
    arpu = parseFloat((totalMRR / activeTenants).toFixed(2))
  }
  if (totalTenants > 0) {
    churnRate = parseFloat(((expiredTenants / totalTenants) * 100).toFixed(1))
  }

  return (
    <div className="space-y-6">
      {/* Notificación de Estado de Base de Datos */}
      {!dbConnected && (
        <div className="p-4 bg-amber-500/10 border border-amber-500/20 rounded-xl text-xs text-amber-400">
          ⚠️ <strong>Modo Demostración Activo:</strong> No se pudo conectar a la base de datos de Supabase ({errorMsg}). 
          Se están mostrando datos de prueba. Asegúrate de ejecutar el script <code className="bg-zinc-900 px-1 py-0.5 rounded text-white">supabase_update_schema.sql</code> en tu panel de Supabase y configurar las variables de entorno.
        </div>
      )}

      {/* Título de Sección */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-white">Gestión de Negocios (Tenants)</h1>
          <p className="text-xs text-zinc-500">Supervisa las métricas comerciales y las suscripciones de tu SaaS.</p>
        </div>
        <Link
          href="/admin/business/new"
          className="rounded-xl bg-purple-600 px-4 py-2.5 text-xs font-bold text-white hover:bg-purple-500 transition-all shadow-lg shadow-purple-600/20"
        >
          + Crear Nuevo Negocio
        </Link>
      </div>

      {/* KPI Cards Grid - SaaS Metrics */}
      <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
        <div className="border border-zinc-900 bg-zinc-950 p-5 rounded-xl space-y-2">
          <span className="text-[10px] uppercase font-bold tracking-wider text-zinc-500">Suscripciones Activas</span>
          <p className="text-2xl font-black text-white">{activeTenants} <span className="text-xs text-zinc-500 font-normal">/ {totalTenants}</span></p>
          <div className="w-full bg-zinc-900 h-1.5 rounded-full overflow-hidden">
            <div 
              className="bg-emerald-500 h-full rounded-full" 
              style={{ width: `${totalTenants > 0 ? (activeTenants / totalTenants) * 100 : 0}%` }}
            />
          </div>
          <span className="text-[10px] text-zinc-500 block">Negocios vigentes</span>
        </div>
        <div className="border border-zinc-900 bg-zinc-950 p-5 rounded-xl space-y-2">
          <span className="text-[10px] uppercase font-bold tracking-wider text-zinc-500">MRR Proyectado</span>
          <p className="text-2xl font-black text-purple-400">
            ${totalMRR.toLocaleString('es-ES', { minimumFractionDigits: 2 })}
          </p>
          <span className="text-[10px] text-zinc-500">Ingresos mensuales de activos</span>
        </div>
        <div className="border border-zinc-900 bg-zinc-950 p-5 rounded-xl space-y-2">
          <span className="text-[10px] uppercase font-bold tracking-wider text-zinc-500">ARPU (Ticket Promedio)</span>
          <p className="text-2xl font-black text-blue-400">
            ${arpu.toLocaleString('es-ES', { minimumFractionDigits: 2 })}
          </p>
          <span className="text-[10px] text-zinc-500">Precio promedio de activos</span>
        </div>
        <div className="border border-zinc-900 bg-zinc-950 p-5 rounded-xl space-y-2">
          <span className="text-[10px] uppercase font-bold tracking-wider text-zinc-500">Tasa de Expiración</span>
          <p className="text-2xl font-black text-red-400">{churnRate}%</p>
          <span className="text-[10px] text-zinc-500">Porcentaje de negocios suspendidos</span>
        </div>
      </div>

      {/* Tabla de Negocios */}
      <div className="border border-zinc-900 bg-zinc-950 rounded-xl overflow-hidden">
        <div className="p-4 border-b border-zinc-900 bg-zinc-950/60">
          <h2 className="text-xs font-bold uppercase tracking-wider text-zinc-400">Listado de Tenants</h2>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-zinc-900 text-[10px] uppercase tracking-wider text-zinc-500 bg-zinc-950">
                <th className="px-6 py-3 font-semibold">Nombre del Negocio</th>
                <th className="px-6 py-3 font-semibold">Rubro</th>
                <th className="px-6 py-3 font-semibold">Suscripción Mensual</th>
                <th className="px-6 py-3 font-semibold">Fecha Vencimiento</th>
                <th className="px-6 py-3 font-semibold">Estado</th>
                <th className="px-6 py-3 text-right font-semibold">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-900/40 text-xs">
              {businesses.map((biz) => {
                const expDate = biz.expiration_date ? new Date(biz.expiration_date) : null
                const isActive = expDate ? expDate > now : false

                return (
                  <tr key={biz.id} className="hover:bg-zinc-900/20 transition-colors">
                    <td className="px-6 py-4">
                      <div className="font-bold text-white">{biz.name}</div>
                      <div className="text-[9px] text-zinc-500 font-mono">{biz.id}</div>
                    </td>
                    <td className="px-6 py-4">
                      <span className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-medium bg-zinc-900 text-zinc-300 border border-zinc-800">
                        {biz.rubro}
                      </span>
                    </td>
                    <td className="px-6 py-4 font-bold text-emerald-400 font-mono">
                      ${Number(biz.subscription_price || 0).toLocaleString('es-ES', { minimumFractionDigits: 2 })}
                    </td>
                    <td className="px-6 py-4 font-mono text-zinc-400">
                      {expDate ? expDate.toLocaleDateString() : 'Sin definir'}
                    </td>
                    <td className="px-6 py-4">
                      {isActive ? (
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/10 border border-emerald-500/20 text-emerald-400">
                          Activo
                        </span>
                      ) : (
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-red-500/10 border border-red-500/20 text-red-400">
                          Vencido
                        </span>
                      )}
                    </td>
                    <td className="px-6 py-4 text-right space-x-2">
                      <Link
                        href={`/dashboard/${biz.id}`}
                        className="inline-block rounded bg-zinc-900 border border-zinc-800 px-2.5 py-1 text-[11px] font-bold text-zinc-300 hover:text-white hover:bg-zinc-800 transition-all"
                      >
                        👁️ Ver Panel
                      </Link>
                      <Link
                        href={`/admin/business/edit/${biz.id}`}
                        className="inline-block rounded bg-purple-500/10 border border-purple-500/20 px-2.5 py-1 text-[11px] font-bold text-purple-400 hover:text-white hover:bg-purple-650 transition-all"
                      >
                        ✏️ Configurar
                      </Link>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}

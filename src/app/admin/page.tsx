import React from 'react'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'

// Datos demo para pre-visualizar el panel si la base de datos no está poblada
const DEMO_BUSINESSES = [
  {
    id: 'demo-restaurante-id',
    name: 'Pizzería Napolitana Bella',
    rubro: 'Comida',
    whatsapp_config: { phone_number_id: '109283748293' },
    created_at: '2026-06-15T10:00:00Z',
  },
  {
    id: 'demo-peluqueria-id',
    name: 'Barbería y Estética Royal',
    rubro: 'Peluquería',
    whatsapp_config: { phone_number_id: '209384729384' },
    created_at: '2026-06-16T14:30:00Z',
  },
  {
    id: 'demo-ecommerce-id',
    name: 'TechStore - Accesorios',
    rubro: 'E-commerce',
    whatsapp_config: { phone_number_id: '304982738495' },
    created_at: '2026-06-17T09:15:00Z',
  },
]

export default async function AdminDashboard() {
  let businesses = []
  let dbConnected = true
  let errorMsg = ''

  try {
    const supabase = await createClient()
    const { data, error } = await supabase
      .from('businesses')
      .select('id, name, rubro, whatsapp_config, created_at')
      .order('created_at', { ascending: false })

    if (error) throw error
    businesses = data || []
  } catch (err: any) {
    dbConnected = false
    errorMsg = err.message
    businesses = DEMO_BUSINESSES // Usar demo en caso de no tener configurado Supabase aún
  }

  return (
    <div className="space-y-6">
      {/* Notificación de Estado de Base de Datos */}
      {!dbConnected && (
        <div className="p-4 bg-amber-500/10 border border-amber-500/20 rounded-xl text-xs text-amber-400">
          ⚠️ <strong>Modo Demostración Activo:</strong> No se pudo conectar a la base de datos de Supabase ({errorMsg}). 
          Se están mostrando datos de prueba. Asegúrate de ejecutar el script <code className="bg-zinc-900 px-1 py-0.5 rounded text-white">supabase_schema.sql</code> en tu panel de Supabase y configurar las variables de entorno.
        </div>
      )}

      {/* Título de Sección */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-white">Gestión de Negocios (Tenants)</h1>
          <p className="text-xs text-zinc-500">Supervisa y administra las cuentas y webhooks del SaaS.</p>
        </div>
        <Link
          href="/admin/business/new"
          className="rounded-xl bg-purple-600 px-4 py-2.5 text-xs font-bold text-white hover:bg-purple-500 transition-all shadow-lg shadow-purple-600/20"
        >
          + Crear Nuevo Negocio
        </Link>
      </div>

      {/* KPI Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
        <div className="border border-zinc-900 bg-zinc-950 p-5 rounded-xl space-y-2">
          <span className="text-[10px] uppercase font-bold tracking-wider text-zinc-500">Total Negocios</span>
          <p className="text-2xl font-black text-white">{businesses.length}</p>
          <span className="text-[10px] text-zinc-500">Empresas registradas</span>
        </div>
        <div className="border border-zinc-900 bg-zinc-950 p-5 rounded-xl space-y-2">
          <span className="text-[10px] uppercase font-bold tracking-wider text-zinc-500">Mensajes del Mes</span>
          <p className="text-2xl font-black text-purple-400">12,504</p>
          <span className="text-[10px] text-zinc-500">Procesados por Gemini</span>
        </div>
        <div className="border border-zinc-900 bg-zinc-950 p-5 rounded-xl space-y-2">
          <span className="text-[10px] uppercase font-bold tracking-wider text-zinc-500">Tasa de Conversión</span>
          <p className="text-2xl font-black text-emerald-400">84.2%</p>
          <span className="text-[10px] text-zinc-500">Bots cerrando pedidos</span>
        </div>
        <div className="border border-zinc-900 bg-zinc-950 p-5 rounded-xl space-y-2">
          <span className="text-[10px] uppercase font-bold tracking-wider text-zinc-500">Status Servidor</span>
          <p className="text-2xl font-black text-blue-400">99.9%</p>
          <span className="text-[10px] text-zinc-500">Uptime Edge Functions</span>
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
                <th className="px-6 py-3 font-semibold">Phone Number ID (Meta)</th>
                <th className="px-6 py-3 font-semibold">Fecha de Creación</th>
                <th className="px-6 py-3 text-right font-semibold">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-900/40 text-xs">
              {businesses.map((biz) => (
                <tr key={biz.id} className="hover:bg-zinc-900/20 transition-colors">
                  <td className="px-6 py-4 font-bold text-white">{biz.name}</td>
                  <td className="px-6 py-4">
                    <span className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-medium bg-zinc-900 text-zinc-300 border border-zinc-800">
                      {biz.rubro}
                    </span>
                  </td>
                  <td className="px-6 py-4 font-mono text-zinc-400">
                    {biz.whatsapp_config?.phone_number_id || 'No configurado'}
                  </td>
                  <td className="px-6 py-4 text-zinc-500">
                    {new Date(biz.created_at).toLocaleDateString()}
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
                      className="inline-block rounded bg-purple-500/10 border border-purple-500/20 px-2.5 py-1 text-[11px] font-bold text-purple-400 hover:text-white hover:bg-purple-600 transition-all"
                    >
                      ✏️ Configurar
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}

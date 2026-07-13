import React from 'react'
import Link from 'next/link'
import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { LogoutButton } from '@/components/logout-button'

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://placeholder.supabase.co'
  const isDemoMode = !process.env.NEXT_PUBLIC_SUPABASE_URL || 
                     !process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ||
                     url.includes('placeholder') || 
                     url === 'http://localhost:54321'

  if (!isDemoMode) {
    try {
      const supabase = await createClient()
      const { data: { user } } = await supabase.auth.getUser()

      if (!user) {
        redirect('/login')
      }

      const { data: profile } = await supabase
        .from('profiles')
        .select('role')
        .eq('id', user.id)
        .single()

      if (!profile || profile.role !== 'superadmin') {
        redirect('/dashboard')
      }
    } catch (err) {
      console.error("Error validando rol de superadmin en layout:", err)
      redirect('/login')
    }
  }

  return (
    <div className="flex min-h-screen bg-zinc-950 text-zinc-100 font-sans">
      {/* 1. SIDEBAR ADMINISTRATIVO */}
      <aside className="w-64 border-r border-zinc-900 bg-zinc-950 flex flex-col justify-between p-6">
        <div className="space-y-8">
          {/* Logo */}
          <Link href="/" className="flex items-center gap-2">
            <span className="h-7 w-7 rounded-lg bg-gradient-to-tr from-purple-600 to-indigo-600 flex items-center justify-center font-black text-xs text-white">
              A
            </span>
            <span className="font-bold text-sm tracking-tight text-white">
              Superadmin Portal
            </span>
          </Link>

          {/* Menú de Navegación */}
          <nav className="space-y-1">
            <Link
              href="/admin"
              className="flex items-center gap-3 px-3 py-2 text-xs font-semibold rounded-lg bg-zinc-900 text-white hover:bg-zinc-800 transition-colors"
            >
              💼 Gestión de Negocios
            </Link>
            <Link
              href="/admin/business/new"
              className="flex items-center gap-3 px-3 py-2 text-xs font-semibold rounded-lg text-zinc-400 hover:text-white hover:bg-zinc-900 transition-colors"
            >
              ➕ Dar de Alta Negocio
            </Link>
            <div className="pt-4 border-t border-zinc-900/60 mt-4 space-y-1">
              <span className="px-3 text-[10px] uppercase font-bold text-zinc-600 tracking-wider">Métricas</span>
              <div className="px-3 py-2 text-xs text-zinc-500">Webhooks Activos: 24</div>
              <div className="px-3 py-2 text-xs text-zinc-500">Gemini Consultas: 1.4k</div>
            </div>
          </nav>
        </div>

        {/* Perfil / Footer */}
        <div className="pt-4 border-t border-zinc-900 flex items-center justify-between">
          <div className="flex flex-col">
            <span className="text-xs font-bold text-white">Superadmin Demo</span>
            <span className="text-[10px] text-zinc-500">admin@saas.com</span>
          </div>
          <LogoutButton>🚪 Salir</LogoutButton>
        </div>
      </aside>

      {/* 2. ÁREA DE CONTENIDO */}
      <main className="flex-1 flex flex-col min-h-screen">
        <header className="h-16 border-b border-zinc-900 px-8 flex items-center justify-between bg-zinc-950/50">
          <div className="text-xs font-semibold text-zinc-400">
            Fase 1: Configuración de Base de Datos y Estructura
          </div>
          <div className="flex items-center gap-4">
            <span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
            <span className="text-xs font-semibold text-zinc-400">Entorno Conectado</span>
          </div>
        </header>
        <div className="flex-1 p-8 overflow-y-auto">
          {children}
        </div>
      </main>
    </div>
  )
}

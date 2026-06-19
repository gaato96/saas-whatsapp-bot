import React from 'react'
import Link from 'next/link'

export default function Home() {
  return (
    <div className="min-h-screen bg-black text-zinc-100 font-sans selection:bg-zinc-800 relative overflow-hidden flex flex-col justify-between">
      {/* Patrón de Grilla de Fondo */}
      <div className="absolute inset-0 bg-[linear-gradient(to_right,#1f2023_1px,transparent_1px),linear-gradient(to_bottom,#1f2023_1px,transparent_1px)] bg-[size:4rem_4rem] [mask-image:radial-gradient(ellipse_60%_50%_at_50%_0%,#000_70%,transparent_100%)] opacity-30 pointer-events-none" />
      
      {/* Efecto de resplandor superior */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[600px] h-[300px] bg-gradient-to-b from-purple-500/10 to-transparent blur-[120px] pointer-events-none" />

      {/* Header */}
      <header className="relative z-10 max-w-7xl mx-auto w-full px-6 py-6 flex items-center justify-between border-b border-zinc-900">
        <div className="flex items-center gap-2">
          <span className="h-8 w-8 rounded-lg bg-gradient-to-tr from-purple-600 to-indigo-600 flex items-center justify-center font-black text-white shadow-lg shadow-purple-500/20">
            A
          </span>
          <span className="font-bold text-lg tracking-tight bg-gradient-to-r from-white to-zinc-400 bg-clip-text text-transparent">
            Antigravity Chatbot SaaS
          </span>
        </div>

        <nav className="flex items-center gap-4">
          <Link 
            href="/login" 
            className="text-xs font-semibold text-zinc-400 hover:text-white transition-colors"
          >
            Iniciar Sesión
          </Link>
          <Link 
            href="/admin" 
            className="rounded-lg bg-zinc-900 border border-zinc-800 px-3 py-1.5 text-xs font-semibold text-white hover:bg-zinc-800 transition-all"
          >
            Superadmin
          </Link>
        </nav>
      </header>

      {/* Hero Section */}
      <main className="relative z-10 max-w-5xl mx-auto px-6 py-24 text-center space-y-8 flex-1 flex flex-col justify-center items-center">
        <div className="inline-flex items-center gap-2 rounded-full border border-purple-500/20 bg-purple-500/5 px-4 py-1.5 text-xs font-medium text-purple-400">
          <span className="h-1.5 w-1.5 rounded-full bg-purple-400 animate-pulse" />
          Fase 1 Activada: Estructura Multitenant y Gemini 2.5 Flash
        </div>

        <h1 className="text-4xl sm:text-6xl font-extrabold tracking-tight text-white max-w-3xl leading-[1.15]">
          Automatiza tu negocio con{' '}
          <span className="bg-gradient-to-r from-purple-400 via-pink-400 to-indigo-400 bg-clip-text text-transparent">
            Chatbots con IA
          </span>{' '}
          en WhatsApp
        </h1>

        <p className="text-zinc-400 text-sm sm:text-lg max-w-2xl leading-relaxed">
          Plataforma SaaS Multi-tenant adaptativa para 10 rubros de negocio. Conecta el API Cloud de WhatsApp,
          activa el agente Gemini 2.5 Flash con tus reglas operativas, y gestiona pedidos y citas en tiempo real.
        </p>

        <div className="flex flex-col sm:flex-row gap-4 justify-center items-center pt-4">
          <Link
            href="/login"
            className="rounded-xl bg-white text-black px-6 py-3 text-sm font-bold hover:bg-zinc-200 transition-all shadow-lg shadow-white/10 w-full sm:w-auto"
          >
            Comenzar Ahora
          </Link>
          <Link
            href="/admin/business/new"
            className="rounded-xl bg-zinc-900 border border-zinc-800 text-zinc-300 px-6 py-3 text-sm font-bold hover:bg-zinc-800 transition-all w-full sm:w-auto"
          >
            Registrar Negocio Demo
          </Link>
        </div>

        {/* Features Matrix Grid */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 max-w-4xl w-full pt-16">
          <div className="border border-zinc-900 bg-zinc-950/40 p-4 rounded-xl text-left space-y-1">
            <span className="text-xs font-semibold text-purple-400">01. Multi-tenant</span>
            <p className="text-white font-medium text-sm">Aislamiento por business_id</p>
            <p className="text-xs text-zinc-500">RLS nativo en Supabase.</p>
          </div>
          <div className="border border-zinc-900 bg-zinc-950/40 p-4 rounded-xl text-left space-y-1">
            <span className="text-xs font-semibold text-pink-400">02. Meta Webhook</span>
            <p className="text-white font-medium text-sm">Edge Function Central</p>
            <p className="text-xs text-zinc-500">Enrutado inteligente por Phone ID.</p>
          </div>
          <div className="border border-zinc-900 bg-zinc-950/40 p-4 rounded-xl text-left space-y-1">
            <span className="text-xs font-semibold text-indigo-400">03. AI Gemini 2.5</span>
            <p className="text-white font-medium text-sm">Contexto Adaptativo</p>
            <p className="text-xs text-zinc-500">System prompt según rubro.</p>
          </div>
          <div className="border border-zinc-900 bg-zinc-950/40 p-4 rounded-xl text-left space-y-1">
            <span className="text-xs font-semibold text-emerald-400">04. CRM en Realtime</span>
            <p className="text-white font-medium text-sm">Canal Realtime Activo</p>
            <p className="text-xs text-zinc-500">Actualización en vivo de pedidos.</p>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="relative z-10 border-t border-zinc-950 py-6 text-center text-xs text-zinc-600">
        &copy; 2026 Antigravity. Todos los derechos reservados. Desarrollado con Next.js 14+ y Supabase.
      </footer>
    </div>
  )
}

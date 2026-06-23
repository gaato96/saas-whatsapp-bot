import React from 'react'
import Link from 'next/link'
import { MessageSquare, Calendar, ShieldCheck, ArrowRight, Zap, Users, BarChart3, Settings } from 'lucide-react'

export default function Home() {
  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 font-sans selection:bg-indigo-500 selection:text-white relative overflow-hidden flex flex-col justify-between">
      {/* Patrón de Grilla de Fondo */}
      <div className="absolute inset-0 bg-[linear-gradient(to_right,#e2e8f0_1px,transparent_1px),linear-gradient(to_bottom,#e2e8f0_1px,transparent_1px)] bg-[size:4rem_4rem] [mask-image:radial-gradient(ellipse_60%_50%_at_50%_0%,#000_70%,transparent_100%)] opacity-50 pointer-events-none" />
      
      {/* Efecto de resplandor superior */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[600px] h-[300px] bg-gradient-to-b from-indigo-500/10 to-transparent blur-[120px] pointer-events-none" />

      {/* Header */}
      <header className="relative z-10 max-w-7xl mx-auto w-full px-6 py-5 flex items-center justify-between border-b border-slate-200 bg-white/60 backdrop-blur-md">
        <div className="flex items-center gap-2">
          <span className="h-9 w-9 rounded-xl bg-gradient-to-tr from-indigo-650 to-purple-600 flex items-center justify-center font-black text-white shadow-md shadow-indigo-500/10">
            A
          </span>
          <span className="font-bold text-lg tracking-tight bg-gradient-to-r from-slate-900 to-slate-700 bg-clip-text text-transparent">
            Antigravity SaaS
          </span>
        </div>

        <nav className="flex items-center gap-4">
          <Link 
            href="/login" 
            className="rounded-xl bg-indigo-600 px-4 py-2 text-xs font-bold text-white hover:bg-indigo-500 transition-all shadow-md shadow-indigo-500/20 flex items-center gap-1.5"
          >
            <span>Acceder a la Plataforma</span>
            <ArrowRight className="h-3.5 w-3.5" />
          </Link>
        </nav>
      </header>

      {/* Hero Section */}
      <main className="relative z-10 max-w-6xl mx-auto px-6 py-20 text-center space-y-10 flex-1 flex flex-col justify-center items-center">
        <div className="inline-flex items-center gap-2 rounded-full border border-indigo-200 bg-indigo-50/50 px-4 py-1.5 text-xs font-semibold text-indigo-700 shadow-sm">
          <span className="h-2 w-2 rounded-full bg-indigo-600 animate-pulse" />
          Plataforma de IA Conversacional para WhatsApp
        </div>

        <h1 className="text-4xl sm:text-6xl font-black tracking-tight text-slate-900 max-w-4xl leading-[1.12]">
          Automatiza tu negocio y{' '}
          <span className="bg-gradient-to-r from-indigo-600 via-purple-600 to-indigo-700 bg-clip-text text-transparent">
            duplica tus ventas
          </span>{' '}
          en WhatsApp
        </h1>

        <p className="text-slate-600 text-base sm:text-lg max-w-2xl leading-relaxed">
          Nuestra Inteligencia Artificial avanzada atiende a tus clientes las 24 horas del día.
          Configura tu catálogo, gestiona pedidos y agenda citas en piloto automático.
        </p>

        <div className="flex flex-col sm:flex-row gap-4 justify-center items-center pt-2">
          <Link
            href="/login"
            className="rounded-xl bg-slate-900 text-white px-8 py-3.5 text-sm font-bold hover:bg-slate-800 transition-all shadow-lg shadow-slate-900/10 w-full sm:w-auto"
          >
            Comenzar Prueba Gratis
          </Link>
        </div>

        {/* Features Matrix Grid */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 max-w-5xl w-full pt-16">
          <div className="border border-slate-200 bg-white/70 backdrop-blur-md p-5 rounded-2xl text-left space-y-3 shadow-sm hover:shadow-md transition-shadow">
            <div className="h-10 w-10 rounded-xl bg-indigo-50 flex items-center justify-center text-indigo-600">
              <MessageSquare className="h-5 w-5" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-slate-900">Atención 24/7 con IA</h3>
              <p className="text-xs text-slate-500 mt-1">Respuestas instantáneas y humanas basadas en las reglas de tu negocio.</p>
            </div>
          </div>
          <div className="border border-slate-200 bg-white/70 backdrop-blur-md p-5 rounded-2xl text-left space-y-3 shadow-sm hover:shadow-md transition-shadow">
            <div className="h-10 w-10 rounded-xl bg-purple-50 flex items-center justify-center text-purple-600">
              <Zap className="h-5 w-5" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-slate-900">Cierre de Pedidos</h3>
              <p className="text-xs text-slate-500 mt-1">El chatbot vende tus productos, valida el stock y recopila datos de envío.</p>
            </div>
          </div>
          <div className="border border-slate-200 bg-white/70 backdrop-blur-md p-5 rounded-2xl text-left space-y-3 shadow-sm hover:shadow-md transition-shadow">
            <div className="h-10 w-10 rounded-xl bg-teal-50 flex items-center justify-center text-teal-600">
              <Calendar className="h-5 w-5" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-slate-900">Agenda y Reservas</h3>
              <p className="text-xs text-slate-500 mt-1">Coordina turnos, reservas de hotel o videollamadas con links de agendamiento.</p>
            </div>
          </div>
          <div className="border border-slate-200 bg-white/70 backdrop-blur-md p-5 rounded-2xl text-left space-y-3 shadow-sm hover:shadow-md transition-shadow">
            <div className="h-10 w-10 rounded-xl bg-emerald-50 flex items-center justify-center text-emerald-600">
              <ShieldCheck className="h-5 w-5" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-slate-900">Control Manual (Takeover)</h3>
              <p className="text-xs text-slate-500 mt-1">Pausa la IA con un clic en el Inbox para atender de forma manual cuando lo requieras.</p>
            </div>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="relative z-10 border-t border-slate-200 py-6 text-center text-xs text-slate-500 bg-white/40">
        &copy; {new Date().getFullYear()} Antigravity. Todos los derechos reservados. SaaS Multi-tenant de Chatbots Inteligentes.
      </footer>
    </div>
  )
}

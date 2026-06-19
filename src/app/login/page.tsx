'use client'

import React, { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'

export default function LoginPage() {
  const router = useRouter()
  const supabase = createClient()
  
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [errorMsg, setErrorMsg] = useState('')

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    setErrorMsg('')

    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    })

    if (error) {
      setErrorMsg(error.message)
      setIsLoading(false)
    } else {
      router.push('/dashboard')
    }
  }

  return (
    <div className="min-h-screen bg-zinc-950 text-zinc-100 flex flex-col items-center justify-center p-6 relative">
      <div className="absolute inset-0 bg-[linear-gradient(to_right,#1f2023_1px,transparent_1px),linear-gradient(to_bottom,#1f2023_1px,transparent_1px)] bg-[size:4rem_4rem] [mask-image:radial-gradient(ellipse_60%_50%_at_50%_50%,#000_70%,transparent_100%)] opacity-25 pointer-events-none" />
      
      <div className="relative z-10 w-full max-w-md bg-zinc-950 border border-zinc-900 p-8 rounded-2xl shadow-2xl space-y-6">
        {/* Logo */}
        <div className="text-center">
          <Link href="/" className="inline-flex items-center gap-2 mb-2">
            <span className="h-8 w-8 rounded-lg bg-gradient-to-tr from-purple-600 to-indigo-600 flex items-center justify-center font-black text-white shadow-lg">
              A
            </span>
            <span className="font-bold text-lg text-white">Antigravity</span>
          </Link>
          <h2 className="text-xl font-bold tracking-tight text-white mt-4">Bienvenido a la Plataforma</h2>
          <p className="text-xs text-zinc-500 mt-1">Ingresa tus credenciales para acceder a tu panel.</p>
        </div>

        {/* Error Alert */}
        {errorMsg && (
          <div className="p-3 bg-red-500/10 border border-red-500/20 text-red-400 rounded-lg text-xs">
            {errorMsg}
          </div>
        )}

        {/* Form */}
        <form onSubmit={handleLogin} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-zinc-400 uppercase tracking-wider">
              Correo Electrónico
            </label>
            <input
              type="email"
              required
              className="mt-1.5 block w-full rounded-lg border border-zinc-800 bg-zinc-900/50 px-3 py-2 text-sm text-white placeholder-zinc-600 focus:border-purple-500 focus:outline-none transition-all"
              placeholder="admin@negocio.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-zinc-400 uppercase tracking-wider">
              Contraseña
            </label>
            <input
              type="password"
              required
              className="mt-1.5 block w-full rounded-lg border border-zinc-800 bg-zinc-900/50 px-3 py-2 text-sm text-white placeholder-zinc-600 focus:border-purple-500 focus:outline-none transition-all"
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
          </div>

          <button
            type="submit"
            disabled={isLoading}
            className="w-full rounded-lg bg-gradient-to-r from-purple-600 to-indigo-600 py-2.5 text-sm font-bold text-white hover:from-purple-500 hover:to-indigo-500 focus:outline-none disabled:opacity-50 transition-all shadow-lg shadow-purple-500/20"
          >
            {isLoading ? 'Ingresando...' : 'Iniciar Sesión'}
          </button>
        </form>

        {/* Separador */}
        <div className="relative flex items-center justify-center my-4">
          <div className="absolute inset-0 flex items-center">
            <div className="w-full border-t border-zinc-900" />
          </div>
          <span className="relative bg-zinc-950 px-3 text-[10px] uppercase font-semibold tracking-wider text-zinc-600">
            Acceso Rápido Desarrollador
          </span>
        </div>

        {/* Demo Links */}
        <div className="grid grid-cols-2 gap-3 text-center">
          <button
            onClick={() => router.push('/admin')}
            className="rounded-lg border border-zinc-800 bg-zinc-900/20 py-2 px-3 text-xs font-semibold hover:bg-zinc-800 transition-colors"
          >
            Panel Superadmin
          </button>
          <button
            onClick={() => router.push('/dashboard/demo-business-id')}
            className="rounded-lg border border-zinc-800 bg-zinc-900/20 py-2 px-3 text-xs font-semibold hover:bg-zinc-800 transition-colors"
          >
            Panel Cliente (Demo)
          </button>
        </div>
      </div>
    </div>
  )
}

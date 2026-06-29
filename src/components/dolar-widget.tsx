'use client'

import React, { useState, useEffect } from 'react'
import { DollarSign, RefreshCw, AlertCircle, TrendingUp } from 'lucide-react'

interface DolarBlueResponse {
  compra: number
  venta: number
  fechaActualizacion: string
}

export function DolarWidget() {
  const [data, setData] = useState<DolarBlueResponse | null>(null)
  const [loading, setLoading] = useState<boolean>(true)
  const [error, setError] = useState<boolean>(false)
  const [refreshing, setRefreshing] = useState<boolean>(false)

  const fetchDolar = async () => {
    setRefreshing(true)
    try {
      const res = await fetch('https://dolarapi.com/v1/dolares/blue')
      if (!res.ok) throw new Error('API Error')
      const json = await res.json()
      setData(json)
      setError(false)
    } catch {
      setError(true)
    } finally {
      setLoading(false)
      setRefreshing(false)
    }
  }

  useEffect(() => {
    fetchDolar()
  }, [])

  const formatTime = (isoString?: string) => {
    if (!isoString) return ''
    try {
      const date = new Date(isoString)
      return date.toLocaleTimeString('es-AR', { hour: '2-digit', minute: '2-digit' }) + ' hs'
    } catch {
      return ''
    }
  }

  return (
    <div className="p-3.5 rounded-xl border border-zinc-800 bg-zinc-950/70 backdrop-blur-md relative overflow-hidden transition-all duration-300 hover:border-emerald-500/30 hover:shadow-lg hover:shadow-emerald-950/10">
      {/* Glow effect */}
      <div className="absolute top-0 right-0 h-16 w-16 bg-emerald-500/5 rounded-full blur-xl pointer-events-none" />

      {/* Header */}
      <div className="flex items-center justify-between gap-2 mb-2.5">
        <div className="flex items-center gap-1.5">
          <div className="h-5 w-5 rounded bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center">
            <DollarSign className="h-3 w-3 text-emerald-400 shrink-0" />
          </div>
          <span className="text-[10px] font-black uppercase tracking-wider text-emerald-400">
            Dólar Blue
          </span>
        </div>
        <button
          onClick={fetchDolar}
          disabled={loading || refreshing}
          className="text-zinc-500 hover:text-zinc-300 disabled:opacity-30 transition-colors p-1"
          title="Actualizar cotización"
        >
          <RefreshCw className={`h-3 w-3 ${refreshing ? 'animate-spin' : ''}`} />
        </button>
      </div>

      {/* Content */}
      {loading ? (
        <div className="py-2.5 flex items-center justify-center">
          <span className="text-[10px] text-zinc-600 font-mono animate-pulse">Obteniendo cotización...</span>
        </div>
      ) : error ? (
        <div className="py-1.5 flex items-center gap-1.5 text-red-400/90">
          <AlertCircle className="h-3.5 w-3.5 shrink-0" />
          <span className="text-[9px] font-semibold">Error al cargar Dólar Blue</span>
        </div>
      ) : data ? (
        <div className="space-y-2">
          <div className="grid grid-cols-2 gap-2 text-center">
            <div className="p-1.5 bg-zinc-900/60 rounded-lg border border-zinc-800/40">
              <span className="block text-[8px] uppercase tracking-wider text-zinc-500 font-bold">Compra</span>
              <span className="font-mono text-sm font-extrabold text-white">
                ${data.compra.toLocaleString('es-AR')}
              </span>
            </div>
            <div className="p-1.5 bg-zinc-900/60 rounded-lg border border-zinc-800/40">
              <span className="block text-[8px] uppercase tracking-wider text-zinc-500 font-bold">Venta</span>
              <span className="font-mono text-sm font-extrabold text-emerald-400">
                ${data.venta.toLocaleString('es-AR')}
              </span>
            </div>
          </div>

          <div className="flex items-center justify-between text-[8px] text-zinc-500 pt-0.5 border-t border-zinc-900/40">
            <span className="flex items-center gap-0.5 text-emerald-500/80 font-bold uppercase tracking-wider">
              <TrendingUp className="h-2 w-2" /> ARS
            </span>
            <span>Act: {formatTime(data.fechaActualizacion)}</span>
          </div>
        </div>
      ) : null}
    </div>
  )
}

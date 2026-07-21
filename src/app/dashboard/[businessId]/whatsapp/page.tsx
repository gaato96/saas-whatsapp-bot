'use client'

import React, { useState, useEffect, use } from 'react'
import { createClient } from '@/lib/supabase/client'
import { MessageCircle, Key, Link as LinkIcon, RefreshCw, AlertCircle, Save, CheckCircle, Info } from 'lucide-react'

interface WhatsAppConfig {
  phone_number_id: string
  waba_id: string
  access_token: string
  verify_token: string
}

interface WhatsAppPageProps {
  params: Promise<{ businessId: string }>
}

export default function WhatsAppPage({ params }: WhatsAppPageProps) {
  const { businessId } = use(params)
  const supabase = createClient()

  // Estados
  const [isLoading, setIsLoading] = useState(true)
  const [isSaving, setIsSaving] = useState(false)
  const [dbConnected, setDbConnected] = useState(true)
  const [successMsg, setSuccessMsg] = useState('')
  const [errorMsg, setErrorMsg] = useState('')

  // Campos de configuración
  const [phoneNumberId, setPhoneNumberId] = useState('')
  const [wabaId, setWabaId] = useState('')
  const [accessToken, setAccessToken] = useState('')
  const [verifyToken, setVerifyToken] = useState('')

  // URL del Webhook
  const [webhookUrl, setWebhookUrl] = useState('')

  useEffect(() => {
    const fetchConfig = async () => {
      setIsLoading(true)
      try {
        // 1. Obtener la configuración actual de whatsapp_config de la tabla businesses
        const { data, error } = await supabase
          .from('businesses')
          .select('whatsapp_config')
          .eq('id', businessId)
          .single()

        if (error) throw error

        const config = data?.whatsapp_config || {}
        setPhoneNumberId(config.phone_number_id || '')
        setWabaId(config.waba_id || '')
        setAccessToken(config.access_token || '')
        setVerifyToken(config.verify_token || '')

        // Construir la URL del webhook en base al host de Supabase
        const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://tu-proyecto.supabase.co'
        setWebhookUrl(`${supabaseUrl}/functions/v1/whatsapp-webhook?business_id=${businessId}`)
      } catch (err: any) {
        console.warn("Error cargando configuración de WhatsApp. Cargando mock demo.", err)
        setDbConnected(false)
        setWebhookUrl(`http://localhost:54321/functions/v1/whatsapp-webhook?business_id=${businessId}`)

        // Defaults demo
        setPhoneNumberId('102434568910')
        setWabaId('204982738495')
        setAccessToken('EAAW_demo_token_permanent_meta_key_long_string_for_testing...')
        setVerifyToken('mi_token_secreto_123')
      } finally {
        setIsLoading(false)
      }
    }

    fetchConfig()
  }, [businessId, supabase])

  // Guardar configuración
  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSaving(true)
    setErrorMsg('')
    setSuccessMsg('')

    const updatedConfig = {
      phone_number_id: phoneNumberId.trim(),
      waba_id: wabaId.trim(),
      access_token: accessToken.trim(),
      verify_token: verifyToken.trim()
    }

    try {
      if (!dbConnected || businessId.startsWith('demo-') || businessId === 'zapas-premium') {
        setTimeout(() => {
          setIsSaving(false)
          setSuccessMsg('Credenciales de WhatsApp simuladas correctamente en memoria.')
          setTimeout(() => setSuccessMsg(''), 4000)
        }, 800)
        return
      }

      // Actualizar la tabla de businesses
      const { error } = await supabase
        .from('businesses')
        .update({ whatsapp_config: updatedConfig })
        .eq('id', businessId)

      if (error) throw error

      setSuccessMsg('¡Credenciales de WhatsApp actualizadas de forma segura!')
      setTimeout(() => setSuccessMsg(''), 4000)
    } catch (err: any) {
      console.error(err)
      setErrorMsg('No se pudieron guardar los cambios en la base de datos.')
    } finally {
      setIsSaving(false)
    }
  }

  // Generador de Token de Verificación rápido
  const handleGenerateVerifyToken = () => {
    const rand = Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15)
    setVerifyToken(rand)
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-20 text-xs text-zinc-500">
        Cargando credenciales de WhatsApp...
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Alerta demo */}
      {!dbConnected && (
        <div className="p-3 bg-zinc-900/60 border border-zinc-800 text-zinc-400 rounded-xl text-xs flex items-center gap-2">
          <AlertCircle className="h-4 w-4 text-emerald-500" />
          <span><strong>WhatsApp Demo Activo:</strong> Editando credenciales de simulación en entorno de pruebas.</span>
        </div>
      )}

      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-white flex items-center gap-2">
            <MessageCircle className="h-5 w-5 text-emerald-500" />
            Configuración de WhatsApp Cloud API
          </h1>
          <p className="text-xs text-zinc-500">
            Conecta tu línea oficial de WhatsApp Business. Registra las credenciales provistas por Meta Developer Console.
          </p>
        </div>
      </div>

      {/* Mensajes de feedback */}
      {successMsg && (
        <div className="p-3.5 bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs rounded-xl font-bold">
          {successMsg}
        </div>
      )}
      {errorMsg && (
        <div className="p-3.5 bg-red-500/10 border border-red-500/20 text-red-400 text-xs rounded-xl font-bold">
          {errorMsg}
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* PANEL DE CONFIGURACIÓN DE CREDENCIALES (Ancho 2 columnas) */}
        <form onSubmit={handleSave} className="lg:col-span-2 space-y-6">
          <div className="bg-zinc-950/20 border border-zinc-800 rounded-2xl p-6 space-y-4">
            <h2 className="text-xs font-bold text-white uppercase tracking-wider flex items-center gap-2 border-b border-zinc-850 pb-2.5">
              <Key className="h-4 w-4 text-emerald-500" />
              Credenciales de Meta Developer
            </h2>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-[10px] text-zinc-500 font-bold uppercase tracking-wider">ID del Teléfono (Phone Number ID)</label>
                <input
                  type="text"
                  required
                  className="mt-1.5 block w-full rounded-lg border border-zinc-800 bg-zinc-900/40 px-3 py-2 text-xs text-white focus:border-emerald-500 focus:outline-none"
                  placeholder="Ej: 102434568910"
                  value={phoneNumberId}
                  onChange={(e) => setPhoneNumberId(e.target.value)}
                />
              </div>

              <div>
                <label className="block text-[10px] text-zinc-500 font-bold uppercase tracking-wider">WABA ID (WhatsApp Business Account ID)</label>
                <input
                  type="text"
                  required
                  className="mt-1.5 block w-full rounded-lg border border-zinc-800 bg-zinc-900/40 px-3 py-2 text-xs text-white focus:border-emerald-500 focus:outline-none"
                  placeholder="Ej: 204982738495"
                  value={wabaId}
                  onChange={(e) => setWabaId(e.target.value)}
                />
              </div>
            </div>

            <div>
              <label className="block text-[10px] text-zinc-500 font-bold uppercase tracking-wider">Token de Acceso Permanente (System User Token)</label>
              <textarea
                rows={3}
                required
                className="mt-1.5 block w-full rounded-lg border border-zinc-800 bg-zinc-900/40 p-3 text-xs text-white font-mono focus:border-emerald-500 focus:outline-none"
                placeholder="EAAW..."
                value={accessToken}
                onChange={(e) => setAccessToken(e.target.value)}
              />
            </div>

            <div>
              <label className="block text-[10px] text-zinc-500 font-bold uppercase tracking-wider">Token de Verificación del Webhook (Verify Token)</label>
              <div className="mt-1.5 flex gap-2">
                <input
                  type="text"
                  required
                  className="block w-full rounded-lg border border-zinc-800 bg-zinc-900/40 px-3 py-2 text-xs text-white font-mono focus:border-emerald-500 focus:outline-none"
                  placeholder="Verify Token para Meta Dashboard"
                  value={verifyToken}
                  onChange={(e) => setVerifyToken(e.target.value)}
                />
                <button
                  type="button"
                  onClick={handleGenerateVerifyToken}
                  className="rounded-lg bg-zinc-800 border border-zinc-700 px-3 hover:bg-zinc-700 transition-colors text-xs font-semibold flex items-center gap-1.5 text-zinc-300"
                >
                  <RefreshCw className="h-3.5 w-3.5" />
                  <span>Generar</span>
                </button>
              </div>
            </div>
            
            <div className="pt-4 border-t border-zinc-850 flex justify-end">
              <button
                type="submit"
                disabled={isSaving}
                className="rounded-xl bg-emerald-600 px-5 py-2.5 text-xs font-bold text-white hover:bg-emerald-500 transition-all shadow-lg shadow-emerald-600/10 flex items-center gap-2 disabled:opacity-50"
              >
                <Save className="h-4 w-4" />
                {isSaving ? 'Guardando...' : 'Guardar Configuración'}
              </button>
            </div>
          </div>
        </form>

        {/* PANEL DE INSTRUCCIONES DE CONEXIÓN WEBHOOK (Ancho 1 columna) */}
        <div className="space-y-6">
          <div className="bg-zinc-950/20 border border-zinc-800 rounded-2xl p-6 space-y-4">
            <h2 className="text-xs font-bold text-white uppercase tracking-wider flex items-center gap-2 border-b border-zinc-850 pb-2.5">
              <LinkIcon className="h-4 w-4 text-emerald-500" />
              Sincronización Webhook
            </h2>

            <div className="space-y-4 text-xs">
              <p className="text-zinc-400 leading-relaxed">
                Para completar el flujo de mensajería interactiva, debes pegar el siguiente endpoint en tu Panel de Meta Developer (WhatsApp {`>`} Configuración de Webhook):
              </p>

              <div>
                <span className="block text-[9px] text-zinc-500 uppercase font-bold tracking-wider mb-1">Webhook URL</span>
                <input
                  type="text"
                  readOnly
                  className="w-full rounded-lg border border-zinc-850 bg-zinc-900/60 px-3 py-2 text-xs text-zinc-400 font-mono select-all focus:outline-none"
                  value={webhookUrl}
                  onClick={(e) => (e.target as HTMLInputElement).select()}
                />
              </div>

              <div>
                <span className="block text-[9px] text-zinc-500 uppercase font-bold tracking-wider mb-1">Verify Token</span>
                <input
                  type="text"
                  readOnly
                  className="w-full rounded-lg border border-zinc-850 bg-zinc-900/60 px-3 py-2 text-xs text-zinc-400 font-mono select-all focus:outline-none"
                  value={verifyToken}
                  onClick={(e) => (e.target as HTMLInputElement).select()}
                />
              </div>

              <div className="p-3 border border-zinc-850 bg-zinc-900/20 rounded-xl space-y-2">
                <span className="text-[10px] font-bold text-zinc-300 flex items-center gap-1.5">
                  <CheckCircle className="h-4 w-4 text-emerald-500" />
                  Suscripción requerida en Meta
                </span>
                <p className="text-[10px] text-zinc-500 leading-relaxed">
                  Asegúrate de suscribirte al webhook del tipo de objeto <strong>messages</strong> para que la plataforma reciba los WhatsApps entrantes de los clientes en tiempo real.
                </p>
              </div>

              <div className="p-3.5 bg-emerald-500/5 border border-emerald-500/10 text-emerald-400/90 rounded-xl text-[10px] leading-relaxed flex gap-2">
                <Info className="h-5 w-5 text-emerald-500 shrink-0" />
                <span>
                  <strong>Nota de costos y seguridad:</strong> La API de Gemini 3.6 Flash utiliza una llave global centralizada provista por el servidor, simplificando costos de llamadas con IA.
                </span>
              </div>
            </div>
          </div>
        </div>

      </div>
    </div>
  )
}

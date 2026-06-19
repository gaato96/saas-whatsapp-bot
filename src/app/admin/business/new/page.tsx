'use client'

import React, { useState } from 'react'
import { useRouter } from 'next/navigation'
import { BusinessForm } from '@/components/forms/business-form'
import { createClient } from '@/lib/supabase/client'

export default function NewBusinessPage() {
  const router = useRouter()
  const supabase = createClient()
  const [isLoading, setIsLoading] = useState(false)
  const [errorMsg, setErrorMsg] = useState('')
  const [successMsg, setSuccessMsg] = useState('')

  const handleCreateBusiness = async (data: any) => {
    setIsLoading(true)
    setErrorMsg('')
    setSuccessMsg('')

    try {
      // 1. Insertar el negocio en la tabla 'businesses'
      const { data: business, error: bizError } = await supabase
        .from('businesses')
        .insert({
          name: data.name,
          rubro: data.rubro,
          whatsapp_config: {
            phone_number_id: data.whatsapp_phone_number_id || null,
            verify_token: data.whatsapp_verify_token || null,
            access_token: data.whatsapp_access_token || null,
            waba_id: data.whatsapp_waba_id || null,
          },
        })
        .select()
        .single()

      if (bizError) throw bizError

      // 2. Insertar la metadata específica del rubro en 'business_rubro_data'
      const { error: rubroError } = await supabase
        .from('business_rubro_data')
        .insert({
          business_id: business.id,
          custom_metadata: data.custom_metadata || {},
        })

      if (rubroError) throw rubroError

      setSuccessMsg(`¡Negocio "${data.name}" creado con éxito! Redireccionando...`)
      
      // Esperar un momento para mostrar el mensaje y redirigir
      setTimeout(() => {
        router.push('/admin')
        router.refresh()
      }, 1500)

    } catch (err: any) {
      console.error("Error al crear negocio:", err)
      setErrorMsg(`Error al guardar: ${err.message || 'Error de conexión'}`)
      setIsLoading(false)
    }
  }

  return (
    <div className="space-y-6">
      {/* Encabezado */}
      <div>
        <h1 className="text-xl font-bold text-white">Dar de Alta un Negocio (Tenant)</h1>
        <p className="text-xs text-zinc-500">Configura la información comercial, credenciales de WhatsApp y parámetros específicos del rubro.</p>
      </div>

      {/* Alertas */}
      {errorMsg && (
        <div className="p-4 bg-red-500/10 border border-red-500/20 text-red-400 rounded-xl text-xs max-w-4xl mx-auto">
          ❌ {errorMsg}
        </div>
      )}
      {successMsg && (
        <div className="p-4 bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 rounded-xl text-xs max-w-4xl mx-auto">
          ✓ {successMsg}
        </div>
      )}

      {/* Formulario */}
      <div className="bg-zinc-950/40 p-1 border border-zinc-900 rounded-2xl">
        <BusinessForm onSubmit={handleCreateBusiness} isLoading={isLoading} />
      </div>
    </div>
  )
}

'use client'

import React, { useState, useEffect, use } from 'react'
import { useRouter } from 'next/navigation'
import { BusinessForm } from '@/components/forms/business-form'
import { createClient } from '@/lib/supabase/client'

interface EditBusinessPageProps {
  params: Promise<{ id: string }>
}

export default function EditBusinessPage({ params }: EditBusinessPageProps) {
  const { id } = use(params)
  const router = useRouter()
  const supabase = createClient()

  const [isLoading, setIsLoading] = useState(true)
  const [isSaving, setIsSaving] = useState(false)
  const [errorMsg, setErrorMsg] = useState('')
  const [successMsg, setSuccessMsg] = useState('')
  const [initialValues, setInitialValues] = useState<any>(null)

  useEffect(() => {
    async function loadBusiness() {
      try {
        const { data, error } = await supabase
          .from('businesses')
          .select('name, rubro, subscription_price, expiration_date, enabled_modules')
          .eq('id', id)
          .single()

        if (error) throw error
        setInitialValues(data)
      } catch (err: any) {
        console.error("Error loading business:", err)
        setErrorMsg(`Error al cargar: ${err.message || 'Error de conexión o permisos'}`)
      } finally {
        setIsLoading(false)
      }
    }
    loadBusiness()
  }, [id, supabase])

  const handleUpdateBusiness = async (data: any) => {
    setIsSaving(true)
    setErrorMsg('')
    setSuccessMsg('')

    try {
      const { error } = await supabase
        .from('businesses')
        .update({
          name: data.name,
          rubro: data.rubro,
          subscription_price: Number(data.subscription_price) || 0,
          expiration_date: data.expiration_date ? new Date(data.expiration_date).toISOString() : null,
          enabled_modules: data.enabled_modules,
        })
        .eq('id', id)

      if (error) throw error

      setSuccessMsg(`¡Negocio "${data.name}" actualizado con éxito!`)
      setTimeout(() => {
        router.push('/admin')
        router.refresh()
      }, 1500)
    } catch (err: any) {
      console.error("Error updating business:", err)
      setErrorMsg(`Error al guardar: ${err.message || 'Error de conexión'}`)
      setIsSaving(false)
    }
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-20 text-xs text-zinc-500">
        Cargando configuración del negocio...
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-bold text-white">Configurar Suscripción de Negocio</h1>
        <p className="text-xs text-zinc-500">Actualiza los datos de facturación, vencimiento y módulos activos para el tenant.</p>
      </div>

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

      {initialValues && (
        <div className="bg-zinc-950/40 p-1 border border-zinc-900 rounded-2xl">
          <BusinessForm 
            initialValues={initialValues} 
            onSubmit={handleUpdateBusiness} 
            isLoading={isSaving}
            isEditing={true}
          />
        </div>
      )}
    </div>
  )
}

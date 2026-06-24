'use client'

import React, { useState } from 'react'
import { useRouter } from 'next/navigation'
import { BusinessForm, BusinessFormValues } from '@/components/forms/business-form'

export default function NewBusinessPage() {
  const router = useRouter()
  const [isLoading, setIsLoading] = useState(false)
  const [errorMsg, setErrorMsg] = useState('')
  const [successMsg, setSuccessMsg] = useState<{ businessId: string; name: string; email: string } | null>(null)

  const handleCreateBusiness = async (data: BusinessFormValues) => {
    setIsLoading(true)
    setErrorMsg('')
    setSuccessMsg(null)

    try {
      const response = await fetch('/api/admin/create-business', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: data.name,
          rubro: data.rubro,
          subscription_price: data.subscription_price,
          expiration_date: data.expiration_date,
          enabled_modules: data.enabled_modules,
          owner_email: data.owner_email,
          owner_password: data.owner_password,
          owner_name: data.owner_name,
        }),
      })

      const result = await response.json()

      if (!response.ok) {
        throw new Error(result.error || 'Error desconocido al crear el negocio')
      }

      setSuccessMsg({ businessId: result.business_id, name: data.name, email: data.owner_email || '' })

      // Redirigir al panel admin luego de 3 segundos para que el superadmin vea las credenciales
      setTimeout(() => {
        router.push('/admin')
        router.refresh()
      }, 4000)

    } catch (err: any) {
      console.error('Error al crear negocio:', err)
      setErrorMsg(err.message || 'Error de conexión. Verificá tu conexión a internet.')
      setIsLoading(false)
    }
  }

  return (
    <div className="space-y-6">
      {/* Encabezado */}
      <div>
        <h1 className="text-xl font-bold text-white">Dar de Alta un Negocio (Tenant)</h1>
        <p className="text-xs text-zinc-500">Configura la información comercial y las credenciales de acceso del cliente al dashboard.</p>
      </div>

      {/* Alertas */}
      {errorMsg && (
        <div className="p-4 bg-red-500/10 border border-red-500/20 text-red-400 rounded-xl text-xs max-w-4xl mx-auto">
          ❌ {errorMsg}
        </div>
      )}

      {successMsg && (
        <div className="p-4 bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 rounded-xl text-sm max-w-4xl mx-auto space-y-2">
          <p className="font-bold">✅ ¡Negocio &quot;{successMsg.name}&quot; creado con éxito!</p>
          <p className="text-xs text-emerald-300/80">Comparte estas credenciales con el cliente de forma segura:</p>
          <div className="mt-2 p-3 bg-emerald-900/20 border border-emerald-500/30 rounded-lg font-mono text-xs space-y-1">
            <div><span className="text-zinc-400">Email:     </span><span className="text-white">{successMsg.email}</span></div>
            <div><span className="text-zinc-400">Panel:     </span><span className="text-white">Tu URL de acceso al dashboard</span></div>
          </div>
          <p className="text-[10px] text-zinc-500">Redireccionando al panel en 4 segundos...</p>
        </div>
      )}

      {/* Formulario (solo visible si no se creó todavía) */}
      {!successMsg && (
        <div className="bg-zinc-950/40 p-1 border border-zinc-900 rounded-2xl">
          <BusinessForm onSubmit={handleCreateBusiness} isLoading={isLoading} isEditing={false} />
        </div>
      )}
    </div>
  )
}

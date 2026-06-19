'use client'

import React from 'react'
import { useForm, Controller } from 'react-hook-form'
import { RubroFieldsRenderer } from './rubros/rubro-fields-renderer'

// Tipos de Rubros soportados
const RUBROS = [
  'Comida', 
  'Peluquería', 
  'Gym', 
  'Médico', 
  'Hotel', 
  'E-commerce', 
  'Cursos', 
  'Servicios', 
  'Automotriz', 
  'Personalizado'
]

interface BusinessFormValues {
  name: string
  rubro: string
  whatsapp_phone_number_id: string
  whatsapp_verify_token: string
  whatsapp_access_token: string
  whatsapp_waba_id: string
  custom_metadata: any
}

interface BusinessFormProps {
  initialValues?: Partial<BusinessFormValues>
  onSubmit: (data: BusinessFormValues) => void
  isLoading?: boolean
}

export function BusinessForm({ initialValues, onSubmit, isLoading = false }: BusinessFormProps) {
  const {
    register,
    handleSubmit,
    watch,
    control,
    formState: { errors },
  } = useForm<BusinessFormValues>({
    defaultValues: {
      name: initialValues?.name || '',
      rubro: initialValues?.rubro || 'Personalizado',
      whatsapp_phone_number_id: initialValues?.whatsapp_phone_number_id || '',
      whatsapp_verify_token: initialValues?.whatsapp_verify_token || '',
      whatsapp_access_token: initialValues?.whatsapp_access_token || '',
      whatsapp_waba_id: initialValues?.whatsapp_waba_id || '',
      custom_metadata: initialValues?.custom_metadata || {},
    },
  })

  // Escucha el rubro seleccionado para renderizar los campos correspondientes
  const selectedRubro = watch('rubro')

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6 max-w-4xl mx-auto">
      {/* 1. INFORMACIÓN PRINCIPAL DEL NEGOCIO */}
      <div className="bg-white dark:bg-zinc-950 p-6 rounded-2xl border border-zinc-200 dark:border-zinc-800 shadow-sm space-y-4">
        <h2 className="text-lg font-bold text-zinc-950 dark:text-white border-b border-zinc-100 dark:border-zinc-800 pb-2">
          Información General
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-semibold text-zinc-500 dark:text-zinc-400 uppercase tracking-wider">
              Nombre del Negocio
            </label>
            <input
              type="text"
              className="mt-1.5 block w-full rounded-lg border border-zinc-200 bg-white px-3 py-2 text-sm focus:border-zinc-900 focus:outline-none dark:border-zinc-800 dark:bg-zinc-950"
              placeholder="Ej: Hamburguesería Gourmet"
              {...register('name', { required: 'El nombre es obligatorio' })}
            />
            {errors.name && <span className="text-xs text-red-500">{errors.name.message}</span>}
          </div>

          <div>
            <label className="block text-xs font-semibold text-zinc-500 dark:text-zinc-400 uppercase tracking-wider">
              Rubro Comercial
            </label>
            <select
              className="mt-1.5 block w-full rounded-lg border border-zinc-200 bg-white px-3 py-2 text-sm focus:border-zinc-900 focus:outline-none dark:border-zinc-800 dark:bg-zinc-950"
              {...register('rubro', { required: 'El rubro es obligatorio' })}
            >
              {RUBROS.map((rubro) => (
                <option key={rubro} value={rubro}>
                  {rubro}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* 2. CONFIGURACIÓN WHATSAPP CLOUD API */}
      <div className="bg-white dark:bg-zinc-950 p-6 rounded-2xl border border-zinc-200 dark:border-zinc-800 shadow-sm space-y-4">
        <h2 className="text-lg font-bold text-zinc-950 dark:text-white border-b border-zinc-100 dark:border-zinc-800 pb-2">
          Configuración WhatsApp Cloud API (Meta)
        </h2>
        <p className="text-xs text-zinc-500">
          Credenciales necesarias para que el bot responda automáticamente a través del número oficial de WhatsApp de este negocio.
        </p>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-semibold text-zinc-500 dark:text-zinc-400 uppercase tracking-wider">
              ID del Teléfono (Phone Number ID)
            </label>
            <input
              type="text"
              className="mt-1.5 block w-full rounded-lg border border-zinc-200 bg-white px-3 py-2 text-sm focus:border-zinc-900 focus:outline-none dark:border-zinc-800 dark:bg-zinc-950"
              placeholder="Ej: 102434568910"
              {...register('whatsapp_phone_number_id')}
            />
          </div>
          <div>
            <label className="block text-xs font-semibold text-zinc-500 dark:text-zinc-400 uppercase tracking-wider">
              Token de Verificación del Webhook (Verify Token)
            </label>
            <input
              type="text"
              className="mt-1.5 block w-full rounded-lg border border-zinc-200 bg-white px-3 py-2 text-sm focus:border-zinc-900 focus:outline-none dark:border-zinc-800 dark:bg-zinc-950"
              placeholder="Ej: mi_token_secreto_123"
              {...register('whatsapp_verify_token')}
            />
          </div>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-semibold text-zinc-500 dark:text-zinc-400 uppercase tracking-wider">
              Token de Acceso Permanente (System User Token)
            </label>
            <input
              type="text"
              className="mt-1.5 block w-full rounded-lg border border-zinc-200 bg-white px-3 py-2 text-sm focus:border-zinc-900 focus:outline-none dark:border-zinc-800 dark:bg-zinc-950"
              placeholder="EAAW..."
              {...register('whatsapp_access_token')}
            />
          </div>
          <div>
            <label className="block text-xs font-semibold text-zinc-500 dark:text-zinc-400 uppercase tracking-wider">
              ID de la Cuenta Comercial (WABA ID)
            </label>
            <input
              type="text"
              className="mt-1.5 block w-full rounded-lg border border-zinc-200 bg-white px-3 py-2 text-sm focus:border-zinc-900 focus:outline-none dark:border-zinc-800 dark:bg-zinc-950"
              placeholder="Ej: 204982738495"
              {...register('whatsapp_waba_id')}
            />
          </div>
        </div>
      </div>

      {/* 3. CAMPOS DINÁMICOS POR RUBRO */}
      <div className="space-y-2">
        <h2 className="text-sm font-bold text-zinc-400 uppercase tracking-wider">
          Configuración Específica del Rubro ({selectedRubro})
        </h2>
        <RubroFieldsRenderer
          rubro={selectedRubro}
          register={register}
          errors={errors}
          control={control}
        />
      </div>

      {/* BOTÓN DE ACCIÓN */}
      <div className="flex justify-end pt-4">
        <button
          type="submit"
          disabled={isLoading}
          className="rounded-xl bg-zinc-950 px-6 py-3 text-sm font-bold text-white hover:bg-zinc-900 focus:outline-none disabled:opacity-50 transition-all dark:bg-white dark:text-zinc-950 dark:hover:bg-zinc-100"
        >
          {isLoading ? 'Guardando...' : 'Crear / Guardar Negocio'}
        </button>
      </div>
    </form>
  )
}

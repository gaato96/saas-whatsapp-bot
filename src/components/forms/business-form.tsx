'use client'

import React, { useEffect } from 'react'
import { useForm } from 'react-hook-form'

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
  'Agencia',
  'Personalizado'
]

// Módulos disponibles
const MODULES = [
  { id: 'crm', name: 'Pedidos / Turnos (CRM)' },
  { id: 'agenda', name: 'Agenda / Reservas' },
  { id: 'catalog', name: 'Catálogo y Stock' },
  { id: 'chat', name: 'Chat Inbox (Core)' },
  { id: 'clients', name: 'Clientes (Core)' },
  { id: 'ai_config', name: 'Inteligencia Artificial (Core)' },
  { id: 'business_config', name: 'Datos del Negocio (Core)' },
  { id: 'whatsapp_config', name: 'Configurar WhatsApp (Core)' }
]

interface BusinessFormValues {
  name: string
  rubro: string
  subscription_price: number
  expiration_date: string // Formato YYYY-MM-DD
  enabled_modules: string[]
}

interface BusinessFormProps {
  initialValues?: Partial<BusinessFormValues>
  onSubmit: (data: BusinessFormValues) => void
  isLoading?: boolean
}

export function BusinessForm({ initialValues, onSubmit, isLoading = false }: BusinessFormProps) {
  // Convertir fecha UTC a formato local YYYY-MM-DD para el input type="date"
  const getFormattedDate = (dateString?: string) => {
    if (!dateString) {
      const d = new Date()
      d.setDate(d.getDate() + 30) // 30 días en el futuro por defecto
      return d.toISOString().split('T')[0]
    }
    return new Date(dateString).toISOString().split('T')[0]
  }

  const {
    register,
    handleSubmit,
    watch,
    setValue,
    formState: { errors },
  } = useForm<BusinessFormValues>({
    defaultValues: {
      name: initialValues?.name || '',
      rubro: initialValues?.rubro || 'Personalizado',
      subscription_price: initialValues?.subscription_price || 0.00,
      expiration_date: getFormattedDate(initialValues?.expiration_date),
      enabled_modules: initialValues?.enabled_modules || ['chat', 'clients', 'ai_config', 'business_config', 'whatsapp_config', 'crm', 'catalog', 'agenda']
    },
  })

  // Escuchar el rubro seleccionado
  const selectedRubro = watch('rubro')

  // Auto-seleccionar módulos recomendados según el rubro comercial elegido
  useEffect(() => {
    if (selectedRubro === 'Comida' || selectedRubro === 'E-commerce' || selectedRubro === 'Cursos') {
      setValue('enabled_modules', ['chat', 'clients', 'ai_config', 'business_config', 'whatsapp_config', 'crm', 'catalog'])
    } else if (
      selectedRubro === 'Peluquería' || 
      selectedRubro === 'Gym' || 
      selectedRubro === 'Médico' || 
      selectedRubro === 'Hotel' || 
      selectedRubro === 'Automotriz' || 
      selectedRubro === 'Agencia' ||
      selectedRubro === 'Servicios'
    ) {
      setValue('enabled_modules', ['chat', 'clients', 'ai_config', 'business_config', 'whatsapp_config', 'agenda', 'catalog'])
    }
  }, [selectedRubro, setValue])

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6 max-w-4xl mx-auto p-6 bg-zinc-950 text-white rounded-2xl border border-zinc-900 shadow-md">
      
      {/* 1. INFORMACIÓN PRINCIPAL */}
      <div className="space-y-4">
        <h2 className="text-sm font-bold text-zinc-400 uppercase tracking-wider border-b border-zinc-900 pb-2">
          Información General de la Suscripción
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-semibold text-zinc-400 uppercase tracking-wider">
              Nombre del Negocio
            </label>
            <input
              type="text"
              className="mt-1.5 block w-full rounded-lg border border-zinc-800 bg-zinc-900/50 px-3 py-2 text-sm text-white placeholder-zinc-600 focus:border-purple-500 focus:outline-none transition-all"
              placeholder="Ej: Hamburguesería Gourmet"
              {...register('name', { required: 'El nombre es obligatorio' })}
            />
            {errors.name && <span className="text-xs text-red-500">{errors.name.message}</span>}
          </div>

          <div>
            <label className="block text-xs font-semibold text-zinc-400 uppercase tracking-wider">
              Rubro Comercial
            </label>
            <select
              className="mt-1.5 block w-full rounded-lg border border-zinc-800 bg-zinc-900/50 px-3 py-2 text-sm text-white focus:border-purple-500 focus:outline-none transition-all"
              {...register('rubro', { required: 'El rubro es obligatorio' })}
            >
              {RUBROS.map((rubro) => (
                <option key={rubro} value={rubro} className="bg-zinc-950">
                  {rubro}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-semibold text-zinc-400 uppercase tracking-wider">
              Precio Acordado (Mensual USD / Ars)
            </label>
            <input
              type="number"
              step="0.01"
              className="mt-1.5 block w-full rounded-lg border border-zinc-800 bg-zinc-900/50 px-3 py-2 text-sm text-white placeholder-zinc-650 focus:border-purple-500 focus:outline-none transition-all font-mono"
              placeholder="Ej: 150.00"
              {...register('subscription_price', { 
                required: 'El precio es obligatorio', 
                valueAsNumber: true,
                validate: v => v >= 0 || 'El precio no puede ser negativo' 
              })}
            />
            {errors.subscription_price && <span className="text-xs text-red-500">{errors.subscription_price.message}</span>}
          </div>

          <div>
            <label className="block text-xs font-semibold text-zinc-400 uppercase tracking-wider">
              Fecha de Vencimiento de Suscripción
            </label>
            <input
              type="date"
              className="mt-1.5 block w-full rounded-lg border border-zinc-800 bg-zinc-900/50 px-3 py-2 text-sm text-white focus:border-purple-500 focus:outline-none transition-all font-mono"
              {...register('expiration_date', { required: 'La fecha es obligatoria' })}
            />
            {errors.expiration_date && <span className="text-xs text-red-500">{errors.expiration_date.message}</span>}
          </div>
        </div>
      </div>

      {/* 2. GESTIÓN DE MÓDULOS (SIEMPRE EDITABLE, ESPECIALMENTE PARA PERSONALIZADO) */}
      <div className="space-y-4 pt-4 border-t border-zinc-900">
        <div className="flex justify-between items-center">
          <h2 className="text-sm font-bold text-zinc-400 uppercase tracking-wider">
            Módulos del Dashboard Habilitados
          </h2>
          {selectedRubro !== 'Personalizado' && (
            <span className="text-[10px] bg-purple-500/10 border border-purple-500/25 px-2 py-0.5 rounded-full text-purple-400 font-semibold">
              Módulos sugeridos para {selectedRubro}
            </span>
          )}
        </div>
        
        {selectedRubro === 'Personalizado' ? (
          <p className="text-xs text-zinc-500">
            Selecciona manualmente cuáles módulos quieres activar para este negocio.
          </p>
        ) : (
          <p className="text-xs text-zinc-500">
            Se han pre-configurado los módulos ideales para el rubro comercial. Puedes cambiar el rubro a "Personalizado" para editarlos individualmente.
          </p>
        )}

        <div className="grid grid-cols-1 md:grid-cols-2 gap-3 bg-zinc-900/20 p-4 border border-zinc-900 rounded-xl">
          {MODULES.map((mod) => (
            <div key={mod.id} className="flex items-center space-x-2.5 p-1 hover:bg-zinc-900/40 rounded transition-all">
              <input
                type="checkbox"
                id={`mod-${mod.id}`}
                value={mod.id}
                disabled={selectedRubro !== 'Personalizado'}
                className="h-4 w-4 rounded border-zinc-800 bg-zinc-900 text-purple-600 focus:ring-purple-500 disabled:opacity-60"
                {...register('enabled_modules')}
              />
              <label 
                htmlFor={`mod-${mod.id}`} 
                className={`text-xs font-semibold select-none cursor-pointer ${selectedRubro === 'Personalizado' ? 'text-zinc-200' : 'text-zinc-500'}`}
              >
                {mod.name}
              </label>
            </div>
          ))}
        </div>
      </div>

      {/* BOTÓN DE ACCIÓN */}
      <div className="flex justify-end pt-4 border-t border-zinc-900">
        <button
          type="submit"
          disabled={isLoading}
          className="rounded-xl bg-purple-600 px-6 py-3 text-sm font-bold text-white hover:bg-purple-500 focus:outline-none disabled:opacity-50 transition-all shadow-md shadow-purple-600/10"
        >
          {isLoading ? 'Guardando...' : 'Guardar Configuración de Suscripción'}
        </button>
      </div>
    </form>
  )
}

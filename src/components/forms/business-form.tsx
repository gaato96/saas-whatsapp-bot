'use client'

import React, { useEffect } from 'react'
import { useForm } from 'react-hook-form'
import { User, Lock, Building2 } from 'lucide-react'

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

export interface BusinessFormValues {
  name: string
  rubro: string
  subscription_price: number
  expiration_date: string
  enabled_modules: string[]
  // Campos de acceso (solo para creación, no para edición)
  owner_email?: string
  owner_password?: string
  owner_name?: string
}

interface BusinessFormProps {
  initialValues?: Partial<BusinessFormValues>
  onSubmit: (data: BusinessFormValues) => void
  isLoading?: boolean
  isEditing?: boolean // Si es edición, no mostrar campos de credenciales
}

export function BusinessForm({ initialValues, onSubmit, isLoading = false, isEditing = false }: BusinessFormProps) {
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
      enabled_modules: initialValues?.enabled_modules || ['chat', 'clients', 'ai_config', 'business_config', 'whatsapp_config', 'crm', 'catalog', 'agenda'],
      owner_email: '',
      owner_password: '',
      owner_name: '',
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

  const inputClass = "mt-1.5 block w-full rounded-lg border border-zinc-800 bg-zinc-900/50 px-3 py-2 text-sm text-white placeholder-zinc-600 focus:border-purple-500 focus:outline-none transition-all"

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6 max-w-4xl mx-auto p-6 bg-zinc-950 text-white rounded-2xl border border-zinc-900 shadow-md">
      
      {/* SECCIÓN: CREDENCIALES DE ACCESO (solo al crear) */}
      {!isEditing && (
        <div className="space-y-4">
          <div className="flex items-center gap-2 border-b border-zinc-900 pb-2">
            <User className="h-4 w-4 text-purple-400" />
            <h2 className="text-sm font-bold text-zinc-400 uppercase tracking-wider">
              Credenciales de Acceso del Cliente
            </h2>
          </div>
          <p className="text-[11px] text-zinc-600">
            Estos datos serán las credenciales de inicio de sesión del dueño del negocio en su panel. Guardálas en un lugar seguro y compártelas con el cliente.
          </p>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-zinc-400 uppercase tracking-wider">
                Nombre del Responsable
              </label>
              <input
                type="text"
                className={inputClass}
                placeholder="Ej: Juan García"
                {...register('owner_name')}
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-zinc-400 uppercase tracking-wider">
                Email de Acceso <span className="text-red-500">*</span>
              </label>
              <input
                type="email"
                className={inputClass}
                placeholder="Ej: juan@hamburgueseria.com"
                {...register('owner_email', {
                  required: 'El email es obligatorio',
                  pattern: { value: /^\S+@\S+$/i, message: 'Email inválido' }
                })}
              />
              {errors.owner_email && <span className="text-xs text-red-500">{errors.owner_email.message}</span>}
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-zinc-400 uppercase tracking-wider">
              Contraseña Inicial <span className="text-red-500">*</span>
            </label>
            <div className="relative">
              <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-zinc-600" />
              <input
                type="password"
                className={`${inputClass} pl-9`}
                placeholder="Mínimo 8 caracteres"
                {...register('owner_password', {
                  required: 'La contraseña es obligatoria',
                  minLength: { value: 8, message: 'Mínimo 8 caracteres' }
                })}
              />
            </div>
            {errors.owner_password && <span className="text-xs text-red-500">{errors.owner_password.message}</span>}
          </div>

          <div className="p-3 rounded-xl bg-amber-500/5 border border-amber-500/20 text-[11px] text-amber-400/80 flex items-start gap-2">
            <span className="text-amber-400 mt-0.5">⚠️</span>
            <span>El cliente podrá cambiar su contraseña desde la pantalla de login. Asegurate de compartirle las credenciales de forma segura.</span>
          </div>
        </div>
      )}

      {/* SECCIÓN: INFORMACIÓN PRINCIPAL */}
      <div className="space-y-4">
        <div className="flex items-center gap-2 border-b border-zinc-900 pb-2">
          <Building2 className="h-4 w-4 text-purple-400" />
          <h2 className="text-sm font-bold text-zinc-400 uppercase tracking-wider">
            Información General de la Suscripción
          </h2>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-semibold text-zinc-400 uppercase tracking-wider">
              Nombre del Negocio <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              className={inputClass}
              placeholder="Ej: Hamburguesería Gourmet"
              {...register('name', { required: 'El nombre es obligatorio' })}
            />
            {errors.name && <span className="text-xs text-red-500">{errors.name.message}</span>}
          </div>

          <div>
            <label className="block text-xs font-semibold text-zinc-400 uppercase tracking-wider">
              Rubro Comercial <span className="text-red-500">*</span>
            </label>
            <select
              className={inputClass}
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
              Precio Acordado (Mensual USD / ARS)
            </label>
            <input
              type="number"
              step="0.01"
              className={`${inputClass} font-mono`}
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
              className={`${inputClass} font-mono`}
              {...register('expiration_date', { required: 'La fecha es obligatoria' })}
            />
            {errors.expiration_date && <span className="text-xs text-red-500">{errors.expiration_date.message}</span>}
          </div>
        </div>
      </div>

      {/* SECCIÓN: MÓDULOS HABILITADOS */}
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
            Se han pre-configurado los módulos ideales para el rubro comercial. Puedes cambiar el rubro a &quot;Personalizado&quot; para editarlos individualmente.
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
          {isLoading ? 'Creando negocio...' : isEditing ? 'Guardar Cambios' : '✓ Crear Negocio y Cuenta de Acceso'}
        </button>
      </div>
    </form>
  )
}

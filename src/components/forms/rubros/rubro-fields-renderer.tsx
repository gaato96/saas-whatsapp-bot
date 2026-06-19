import React from 'react'
import { UseFormRegister, FieldErrors, Control, useFieldArray } from 'react-hook-form'

interface RubroFieldsProps {
  register: UseFormRegister<any>
  errors: FieldErrors<any>
  control?: any
}

// 1. Restaurantes / Delivery
export function ComidaFields({ register }: RubroFieldsProps) {
  return (
    <div className="space-y-4 p-4 border rounded-xl bg-zinc-50 dark:bg-zinc-900 dark:border-zinc-800">
      <h3 className="text-md font-semibold text-zinc-900 dark:text-zinc-100">Configuración de Restaurante / Delivery</h3>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label className="block text-xs font-medium text-zinc-500 dark:text-zinc-400">Costo de Envío ($)</label>
          <input
            type="number"
            step="0.01"
            className="mt-1 block w-full rounded-lg border border-zinc-200 bg-white px-3 py-2 text-sm focus:border-zinc-900 focus:outline-none dark:border-zinc-800 dark:bg-zinc-950"
            placeholder="Ej: 150.00"
            {...register('custom_metadata.delivery_cost')}
          />
        </div>
        <div>
          <label className="block text-xs font-medium text-zinc-500 dark:text-zinc-400">Tiempo Estimado de Entrega</label>
          <input
            type="text"
            className="mt-1 block w-full rounded-lg border border-zinc-200 bg-white px-3 py-2 text-sm focus:border-zinc-900 focus:outline-none dark:border-zinc-800 dark:bg-zinc-950"
            placeholder="Ej: 30 a 45 minutos"
            {...register('custom_metadata.estimated_time')}
          />
        </div>
      </div>
      <div>
        <label className="block text-xs font-medium text-zinc-500 dark:text-zinc-400">Zonas de Envío (separadas por coma)</label>
        <input
          type="text"
          className="mt-1 block w-full rounded-lg border border-zinc-200 bg-white px-3 py-2 text-sm focus:border-zinc-900 focus:outline-none dark:border-zinc-800 dark:bg-zinc-950"
          placeholder="Ej: Centro, Palermo, Belgrano"
          {...register('custom_metadata.shipping_zones')}
        />
      </div>
      <div>
        <label className="block text-xs font-medium text-zinc-500 dark:text-zinc-400">Horarios de Cocina</label>
        <input
          type="text"
          className="mt-1 block w-full rounded-lg border border-zinc-200 bg-white px-3 py-2 text-sm focus:border-zinc-900 focus:outline-none dark:border-zinc-800 dark:bg-zinc-950"
          placeholder="Ej: Mar a Dom de 19:30 a 23:30"
          {...register('custom_metadata.kitchen_hours')}
        />
      </div>
      <div className="p-3 border rounded-lg bg-white dark:bg-zinc-950 dark:border-zinc-800 space-y-3">
        <span className="text-xs font-semibold text-zinc-700 dark:text-zinc-300 block">Datos Bancarios para Transferencia</span>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          <div>
            <label className="block text-[10px] font-medium text-zinc-400">Alias CBU</label>
            <input
              type="text"
              className="mt-1 block w-full rounded-lg border border-zinc-200 bg-white px-2 py-1 text-xs focus:border-zinc-900 focus:outline-none dark:border-zinc-800 dark:bg-zinc-950"
              placeholder="Alias"
              {...register('custom_metadata.bank_details.alias')}
            />
          </div>
          <div>
            <label className="block text-[10px] font-medium text-zinc-400">CBU / CVU</label>
            <input
              type="text"
              className="mt-1 block w-full rounded-lg border border-zinc-200 bg-white px-2 py-1 text-xs focus:border-zinc-900 focus:outline-none dark:border-zinc-800 dark:bg-zinc-950"
              placeholder="CBU"
              {...register('custom_metadata.bank_details.cbu')}
            />
          </div>
          <div>
            <label className="block text-[10px] font-medium text-zinc-400">Titular de Cuenta</label>
            <input
              type="text"
              className="mt-1 block w-full rounded-lg border border-zinc-200 bg-white px-2 py-1 text-xs focus:border-zinc-900 focus:outline-none dark:border-zinc-800 dark:bg-zinc-950"
              placeholder="Nombre Titular"
              {...register('custom_metadata.bank_details.titular')}
            />
          </div>
        </div>
      </div>
    </div>
  )
}

// 2. Peluquería / Estética
export function PeluqueriaFields({ register }: RubroFieldsProps) {
  return (
    <div className="space-y-4 p-4 border rounded-xl bg-zinc-50 dark:bg-zinc-900 dark:border-zinc-800">
      <h3 className="text-md font-semibold text-zinc-900 dark:text-zinc-100">Configuración de Peluquería / Estética</h3>
      <div>
        <label className="block text-xs font-medium text-zinc-500 dark:text-zinc-400">Estilistas / Especialistas disponibles (separados por coma)</label>
        <input
          type="text"
          className="mt-1 block w-full rounded-lg border border-zinc-200 bg-white px-3 py-2 text-sm focus:border-zinc-900 focus:outline-none dark:border-zinc-800 dark:bg-zinc-950"
          placeholder="Ej: Carlos Ortiz, Sofía Gomez"
          {...register('custom_metadata.specialists')}
        />
      </div>
      <div>
        <label className="block text-xs font-medium text-zinc-500 dark:text-zinc-400">Duración Promedio de Servicio (minutos)</label>
        <input
          type="number"
          className="mt-1 block w-full rounded-lg border border-zinc-200 bg-white px-3 py-2 text-sm focus:border-zinc-900 focus:outline-none dark:border-zinc-800 dark:bg-zinc-950"
          placeholder="Ej: 45"
          {...register('custom_metadata.average_duration')}
        />
      </div>
      <div>
        <label className="block text-xs font-medium text-zinc-500 dark:text-zinc-400">Políticas de Cancelación</label>
        <textarea
          rows={2}
          className="mt-1 block w-full rounded-lg border border-zinc-200 bg-white px-3 py-2 text-sm focus:border-zinc-900 focus:outline-none dark:border-zinc-800 dark:bg-zinc-950"
          placeholder="Ej: Cancelaciones permitidas con hasta 2 horas de anticipación."
          {...register('custom_metadata.cancellation_policy')}
        />
      </div>
    </div>
  )
}

// 3. Gimnasios (Gym)
export function GymFields({ register }: RubroFieldsProps) {
  return (
    <div className="space-y-4 p-4 border rounded-xl bg-zinc-50 dark:bg-zinc-900 dark:border-zinc-800">
      <h3 className="text-md font-semibold text-zinc-900 dark:text-zinc-100">Configuración de Gimnasio</h3>
      <div>
        <label className="block text-xs font-medium text-zinc-500 dark:text-zinc-400">Disciplinas Disponibles (separadas por coma)</label>
        <input
          type="text"
          className="mt-1 block w-full rounded-lg border border-zinc-200 bg-white px-3 py-2 text-sm focus:border-zinc-900 focus:outline-none dark:border-zinc-800 dark:bg-zinc-950"
          placeholder="Ej: Crossfit, Spinning, Funcional, Yoga"
          {...register('custom_metadata.disciplines')}
        />
      </div>
      <div>
        <label className="block text-xs font-medium text-zinc-500 dark:text-zinc-400">Horarios de Clases</label>
        <textarea
          rows={3}
          className="mt-1 block w-full rounded-lg border border-zinc-200 bg-white px-3 py-2 text-sm focus:border-zinc-900 focus:outline-none dark:border-zinc-800 dark:bg-zinc-950"
          placeholder="Ej: Crossfit: Lun a Vie 8:00, 18:00, 20:00. Yoga: Mar y Jue 9:30."
          {...register('custom_metadata.class_schedules')}
        />
      </div>
      <div>
        <label className="block text-xs font-medium text-zinc-500 dark:text-zinc-400">Planes de Membresía (Precios y Beneficios)</label>
        <textarea
          rows={3}
          className="mt-1 block w-full rounded-lg border border-zinc-200 bg-white px-3 py-2 text-sm focus:border-zinc-900 focus:outline-none dark:border-zinc-800 dark:bg-zinc-950"
          placeholder="Ej: Pase Libre: $15.000/mes. 3 Veces por semana: $12.000/mes."
          {...register('custom_metadata.membership_plans')}
        />
      </div>
    </div>
  )
}

// 4. Consultorios Médicos
export function MedicoFields({ register }: RubroFieldsProps) {
  return (
    <div className="space-y-4 p-4 border rounded-xl bg-zinc-50 dark:bg-zinc-900 dark:border-zinc-800">
      <h3 className="text-md font-semibold text-zinc-900 dark:text-zinc-100">Configuración de Consultorio Médico</h3>
      <div>
        <label className="block text-xs font-medium text-zinc-500 dark:text-zinc-400">Especialidades Médicas (separadas por coma)</label>
        <input
          type="text"
          className="mt-1 block w-full rounded-lg border border-zinc-200 bg-white px-3 py-2 text-sm focus:border-zinc-900 focus:outline-none dark:border-zinc-800 dark:bg-zinc-950"
          placeholder="Ej: Pediatría, Dermatología, Cardiología"
          {...register('custom_metadata.specialties')}
        />
      </div>
      <div>
        <label className="block text-xs font-medium text-zinc-500 dark:text-zinc-400">Obras Sociales / Prepagas Aceptadas (separadas por coma)</label>
        <input
          type="text"
          className="mt-1 block w-full rounded-lg border border-zinc-200 bg-white px-3 py-2 text-sm focus:border-zinc-900 focus:outline-none dark:border-zinc-800 dark:bg-zinc-950"
          placeholder="Ej: OSDE, Medicus, Galeno, Particular"
          {...register('custom_metadata.accepted_insurances')}
        />
      </div>
      <div>
        <label className="block text-xs font-medium text-zinc-500 dark:text-zinc-400">Requisitos Previos / Indicaciones para Estudios</label>
        <textarea
          rows={3}
          className="mt-1 block w-full rounded-lg border border-zinc-200 bg-white px-3 py-2 text-sm focus:border-zinc-900 focus:outline-none dark:border-zinc-800 dark:bg-zinc-950"
          placeholder="Ej: Ecografía abdominal: Ayuno de 8 horas. Análisis de sangre: 12 hs de ayuno."
          {...register('custom_metadata.pre_requisites')}
        />
      </div>
    </div>
  )
}

// 5. Hoteles / Alojamiento
export function HotelFields({ register }: RubroFieldsProps) {
  return (
    <div className="space-y-4 p-4 border rounded-xl bg-zinc-50 dark:bg-zinc-900 dark:border-zinc-800">
      <h3 className="text-md font-semibold text-zinc-900 dark:text-zinc-100">Configuración de Hotel / Alojamiento</h3>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label className="block text-xs font-medium text-zinc-500 dark:text-zinc-400">Horario de Check-in</label>
          <input
            type="text"
            className="mt-1 block w-full rounded-lg border border-zinc-200 bg-white px-3 py-2 text-sm focus:border-zinc-900 focus:outline-none dark:border-zinc-800 dark:bg-zinc-950"
            placeholder="Ej: 14:00"
            {...register('custom_metadata.check_in_time')}
          />
        </div>
        <div>
          <label className="block text-xs font-medium text-zinc-500 dark:text-zinc-400">Horario de Check-out</label>
          <input
            type="text"
            className="mt-1 block w-full rounded-lg border border-zinc-200 bg-white px-3 py-2 text-sm focus:border-zinc-900 focus:outline-none dark:border-zinc-800 dark:bg-zinc-950"
            placeholder="Ej: 10:00"
            {...register('custom_metadata.check_out_time')}
          />
        </div>
      </div>
      <div>
        <label className="block text-xs font-medium text-zinc-500 dark:text-zinc-400">Servicios Incluidos (separados por coma)</label>
        <input
          type="text"
          className="mt-1 block w-full rounded-lg border border-zinc-200 bg-white px-3 py-2 text-sm focus:border-zinc-900 focus:outline-none dark:border-zinc-800 dark:bg-zinc-950"
          placeholder="Ej: Desayuno buffet, Cochera cubierta, Wi-Fi libre, Pileta"
          {...register('custom_metadata.included_services')}
        />
      </div>
      <div className="flex items-center space-x-2">
        <input
          type="checkbox"
          id="pet_friendly"
          className="h-4 w-4 rounded border-zinc-300 text-zinc-900 focus:ring-zinc-900 dark:border-zinc-800 dark:bg-zinc-950"
          {...register('custom_metadata.pet_friendly')}
        />
        <label htmlFor="pet_friendly" className="text-xs font-medium text-zinc-500 dark:text-zinc-400">
          Acepta Mascotas (Pet Friendly)
        </label>
      </div>
    </div>
  )
}

// 6. Tiendas / E-commerce
export function EcommerceFields({ register }: RubroFieldsProps) {
  return (
    <div className="space-y-4 p-4 border rounded-xl bg-zinc-50 dark:bg-zinc-900 dark:border-zinc-800">
      <h3 className="text-md font-semibold text-zinc-900 dark:text-zinc-100">Configuración de Tienda / E-commerce</h3>
      <div>
        <label className="block text-xs font-medium text-zinc-500 dark:text-zinc-400">Métodos de Envío disponibles (separados por coma)</label>
        <input
          type="text"
          className="mt-1 block w-full rounded-lg border border-zinc-200 bg-white px-3 py-2 text-sm focus:border-zinc-900 focus:outline-none dark:border-zinc-800 dark:bg-zinc-950"
          placeholder="Ej: Retiro por local, Envío por Correo Argentino, Moto express (24hs)"
          {...register('custom_metadata.shipping_methods')}
        />
      </div>
      <div>
        <label className="block text-xs font-medium text-zinc-500 dark:text-zinc-400">Políticas de Cambios y Devoluciones</label>
        <textarea
          rows={3}
          className="mt-1 block w-full rounded-lg border border-zinc-200 bg-white px-3 py-2 text-sm focus:border-zinc-900 focus:outline-none dark:border-zinc-800 dark:bg-zinc-950"
          placeholder="Ej: Cambios dentro de los 30 días con ticket. No se aceptan cambios de prendas de temporada pasada."
          {...register('custom_metadata.return_policy')}
        />
      </div>
    </div>
  )
}

// 7. Educación / Cursos
export function CursosFields({ register }: RubroFieldsProps) {
  return (
    <div className="space-y-4 p-4 border rounded-xl bg-zinc-50 dark:bg-zinc-900 dark:border-zinc-800">
      <h3 className="text-md font-semibold text-zinc-900 dark:text-zinc-100">Configuración de Educación / Cursos</h3>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label className="block text-xs font-medium text-zinc-500 dark:text-zinc-400">Modalidad</label>
          <select
            className="mt-1 block w-full rounded-lg border border-zinc-200 bg-white px-3 py-2 text-sm focus:border-zinc-900 focus:outline-none dark:border-zinc-800 dark:bg-zinc-950"
            {...register('custom_metadata.modality')}
          >
            <option value="live">Clases en Vivo (Virtuales)</option>
            <option value="recorded">Clases Grabadas (On-Demand)</option>
            <option value="presential">Presencial</option>
          </select>
        </div>
        <div>
          <label className="block text-xs font-medium text-zinc-500 dark:text-zinc-400">Plataforma de Cursada</label>
          <input
            type="text"
            className="mt-1 block w-full rounded-lg border border-zinc-200 bg-white px-3 py-2 text-sm focus:border-zinc-900 focus:outline-none dark:border-zinc-800 dark:bg-zinc-950"
            placeholder="Ej: Zoom, Hotmart, Classroom"
            {...register('custom_metadata.platform')}
          />
        </div>
      </div>
      <div>
        <label className="block text-xs font-medium text-zinc-500 dark:text-zinc-400">Fechas de Inicio / Próximas Cohortes</label>
        <input
          type="text"
          className="mt-1 block w-full rounded-lg border border-zinc-200 bg-white px-3 py-2 text-sm focus:border-zinc-900 focus:outline-none dark:border-zinc-800 dark:bg-zinc-950"
          placeholder="Ej: Cohorte Julio 2026: Inicia el 15/07."
          {...register('custom_metadata.start_dates')}
        />
      </div>
      <div>
        <label className="block text-xs font-medium text-zinc-500 dark:text-zinc-400">Temarios de los Cursos (Breve descripción)</label>
        <textarea
          rows={3}
          className="mt-1 block w-full rounded-lg border border-zinc-200 bg-white px-3 py-2 text-sm focus:border-zinc-900 focus:outline-none dark:border-zinc-800 dark:bg-zinc-950"
          placeholder="Ej: Curso IA: Mod 1 Prompting, Mod 2 Agentic Workflow, Mod 3 Deployment."
          {...register('custom_metadata.syllabus')}
        />
      </div>
    </div>
  )
}

// 8. Servicios Profesionales
export function ServiciosFields({ register }: RubroFieldsProps) {
  return (
    <div className="space-y-4 p-4 border rounded-xl bg-zinc-50 dark:bg-zinc-900 dark:border-zinc-800">
      <h3 className="text-md font-semibold text-zinc-900 dark:text-zinc-100">Configuración de Servicios Profesionales</h3>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label className="block text-xs font-medium text-zinc-500 dark:text-zinc-400">Costo de Consulta Inicial ($)</label>
          <input
            type="number"
            step="0.01"
            className="mt-1 block w-full rounded-lg border border-zinc-200 bg-white px-3 py-2 text-sm focus:border-zinc-900 focus:outline-none dark:border-zinc-800 dark:bg-zinc-950"
            placeholder="Ej: 5000.00"
            {...register('custom_metadata.consultation_cost')}
          />
        </div>
        <div>
          <label className="block text-xs font-medium text-zinc-500 dark:text-zinc-400">Modalidad de Asesoría</label>
          <select
            className="mt-1 block w-full rounded-lg border border-zinc-200 bg-white px-3 py-2 text-sm focus:border-zinc-900 focus:outline-none dark:border-zinc-800 dark:bg-zinc-950"
            {...register('custom_metadata.consultation_type')}
          >
            <option value="virtual">Virtual (Videollamada)</option>
            <option value="presential">Presencial (Oficina)</option>
            <option value="both">Híbrido (Ambas)</option>
          </select>
        </div>
      </div>
      <div>
        <label className="block text-xs font-medium text-zinc-500 dark:text-zinc-400">Áreas de Especialidad / Expertise (separados por coma)</label>
        <input
          type="text"
          className="mt-1 block w-full rounded-lg border border-zinc-200 bg-white px-3 py-2 text-sm focus:border-zinc-900 focus:outline-none dark:border-zinc-800 dark:bg-zinc-950"
          placeholder="Ej: Derecho Laboral, Asesoramiento Fiscal, Branding corporativo"
          {...register('custom_metadata.areas')}
        />
      </div>
    </div>
  )
}

// 9. Automotriz (Talleres, Lavaderos, Repuestos)
export function AutomotrizFields({ register }: RubroFieldsProps) {
  return (
    <div className="space-y-4 p-4 border rounded-xl bg-zinc-50 dark:bg-zinc-900 dark:border-zinc-800">
      <h3 className="text-md font-semibold text-zinc-900 dark:text-zinc-100">Configuración del Rubro Automotriz</h3>
      <div>
        <label className="block text-xs font-medium text-zinc-500 dark:text-zinc-400">Tipos de Vehículos Aceptados (separados por coma)</label>
        <input
          type="text"
          className="mt-1 block w-full rounded-lg border border-zinc-200 bg-white px-3 py-2 text-sm focus:border-zinc-900 focus:outline-none dark:border-zinc-800 dark:bg-zinc-950"
          placeholder="Ej: Autos, Camionetas SUV, Motos, Camiones"
          {...register('custom_metadata.accepted_vehicles')}
        />
      </div>
      <div>
        <label className="block text-xs font-medium text-zinc-500 dark:text-zinc-400">Marcas con las que Trabaja (separadas por coma)</label>
        <input
          type="text"
          className="mt-1 block w-full rounded-lg border border-zinc-200 bg-white px-3 py-2 text-sm focus:border-zinc-900 focus:outline-none dark:border-zinc-800 dark:bg-zinc-950"
          placeholder="Ej: Todas las marcas, Especialista en Toyota / Honda"
          {...register('custom_metadata.brands')}
        />
      </div>
      <div>
        <label className="block text-xs font-medium text-zinc-500 dark:text-zinc-400">Cotizaciones Base de Servicios Comunes</label>
        <textarea
          rows={3}
          className="mt-1 block w-full rounded-lg border border-zinc-200 bg-white px-3 py-2 text-sm focus:border-zinc-900 focus:outline-none dark:border-zinc-800 dark:bg-zinc-950"
          placeholder="Ej: Lavado simple: $2500. Cambio de Aceite y Filtro: desde $18000 (según motor)."
          {...register('custom_metadata.base_quotes')}
        />
      </div>
    </div>
  )
}

// 10. Personalizado (Constructor Dinámico de Key-Value)
export function PersonalizadoFields({ control, register }: RubroFieldsProps) {
  // Inicializa el hook array de campos dinámicos
  const { fields, append, remove } = useFieldArray({
    control,
    name: 'custom_metadata.keyValueFields',
  })

  // Si no hay campos, agregar uno por defecto
  React.useEffect(() => {
    if (fields.length === 0) {
      append({ key: '', value: '' })
    }
  }, [fields, append])

  return (
    <div className="space-y-4 p-4 border rounded-xl bg-zinc-50 dark:bg-zinc-900 dark:border-zinc-800">
      <div className="flex items-center justify-between">
        <h3 className="text-md font-semibold text-zinc-900 dark:text-zinc-100">Constructor de Información Personalizada</h3>
        <button
          type="button"
          onClick={() => append({ key: '', value: '' })}
          className="rounded-lg bg-zinc-900 px-3 py-1.5 text-xs font-semibold text-white hover:bg-zinc-800 dark:bg-zinc-100 dark:text-zinc-900 dark:hover:bg-zinc-200"
        >
          + Agregar Campo
        </button>
      </div>
      <p className="text-xs text-zinc-500">
        Define preguntas y respuestas o datos clave que el Bot de IA usará para responder a tus clientes.
      </p>
      <div className="space-y-3">
        {fields.map((field, index) => (
          <div key={field.id} className="flex items-center gap-2">
            <input
              type="text"
              placeholder="Dato / Pregunta (ej: Políticas de Envío)"
              className="flex-1 rounded-lg border border-zinc-200 bg-white px-3 py-2 text-sm focus:border-zinc-900 focus:outline-none dark:border-zinc-800 dark:bg-zinc-950"
              {...register(`custom_metadata.keyValueFields.${index}.key`)}
            />
            <input
              type="text"
              placeholder="Valor / Respuesta (ej: Gratis en compras > $10.000)"
              className="flex-1 rounded-lg border border-zinc-200 bg-white px-3 py-2 text-sm focus:border-zinc-900 focus:outline-none dark:border-zinc-800 dark:bg-zinc-950"
              {...register(`custom_metadata.keyValueFields.${index}.value`)}
            />
            {fields.length > 1 && (
              <button
                type="button"
                onClick={() => remove(index)}
                className="rounded-lg border border-red-200 text-red-600 px-3 py-2 text-sm hover:bg-red-50 dark:border-red-900/30 dark:text-red-400 dark:hover:bg-red-950/20"
              >
                Eliminar
              </button>
            )}
          </div>
        ))}
      </div>
    </div>
  )
}

// Renderizador Central de Rubros
export function RubroFieldsRenderer({ rubro, register, errors, control }: RubroFieldsProps & { rubro: string }) {
  switch (rubro) {
    case 'Comida':
      return <ComidaFields register={register} errors={errors} />
    case 'Peluquería':
      return <PeluqueriaFields register={register} errors={errors} />
    case 'Gym':
      return <GymFields register={register} errors={errors} />
    case 'Médico':
      return <MedicoFields register={register} errors={errors} />
    case 'Hotel':
      return <HotelFields register={register} errors={errors} />
    case 'E-commerce':
      return <EcommerceFields register={register} errors={errors} />
    case 'Cursos':
      return <CursosFields register={register} errors={errors} />
    case 'Servicios':
      return <ServiciosFields register={register} errors={errors} />
    case 'Automotriz':
      return <AutomotrizFields register={register} errors={errors} />
    case 'Personalizado':
    default:
      return <PersonalizadoFields control={control} register={register} errors={errors} />
  }
}

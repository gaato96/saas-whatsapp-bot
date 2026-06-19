'use client'

import React, { useState, useEffect, use } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Bot, Save, AlertCircle, Sparkles, HelpCircle, FileText, ClipboardList } from 'lucide-react'

interface ConfigIAPageProps {
  params: Promise<{ businessId: string }>
}

export default function ConfigIAPage({ params }: ConfigIAPageProps) {
  const { businessId } = use(params)
  const supabase = createClient()

  // Estados de carga e interfaz
  const [activeTab, setActiveTab] = useState<'prompt' | 'rubro' | 'faqs'>('prompt')
  const [isLoading, setIsLoading] = useState(true)
  const [isSaving, setIsSaving] = useState(false)
  const [dbConnected, setDbConnected] = useState(true)
  const [successMsg, setSuccessMsg] = useState('')
  const [errorMsg, setErrorMsg] = useState('')

  // Información del negocio
  const [businessName, setBusinessName] = useState('Mi Negocio')
  const [rubro, setRubro] = useState('Personalizado')

  // Datos de Configuración IA (custom_metadata)
  const [systemPrompt, setSystemPrompt] = useState('')
  const [specialInstructions, setSpecialInstructions] = useState('')
  
  // Parámetros específicos por rubro (guardados en custom_metadata)
  const [rubroConfig, setRubroConfig] = useState<any>({
    delivery_cost: '',
    estimated_time: '',
    shipping_zones: '',
    kitchen_hours: '',
    bank_details: { alias: '', cbu: '', titular: '' },
    specialists: '',
    average_duration: '',
    cancellation_policy: '',
    disciplines: '',
    class_schedules: '',
  })

  // Cargar datos del negocio y de rubro_data
  useEffect(() => {
    const fetchData = async () => {
      setIsLoading(true)
      try {
        // 1. Obtener datos básicos del negocio
        const { data: bizData, error: bizError } = await supabase
          .from('businesses')
          .select('name, rubro')
          .eq('id', businessId)
          .single()

        if (bizError) throw bizError
        if (bizData) {
          setBusinessName(bizData.name)
          setRubro(bizData.rubro)
        }

        // 2. Obtener metadatos específicos del rubro
        const { data: metaData, error: metaError } = await supabase
          .from('business_rubro_data')
          .select('custom_metadata')
          .eq('business_id', businessId)
          .single()

        if (metaError && metaError.code !== 'PGRST116') { // PGRST116 es "no rows found"
          throw metaError
        }

        if (metaData?.custom_metadata) {
          const meta = metaData.custom_metadata
          setSystemPrompt(meta.system_prompt || '')
          setSpecialInstructions(meta.special_instructions || '')
          setRubroConfig({
            delivery_cost: meta.delivery_cost || '',
            estimated_time: meta.estimated_time || '',
            shipping_zones: meta.shipping_zones || '',
            kitchen_hours: meta.kitchen_hours || '',
            bank_details: {
              alias: meta.bank_details?.alias || '',
              cbu: meta.bank_details?.cbu || '',
              titular: meta.bank_details?.titular || '',
            },
            specialists: meta.specialists || '',
            average_duration: meta.average_duration || '',
            cancellation_policy: meta.cancellation_policy || '',
            disciplines: meta.disciplines || '',
            class_schedules: meta.class_schedules || '',
          })
        }
      } catch (err: any) {
        console.warn("Fallo de conexión o base de datos. Cargando datos demo.", err)
        setDbConnected(false)
        // Valores demo según rubro
        if (businessId === 'demo-business-id') {
          setBusinessName('Pizzería Bella (Demo)')
          setRubro('Comida')
          setSystemPrompt('Eres el asistente virtual de Pizzería Bella. Ayuda a los clientes a armar su pedido de pizza y empanadas, confirmando siempre el stock. Sé cálido y entusiasta.')
          setSpecialInstructions('FAQ:\n- ¿Hacen envíos? Sí, de martes a domingo.\n- ¿Tienen opciones sin TACC? Únicamente ensaladas.')
          setRubroConfig({
            delivery_cost: '150',
            estimated_time: '30 a 45 minutos',
            shipping_zones: 'Centro, Palermo, Belgrano',
            kitchen_hours: '19:30 a 23:30',
            bank_details: { alias: 'pizza.bella.mp', cbu: '0000003100012345678901', titular: 'Bella Pizza S.A.' }
          })
        } else {
          setBusinessName('Zapas Premium (Demo)')
          setRubro('E-commerce')
          setSystemPrompt('Eres el bot experto en calzado de Zapas Premium. Ayuda a seleccionar el talle ideal (ofrecemos del 38 al 45) e informa el método de envío.')
          setSpecialInstructions('FAQ:\n- ¿Tienen cambio? Sí, dentro de los 30 días en su caja original.')
        }
      } finally {
        setIsLoading(false)
      }
    }

    fetchData()
  }, [businessId, supabase])

  // Guardar datos en Supabase
  const handleSave = async () => {
    setIsSaving(true)
    setErrorMsg('')
    setSuccessMsg('')

    const customMetadataPayload = {
      ...rubroConfig,
      system_prompt: systemPrompt,
      special_instructions: specialInstructions,
    }

    try {
      if (!dbConnected || businessId.startsWith('demo-') || businessId === 'zapas-premium') {
        // Modo demo local
        setTimeout(() => {
          setIsSaving(false)
          setSuccessMsg('Configuración guardada correctamente en memoria local.')
          setTimeout(() => setSuccessMsg(''), 4000)
        }, 800)
        return
      }

      // 1. Intentar actualizar business_rubro_data
      const { error: upsertError } = await supabase
        .from('business_rubro_data')
        .upsert({
          business_id: businessId,
          custom_metadata: customMetadataPayload,
          updated_at: new Date().toISOString()
        })

      if (upsertError) throw upsertError

      setSuccessMsg('¡Configuración de IA actualizada exitosamente!')
      setTimeout(() => setSuccessMsg(''), 4000)
    } catch (err: any) {
      console.error(err)
      setErrorMsg('No se pudieron guardar los cambios en la base de datos.')
    } finally {
      setIsSaving(false)
    }
  }

  const handleRubroChange = (field: string, val: any, isBank = false) => {
    if (isBank) {
      setRubroConfig((prev: any) => ({
        ...prev,
        bank_details: {
          ...prev.bank_details,
          [field]: val
        }
      }))
    } else {
      setRubroConfig((prev: any) => ({
        ...prev,
        [field]: val
      }))
    }
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-20 text-xs text-zinc-500">
        Cargando módulo de Inteligencia Artificial...
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Alerta de demo */}
      {!dbConnected && (
        <div className="p-3 bg-zinc-900/60 border border-zinc-800 text-zinc-400 rounded-xl text-xs flex items-center gap-2">
          <AlertCircle className="h-4 w-4 text-emerald-500" />
          <span><strong>Modo Demostración:</strong> El panel está operando con datos locales y mocks de base de datos.</span>
        </div>
      )}

      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-white flex items-center gap-2">
            <Bot className="h-5 w-5 text-emerald-500 animate-pulse" />
            Configuración de Inteligencia Artificial
          </h1>
          <p className="text-xs text-zinc-500">
            Define el comportamiento, reglas de negocio e información que utiliza Gemini 2.5 Flash para atender a tus clientes por WhatsApp.
          </p>
        </div>
        <button
          onClick={handleSave}
          disabled={isSaving}
          className="rounded-xl bg-emerald-600 px-4 py-2.5 text-xs font-bold text-white hover:bg-emerald-500 transition-all shadow-lg shadow-emerald-600/10 flex items-center gap-2 disabled:opacity-50"
        >
          <Save className="h-4 w-4" />
          {isSaving ? 'Guardando...' : 'Guardar Configuración IA'}
        </button>
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

      {/* Layout de Tabs */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* Selector de Pestañas lateral */}
        <div className="space-y-1 bg-zinc-950/20 p-2.5 border border-zinc-800 rounded-2xl h-fit">
          <button
            onClick={() => setActiveTab('prompt')}
            className={`w-full text-left px-3.5 py-2.5 rounded-xl text-xs font-semibold flex items-center gap-2.5 transition-all ${
              activeTab === 'prompt'
                ? 'bg-emerald-500/10 text-emerald-400 font-bold'
                : 'text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800/40'
            }`}
          >
            <Sparkles className="h-4 w-4" />
            <span>Instrucciones (System Prompt)</span>
          </button>
          <button
            onClick={() => setActiveTab('rubro')}
            className={`w-full text-left px-3.5 py-2.5 rounded-xl text-xs font-semibold flex items-center gap-2.5 transition-all ${
              activeTab === 'rubro'
                ? 'bg-emerald-500/10 text-emerald-400 font-bold'
                : 'text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800/40'
            }`}
          >
            <ClipboardList className="h-4 w-4" />
            <span>Parámetros del Rubro ({rubro})</span>
          </button>
          <button
            onClick={() => setActiveTab('faqs')}
            className={`w-full text-left px-3.5 py-2.5 rounded-xl text-xs font-semibold flex items-center gap-2.5 transition-all ${
              activeTab === 'faqs'
                ? 'bg-emerald-500/10 text-emerald-400 font-bold'
                : 'text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800/40'
            }`}
          >
            <HelpCircle className="h-4 w-4" />
            <span>Preguntas Frecuentes y FAQ</span>
          </button>
        </div>

        {/* Contenido de la Pestaña Activa */}
        <div className="lg:col-span-3 bg-zinc-950/20 border border-zinc-800 rounded-2xl p-6">
          
          {/* TAB 1: SYSTEM PROMPT */}
          {activeTab === 'prompt' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between border-b border-zinc-850 pb-3">
                <div>
                  <h3 className="text-xs font-bold uppercase tracking-wider text-white">Instrucciones Principales de la IA</h3>
                  <p className="text-[11px] text-zinc-500">
                    Escribe la personalidad del bot y las pautas generales de atención comercial.
                  </p>
                </div>
                <span className="text-[10px] bg-zinc-800 px-2 py-0.5 rounded text-zinc-400 font-mono">Gemini 2.5 Flash</span>
              </div>
              <textarea
                className="w-full h-80 rounded-xl border border-zinc-800 bg-zinc-900/40 p-4 text-xs font-mono text-zinc-200 focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500 transition-all leading-relaxed"
                placeholder="Ej: Eres el asistente virtual de la pizzería..."
                value={systemPrompt}
                onChange={(e) => setSystemPrompt(e.target.value)}
              />
              <div className="p-3 bg-zinc-900/40 border border-zinc-850 rounded-xl text-[10px] text-zinc-500 leading-relaxed">
                💡 <strong>Consejo del Diseñador:</strong> Indícale al bot cómo tratar a tus clientes, si debe usar emojis y el tono de voz (formal, informal, amigable, etc.). El catálogo y stock de productos se inyecta de manera automática en la IA al procesar un mensaje.
              </div>
            </div>
          )}

          {/* TAB 2: PARÁMETROS DEL RUBRO */}
          {activeTab === 'rubro' && (
            <div className="space-y-6">
              <div className="border-b border-zinc-850 pb-3">
                <h3 className="text-xs font-bold uppercase tracking-wider text-white">Reglas y Parámetros Operativos</h3>
                <p className="text-[11px] text-zinc-500">
                  Valores del rubro <strong>{rubro}</strong> que alimentan el prompt de la IA de forma estructurada.
                </p>
              </div>

              {rubro === 'Comida' ? (
                <div className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-[11px] text-zinc-500 font-bold uppercase tracking-wider">Costo de Envío ($)</label>
                      <input
                        type="number"
                        className="mt-1.5 block w-full rounded-lg border border-zinc-800 bg-zinc-900/40 px-3 py-2 text-xs text-white focus:border-emerald-500 focus:outline-none"
                        placeholder="Ej: 150"
                        value={rubroConfig.delivery_cost || ''}
                        onChange={(e) => handleRubroChange('delivery_cost', e.target.value)}
                      />
                    </div>
                    <div>
                      <label className="block text-[11px] text-zinc-500 font-bold uppercase tracking-wider">Tiempo Estimado de Entrega</label>
                      <input
                        type="text"
                        className="mt-1.5 block w-full rounded-lg border border-zinc-800 bg-zinc-900/40 px-3 py-2 text-xs text-white focus:border-emerald-500 focus:outline-none"
                        placeholder="Ej: 30 a 45 minutos"
                        value={rubroConfig.estimated_time || ''}
                        onChange={(e) => handleRubroChange('estimated_time', e.target.value)}
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-[11px] text-zinc-500 font-bold uppercase tracking-wider">Zonas de Envío (separadas por comas)</label>
                      <input
                        type="text"
                        className="mt-1.5 block w-full rounded-lg border border-zinc-800 bg-zinc-900/40 px-3 py-2 text-xs text-white focus:border-emerald-500 focus:outline-none"
                        placeholder="Ej: Palermo, Belgrano, Recoleta"
                        value={rubroConfig.shipping_zones || ''}
                        onChange={(e) => handleRubroChange('shipping_zones', e.target.value)}
                      />
                    </div>
                    <div>
                      <label className="block text-[11px] text-zinc-500 font-bold uppercase tracking-wider">Horarios de Cocina</label>
                      <input
                        type="text"
                        className="mt-1.5 block w-full rounded-lg border border-zinc-800 bg-zinc-900/40 px-3 py-2 text-xs text-white focus:border-emerald-500 focus:outline-none"
                        placeholder="Ej: Mar a Dom de 19:30 a 23:30"
                        value={rubroConfig.kitchen_hours || ''}
                        onChange={(e) => handleRubroChange('kitchen_hours', e.target.value)}
                      />
                    </div>
                  </div>

                  <div className="p-4 border border-zinc-850 rounded-xl bg-zinc-900/20 space-y-3">
                    <span className="text-xs font-bold text-zinc-300 block">Datos Bancarios para Transferencias</span>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                      <div>
                        <label className="block text-[10px] text-zinc-500 uppercase font-bold tracking-wider">Alias</label>
                        <input
                          type="text"
                          className="mt-1 block w-full rounded-lg border border-zinc-800 bg-zinc-900/40 px-2.5 py-1.5 text-xs text-white focus:border-emerald-500 focus:outline-none"
                          placeholder="Alias"
                          value={rubroConfig.bank_details?.alias || ''}
                          onChange={(e) => handleRubroChange('alias', e.target.value, true)}
                        />
                      </div>
                      <div>
                        <label className="block text-[10px] text-zinc-500 uppercase font-bold tracking-wider">CBU / CVU</label>
                        <input
                          type="text"
                          className="mt-1 block w-full rounded-lg border border-zinc-800 bg-zinc-900/40 px-2.5 py-1.5 text-xs text-white focus:border-emerald-500 focus:outline-none"
                          placeholder="22 dígitos"
                          value={rubroConfig.bank_details?.cbu || ''}
                          onChange={(e) => handleRubroChange('cbu', e.target.value, true)}
                        />
                      </div>
                      <div>
                        <label className="block text-[10px] text-zinc-500 uppercase font-bold tracking-wider">Titular de Cuenta</label>
                        <input
                          type="text"
                          className="mt-1 block w-full rounded-lg border border-zinc-800 bg-zinc-900/40 px-2.5 py-1.5 text-xs text-white focus:border-emerald-500 focus:outline-none"
                          placeholder="Nombre Titular"
                          value={rubroConfig.bank_details?.titular || ''}
                          onChange={(e) => handleRubroChange('titular', e.target.value, true)}
                        />
                      </div>
                    </div>
                  </div>
                </div>
              ) : rubro === 'Peluquería' || rubro === 'Médico' ? (
                <div className="space-y-4">
                  <div>
                    <label className="block text-[11px] text-zinc-500 font-bold uppercase tracking-wider">Especialistas disponibles (separados por coma)</label>
                    <input
                      type="text"
                      className="mt-1.5 block w-full rounded-lg border border-zinc-800 bg-zinc-900/40 px-3 py-2 text-xs text-white focus:border-emerald-500 focus:outline-none"
                      placeholder="Ej: Carlos Ortiz, Sofía Gomez"
                      value={rubroConfig.specialists || ''}
                      onChange={(e) => handleRubroChange('specialists', e.target.value)}
                    />
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-[11px] text-zinc-500 font-bold uppercase tracking-wider">Duración Promedio de Turno (minutos)</label>
                      <input
                        type="number"
                        className="mt-1.5 block w-full rounded-lg border border-zinc-800 bg-zinc-900/40 px-3 py-2 text-xs text-white focus:border-emerald-500 focus:outline-none"
                        placeholder="Ej: 45"
                        value={rubroConfig.average_duration || ''}
                        onChange={(e) => handleRubroChange('average_duration', e.target.value)}
                      />
                    </div>
                    <div>
                      <label className="block text-[11px] text-zinc-500 font-bold uppercase tracking-wider">Políticas de Cancelación</label>
                      <input
                        type="text"
                        className="mt-1.5 block w-full rounded-lg border border-zinc-800 bg-zinc-900/40 px-3 py-2 text-xs text-white focus:border-emerald-500 focus:outline-none"
                        placeholder="Ej: Hasta 2 horas antes de la cita"
                        value={rubroConfig.cancellation_policy || ''}
                        onChange={(e) => handleRubroChange('cancellation_policy', e.target.value)}
                      />
                    </div>
                  </div>
                </div>
              ) : rubro === 'Gym' ? (
                <div className="space-y-4">
                  <div>
                    <label className="block text-[11px] text-zinc-500 font-bold uppercase tracking-wider">Disciplinas Deportivas (separadas por coma)</label>
                    <input
                      type="text"
                      className="mt-1.5 block w-full rounded-lg border border-zinc-800 bg-zinc-900/40 px-3 py-2 text-xs text-white focus:border-emerald-500 focus:outline-none"
                      placeholder="Ej: Crossfit, Zumba, Spinning"
                      value={rubroConfig.disciplines || ''}
                      onChange={(e) => handleRubroChange('disciplines', e.target.value)}
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] text-zinc-500 font-bold uppercase tracking-wider">Cronograma de Horarios</label>
                    <textarea
                      rows={4}
                      className="mt-1.5 block w-full rounded-lg border border-zinc-800 bg-zinc-900/40 px-3 py-2 text-xs text-white focus:border-emerald-500 focus:outline-none font-mono"
                      placeholder="Ej: Spinning: Lun y Mie a las 19:00..."
                      value={rubroConfig.class_schedules || ''}
                      onChange={(e) => handleRubroChange('class_schedules', e.target.value)}
                    />
                  </div>
                </div>
              ) : (
                // E-commerce o Personalizado
                <div className="space-y-4">
                  <p className="text-xs text-zinc-400">
                    Tu rubro no requiere parámetros específicos pre-diseñados. Puedes ingresar parámetros generales como texto libre a continuación:
                  </p>
                  <div>
                    <label className="block text-[11px] text-zinc-500 font-bold uppercase tracking-wider">Reglas Adicionales en formato de texto</label>
                    <textarea
                      rows={5}
                      className="mt-1.5 block w-full rounded-lg border border-zinc-800 bg-zinc-900/40 px-3 py-2 text-xs text-zinc-200 focus:border-emerald-500 focus:outline-none"
                      placeholder="Ej: Politica de Envíos: Los envíos se realizan por Correo Argentino y tardan entre 3 a 5 días..."
                      value={rubroConfig.generic_rules || ''}
                      onChange={(e) => handleRubroChange('generic_rules', e.target.value)}
                    />
                  </div>
                </div>
              )}
            </div>
          )}

          {/* TAB 3: FAQS Y PREGUNTAS FRECUENTES */}
          {activeTab === 'faqs' && (
            <div className="space-y-4">
              <div className="border-b border-zinc-850 pb-3">
                <h3 className="text-xs font-bold uppercase tracking-wider text-white">Base de Conocimiento de FAQ (Preguntas Frecuentes)</h3>
                <p className="text-[11px] text-zinc-500">
                  Agrega observaciones especiales, detalles de ubicación o respuestas a preguntas frecuentes para que la IA las resuelva sola.
                </p>
              </div>
              <textarea
                className="w-full h-80 rounded-xl border border-zinc-800 bg-zinc-900/40 p-4 text-xs font-mono text-zinc-200 focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500 transition-all leading-relaxed"
                placeholder="Ej: FAQ:&#10;- ¿Aceptan tarjeta? Sí, por link de pago.&#10;- ¿Tienen estacionamiento? Sí, gratuito por 1 hora."
                value={specialInstructions}
                onChange={(e) => setSpecialInstructions(e.target.value)} // Mapear a la variable de estado correcta
              />
              <div className="p-3 bg-zinc-900/40 border border-zinc-850 rounded-xl text-[10px] text-zinc-500 leading-relaxed">
                💡 <strong>Consejo del Diseñador:</strong> Escribe en formato simple de preguntas y respuestas. Gemini interpretará este texto libre de manera inteligente para dar respuesta a las dudas recurrentes.
              </div>
            </div>
          )}

        </div>
      </div>
    </div>
  )
}

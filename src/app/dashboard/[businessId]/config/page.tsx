'use client'

import React, { useState, useEffect, use } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Settings, MapPin, Phone, Share2, Map, Plus, Trash, Save, AlertCircle, Sparkles, Clock, Bot, MessageSquare } from 'lucide-react'

interface ShippingZone {
  id: string
  name: string
  cost: number
}

interface ConfigPageProps {
  params: Promise<{ businessId: string }>
}

export default function ConfigPage({ params }: ConfigPageProps) {
  const { businessId } = use(params)
  const supabase = createClient()

  // Estados del sistema
  const [isLoading, setIsLoading] = useState(true)
  const [isSaving, setIsSaving] = useState(false)
  const [dbConnected, setDbConnected] = useState(true)
  const [successMsg, setSuccessMsg] = useState('')
  const [errorMsg, setErrorMsg] = useState('')

  // Campos básicos
  const [businessName, setBusinessName] = useState('')
  const [rubro, setRubro] = useState('Personalizado')
  const [address, setAddress] = useState('')
  const [contactPhone, setContactPhone] = useState('')
  
  // Redes Sociales
  const [instagram, setInstagram] = useState('')
  const [facebook, setFacebook] = useState('')
  const [website, setWebsite] = useState('')

  // Zonas de Envío
  const [shippingZones, setShippingZones] = useState<ShippingZone[]>([])
  const [newZoneName, setNewZoneName] = useState('')
  const [newZoneCost, setNewZoneCost] = useState('')

  // --- Estados específicos de cada Rubro ---
  // Comida
  const [kitchenHours, setKitchenHours] = useState('')
  const [estimatedTime, setEstimatedTime] = useState('')
  const [bankAlias, setBankAlias] = useState('')
  const [bankCbu, setBankCbu] = useState('')
  const [bankTitular, setBankTitular] = useState('')
  
  // Peluquería
  const [specialists, setSpecialists] = useState('')
  const [averageDuration, setAverageDuration] = useState('')
  const [cancellationPolicy, setCancellationPolicy] = useState('')
  
  // Gym
  const [disciplines, setDisciplines] = useState('')
  const [classSchedules, setClassSchedules] = useState('')
  const [membershipPlans, setMembershipPlans] = useState('')
  
  // Médico
  const [specialties, setSpecialties] = useState('')
  const [acceptedInsurances, setAcceptedInsurances] = useState('')
  const [preRequisites, setPreRequisites] = useState('')
  
  // Hotel
  const [checkInTime, setCheckInTime] = useState('')
  const [checkOutTime, setCheckOutTime] = useState('')
  const [includedServices, setIncludedServices] = useState('')
  const [petFriendly, setPetFriendly] = useState(false)
  
  // Cursos
  const [modality, setModality] = useState('live')
  const [platform, setPlatform] = useState('')
  const [startDates, setStartDates] = useState('')
  const [syllabus, setSyllabus] = useState('')
  
  // Servicios
  const [consultationCost, setConsultationCost] = useState('')
  const [consultationType, setConsultationType] = useState('virtual')
  const [areas, setAreas] = useState('')
  
  // Automotriz
  const [acceptedVehicles, setAcceptedVehicles] = useState('')
  const [brands, setBrands] = useState('')
  const [baseQuotes, setBaseQuotes] = useState('')
  
  // Agencia
  const [bookingLink, setBookingLink] = useState('')
  const [agencySpecialties, setAgencySpecialties] = useState('')
  const [meetingType, setMeetingType] = useState('virtual')
  const [agencyType, setAgencyType] = useState('')
  
  // Personalizado
  const [keyValueFields, setKeyValueFields] = useState<{ key: string; value: string }[]>([])

  // iPhones (Cotizador)
  const [iphoneQuotingRanges, setIphoneQuotingRanges] = useState<{ name: string; min_price: string; max_price: string }[]>([])

  // --- Follow-up automático ---
  const [followupEnabled, setFollowupEnabled] = useState(false)
  const [followupHours, setFollowupHours] = useState('3')
  const [followupMode, setFollowupMode] = useState<'fixed' | 'ai'>('ai')
  const [followupFixedMessage, setFollowupFixedMessage] = useState('')

  // Cargar datos
  useEffect(() => {
    const fetchData = async () => {
      setIsLoading(true)
      try {
        // 1. Obtener datos del negocio
        const { data: biz, error: bizError } = await supabase
          .from('businesses')
          .select('name, rubro')
          .eq('id', businessId)
          .single()

        if (bizError) throw bizError
        if (biz) {
          setBusinessName(biz.name)
          setRubro(biz.rubro)
        }

        // 2. Obtener metadatos específicos
        const { data: metaData, error: metaError } = await supabase
          .from('business_rubro_data')
          .select('custom_metadata')
          .eq('business_id', businessId)
          .single()

        if (metaError && metaError.code !== 'PGRST116') throw metaError

        if (metaData?.custom_metadata) {
          const meta = metaData.custom_metadata
          setAddress(meta.address || '')
          setContactPhone(meta.contact_phone || '')
          setInstagram(meta.socials?.instagram || '')
          setFacebook(meta.socials?.facebook || '')
          setWebsite(meta.socials?.website || '')
          
          // Zonas de envío
          if (Array.isArray(meta.shipping_zones_list)) {
            setShippingZones(meta.shipping_zones_list)
          } else if (meta.shipping_zones) {
            const list = String(meta.shipping_zones)
              .split(',')
              .filter(Boolean)
              .map((name, idx) => ({
                id: `zone-${idx}`,
                name: name.trim(),
                cost: Number(meta.delivery_cost) || 0
              }))
            setShippingZones(list)
          }

          // Cargar variables de rubros
          setKitchenHours(meta.kitchen_hours || '')
          setEstimatedTime(meta.estimated_time || '')
          setBankAlias(meta.bank_details?.alias || '')
          setBankCbu(meta.bank_details?.cbu || '')
          setBankTitular(meta.bank_details?.titular || '')
          
          setSpecialists(meta.specialists || '')
          setAverageDuration(meta.average_duration || '')
          setCancellationPolicy(meta.cancellation_policy || '')
          
          setDisciplines(meta.disciplines || '')
          setClassSchedules(meta.class_schedules || '')
          setMembershipPlans(meta.membership_plans || '')
          
          setSpecialties(meta.specialties || '')
          setAcceptedInsurances(meta.accepted_insurances || '')
          setPreRequisites(meta.pre_requisites || '')
          
          setCheckInTime(meta.check_in_time || '')
          setCheckOutTime(meta.check_out_time || '')
          setIncludedServices(meta.included_services || '')
          setPetFriendly(!!meta.pet_friendly)
          
          setModality(meta.modality || 'live')
          setPlatform(meta.platform || '')
          setStartDates(meta.start_dates || '')
          setSyllabus(meta.syllabus || '')
          
          setConsultationCost(meta.consultation_cost || '')
          setConsultationType(meta.consultation_type || 'virtual')
          setAreas(meta.areas || '')
          
          setAcceptedVehicles(meta.accepted_vehicles || '')
          setBrands(meta.brands || '')
          setBaseQuotes(meta.base_quotes || '')
          
          setBookingLink(meta.booking_link || '')
          setAgencySpecialties(meta.agency_specialties || '')
          setMeetingType(meta.meeting_type || 'virtual')
          setAgencyType(meta.agency_type || '')
          
          setKeyValueFields(meta.keyValueFields || [{ key: '', value: '' }])
          setIphoneQuotingRanges(meta.iphone_quoting_ranges || [{ name: '', min_price: '', max_price: '' }])

          // Follow-up
          setFollowupEnabled(!!meta.followup_enabled)
          setFollowupHours(String(meta.followup_hours || '3'))
          setFollowupMode(meta.followup_mode || 'ai')
          setFollowupFixedMessage(meta.followup_fixed_message || '')
        }
      } catch (err: any) {
        console.warn("Fallo cargando configuraciones. Usando mocks locales.", err)
        setDbConnected(false)

        // Mock defaults según businessId
        if (businessId === 'demo-business-id' || businessId === 'demo-restaurante-id') {
          setBusinessName('Pizzería Bella (Demo)')
          setRubro('Comida')
          setAddress('Av. Corrientes 1234, CABA')
          setContactPhone('+54 11 4567-8901')
          setInstagram('pizzeriabella.ok')
          setFacebook('pizzeriabella')
          setWebsite('https://pizzeriabella.com')
          setKitchenHours('Mar a Dom de 19:30 a 23:30')
          setEstimatedTime('30 a 45 minutos')
          setBankAlias('PIZZA.BELLA.MP')
          setBankCbu('0000003100001234567890')
          setBankTitular('Pizza Bella SRL')
          setShippingZones([
            { id: 'z1', name: 'Palermo', cost: 150 },
            { id: 'z2', name: 'Belgrano', cost: 250 },
            { id: 'z3', name: 'Almagro', cost: 100 }
          ])
        } else if (businessId === 'demo-peluqueria-id') {
          setBusinessName('Barbería Royal (Demo)')
          setRubro('Peluquería')
          setAddress('Av. Santa Fe 2345, CABA')
          setContactPhone('+54 11 5678-9012')
          setInstagram('barberiaroyal')
          setWebsite('https://barberiaroyal.com')
          setSpecialists('Carlos Ortiz, Sofía Gómez')
          setAverageDuration('45')
          setCancellationPolicy('Permitido avisar hasta 2 horas antes de la cita.')
        } else if (businessId === 'demo-iphones-id' || businessId.includes('iphone')) {
          setBusinessName('iPhone Store (Demo)')
          setRubro('iPhones')
          setAddress('Av. Libertador 4567, CABA')
          setContactPhone('+54 11 3829-2819')
          setBankAlias('IPHONE.STORE.MP')
          setBankCbu('0000003100008888888888')
          setBankTitular('iPhone Store Canjes')
          setIphoneQuotingRanges([
            { name: 'iPhone 11 128GB', min_price: '250', max_price: '300' },
            { name: 'iPhone 12 128GB', min_price: '350', max_price: '420' },
            { name: 'iPhone 13 128GB', min_price: '480', max_price: '550' }
          ])
        } else {
          setBusinessName('Negocio Personalizado (Demo)')
          setRubro('Personalizado')
          setAddress('Calle Falsa 123')
          setContactPhone('+54 11 9999-9999')
          setKeyValueFields([
            { key: 'Políticas de Envío', value: 'Envío gratis en compras mayores a $15.000.' },
            { key: 'Garantía', value: 'Todos los productos tienen 3 meses de garantía oficial.' }
          ])
        }
      } finally {
        setIsLoading(false)
      }
    }

    fetchData()
  }, [businessId, supabase])

  // Guardar datos
  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSaving(true)
    setErrorMsg('')
    setSuccessMsg('')

    try {
      let currentMetadata: any = {}
      
      if (dbConnected && !businessId.startsWith('demo-') && businessId !== 'zapas-premium') {
        const { data } = await supabase
          .from('business_rubro_data')
          .select('custom_metadata')
          .eq('business_id', businessId)
          .single()
        
        if (data?.custom_metadata) {
          currentMetadata = data.custom_metadata
        }
      }

      // Consolidar la metadata completa
      const updatedMetadata = {
        ...currentMetadata,
        address: address,
        contact_phone: contactPhone,
        socials: {
          instagram,
          facebook,
          website
        },
        shipping_zones_list: shippingZones,
        shipping_zones: shippingZones.map(z => z.name).join(', '),
        delivery_cost: shippingZones[0]?.cost || 0,

        // Campos de rubros
        kitchen_hours: kitchenHours,
        estimated_time: estimatedTime,
        bank_details: {
          alias: bankAlias,
          cbu: bankCbu,
          titular: bankTitular
        },
        specialists,
        average_duration: averageDuration,
        cancellation_policy: cancellationPolicy,
        disciplines,
        class_schedules: classSchedules,
        membership_plans: membershipPlans,
        specialties,
        accepted_insurances: acceptedInsurances,
        pre_requisites: preRequisites,
        check_in_time: checkInTime,
        check_out_time: checkOutTime,
        included_services: includedServices,
        pet_friendly: petFriendly,
        modality,
        platform,
        start_dates: startDates,
        syllabus,
        consultation_cost: consultationCost,
        consultation_type: consultationType,
        areas,
        accepted_vehicles: acceptedVehicles,
        brands,
        base_quotes: baseQuotes,
        booking_link: bookingLink,
        agency_specialties: agencySpecialties,
        meeting_type: meetingType,
        agency_type: agencyType,
        keyValueFields,
        iphone_quoting_ranges: iphoneQuotingRanges,

        // Follow-up
        followup_enabled: followupEnabled,
        followup_hours: Number(followupHours) || 3,
        followup_mode: followupMode,
        followup_fixed_message: followupFixedMessage
      }

      if (!dbConnected || businessId.startsWith('demo-') || businessId === 'zapas-premium') {
        setTimeout(() => {
          setIsSaving(false)
          setSuccessMsg('Información comercial y de rubro guardada en memoria local.')
          setTimeout(() => setSuccessMsg(''), 4000)
        }, 800)
        return
      }

      const { error } = await supabase
        .from('business_rubro_data')
        .upsert({
          business_id: businessId,
          custom_metadata: updatedMetadata,
          updated_at: new Date().toISOString()
        })

      if (error) throw error

      setSuccessMsg('¡Datos del negocio y de rubro guardados correctamente!')
      setTimeout(() => setSuccessMsg(''), 4000)
    } catch (err: any) {
      console.error(err)
      setErrorMsg('No se pudieron guardar los cambios en la base de datos.')
    } finally {
      setIsSaving(false)
    }
  }

  // Agregar zona de envío
  const handleAddZone = () => {
    if (!newZoneName || !newZoneCost) return
    const newZone: ShippingZone = {
      id: `zone-${Math.floor(Math.random() * 1000)}`,
      name: newZoneName,
      cost: Number(newZoneCost)
    }
    setShippingZones(prev => [...prev, newZone])
    setNewZoneName('')
    setNewZoneCost('')
  }

  // Eliminar zona de envío
  const handleRemoveZone = (zoneId: string) => {
    setShippingZones(prev => prev.filter(z => z.id !== zoneId))
  }

  // Key-Values dinámicos
  const handleAddKeyValue = () => {
    setKeyValueFields(prev => [...prev, { key: '', value: '' }])
  }
  const handleRemoveKeyValue = (index: number) => {
    setKeyValueFields(prev => prev.filter((_, idx) => idx !== index))
  }
  const handleUpdateKeyValue = (index: number, field: 'key' | 'value', val: string) => {
    setKeyValueFields(prev => prev.map((item, idx) => idx === index ? { ...item, [field]: val } : item))
  }

  // iPhones cotizador handlers
  const handleAddIphoneRange = () => {
    setIphoneQuotingRanges(prev => [...prev, { name: '', min_price: '', max_price: '' }])
  }
  const handleRemoveIphoneRange = (index: number) => {
    setIphoneQuotingRanges(prev => prev.filter((_, idx) => idx !== index))
  }
  const handleUpdateIphoneRange = (index: number, field: 'name' | 'min_price' | 'max_price', val: string) => {
    setIphoneQuotingRanges(prev => prev.map((item, idx) => idx === index ? { ...item, [field]: val } : item))
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-20 text-xs text-zinc-500">
        Cargando perfil comercial...
      </div>
    )
  }

  const isDeliveryRubro = rubro === 'Comida' || rubro === 'E-commerce'

  return (
    <div className="space-y-6 font-sans">
      {!dbConnected && (
        <div className="p-3 bg-zinc-900/60 border border-zinc-850 text-zinc-400 rounded-xl text-xs flex items-center gap-2">
          <AlertCircle className="h-4 w-4 text-emerald-500" />
          <span><strong>Modo Demo Activo:</strong> Editando datos de simulación comercial de forma local.</span>
        </div>
      )}

      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-white flex items-center gap-2">
            <Settings className="h-5 w-5 text-emerald-500 animate-spin-slow" />
            Datos y Configuración del Negocio
          </h1>
          <p className="text-xs text-zinc-500">
            Administra la información de contacto, redes sociales y parámetros específicos que la IA usará para responder a los clientes.
          </p>
        </div>
      </div>

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

      <form onSubmit={handleSave} className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        
        {/* COLUMNA 1: INFORMACIÓN PÚBLICA Y REDES */}
        <div className="space-y-6">
          <div className="bg-zinc-950/20 border border-zinc-800 rounded-2xl p-6 space-y-4">
            <h2 className="text-xs font-bold text-white uppercase tracking-wider flex items-center gap-2 border-b border-zinc-850 pb-2.5">
              <MapPin className="h-4 w-4 text-emerald-500" />
              Ubicación y Contacto
            </h2>
            
            <div className="space-y-3">
              <div>
                <label className="block text-[10px] text-zinc-550 font-bold uppercase tracking-wider">Nombre Comercial</label>
                <input
                  type="text"
                  disabled
                  className="mt-1.5 block w-full rounded-lg border border-zinc-850 bg-zinc-900/10 px-3 py-2 text-xs text-zinc-400 cursor-not-allowed"
                  value={businessName}
                />
              </div>

              <div>
                <label className="block text-[10px] text-zinc-555 font-bold uppercase tracking-wider">Dirección Física</label>
                <input
                  type="text"
                  className="mt-1.5 block w-full rounded-lg border border-zinc-800 bg-zinc-900/40 px-3 py-2 text-xs text-white focus:border-emerald-500 focus:outline-none"
                  placeholder="Ej: Av. Rivadavia 4500, CABA"
                  value={address}
                  onChange={(e) => setAddress(e.target.value)}
                />
              </div>

              <div>
                <label className="block text-[10px] text-zinc-555 font-bold uppercase tracking-wider">Teléfono de Atención</label>
                <input
                  type="text"
                  className="mt-1.5 block w-full rounded-lg border border-zinc-800 bg-zinc-900/40 px-3 py-2 text-xs text-white focus:border-emerald-500 focus:outline-none"
                  placeholder="Ej: +54 11 1234-5678"
                  value={contactPhone}
                  onChange={(e) => setContactPhone(e.target.value)}
                />
              </div>
            </div>
          </div>

          <div className="bg-zinc-950/20 border border-zinc-800 rounded-2xl p-6 space-y-4">
            <h2 className="text-xs font-bold text-white uppercase tracking-wider flex items-center gap-2 border-b border-zinc-850 pb-2.5">
              <Share2 className="h-4 w-4 text-emerald-500" />
              Redes Sociales
            </h2>

            <div className="space-y-3">
              <div>
                <label className="block text-[10px] text-zinc-555 font-bold uppercase tracking-wider">Instagram (@usuario)</label>
                <input
                  type="text"
                  className="mt-1.5 block w-full rounded-lg border border-zinc-800 bg-zinc-900/40 px-3 py-2 text-xs text-white focus:border-emerald-500 focus:outline-none"
                  placeholder="Ej: mi_negocio.ok"
                  value={instagram}
                  onChange={(e) => setInstagram(e.target.value)}
                />
              </div>

              <div>
                <label className="block text-[10px] text-zinc-555 font-bold uppercase tracking-wider">Facebook Page</label>
                <input
                  type="text"
                  className="mt-1.5 block w-full rounded-lg border border-zinc-800 bg-zinc-900/40 px-3 py-2 text-xs text-white focus:border-emerald-500 focus:outline-none"
                  placeholder="Ej: facebook_negocio"
                  value={facebook}
                  onChange={(e) => setFacebook(e.target.value)}
                />
              </div>

              <div>
                <label className="block text-[10px] text-zinc-555 font-bold uppercase tracking-wider">Sitio Web (URL)</label>
                <input
                  type="text"
                  className="mt-1.5 block w-full rounded-lg border border-zinc-800 bg-zinc-900/40 px-3 py-2 text-xs text-white focus:border-emerald-500 focus:outline-none"
                  placeholder="Ej: https://minegocio.com"
                  value={website}
                  onChange={(e) => setWebsite(e.target.value)}
                />
              </div>
            </div>
          </div>
        </div>

        {/* COLUMNA 2: METADATOS ESPECÍFICOS DEL RUBRO */}
        <div className="space-y-6">
          
          {/* Ficha 1: Configuración específica del Rubro */}
          <div className="bg-zinc-950/20 border border-zinc-800 rounded-2xl p-6 space-y-4">
            <h2 className="text-xs font-bold text-white uppercase tracking-wider flex items-center gap-2 border-b border-zinc-850 pb-2.5">
              <Sparkles className="h-4 w-4 text-purple-400" />
              Configuración Específica: Rubro {rubro}
            </h2>
            <p className="text-[11px] text-zinc-500">
              Personaliza las respuestas de la IA ingresando detalles operativos del rubro.
            </p>

            <div className="space-y-4 pt-2">
              {rubro === 'Comida' && (
                <>
                  <div>
                    <label className="block text-[10px] text-zinc-450 uppercase font-bold tracking-wider">Horarios de Cocina / Pedidos</label>
                    <input
                      type="text"
                      className="mt-1.5 block w-full rounded-lg border border-zinc-800 bg-zinc-900/40 px-3 py-2 text-xs text-white focus:border-purple-500 focus:outline-none"
                      placeholder="Ej: Mar a Dom de 19:30 a 23:30"
                      value={kitchenHours}
                      onChange={(e) => setKitchenHours(e.target.value)}
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] text-zinc-450 uppercase font-bold tracking-wider">Tiempo Estimado de Entrega</label>
                    <input
                      type="text"
                      className="mt-1.5 block w-full rounded-lg border border-zinc-800 bg-zinc-900/40 px-3 py-2 text-xs text-white focus:border-purple-500 focus:outline-none"
                      placeholder="Ej: 30 a 45 minutos"
                      value={estimatedTime}
                      onChange={(e) => setEstimatedTime(e.target.value)}
                    />
                  </div>
                  <div className="p-3 border border-zinc-900 rounded-xl bg-zinc-950/30 space-y-2">
                    <span className="text-[10px] font-bold text-zinc-450 uppercase tracking-wider block">Datos de Transferencia Bancaria</span>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                      <div>
                        <label className="text-[9px] text-zinc-500 uppercase">Alias CBU</label>
                        <input
                          type="text"
                          className="mt-1 block w-full rounded border border-zinc-850 bg-zinc-900/40 px-2 py-1 text-xs text-white"
                          value={bankAlias}
                          onChange={(e) => setBankAlias(e.target.value)}
                        />
                      </div>
                      <div>
                        <label className="text-[9px] text-zinc-500 uppercase">CBU / CVU</label>
                        <input
                          type="text"
                          className="mt-1 block w-full rounded border border-zinc-850 bg-zinc-900/40 px-2 py-1 text-xs text-white"
                          value={bankCbu}
                          onChange={(e) => setBankCbu(e.target.value)}
                        />
                      </div>
                    </div>
                    <div>
                      <label className="text-[9px] text-zinc-500 uppercase">Titular de Cuenta</label>
                      <input
                        type="text"
                        className="mt-1 block w-full rounded border border-zinc-850 bg-zinc-900/40 px-2 py-1 text-xs text-white"
                        value={bankTitular}
                        onChange={(e) => setBankTitular(e.target.value)}
                      />
                    </div>
                  </div>
                </>
              )}

              {rubro === 'Peluquería' && (
                <>
                  <div>
                    <label className="block text-[10px] text-zinc-450 uppercase font-bold tracking-wider">Estilistas / Especialistas disponibles</label>
                    <input
                      type="text"
                      className="mt-1.5 block w-full rounded-lg border border-zinc-800 bg-zinc-900/40 px-3 py-2 text-xs text-white focus:border-purple-500 focus:outline-none"
                      placeholder="Ej: Carlos Ortiz, Sofía Gomez"
                      value={specialists}
                      onChange={(e) => setSpecialists(e.target.value)}
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] text-zinc-450 uppercase font-bold tracking-wider">Duración Promedio de Cita (minutos)</label>
                    <input
                      type="number"
                      className="mt-1.5 block w-full rounded-lg border border-zinc-800 bg-zinc-900/40 px-3 py-2 text-xs text-white focus:border-purple-500 focus:outline-none"
                      value={averageDuration}
                      onChange={(e) => setAverageDuration(e.target.value)}
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] text-zinc-450 uppercase font-bold tracking-wider">Políticas de Cancelación</label>
                    <textarea
                      rows={2}
                      className="mt-1.5 block w-full rounded-lg border border-zinc-800 bg-zinc-900/40 px-3 py-2 text-xs text-white focus:border-purple-500 focus:outline-none resize-none"
                      placeholder="Ej: Avisar con 2 hs de anticipación."
                      value={cancellationPolicy}
                      onChange={(e) => setCancellationPolicy(e.target.value)}
                    />
                  </div>
                </>
              )}

              {rubro === 'Gym' && (
                <>
                  <div>
                    <label className="block text-[10px] text-zinc-450 uppercase font-bold tracking-wider">Disciplinas Disponibles</label>
                    <input
                      type="text"
                      className="mt-1.5 block w-full rounded-lg border border-zinc-800 bg-zinc-900/40 px-3 py-2 text-xs text-white focus:border-purple-500 focus:outline-none"
                      placeholder="Ej: Crossfit, Spinning, Funcional"
                      value={disciplines}
                      onChange={(e) => setDisciplines(e.target.value)}
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] text-zinc-450 uppercase font-bold tracking-wider">Horarios de Clases</label>
                    <textarea
                      rows={2}
                      className="mt-1.5 block w-full rounded-lg border border-zinc-800 bg-zinc-900/40 px-3 py-2 text-xs text-white focus:border-purple-500 focus:outline-none resize-none"
                      placeholder="Ej: Crossfit: Lun a Vie 8:00 y 18:00"
                      value={classSchedules}
                      onChange={(e) => setClassSchedules(e.target.value)}
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] text-zinc-450 uppercase font-bold tracking-wider">Planes de Membresía (Precios)</label>
                    <textarea
                      rows={2}
                      className="mt-1.5 block w-full rounded-lg border border-zinc-800 bg-zinc-900/40 px-3 py-2 text-xs text-white focus:border-purple-500 focus:outline-none resize-none"
                      placeholder="Ej: Pase Libre: $15.000/mes"
                      value={membershipPlans}
                      onChange={(e) => setMembershipPlans(e.target.value)}
                    />
                  </div>
                </>
              )}

              {rubro === 'Médico' && (
                <>
                  <div>
                    <label className="block text-[10px] text-zinc-450 uppercase font-bold tracking-wider">Especialidades Médicas</label>
                    <input
                      type="text"
                      className="mt-1.5 block w-full rounded-lg border border-zinc-800 bg-zinc-900/40 px-3 py-2 text-xs text-white focus:border-purple-500 focus:outline-none"
                      placeholder="Ej: Pediatría, Cardiología"
                      value={specialties}
                      onChange={(e) => setSpecialties(e.target.value)}
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] text-zinc-450 uppercase font-bold tracking-wider">Obras Sociales Aceptadas</label>
                    <input
                      type="text"
                      className="mt-1.5 block w-full rounded-lg border border-zinc-800 bg-zinc-900/40 px-3 py-2 text-xs text-white focus:border-purple-500 focus:outline-none"
                      placeholder="Ej: OSDE, Medicus, Galeno"
                      value={acceptedInsurances}
                      onChange={(e) => setAcceptedInsurances(e.target.value)}
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] text-zinc-450 uppercase font-bold tracking-wider">Requisitos para Estudios / Visita</label>
                    <textarea
                      rows={2}
                      className="mt-1.5 block w-full rounded-lg border border-zinc-800 bg-zinc-900/40 px-3 py-2 text-xs text-white focus:border-purple-500 focus:outline-none resize-none"
                      placeholder="Ej: Ecografía: Ayuno de 8 horas."
                      value={preRequisites}
                      onChange={(e) => setPreRequisites(e.target.value)}
                    />
                  </div>
                </>
              )}

              {rubro === 'Hotel' && (
                <>
                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <label className="text-[10px] text-zinc-450 uppercase font-bold tracking-wider">Check-in</label>
                      <input
                        type="text"
                        className="mt-1 block w-full rounded border border-zinc-850 bg-zinc-900/40 px-2 py-1.5 text-xs text-white"
                        placeholder="14:00"
                        value={checkInTime}
                        onChange={(e) => setCheckInTime(e.target.value)}
                      />
                    </div>
                    <div>
                      <label className="text-[10px] text-zinc-450 uppercase font-bold tracking-wider">Check-out</label>
                      <input
                        type="text"
                        className="mt-1 block w-full rounded border border-zinc-850 bg-zinc-900/40 px-2 py-1.5 text-xs text-white"
                        placeholder="10:00"
                        value={checkOutTime}
                        onChange={(e) => setCheckOutTime(e.target.value)}
                      />
                    </div>
                  </div>
                  <div>
                    <label className="block text-[10px] text-zinc-450 uppercase font-bold tracking-wider">Servicios Incluidos</label>
                    <input
                      type="text"
                      className="mt-1.5 block w-full rounded-lg border border-zinc-800 bg-zinc-900/40 px-3 py-2 text-xs text-white focus:border-purple-500 focus:outline-none"
                      placeholder="Ej: Wi-Fi, Piscina, Desayuno"
                      value={includedServices}
                      onChange={(e) => setIncludedServices(e.target.value)}
                    />
                  </div>
                  <div className="flex items-center space-x-2">
                    <input
                      type="checkbox"
                      id="pet_friendly"
                      checked={petFriendly}
                      onChange={(e) => setPetFriendly(e.target.checked)}
                      className="h-4 w-4 rounded border-zinc-800 bg-zinc-900 text-purple-600 focus:ring-purple-500"
                    />
                    <label htmlFor="pet_friendly" className="text-xs text-zinc-400 select-none">
                      Mascotas Permitidas (Pet Friendly)
                    </label>
                  </div>
                </>
              )}

              {rubro === 'Cursos' && (
                <>
                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <label className="text-[10px] text-zinc-450 uppercase font-bold tracking-wider">Modalidad</label>
                      <select
                        value={modality}
                        onChange={(e) => setModality(e.target.value)}
                        className="mt-1 block w-full rounded border border-zinc-850 bg-zinc-900/40 px-2 py-1.5 text-xs text-white"
                      >
                        <option value="live">En Vivo (Zoom/Meet)</option>
                        <option value="recorded">Grabado (Hotmart)</option>
                        <option value="presential">Presencial</option>
                      </select>
                    </div>
                    <div>
                      <label className="text-[10px] text-zinc-450 uppercase font-bold tracking-wider">Plataforma</label>
                      <input
                        type="text"
                        className="mt-1 block w-full rounded border border-zinc-850 bg-zinc-900/40 px-2 py-1.5 text-xs text-white"
                        placeholder="Zoom"
                        value={platform}
                        onChange={(e) => setPlatform(e.target.value)}
                      />
                    </div>
                  </div>
                  <div>
                    <label className="block text-[10px] text-zinc-450 uppercase font-bold tracking-wider">Fechas de Inicio / Cohortes</label>
                    <input
                      type="text"
                      className="mt-1.5 block w-full rounded-lg border border-zinc-800 bg-zinc-900/40 px-3 py-2 text-xs text-white focus:border-purple-500 focus:outline-none"
                      placeholder="Ej: Inicia el 15 de Julio"
                      value={startDates}
                      onChange={(e) => setStartDates(e.target.value)}
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] text-zinc-450 uppercase font-bold tracking-wider">Temarios / Syllabus</label>
                    <textarea
                      rows={2}
                      className="mt-1.5 block w-full rounded-lg border border-zinc-800 bg-zinc-900/40 px-3 py-2 text-xs text-white focus:border-purple-500 focus:outline-none resize-none"
                      placeholder="Ej: Mod 1: Introducción, Mod 2: Práctica"
                      value={syllabus}
                      onChange={(e) => setSyllabus(e.target.value)}
                    />
                  </div>
                </>
              )}

              {rubro === 'Servicios' && (
                <>
                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <label className="text-[10px] text-zinc-450 uppercase font-bold tracking-wider">Costo Consulta ($)</label>
                      <input
                        type="number"
                        className="mt-1 block w-full rounded border border-zinc-850 bg-zinc-900/40 px-2 py-1.5 text-xs text-white"
                        value={consultationCost}
                        onChange={(e) => setConsultationCost(e.target.value)}
                      />
                    </div>
                    <div>
                      <label className="text-[10px] text-zinc-450 uppercase font-bold tracking-wider">Modalidad</label>
                      <select
                        value={consultationType}
                        onChange={(e) => setConsultationType(e.target.value)}
                        className="mt-1 block w-full rounded border border-zinc-850 bg-zinc-900/40 px-2 py-1.5 text-xs text-white"
                      >
                        <option value="virtual">Virtual (Videollamada)</option>
                        <option value="presential">Presencial (Oficina)</option>
                        <option value="both">Híbrido (Ambas)</option>
                      </select>
                    </div>
                  </div>
                  <div>
                    <label className="block text-[10px] text-zinc-450 uppercase font-bold tracking-wider">Áreas de Expertise</label>
                    <input
                      type="text"
                      className="mt-1.5 block w-full rounded-lg border border-zinc-800 bg-zinc-900/40 px-3 py-2 text-xs text-white focus:border-purple-500 focus:outline-none"
                      placeholder="Ej: Contabilidad, Abogacía, Diseño"
                      value={areas}
                      onChange={(e) => setAreas(e.target.value)}
                    />
                  </div>
                </>
              )}

              {rubro === 'Automotriz' && (
                <>
                  <div>
                    <label className="block text-[10px] text-zinc-450 uppercase font-bold tracking-wider">Vehículos Aceptados</label>
                    <input
                      type="text"
                      className="mt-1.5 block w-full rounded-lg border border-zinc-800 bg-zinc-900/40 px-3 py-2 text-xs text-white focus:border-purple-500 focus:outline-none"
                      placeholder="Ej: Autos, Motos, Camionetas"
                      value={acceptedVehicles}
                      onChange={(e) => setAcceptedVehicles(e.target.value)}
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] text-zinc-450 uppercase font-bold tracking-wider">Especialista en Marcas</label>
                    <input
                      type="text"
                      className="mt-1.5 block w-full rounded-lg border border-zinc-800 bg-zinc-900/40 px-3 py-2 text-xs text-white focus:border-purple-500 focus:outline-none"
                      placeholder="Ej: Toyota, Honda, Ford"
                      value={brands}
                      onChange={(e) => setBrands(e.target.value)}
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] text-zinc-450 uppercase font-bold tracking-wider">Cotizaciones Base</label>
                    <textarea
                      rows={2}
                      className="mt-1.5 block w-full rounded-lg border border-zinc-800 bg-zinc-900/40 px-3 py-2 text-xs text-white focus:border-purple-500 focus:outline-none resize-none"
                      placeholder="Ej: Lavado simple: $2500"
                      value={baseQuotes}
                      onChange={(e) => setBaseQuotes(e.target.value)}
                    />
                  </div>
                </>
              )}

              {rubro === 'Agencia' && (
                <>
                  <div>
                    <label className="block text-[10px] text-zinc-450 uppercase font-bold tracking-wider">Calendario de Reserva (Link Calendly / Google)</label>
                    <input
                      type="text"
                      className="mt-1.5 block w-full rounded-lg border border-zinc-800 bg-zinc-900/40 px-3 py-2 text-xs text-white focus:border-purple-500 focus:outline-none"
                      placeholder="Ej: https://calendly.com/mi-agencia/consulta"
                      value={bookingLink}
                      onChange={(e) => setBookingLink(e.target.value)}
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <label className="text-[10px] text-zinc-450 uppercase font-bold tracking-wider">Tipo de Agencia</label>
                      <input
                        type="text"
                        className="mt-1 block w-full rounded border border-zinc-850 bg-zinc-900/40 px-2 py-1.5 text-xs text-white"
                        placeholder="Ej: Marketing, Automatizaciones"
                        value={agencyType}
                        onChange={(e) => setAgencyType(e.target.value)}
                      />
                    </div>
                    <div>
                      <label className="text-[10px] text-zinc-450 uppercase font-bold tracking-wider">Tipo de Reunión</label>
                      <select
                        value={meetingType}
                        onChange={(e) => setMeetingType(e.target.value)}
                        className="mt-1 block w-full rounded border border-zinc-850 bg-zinc-900/40 px-2 py-1.5 text-xs text-white"
                      >
                        <option value="virtual">Videollamada</option>
                        <option value="presential">Presencial</option>
                        <option value="both">Híbrido (Ambas)</option>
                      </select>
                    </div>
                  </div>
                  <div>
                    <label className="block text-[10px] text-zinc-450 uppercase font-bold tracking-wider">Especialidades / Servicios clave</label>
                    <input
                      type="text"
                      className="mt-1.5 block w-full rounded-lg border border-zinc-800 bg-zinc-900/40 px-3 py-2 text-xs text-white focus:border-purple-500 focus:outline-none"
                      placeholder="Ej: Campañas de Meta Ads, Bots de WhatsApp, Diseño Web"
                      value={agencySpecialties}
                      onChange={(e) => setAgencySpecialties(e.target.value)}
                    />
                  </div>
                </>
              )}

              {rubro === 'iPhones' && (
                <>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-2">
                    <div>
                      <label className="text-[10px] text-zinc-450 uppercase font-bold tracking-wider">Alias Transferencia</label>
                      <input
                        type="text"
                        className="mt-1 block w-full rounded border border-zinc-850 bg-zinc-900/40 px-2 py-1.5 text-xs text-white"
                        placeholder="Alias"
                        value={bankAlias}
                        onChange={(e) => setBankAlias(e.target.value)}
                      />
                    </div>
                    <div>
                      <label className="text-[10px] text-zinc-450 uppercase font-bold tracking-wider">CBU / CVU</label>
                      <input
                        type="text"
                        className="mt-1 block w-full rounded border border-zinc-850 bg-zinc-900/40 px-2 py-1.5 text-xs text-white"
                        placeholder="22 dígitos"
                        value={bankCbu}
                        onChange={(e) => setBankCbu(e.target.value)}
                      />
                    </div>
                    <div>
                      <label className="text-[10px] text-zinc-450 uppercase font-bold tracking-wider">Titular de Cuenta</label>
                      <input
                        type="text"
                        className="mt-1 block w-full rounded border border-zinc-850 bg-zinc-900/40 px-2 py-1.5 text-xs text-white"
                        placeholder="Nombre"
                        value={bankTitular}
                        onChange={(e) => setBankTitular(e.target.value)}
                      />
                    </div>
                  </div>

                  <div className="flex items-center justify-between border-t border-zinc-900 pt-4 mt-2">
                    <div>
                      <span className="text-[10px] text-zinc-450 uppercase font-bold block">Cotizador de iPhones (Canjes / Compras)</span>
                      <span className="text-[9px] text-zinc-500 mt-0.5 block">Configura el rango en USD por el que el Bot cotizará cada modelo usado.</span>
                    </div>
                    <button
                      type="button"
                      onClick={handleAddIphoneRange}
                      className="px-2.5 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-[10px] font-bold text-white transition-colors"
                    >
                      + Añadir Modelo
                    </button>
                  </div>
                  <div className="space-y-2 max-h-[280px] overflow-y-auto pr-1">
                    {iphoneQuotingRanges.map((item, index) => (
                      <div key={index} className="flex gap-2 items-center">
                        <input
                          type="text"
                          placeholder="Modelo (ej: iPhone 11 128GB)"
                          className="flex-[2] rounded border border-zinc-850 bg-zinc-900/40 px-2.5 py-1.5 text-xs text-white"
                          value={item.name}
                          onChange={(e) => handleUpdateIphoneRange(index, 'name', e.target.value)}
                        />
                        <input
                          type="number"
                          placeholder="Mínimo USD"
                          className="flex-1 rounded border border-zinc-850 bg-zinc-900/40 px-2.5 py-1.5 text-xs text-white font-mono"
                          value={item.min_price}
                          onChange={(e) => handleUpdateIphoneRange(index, 'min_price', e.target.value)}
                        />
                        <input
                          type="number"
                          placeholder="Máximo USD"
                          className="flex-1 rounded border border-zinc-850 bg-zinc-900/40 px-2.5 py-1.5 text-xs text-white font-mono"
                          value={item.max_price}
                          onChange={(e) => handleUpdateIphoneRange(index, 'max_price', e.target.value)}
                        />
                        {iphoneQuotingRanges.length > 1 && (
                          <button
                            type="button"
                            onClick={() => handleRemoveIphoneRange(index)}
                            className="px-2 py-1.5 rounded border border-red-900/30 text-red-500 bg-red-950/10 hover:bg-red-950/20 text-xs font-bold transition-all"
                          >
                            Eliminar
                          </button>
                        )}
                      </div>
                    ))}
                  </div>
                </>
              )}

              {rubro === 'Personalizado' && (
                <>
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] text-zinc-450 uppercase font-bold">Campos Dinámicos Key-Value</span>
                    <button
                      type="button"
                      onClick={handleAddKeyValue}
                      className="px-2 py-1 rounded bg-zinc-900 text-[10px] text-zinc-250 border border-zinc-850 hover:bg-zinc-800"
                    >
                      + Añadir Campo
                    </button>
                  </div>
                  <div className="space-y-2 max-h-[220px] overflow-y-auto pr-1">
                    {keyValueFields.map((item, index) => (
                      <div key={index} className="flex gap-1.5 items-center">
                        <input
                          type="text"
                          placeholder="Pregunta / Dato"
                          className="flex-1 rounded border border-zinc-850 bg-zinc-900/40 px-2 py-1 text-xs text-white"
                          value={item.key}
                          onChange={(e) => handleUpdateKeyValue(index, 'key', e.target.value)}
                        />
                        <input
                          type="text"
                          placeholder="Respuesta / Detalle"
                          className="flex-1 rounded border border-zinc-850 bg-zinc-900/40 px-2 py-1 text-xs text-white"
                          value={item.value}
                          onChange={(e) => handleUpdateKeyValue(index, 'value', e.target.value)}
                        />
                        <button
                          type="button"
                          onClick={() => handleRemoveKeyValue(index)}
                          className="text-red-500 text-[11px] p-1.5 hover:bg-red-500/10 rounded"
                        >
                          ✕
                        </button>
                      </div>
                    ))}
                  </div>
                </>
              )}
            </div>
          </div>

          {/* Ficha 2: Tarifas de Envíos por Zona (Oculto para rubros que no sean Comida o E-commerce) */}
          {isDeliveryRubro && (
            <div className="bg-zinc-950/20 border border-zinc-800 rounded-2xl p-6 space-y-4 flex flex-col justify-between">
              <div>
                <h2 className="text-xs font-bold text-white uppercase tracking-wider flex items-center gap-2 border-b border-zinc-850 pb-2.5">
                  <Map className="h-4 w-4 text-emerald-500" />
                  Tarifas de Envíos y Zonas
                </h2>
                <p className="text-[11px] text-zinc-500 mt-2">
                  Define las zonas a las que llega tu delivery o paquetería y el costo de envío correspondiente.
                </p>

                {/* Formulario rápido para añadir zona */}
                <div className="mt-4 grid grid-cols-5 gap-2 items-end">
                  <div className="col-span-3">
                    <label className="block text-[9px] text-zinc-500 uppercase font-bold tracking-wider">Nombre Zona</label>
                    <input
                      type="text"
                      className="mt-1 block w-full rounded-lg border border-zinc-800 bg-zinc-900/40 px-2.5 py-1.5 text-xs text-white focus:border-emerald-500 focus:outline-none"
                      placeholder="Ej: San Isidro"
                      value={newZoneName}
                      onChange={(e) => setNewZoneName(e.target.value)}
                    />
                  </div>
                  <div className="col-span-1.5">
                    <label className="block text-[9px] text-zinc-500 uppercase font-bold tracking-wider">Costo ($)</label>
                    <input
                      type="number"
                      className="mt-1 block w-full rounded-lg border border-zinc-800 bg-zinc-900/40 px-2.5 py-1.5 text-xs text-white focus:border-emerald-500 focus:outline-none"
                      placeholder="250"
                      value={newZoneCost}
                      onChange={(e) => setNewZoneCost(e.target.value)}
                    />
                  </div>
                  <div className="col-span-0.5">
                    <button
                      type="button"
                      onClick={handleAddZone}
                      className="h-8 w-8 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white flex items-center justify-center transition-colors cursor-pointer"
                    >
                      <Plus className="h-4 w-4" />
                    </button>
                  </div>
                </div>

                {/* Listado de zonas añadidas */}
                <div className="mt-6 space-y-2 max-h-[160px] overflow-y-auto pr-1">
                  {shippingZones.length === 0 ? (
                    <div className="text-center py-8 text-[11px] text-zinc-650">No hay zonas configuradas. Envíos a convenir.</div>
                  ) : (
                    shippingZones.map((zone) => (
                      <div
                        key={zone.id}
                        className="p-2.5 border border-zinc-850 bg-zinc-900/20 rounded-xl flex items-center justify-between"
                      >
                        <span className="font-bold text-zinc-200">{zone.name}</span>
                        <div className="flex items-center gap-3">
                          <span className="font-mono text-emerald-400 font-bold bg-emerald-500/5 px-2 py-0.5 rounded text-xs border border-emerald-500/10">
                            ${zone.cost.toFixed(2)}
                          </span>
                          <button
                            type="button"
                            onClick={() => handleRemoveZone(zone.id)}
                            className="text-red-500 hover:text-red-400 transition-colors p-1 cursor-pointer"
                          >
                            <Trash className="h-4 w-4" />
                          </button>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>
            </div>
          )}

          {/* Sección: Follow-up Automático */}
          <div className="bg-zinc-950/20 border border-zinc-800 rounded-2xl p-6 space-y-4">
            <h2 className="text-xs font-bold text-white uppercase tracking-wider flex items-center gap-2 border-b border-zinc-800 pb-2.5">
              <Clock className="h-4 w-4 text-amber-400" />
              Seguimiento Automático (Follow-up)
            </h2>
            <p className="text-[11px] text-zinc-500 leading-relaxed">
              Si un chat queda sin concretar pedido, el bot envía un mensaje de seguimiento automático dentro del horario de atención y antes de las 24 hs (límite de Meta).
            </p>

            {/* Toggle activar */}
            <div className="flex items-center justify-between p-3 rounded-xl bg-zinc-900/40 border border-zinc-800">
              <div>
                <p className="text-xs font-semibold text-white">Activar seguimiento automático</p>
                <p className="text-[10px] text-zinc-500 mt-0.5">El bot enviará un mensaje unas horas después del último mensaje del cliente si no se generó un pedido.</p>
              </div>
              <button
                type="button"
                onClick={() => setFollowupEnabled(p => !p)}
                className={`relative w-11 h-6 rounded-full transition-colors cursor-pointer ${
                  followupEnabled ? 'bg-amber-500' : 'bg-zinc-700'
                }`}
              >
                <span className={`absolute top-0.5 left-0.5 w-5 h-5 rounded-full bg-white shadow transition-transform ${
                  followupEnabled ? 'translate-x-5' : 'translate-x-0'
                }`} />
              </button>
            </div>

            {followupEnabled && (
              <div className="space-y-4 pt-1">
                {/* Horas de espera */}
                <div>
                  <label className="block text-[10px] text-zinc-450 uppercase font-bold tracking-wider">
                    Horas de espera tras el último mensaje
                  </label>
                  <div className="mt-1.5 flex items-center gap-3">
                    <input
                      type="number"
                      min="1"
                      max="23"
                      className="w-24 rounded-lg border border-zinc-800 bg-zinc-900/40 px-3 py-2 text-xs text-white focus:border-amber-500 focus:outline-none"
                      value={followupHours}
                      onChange={(e) => setFollowupHours(e.target.value)}
                    />
                    <span className="text-xs text-zinc-500">horas (máx. 23 hs para respetar el límite de 24 hs de Meta)</span>
                  </div>
                </div>

                {/* Modo: IA o Mensaje Fijo */}
                <div>
                  <label className="block text-[10px] text-zinc-450 uppercase font-bold tracking-wider mb-2">Tipo de mensaje</label>
                  <div className="grid grid-cols-2 gap-2">
                    <button
                      type="button"
                      onClick={() => setFollowupMode('ai')}
                      className={`flex items-center gap-2 p-3 rounded-xl border text-xs font-semibold transition-all cursor-pointer ${
                        followupMode === 'ai'
                          ? 'border-amber-500/60 bg-amber-500/10 text-amber-300'
                          : 'border-zinc-800 bg-zinc-900/30 text-zinc-400 hover:border-zinc-700'
                      }`}
                    >
                      <Bot className="h-4 w-4" />
                      Generado por IA
                    </button>
                    <button
                      type="button"
                      onClick={() => setFollowupMode('fixed')}
                      className={`flex items-center gap-2 p-3 rounded-xl border text-xs font-semibold transition-all cursor-pointer ${
                        followupMode === 'fixed'
                          ? 'border-amber-500/60 bg-amber-500/10 text-amber-300'
                          : 'border-zinc-800 bg-zinc-900/30 text-zinc-400 hover:border-zinc-700'
                      }`}
                    >
                      <MessageSquare className="h-4 w-4" />
                      Mensaje fijo
                    </button>
                  </div>
                </div>

                {followupMode === 'ai' && (
                  <div className="p-3 rounded-xl bg-amber-500/5 border border-amber-500/20 text-[11px] text-amber-300 leading-relaxed">
                    <strong>Modo IA:</strong> El bot analizará el contexto de la conversación y generará un mensaje de seguimiento personalizado y natural para intentar retomar el interés del cliente.
                  </div>
                )}

                {followupMode === 'fixed' && (
                  <div>
                    <label className="block text-[10px] text-zinc-450 uppercase font-bold tracking-wider">Mensaje de seguimiento</label>
                    <textarea
                      rows={3}
                      className="mt-1.5 block w-full rounded-lg border border-zinc-800 bg-zinc-900/40 px-3 py-2 text-xs text-white focus:border-amber-500 focus:outline-none resize-none"
                      placeholder="Ej: ¡Hola! 👋 ¿Pudiste ver nuestro menú? Estamos para ayudarte cuando quieras."
                      value={followupFixedMessage}
                      onChange={(e) => setFollowupFixedMessage(e.target.value)}
                    />
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Botón de guardar global */}
          <div className="bg-zinc-950/20 border border-zinc-800 rounded-2xl p-6 flex justify-end">
            <button
              type="submit"
              disabled={isSaving}
              className="rounded-xl bg-emerald-600 px-6 py-3 text-xs font-bold text-white hover:bg-emerald-500 transition-all shadow-lg shadow-emerald-600/10 flex items-center gap-2 disabled:opacity-50 cursor-pointer"
            >
              <Save className="h-4 w-4" />
              {isSaving ? 'Guardando...' : 'Guardar Información'}
            </button>
          </div>
          
        </div>
      </form>
    </div>
  )
}

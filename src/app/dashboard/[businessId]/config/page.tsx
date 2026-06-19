'use client'

import React, { useState, useEffect, use } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Settings, MapPin, Phone, Share2, Map, Plus, Trash, Save, AlertCircle, Globe } from 'lucide-react'

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
  const [address, setAddress] = useState('')
  const [contactPhone, setContactPhone] = useState('')
  
  // Redes Sociales
  const [instagram, setInstagram] = useState('')
  const [facebook, setFacebook] = useState('')
  const [website, setWebsite] = useState('')

  // Zonas de Envío (Array dinámico)
  const [shippingZones, setShippingZones] = useState<ShippingZone[]>([])
  const [newZoneName, setNewZoneName] = useState('')
  const [newZoneCost, setNewZoneCost] = useState('')

  // Cargar datos
  useEffect(() => {
    const fetchData = async () => {
      setIsLoading(true)
      try {
        // 1. Obtener datos de la empresa
        const { data: biz, error: bizError } = await supabase
          .from('businesses')
          .select('name')
          .eq('id', businessId)
          .single()

        if (bizError) throw bizError
        if (biz) {
          setBusinessName(biz.name)
        }

        // 2. Obtener metadatos específicos del rubro
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
            // Convertir texto separado por comas a array estructurado inicial si existía
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
        }
      } catch (err: any) {
        console.warn("Fallo cargando configuraciones. Usando mocks locales.", err)
        setDbConnected(false)

        // Mock defaults
        if (businessId === 'demo-business-id') {
          setBusinessName('Pizzería Bella (Demo)')
          setAddress('Av. Corrientes 1234, CABA')
          setContactPhone('+54 11 4567-8901')
          setInstagram('pizzeriabella.ok')
          setFacebook('pizzeriabella')
          setWebsite('https://pizzeriabella.com')
          setShippingZones([
            { id: 'z1', name: 'Palermo', cost: 150 },
            { id: 'z2', name: 'Belgrano', cost: 250 },
            { id: 'z3', name: 'Almagro', cost: 100 }
          ])
        } else {
          setBusinessName('Zapas Premium (Demo)')
          setAddress('Av. Santa Fe 2345, CABA')
          setContactPhone('+54 11 5678-9012')
          setInstagram('zapaspremium.ar')
          setWebsite('https://zapaspremium.com.ar')
          setShippingZones([
            { id: 'z1', name: 'Capital Federal', cost: 400 },
            { id: 'z2', name: 'Gran Buenos Aires', cost: 750 }
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
      // Leer metadata actual primero para no sobreescribir otros campos de IA
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

      // Consolidar la metadata
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
        // Mantener compatibilidad con los campos antiguos que lee el bot
        shipping_zones: shippingZones.map(z => z.name).join(', '),
        delivery_cost: shippingZones[0]?.cost || 0
      }

      if (!dbConnected || businessId.startsWith('demo-') || businessId === 'zapas-premium') {
        setTimeout(() => {
          setIsSaving(false)
          setSuccessMsg('Información comercial guardada temporalmente.')
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

      setSuccessMsg('¡Datos de negocio guardados correctamente!')
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

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-20 text-xs text-zinc-500">
        Cargando perfil comercial...
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Alerta demo */}
      {!dbConnected && (
        <div className="p-3 bg-zinc-900/60 border border-zinc-800 text-zinc-400 rounded-xl text-xs flex items-center gap-2">
          <AlertCircle className="h-4 w-4 text-emerald-500" />
          <span><strong>Modo Demo Activo:</strong> Configurando datos del perfil de forma local.</span>
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
            Administra la dirección física, tarifas de envío regional y redes sociales de tu negocio.
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

      {/* Formulario */}
      <form onSubmit={handleSave} className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        
        {/* COLUMNA 1: INFORMACIÓN PÚBLICA Y REDES */}
        <div className="space-y-6">
          
          {/* Ficha 1: Datos Básicos */}
          <div className="bg-zinc-950/20 border border-zinc-800 rounded-2xl p-6 space-y-4">
            <h2 className="text-xs font-bold text-white uppercase tracking-wider flex items-center gap-2 border-b border-zinc-850 pb-2.5">
              <MapPin className="h-4 w-4 text-emerald-500" />
              Ubicación y Contacto
            </h2>
            
            <div className="space-y-3">
              <div>
                <label className="block text-[10px] text-zinc-500 font-bold uppercase tracking-wider">Nombre Comercial</label>
                <input
                  type="text"
                  disabled
                  className="mt-1.5 block w-full rounded-lg border border-zinc-850 bg-zinc-900/10 px-3 py-2 text-xs text-zinc-400 cursor-not-allowed"
                  value={businessName}
                />
              </div>

              <div>
                <label className="block text-[10px] text-zinc-500 font-bold uppercase tracking-wider">Dirección Física</label>
                <input
                  type="text"
                  className="mt-1.5 block w-full rounded-lg border border-zinc-800 bg-zinc-900/40 px-3 py-2 text-xs text-white focus:border-emerald-500 focus:outline-none"
                  placeholder="Ej: Av. Rivadavia 4500, CABA"
                  value={address}
                  onChange={(e) => setAddress(e.target.value)}
                />
              </div>

              <div>
                <label className="block text-[10px] text-zinc-500 font-bold uppercase tracking-wider">Teléfono de Atención</label>
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

          {/* Ficha 2: Redes Sociales */}
          <div className="bg-zinc-950/20 border border-zinc-800 rounded-2xl p-6 space-y-4">
            <h2 className="text-xs font-bold text-white uppercase tracking-wider flex items-center gap-2 border-b border-zinc-850 pb-2.5">
              <Share2 className="h-4 w-4 text-emerald-500" />
              Redes Sociales & Canales
            </h2>

            <div className="space-y-3">
              <div>
                <label className="block text-[10px] text-zinc-500 font-bold uppercase tracking-wider">Instagram (@usuario)</label>
                <input
                  type="text"
                  className="mt-1.5 block w-full rounded-lg border border-zinc-800 bg-zinc-900/40 px-3 py-2 text-xs text-white focus:border-emerald-500 focus:outline-none"
                  placeholder="Ej: mi_negocio.ok"
                  value={instagram}
                  onChange={(e) => setInstagram(e.target.value)}
                />
              </div>

              <div>
                <label className="block text-[10px] text-zinc-500 font-bold uppercase tracking-wider">Facebook Page (Username)</label>
                <input
                  type="text"
                  className="mt-1.5 block w-full rounded-lg border border-zinc-800 bg-zinc-900/40 px-3 py-2 text-xs text-white focus:border-emerald-500 focus:outline-none"
                  placeholder="Ej: facebook_negocio"
                  value={facebook}
                  onChange={(e) => setFacebook(e.target.value)}
                />
              </div>

              <div>
                <label className="block text-[10px] text-zinc-500 font-bold uppercase tracking-wider">Sitio Web (URL)</label>
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

        {/* COLUMNA 2: TARIFAS DE ENVÍOS POR ZONA */}
        <div className="space-y-6">
          <div className="bg-zinc-950/20 border border-zinc-800 rounded-2xl p-6 space-y-4 flex flex-col justify-between h-full">
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
                    className="h-8 w-8 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white flex items-center justify-center transition-colors"
                  >
                    <Plus className="h-4 w-4" />
                  </button>
                </div>
              </div>

              {/* Listado de zonas añadidas */}
              <div className="mt-6 space-y-2 max-h-[200px] overflow-y-auto pr-1">
                {shippingZones.length === 0 ? (
                  <div className="text-center py-10 text-[11px] text-zinc-600">No hay zonas configuradas. Los envíos se asumen a convenir.</div>
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
                          className="text-red-500 hover:text-red-400 transition-colors p-1"
                        >
                          <Trash className="h-4 w-4" />
                        </button>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>

            {/* Acciones principales del Formulario */}
            <div className="pt-4 border-t border-zinc-850 flex justify-end">
              <button
                type="submit"
                disabled={isSaving}
                className="rounded-xl bg-emerald-600 px-5 py-2.5 text-xs font-bold text-white hover:bg-emerald-500 transition-all shadow-lg shadow-emerald-600/10 flex items-center gap-2 disabled:opacity-50"
              >
                <Save className="h-4 w-4" />
                {isSaving ? 'Guardando...' : 'Guardar Información'}
              </button>
            </div>

          </div>
        </div>

      </form>
    </div>
  )
}

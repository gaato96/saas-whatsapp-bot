'use client'

import React, { useEffect, useState, use, useRef } from 'react'
import { createClient } from '@/lib/supabase/client'
import { FileText, Plus, X, Upload, CheckCircle, Image as ImageIcon, Trash2, Edit, Save, Loader2 } from 'lucide-react'
import { DolarWidget } from '@/components/dolar-widget'

interface Product {
  id: string
  business_id: string
  name: string
  description: string
  price: number
  stock: number
  is_active: boolean
  image_url?: string | null
}

// Ítem parseado desde el texto libre antes de confirmar la importación
interface ParsedItem {
  name: string
  description: string
  price: number
}

interface ProductsPageProps {
  params: Promise<{ businessId: string }>
}

// ─────────────────────────────────────────────
// Parser de menú en texto libre
// Detecta líneas del tipo:
//   - Triple Cheese $2100
//   - Pizza Muzzarella: $1.500
//   Coca Cola 500ml  ........ $400
//   Papas fritas (medianas) - 350
// Guarda la categoría anterior como descripción
// ─────────────────────────────────────────────
function parseMenuText(text: string): ParsedItem[] {
  const lines = text.split('\n').map(l => l.trim()).filter(Boolean)
  const items: ParsedItem[] = []
  let currentCategory = ''

  for (const line of lines) {
    // Detectar si la línea es sólo un encabezado de categoría (sin precio)
    const pricePattern = /\$[\d.,]+|\d[\d.,]+\s*(?:pesos|ars)?$/i
    const hasPrice = pricePattern.test(line)

    if (!hasPrice) {
      // Es una categoría/separador (ej: "Hamburguesas", "--- Bebidas ---", "PIZZAS:")
      const clean = line.replace(/^[-*=#\s]+|[-*=#:\s]+$/g, '').trim()
      if (clean.length > 0 && clean.length < 50) {
        currentCategory = clean
      }
      continue
    }

    // Extraer precio: buscar el último número con $ o al final de línea
    const priceMatch = line.match(/\$\s*([\d.,]+)|(?:^|[\s\-–])(\d{2,6})(?:\s*(?:pesos|ars)?)\s*$/i)
    if (!priceMatch) continue

    const rawPrice = (priceMatch[1] || priceMatch[2]).replace(/\./g, '').replace(',', '.')
    const price = parseFloat(rawPrice)
    if (isNaN(price) || price <= 0) continue

    // El nombre es todo lo que queda sin el precio y sin bullets/guiones iniciales
    const nameRaw = line
      .replace(/\$\s*[\d.,]+/, '')           // quitar $precio
      .replace(/\b\d{2,6}\s*(?:pesos|ars)?\s*$/i, '') // quitar precio sin $
      .replace(/^[-*•·\s]+/, '')             // quitar bullets iniciales
      .replace(/[:\-–.]+\s*$/, '')           // quitar separadores al final
      .trim()

    if (nameRaw.length < 2) continue

    items.push({
      name: nameRaw,
      description: currentCategory,
      price,
    })
  }

  return items
}

export default function ProductsPage({ params }: ProductsPageProps) {
  const { businessId } = use(params)
  const supabase = createClient()

  const [products, setProducts] = useState<Product[]>([])
  const [dbConnected, setDbConnected] = useState(true)
  const [isLoading, setIsLoading] = useState(true)
  const [errorMsg, setErrorMsg] = useState('')

  // Vista activa: 'catalog' | 'add' | 'import'
  const [activeView, setActiveView] = useState<'catalog' | 'add' | 'import'>('catalog')

  // Formulario de agregar uno
  const [name, setName] = useState('')
  const [description, setDescription] = useState('')
  const [price, setPrice] = useState('')
  const [imageUrl, setImageUrl] = useState('')
  const [imageFile, setImageFile] = useState<File | null>(null)
  const [isUploadingImage, setIsUploadingImage] = useState(false)

  // Formulario de edición modal
  const [editingProduct, setEditingProduct] = useState<Product | null>(null)
  const [editName, setEditName] = useState('')
  const [editDescription, setEditDescription] = useState('')
  const [editPrice, setEditPrice] = useState('')
  const [editStock, setEditStock] = useState('')
  const [editImageUrl, setEditImageUrl] = useState('')
  const [editImageFile, setEditImageFile] = useState<File | null>(null)
  const [isSavingEdit, setIsSavingEdit] = useState(false)

  const [rubro, setRubro] = useState<string>('Personalizado')
  const [batteryHealth, setBatteryHealth] = useState('100')
  const [aestheticCondition, setAestheticCondition] = useState('Excelente')
  const [storage, setStorage] = useState('128GB')
  const [color, setColor] = useState('Negro')
  const [stockQty, setStockQty] = useState('1')

  // Importación masiva
  const [menuText, setMenuText] = useState('')
  const [parsedItems, setParsedItems] = useState<ParsedItem[]>([])
  const [isParsed, setIsParsed] = useState(false)
  const [isImporting, setIsImporting] = useState(false)
  const [importResult, setImportResult] = useState<{ imported: number; skipped: number } | null>(null)

  // Feedback inline al editar precio
  const [savingStates, setSavingStates] = useState<{ [id: string]: 'idle' | 'saving' | 'saved' | 'error' }>({})

  // ── Cargar Catálogo ──────────────────────────────────────
  useEffect(() => {
    const fetchProducts = async () => {
      setIsLoading(true)
      try {
        // Obtener rubro del negocio
        const { data: bizData } = await supabase
          .from('businesses')
          .select('rubro')
          .eq('id', businessId)
          .single()
        
        if (bizData) {
          setRubro(bizData.rubro)
        }

        const { data, error } = await supabase
          .from('products_services')
          .select('id, business_id, name, description, price, stock, is_active, image_url')
          .eq('business_id', businessId)
          .order('created_at', { ascending: false })

        if (error) throw error
        setProducts(data || [])
      } catch (err) {
        setDbConnected(false)
        
        // Cargar mocks según rubro
        if (businessId.includes('iphone') || businessId === 'demo-iphones-id') {
          setRubro('iPhones')
          setProducts([
            { id: 'p1', business_id: businessId, name: 'iPhone 11 Pro', description: 'Batería: 85% | Estética: Excelente | Almacenamiento: 128GB | Color: Space Gray', price: 320, stock: 1, is_active: true },
            { id: 'p2', business_id: businessId, name: 'iPhone 12', description: 'Batería: 90% | Estética: Como Nuevo | Almacenamiento: 128GB | Color: Azul', price: 440, stock: 1, is_active: true },
            { id: 'p3', business_id: businessId, name: 'iPhone 13 Pro Max', description: 'Batería: 94% | Estética: Excelente | Almacenamiento: 256GB | Color: Sierra Blue', price: 680, stock: 0, is_active: true },
          ])
        } else {
          setProducts([
            { id: 'p1', business_id: businessId, name: 'Pizza Muzzarella Individual', description: 'Pizzas', price: 1500, stock: 0, is_active: true },
            { id: 'p2', business_id: businessId, name: 'Hamburguesa Triple Cheese', description: 'Hamburguesas', price: 2100, stock: 0, is_active: true },
            { id: 'p3', business_id: businessId, name: 'Papas Fritas Medianas', description: 'Guarniciones', price: 350, stock: 0, is_active: true },
            { id: 'p4', business_id: businessId, name: 'Coca Cola 500ml', description: 'Bebidas', price: 400, stock: 0, is_active: true },
          ])
        }
      } finally {
        setIsLoading(false)
      }
    }
    fetchProducts()
  }, [businessId, supabase])

  const handleAddProduct = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!name || !price) return
    setIsUploadingImage(true)
    setErrorMsg('')

    let finalImageUrl = imageUrl.trim() || null

    try {
      // Si hay archivo seleccionado, subirlo al storage de Supabase
      if (imageFile && dbConnected) {
        const fileExt = imageFile.name.split('.').pop()
        const fileName = `${businessId}/${Date.now()}.${fileExt}`
        const { error: uploadError } = await supabase.storage
          .from('product-images')
          .upload(fileName, imageFile)

        if (uploadError) throw uploadError

        const { data: linkData } = supabase.storage
          .from('product-images')
          .getPublicUrl(fileName)

        if (linkData) {
          finalImageUrl = linkData.publicUrl
        }
      } else if (imageFile && !dbConnected) {
        finalImageUrl = 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=200&auto=format&fit=crop'
      }

      // Si es iPhones, el campo description se compone de los atributos custom
      const finalDescription = rubro === 'iPhones'
        ? `Batería: ${batteryHealth}% | Estética: ${aestheticCondition} | Almacenamiento: ${storage} | Color: ${color}`
        : description

      const payload = { 
        business_id: businessId, 
        name, 
        description: finalDescription, 
        price: parseFloat(price), 
        stock: parseInt(stockQty) || (rubro === 'Comida' ? 0 : 1),
        is_active: true,
        image_url: finalImageUrl
      }

      if (!dbConnected) {
        setProducts(prev => [{ id: `mock-${Date.now()}`, ...payload }, ...prev])
      } else {
        const { data, error } = await supabase.from('products_services').insert(payload).select().single()
        if (error) throw error
        if (data) setProducts(prev => [data, ...prev])
      }

      setName(''); setDescription(''); setPrice(''); setStockQty('1')
      setImageUrl(''); setImageFile(null)
      // Resetear campos custom
      setBatteryHealth('100')
      setAestheticCondition('Excelente')
      setStorage('128GB')
      setColor('Negro')
      setActiveView('catalog')
    } catch (err: any) {
      setErrorMsg('No se pudo guardar: ' + err.message)
    } finally {
      setIsUploadingImage(false)
    }
  }

  // Abrir modal de edición
  const handleStartEdit = (p: Product) => {
    setEditingProduct(p)
    setEditName(p.name)
    setEditDescription(p.description || '')
    setEditPrice(String(p.price))
    setEditStock(String(p.stock ?? 0))
    setEditImageUrl(p.image_url || '')
    setEditImageFile(null)
  }

  // Guardar edición modal
  const handleSaveProductEdit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!editingProduct) return
    setIsSavingEdit(true)
    setErrorMsg('')

    let finalImageUrl = editImageUrl.trim() || null

    try {
      if (editImageFile && dbConnected) {
        const fileExt = editImageFile.name.split('.').pop()
        const fileName = `${businessId}/${Date.now()}.${fileExt}`
        const { error: uploadError } = await supabase.storage
          .from('product-images')
          .upload(fileName, editImageFile)

        if (uploadError) throw uploadError

        const { data: linkData } = supabase.storage
          .from('product-images')
          .getPublicUrl(fileName)

        if (linkData) {
          finalImageUrl = linkData.publicUrl
        }
      } else if (editImageFile && !dbConnected) {
        finalImageUrl = 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=200&auto=format&fit=crop'
      }

      const payload = {
        name: editName,
        description: editDescription,
        price: parseFloat(editPrice) || 0,
        stock: parseInt(editStock) || 0,
        image_url: finalImageUrl
      }

      if (!dbConnected) {
        setProducts(prev => prev.map(p => p.id === editingProduct.id ? { ...p, ...payload } : p))
      } else {
        const { data, error } = await supabase
          .from('products_services')
          .update(payload)
          .eq('id', editingProduct.id)
          .select()
          .single()

        if (error) throw error
        if (data) {
          setProducts(prev => prev.map(p => p.id === editingProduct.id ? data : p))
        }
      }

      setEditingProduct(null)
    } catch (err: any) {
      setErrorMsg('No se pudo actualizar: ' + err.message)
    } finally {
      setIsSavingEdit(false)
    }
  }

  // ── Parser preview ───────────────────────────────────────
  const handleParsePreview = () => {
    const items = parseMenuText(menuText)
    setParsedItems(items)
    setIsParsed(true)
    setImportResult(null)
  }

  const updateParsedItem = (index: number, field: keyof ParsedItem, value: string) => {
    setParsedItems(prev => prev.map((item, i) =>
      i === index ? { ...item, [field]: field === 'price' ? parseFloat(value) || 0 : value } : item
    ))
  }

  const removeParsedItem = (index: number) => {
    setParsedItems(prev => prev.filter((_, i) => i !== index))
  }

  // ── Importar masivo ──────────────────────────────────────
  const handleBulkImport = async () => {
    if (parsedItems.length === 0) return
    setIsImporting(true)
    let imported = 0
    let skipped = 0

    try {
      const payload = parsedItems
        .filter(item => item.name && item.price > 0)
        .map(item => ({
          business_id: businessId,
          name: item.name,
          description: item.description || '',
          price: item.price,
          stock: 0,
          is_active: true,
        }))

      if (!dbConnected) {
        const mocks: Product[] = payload.map((p, i) => ({ id: `mock-${Date.now()}-${i}`, ...p }))
        setProducts(prev => [...mocks, ...prev])
        imported = mocks.length
        skipped = parsedItems.length - imported
      } else {
        const { data, error } = await supabase.from('products_services').insert(payload).select()
        if (error) throw error
        imported = (data || []).length
        skipped = parsedItems.length - imported
        setProducts(prev => [...(data || []), ...prev])
      }

      setImportResult({ imported, skipped })
      setMenuText('')
      setParsedItems([])
      setIsParsed(false)
    } catch (err: any) {
      setErrorMsg('Error al importar: ' + err.message)
    } finally {
      setIsImporting(false)
    }
  }

  // ── Edición inline de precio ─────────────────────────────
  const saveInlinePrice = async (productId: string, value: string) => {
    const parsed = parseFloat(value)
    if (isNaN(parsed) || parsed < 0) return
    setSavingStates(prev => ({ ...prev, [productId]: 'saving' }))
    try {
      if (!dbConnected) {
        setProducts(prev => prev.map(p => p.id === productId ? { ...p, price: parsed } : p))
      } else {
        const { error } = await supabase.from('products_services').update({ price: parsed }).eq('id', productId)
        if (error) throw error
        setProducts(prev => prev.map(p => p.id === productId ? { ...p, price: parsed } : p))
      }
      setSavingStates(prev => ({ ...prev, [productId]: 'saved' }))
      setTimeout(() => setSavingStates(prev => ({ ...prev, [productId]: 'idle' })), 1500)
    } catch {
      setSavingStates(prev => ({ ...prev, [productId]: 'error' }))
    }
  }

  // ── Edición inline de stock ──────────────────────────────
  const saveInlineStock = async (productId: string, value: string) => {
    const parsed = parseInt(value)
    if (isNaN(parsed) || parsed < 0) return
    setSavingStates(prev => ({ ...prev, [productId]: 'saving' }))
    try {
      if (!dbConnected) {
        setProducts(prev => prev.map(p => p.id === productId ? { ...p, stock: parsed } : p))
      } else {
        const { error } = await supabase.from('products_services').update({ stock: parsed }).eq('id', productId)
        if (error) throw error
        setProducts(prev => prev.map(p => p.id === productId ? { ...p, stock: parsed } : p))
      }
      setSavingStates(prev => ({ ...prev, [productId]: 'saved' }))
      setTimeout(() => setSavingStates(prev => ({ ...prev, [productId]: 'idle' })), 1500)
    } catch {
      setSavingStates(prev => ({ ...prev, [productId]: 'error' }))
    }
  }

  // ── Toggle activo ─────────────────────────────────────────
  const handleToggleActive = async (productId: string, current: boolean) => {
    try {
      if (!dbConnected) {
        setProducts(prev => prev.map(p => p.id === productId ? { ...p, is_active: !current } : p))
        return
      }
      const { error } = await supabase.from('products_services').update({ is_active: !current }).eq('id', productId)
      if (error) throw error
      setProducts(prev => prev.map(p => p.id === productId ? { ...p, is_active: !current } : p))
    } catch { alert('Error al actualizar estado.') }
  }

  // ── Eliminar ──────────────────────────────────────────────
  const handleDelete = async (productId: string) => {
    if (!confirm('¿Eliminar este ítem del catálogo permanentemente?')) return
    try {
      if (!dbConnected) { setProducts(prev => prev.filter(p => p.id !== productId)); return }
      const { error } = await supabase.from('products_services').delete().eq('id', productId)
      if (error) throw error
      setProducts(prev => prev.filter(p => p.id !== productId))
    } catch { alert('Error al eliminar.') }
  }

  const inputClass = 'mt-1.5 block w-full rounded-lg border border-zinc-800 bg-zinc-900/50 px-3 py-2 text-xs text-white placeholder-zinc-600 focus:border-purple-500 focus:outline-none transition-all'

  return (
    <div className="space-y-6">
      {!dbConnected && (
        <div className="p-3 bg-zinc-900 border border-zinc-800 text-zinc-400 rounded-xl text-xs">
          ⚠️ <strong>Modo Demo:</strong> Los cambios son temporales en esta sesión.
        </div>
      )}

      {/* Header */}
      <div className="flex items-center justify-between gap-4 flex-wrap">
        <div>
          <h1 className="text-xl font-bold text-white">
            {rubro === 'iPhones'    ? 'Inventario de Equipos'
            : rubro === 'E-commerce' ? 'Catálogo e Inventario'
            : rubro === 'Cursos'     ? 'Cursos y Programas'
            : rubro === 'Agencia'    ? 'Servicios y Propuestas'
            : rubro === 'Médico' || rubro === 'Peluquería' || rubro === 'Gym' || rubro === 'Hotel' || rubro === 'Automotriz' || rubro === 'Servicios' ? 'Servicios'
            : rubro === 'Comida'     ? 'Menú'
            : 'Catálogo / Stock'}
          </h1>
          <p className="text-xs text-zinc-500">
            {rubro === 'iPhones'
              ? 'El bot lee estos equipos en tiempo real para asesorar y vender. Precios en USD.'
              : rubro === 'Cursos'
              ? 'El bot lee estos cursos para responder consultas y tomar inscripciones.'
              : rubro === 'Agencia'
              ? 'El bot lee estos servicios para cotizar y cerrar propuestas.'
              : 'El bot de WhatsApp lee estos ítems en tiempo real para responder consultas y tomar pedidos.'}
          </p>
        </div>
        <div className="flex gap-4 items-center flex-wrap">
          {rubro === 'iPhones' && (
            <div className="w-60 text-left shrink-0">
              <DolarWidget />
            </div>
          )}
          <div className="flex gap-2">
            {/* Cargar Menú Completo SOLO para Comida */}
            {rubro === 'Comida' && (
              <button
                onClick={() => setActiveView(activeView === 'import' ? 'catalog' : 'import')}
                className={`rounded-xl px-4 py-2.5 text-xs font-bold border transition-all flex items-center gap-1.5 ${activeView === 'import' ? 'bg-emerald-600 border-emerald-500 text-white shadow-lg shadow-emerald-600/10' : 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400 hover:bg-emerald-500/20'}`}
              >
                <FileText className="h-3.5 w-3.5" />
                Cargar Menú Completo
              </button>
            )}
            <button
              onClick={() => setActiveView(activeView === 'add' ? 'catalog' : 'add')}
              className={`rounded-xl px-4 py-2.5 text-xs font-bold border transition-all flex items-center gap-1.5 ${activeView === 'add' ? 'bg-purple-600 border-purple-500 text-white' : 'bg-purple-500/10 border-purple-500/20 text-purple-400 hover:bg-purple-500/20'}`}
            >
              <Plus className="h-3.5 w-3.5" />
              {rubro === 'iPhones' ? 'Agregar Equipo' : rubro === 'Cursos' ? 'Agregar Curso' : rubro === 'Agencia' ? 'Agregar Servicio' : 'Agregar Ítem'}
            </button>
          </div>
        </div>
      </div>

      {errorMsg && (
        <div className="p-3 bg-red-500/10 border border-red-500/20 text-red-400 rounded-xl text-xs">❌ {errorMsg}</div>
      )}

      {/* ─── PANEL: IMPORTAR MENÚ COMPLETO (solo Comida) ─── */}
      {activeView === 'import' && rubro === 'Comida' && (
        <div className="p-6 border border-emerald-500/20 bg-zinc-950 rounded-2xl space-y-5 shadow-md shadow-emerald-500/5">
          <div>
            <h2 className="text-sm font-bold text-white flex items-center gap-2">
              <FileText className="h-4 w-4 text-emerald-400" />
              Importar Menú Completo
            </h2>
            <p className="text-[11px] text-zinc-500 mt-1">
              Pegá tu carta tal como la tenés (en WhatsApp, Google Docs, papel escaneado, etc.). El sistema detecta los nombres y precios automáticamente.
            </p>
          </div>

          <div className="p-3 rounded-xl bg-zinc-900/60 border border-zinc-800 text-[11px] text-zinc-400 space-y-1">
            <p className="font-semibold text-zinc-300 mb-1.5">Formatos soportados:</p>
            <p>• <span className="font-mono text-zinc-300">Hamburguesas</span> → encabezado de categoría</p>
            <p>• <span className="font-mono text-zinc-300">- Triple Cheese $2100</span></p>
            <p>• <span className="font-mono text-zinc-300">Pizza Muzzarella: $1.500</span></p>
            <p>• <span className="font-mono text-zinc-300">Coca Cola 500ml ......... $400</span></p>
          </div>

          {!isParsed ? (
            <>
              <textarea
                rows={12}
                className="w-full rounded-xl border border-zinc-800 bg-zinc-900/40 px-4 py-3 text-xs text-white placeholder-zinc-600 focus:border-emerald-500 focus:outline-none transition-all font-mono leading-relaxed resize-y"
                placeholder={`Hamburguesas\n- Triple Cheese $2100\n- Doble BBQ $1800\n\nBebidas\n- Coca Cola 500ml $400\n- Agua Mineral $200\n\nGuarniciones\n- Papas Fritas Medianas $350\n- Papas con queso $500`}
                value={menuText}
                onChange={e => setMenuText(e.target.value)}
              />
              <div className="flex justify-end">
                <button
                  onClick={handleParsePreview}
                  disabled={menuText.trim().length < 5}
                  className="rounded-xl bg-emerald-600 px-5 py-2.5 text-xs font-bold text-white hover:bg-emerald-500 disabled:opacity-40 transition-all"
                >
                  Detectar Ítems →
                </button>
              </div>
            </>
          ) : (
            <>
              {importResult ? (
                <div className="p-4 bg-emerald-500/10 border border-emerald-500/20 rounded-xl text-sm text-emerald-400 flex items-center gap-3">
                  <CheckCircle className="h-5 w-5 shrink-0" />
                  <div>
                    <p className="font-bold">¡Importación completada!</p>
                    <p className="text-[11px] text-emerald-300/80 mt-0.5">{importResult.imported} ítems importados al catálogo.</p>
                  </div>
                  <button
                    onClick={() => { setImportResult(null); setActiveView('catalog') }}
                    className="ml-auto text-emerald-400 hover:text-white transition-colors"
                  >
                    <X className="h-4 w-4" />
                  </button>
                </div>
              ) : (
                <>
                  <div className="flex items-center justify-between">
                    <p className="text-xs font-semibold text-zinc-300">
                      {parsedItems.length === 0 ? '⚠️ No se detectaron ítems con precio.' : `✓ ${parsedItems.length} ítem${parsedItems.length !== 1 ? 's' : ''} detectado${parsedItems.length !== 1 ? 's' : ''} — revisá y editá antes de importar`}
                    </p>
                    <button onClick={() => { setIsParsed(false); setParsedItems([]) }} className="text-[10px] text-zinc-500 hover:text-zinc-300 transition-colors underline">
                      ← Editar texto
                    </button>
                  </div>

                  {parsedItems.length > 0 && (
                    <div className="border border-zinc-900 rounded-xl overflow-hidden">
                      <table className="w-full text-xs text-left border-collapse">
                        <thead>
                          <tr className="border-b border-zinc-900 text-[10px] uppercase tracking-wider text-zinc-500 bg-zinc-950 font-semibold">
                            <th className="px-4 py-3">Nombre del ítem</th>
                            <th className="px-4 py-3">Categoría / Descripción</th>
                            <th className="px-4 py-3 text-right w-32">Precio ($)</th>
                            <th className="px-4 py-3 text-center w-16"></th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-zinc-900/40">
                          {parsedItems.map((item, i) => (
                            <tr key={i} className="hover:bg-zinc-900/20 transition-colors">
                              <td className="px-4 py-2.5">
                                <input
                                  type="text"
                                  value={item.name}
                                  onChange={e => updateParsedItem(i, 'name', e.target.value)}
                                  className="bg-transparent border-b border-transparent focus:border-zinc-700 w-full text-white focus:outline-none py-0.5 transition-all"
                                />
                              </td>
                              <td className="px-4 py-2.5">
                                <input
                                  type="text"
                                  value={item.description}
                                  onChange={e => updateParsedItem(i, 'description', e.target.value)}
                                  className="bg-transparent border-b border-transparent focus:border-zinc-700 w-full text-zinc-400 focus:outline-none py-0.5 transition-all"
                                  placeholder="Sin categoría"
                                />
                              </td>
                              <td className="px-4 py-2.5 text-right">
                                <input
                                  type="number"
                                  value={item.price}
                                  onChange={e => updateParsedItem(i, 'price', e.target.value)}
                                  className="bg-transparent border-b border-transparent focus:border-zinc-700 w-24 text-right text-emerald-400 font-mono font-bold focus:outline-none py-0.5 transition-all"
                                />
                              </td>
                              <td className="px-4 py-2.5 text-center">
                                <button onClick={() => removeParsedItem(i)} className="text-zinc-600 hover:text-red-400 transition-colors" title="Eliminar ítem">
                                  <X className="h-3.5 w-3.5" />
                                </button>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}

                  <div className="flex justify-between items-center pt-1">
                    <p className="text-[10px] text-zinc-600">Podés editar nombre, categoría y precio antes de confirmar</p>
                    <button
                      onClick={handleBulkImport}
                      disabled={parsedItems.length === 0 || isImporting}
                      className="rounded-xl bg-emerald-600 px-5 py-2.5 text-xs font-bold text-white hover:bg-emerald-500 disabled:opacity-40 transition-all flex items-center gap-2"
                    >
                      <Upload className="h-3.5 w-3.5" />
                      {isImporting ? 'Importando...' : `Importar ${parsedItems.length} ítem${parsedItems.length !== 1 ? 's' : ''} al catálogo`}
                    </button>
                  </div>
                </>
              )}
            </>
          )}
        </div>
      )}

      {/* ─── PANEL: AGREGAR UNO ─── */}
      {activeView === 'add' && (
        <form onSubmit={handleAddProduct} className="p-6 border border-zinc-900 bg-zinc-950 rounded-2xl max-w-2xl space-y-4 shadow-sm">
          <h2 className="text-xs font-bold text-white uppercase tracking-wider flex items-center gap-1.5">
            <Plus className="h-3.5 w-3.5 text-purple-400" />
            {rubro === 'iPhones' ? 'Nuevo iPhone al Inventario (USD)' : 'Nuevo Ítem al Catálogo'}
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-[11px] text-zinc-500 font-bold uppercase tracking-wider">
                {rubro === 'iPhones' ? 'Modelo de iPhone *' : 'Nombre del Ítem *'}
              </label>
              <input type="text" required className={inputClass} placeholder={rubro === 'iPhones' ? 'Ej: iPhone 12 Pro Max' : 'Ej: Pasta Frola Membrillo'} value={name} onChange={e => setName(e.target.value)} />
            </div>
            <div>
              <label className="block text-[11px] text-zinc-500 font-bold uppercase tracking-wider">
                {rubro === 'iPhones' ? 'Precio (USD) *' : 'Precio ($) *'}
              </label>
              <input type="number" step="0.01" required className={inputClass} placeholder={rubro === 'iPhones' ? 'Ej: 520' : 'Ej: 1400'} value={price} onChange={e => setPrice(e.target.value)} />
            </div>
          </div>

          {rubro === 'iPhones' ? (
            <div className="space-y-4 pt-1 border-t border-zinc-900/60">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-[11px] text-zinc-500 font-bold uppercase tracking-wider">Condición de Batería (%)</label>
                  <input type="number" min="50" max="100" className={inputClass} placeholder="Ej: 85" value={batteryHealth} onChange={e => setBatteryHealth(e.target.value)} />
                </div>
                <div>
                  <label className="block text-[11px] text-zinc-500 font-bold uppercase tracking-wider">Almacenamiento</label>
                  <select className={inputClass} value={storage} onChange={e => setStorage(e.target.value)}>
                    <option value="64GB">64 GB</option>
                    <option value="128GB">128 GB</option>
                    <option value="256GB">256 GB</option>
                    <option value="512GB">512 GB</option>
                    <option value="1TB">1 TB</option>
                  </select>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-[11px] text-zinc-500 font-bold uppercase tracking-wider">Detalles Estéticos</label>
                  <select className={inputClass} value={aestheticCondition} onChange={e => setAestheticCondition(e.target.value)}>
                    <option value="Excelente">Excelente (Sin marcas)</option>
                    <option value="Como Nuevo">Como Nuevo (Reacondicionado A+)</option>
                    <option value="Muy Bueno">Muy Bueno (Marcas mínimas)</option>
                    <option value="Bueno">Bueno (Detalles de uso visibles)</option>
                    <option value="Detalles en pantalla">Detalles en pantalla / vidrio</option>
                  </select>
                </div>
                <div>
                  <label className="block text-[11px] text-zinc-500 font-bold uppercase tracking-wider">Color del Equipo</label>
                  <input type="text" className={inputClass} placeholder="Ej: Gris Espacial, Sierra Blue" value={color} onChange={e => setColor(e.target.value)} />
                </div>
              </div>
              {/* Stock para iPhones */}
              <div className="border-t border-zinc-900/60 pt-3">
                <label className="block text-[11px] text-zinc-500 font-bold uppercase tracking-wider">📦 Stock disponible (unidades)</label>
                <input
                  type="number" min="0" max="999"
                  className={inputClass}
                  placeholder="Ej: 1"
                  value={stockQty}
                  onChange={e => setStockQty(e.target.value)}
                />
                <p className="mt-1 text-[10px] text-zinc-600">Para equipos únicos usados, dejá 1. El bot NO ofrecerá el equipo si el stock es 0.</p>
              </div>
            </div>
          ) : rubro === 'E-commerce' ? (
            <div className="space-y-4">
              <div>
                <label className="block text-[11px] text-zinc-500 font-bold uppercase tracking-wider">Categoría / Descripción</label>
                <input type="text" className={inputClass} placeholder="Ej: Ropa Mujer, Electrónica..." value={description} onChange={e => setDescription(e.target.value)} />
              </div>
              <div>
                <label className="block text-[11px] text-zinc-500 font-bold uppercase tracking-wider">📦 Stock disponible (unidades)</label>
                <input
                  type="number" min="0" max="9999"
                  className={inputClass}
                  placeholder="Ej: 15"
                  value={stockQty}
                  onChange={e => setStockQty(e.target.value)}
                />
                <p className="mt-1 text-[10px] text-zinc-600">El bot controlará el stock y no permitirá ventas si llega a 0.</p>
              </div>
            </div>
          ) : (
            <div>
              <label className="block text-[11px] text-zinc-500 font-bold uppercase tracking-wider">Categoría / Descripción</label>
              <textarea rows={3} className="mt-1.5 block w-full rounded-lg border border-zinc-800 bg-zinc-900/50 px-3 py-2 text-xs text-white placeholder-zinc-650 focus:border-purple-500 focus:outline-none transition-all resize-none" placeholder="Breve descripción del producto, ingredientes, o detalles que el bot usará para asesorar..." value={description} onChange={e => setDescription(e.target.value)} />
            </div>
          )}

          {/* Subida de Imagen Opcional */}
          <div className="space-y-3 border-t border-zinc-900/60 pt-3">
            <label className="block text-[11px] text-emerald-400 font-bold uppercase tracking-wider">Imagen del Producto (Opcional)</label>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-[10px] text-zinc-500 mb-1">Subir archivo de imagen</label>
                <input
                  type="file"
                  accept="image/*"
                  onChange={(e) => setImageFile(e.target.files?.[0] || null)}
                  className="block w-full text-xs text-zinc-400 file:mr-3 file:py-1.5 file:px-3 file:rounded-lg file:border-0 file:text-xs file:font-semibold file:bg-zinc-900 file:text-white hover:file:bg-zinc-800 file:cursor-pointer"
                />
              </div>
              <div>
                <label className="block text-[10px] text-zinc-500 mb-1">O pegar URL de imagen externa</label>
                <input
                  type="text"
                  value={imageUrl}
                  onChange={(e) => setImageUrl(e.target.value)}
                  placeholder="https://ejemplo.com/imagen.jpg"
                  className={inputClass}
                />
              </div>
            </div>
          </div>

          <div className="flex justify-end gap-2 pt-2">
            <button type="button" onClick={() => setActiveView('catalog')} className="rounded-lg border border-zinc-800 text-zinc-400 px-4 py-2 text-xs font-bold hover:bg-zinc-900 transition-colors">Cancelar</button>
            <button type="submit" disabled={isUploadingImage} className="rounded-lg bg-purple-655 text-white px-4 py-2 text-xs font-bold hover:bg-purple-600 transition-all disabled:opacity-50 flex items-center gap-1.5 cursor-pointer">
              {isUploadingImage && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
              {isUploadingImage ? 'Guardando e Imagen...' : 'Guardar en Catálogo'}
            </button>
          </div>
        </form>
      )}

{/* ─── TABLA DEL CATÁLOGO ─── */}
      <div className="border border-zinc-900 bg-zinc-950 rounded-2xl overflow-hidden shadow-sm">
        <div className="p-4 border-b border-zinc-900 bg-zinc-950/60 flex items-center justify-between">
          <div>
            <span className="text-xs font-bold uppercase tracking-wider text-zinc-400">
              {rubro === 'iPhones'    ? 'Equipos en Inventario'
              : rubro === 'Cursos'    ? 'Cursos Disponibles'
              : rubro === 'Agencia'   ? 'Servicios y Propuestas'
              : rubro === 'Comida'    ? 'Menú'
              : 'Ítems en el Catálogo'}
            </span>
            <span className="ml-3 text-[10px] text-zinc-600">
              {products.length} {rubro === 'iPhones' ? 'equipo' : rubro === 'Cursos' ? 'curso' : rubro === 'Agencia' ? 'servicio' : 'ítem'}{products.length !== 1 ? 's' : ''} total
            </span>
          </div>
          <span className="text-[10px] text-zinc-600">Click en el precio para editarlo inline</span>
        </div>
        <div className="overflow-x-auto">
          {isLoading ? (
            <div className="text-center py-20 text-xs text-zinc-500">Cargando catálogo...</div>
          ) : products.length === 0 ? (
            <div className="text-center py-20 space-y-3">
              <p className="text-xs text-zinc-600">
                {rubro === 'iPhones' ? 'No hay equipos en el inventario todavía.'
                : rubro === 'Cursos' ? 'No hay cursos cargados todavía.'
                : rubro === 'Agencia' ? 'No hay servicios cargados todavía.'
                : 'No hay ítems en el catálogo todavía.'}
              </p>
              <div className="flex justify-center gap-2">
                {rubro === 'Comida' && (
                  <>
                    <button onClick={() => setActiveView('import')} className="text-[11px] text-emerald-400 hover:text-emerald-300 underline transition-colors">Cargar menú completo</button>
                    <span className="text-zinc-700 text-[11px]">o</span>
                  </>
                )}
                <button onClick={() => setActiveView('add')} className="text-[11px] text-purple-400 hover:text-purple-300 underline transition-colors">
                  {rubro === 'iPhones' ? 'Agregar equipo' : rubro === 'Cursos' ? 'Agregar curso' : rubro === 'Agencia' ? 'Agregar servicio' : 'agregar uno por uno'}
                </button>
              </div>
            </div>
          ) : (
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-zinc-900 text-[10px] uppercase tracking-wider text-zinc-500 bg-zinc-950 font-semibold">
                  <th className="px-6 py-4">{rubro === 'iPhones' ? 'Modelo' : 'Nombre'}</th>
                  <th className="px-6 py-4">{rubro === 'iPhones' ? 'Detalles del Equipo' : 'Categoría / Descripción'}</th>
                  <th className="px-6 py-4 text-center w-36">{rubro === 'iPhones' ? 'Precio (USD)' : 'Precio ($)'}</th>
                  {/* Header de stock — alineado con el cuerpo */}
                  {(rubro === 'iPhones' || rubro === 'E-commerce') && (
                    <th className="px-6 py-4 text-center w-28">Stock</th>
                  )}
                  <th className="px-6 py-4 text-center w-28">Visible en bot</th>
                  <th className="px-6 py-4 text-right w-44">Acciones</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-900/40 text-xs">
                {products.map(p => {
                  const state = savingStates[p.id] || 'idle'
                  return (
                    <tr key={p.id} className="hover:bg-zinc-900/10 transition-colors group">
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          {p.image_url ? (
                            // eslint-disable-next-line @next/next/no-img-element
                            <img 
                              src={p.image_url} 
                              alt={p.name} 
                              className="h-9 w-9 rounded-lg object-cover bg-zinc-900 border border-zinc-800 shrink-0" 
                            />
                          ) : (
                            <div className="h-9 w-9 rounded-lg bg-zinc-900 border border-zinc-800 flex items-center justify-center text-zinc-700 shrink-0">
                              <ImageIcon className="h-4 w-4" />
                            </div>
                          )}
                          <div>
                            <span className="font-bold text-white block">{p.name}</span>
                            {state === 'saving' && <span className="text-[10px] text-purple-400 font-bold block animate-pulse">Guardando...</span>}
                            {state === 'saved' && <span className="text-[10px] text-emerald-450 font-bold block">✓ Guardado</span>}
                            {state === 'error' && <span className="text-[10px] text-red-400 font-bold block">✗ Error</span>}
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 text-zinc-500 max-w-xs truncate" title={p.description}>
                        {p.description || <span className="text-zinc-700 italic">Sin categoría</span>}
                      </td>
                      <td className="px-6 py-4 text-center">
                        <input
                          type="number"
                          step="0.01"
                          defaultValue={p.price}
                          onBlur={e => { if (parseFloat(e.target.value) !== p.price) saveInlinePrice(p.id, e.target.value) }}
                          className="bg-transparent border border-transparent focus:border-zinc-800 hover:border-zinc-900/60 rounded px-2.5 py-1 w-28 text-center text-emerald-400 font-mono font-bold focus:bg-zinc-900 focus:outline-none transition-all group-hover:border-zinc-900/50"
                        />
                      </td>
                      {/* Columna de stock — solo para iPhones y E-commerce */}
                      {(rubro === 'iPhones' || rubro === 'E-commerce') && (
                        <td className="px-6 py-4 text-center">
                          <input
                            type="number"
                            min="0"
                            defaultValue={p.stock ?? 0}
                            onBlur={e => { if (parseInt(e.target.value) !== (p.stock ?? 0)) saveInlineStock(p.id, e.target.value) }}
                            className={`bg-transparent border rounded px-2 py-1 w-16 text-center font-mono font-bold focus:outline-none transition-all ${
                              (p.stock ?? 0) === 0
                                ? 'border-red-800/50 text-red-400 focus:border-red-600 hover:border-red-800'
                                : 'border-transparent text-amber-400 focus:border-zinc-800 hover:border-zinc-900/60 focus:bg-zinc-900'
                            }`}
                            title={(p.stock ?? 0) === 0 ? 'Sin stock — el bot no ofrecerá este ítem' : `Stock: ${p.stock}`}
                          />
                          {(p.stock ?? 0) === 0 && (
                            <div className="text-[9px] text-red-500 mt-0.5 font-bold">SIN STOCK</div>
                          )}
                        </td>
                      )}
                      <td className="px-6 py-4 text-center">
                        <button
                          onClick={() => handleToggleActive(p.id, p.is_active)}
                          className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold border transition-colors ${p.is_active ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400' : 'bg-zinc-900 border-zinc-800 text-zinc-500'}`}
                        >
                          <span className={`h-1.5 w-1.5 rounded-full ${p.is_active ? 'bg-emerald-400' : 'bg-zinc-600'}`} />
                          {p.is_active ? 'Activo' : 'Oculto'}
                        </button>
                      </td>
                      <td className="px-6 py-4 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          <button
                            onClick={() => handleStartEdit(p)}
                            className="rounded border border-zinc-800 text-zinc-400 hover:text-white bg-zinc-900 hover:bg-zinc-850 px-2 py-1 text-[11px] font-bold transition-all cursor-pointer"
                          >
                            ✏️ Editar
                          </button>
                          <button
                            onClick={() => handleDelete(p.id)}
                            className="rounded border border-red-900/30 text-red-500 bg-red-950/10 hover:bg-red-950/25 px-2 py-1 text-[11px] font-bold transition-all cursor-pointer"
                          >
                            🗑️
                          </button>
                        </div>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          )}
        </div>
      </div>

      {/* ====== MODAL DE EDICIÓN DE PRODUCTO ====== */}
      {editingProduct && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <form onSubmit={handleSaveProductEdit} className="bg-zinc-950 border border-zinc-800 rounded-2xl p-6 w-full max-w-lg space-y-4 shadow-2xl">
            <div className="flex items-center justify-between border-b border-zinc-900 pb-3">
              <h3 className="text-sm font-bold text-white uppercase tracking-wider flex items-center gap-1.5">
                <Edit className="h-4 w-4 text-purple-400" />
                Editar Ítem del Catálogo
              </h3>
              <button type="button" onClick={() => setEditingProduct(null)} className="text-zinc-500 hover:text-white p-1 cursor-pointer">
                <X className="h-4 w-4" />
              </button>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-[10px] text-zinc-500 font-bold uppercase tracking-wider mb-1">Nombre / Modelo *</label>
                <input
                  type="text"
                  required
                  value={editName}
                  onChange={(e) => setEditName(e.target.value)}
                  className="w-full bg-zinc-900 border border-zinc-850 rounded-lg px-3 py-2 text-xs text-white focus:border-purple-500 focus:outline-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-[10px] text-zinc-500 font-bold uppercase tracking-wider mb-1">Precio *</label>
                  <input
                    type="number"
                    step="0.01"
                    required
                    value={editPrice}
                    onChange={(e) => setEditPrice(e.target.value)}
                    className="w-full bg-zinc-900 border border-zinc-850 rounded-lg px-3 py-2 text-xs text-white focus:border-purple-500 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-[10px] text-zinc-500 font-bold uppercase tracking-wider mb-1">Stock (unidades)</label>
                  <input
                    type="number"
                    min="0"
                    value={editStock}
                    onChange={(e) => setEditStock(e.target.value)}
                    className="w-full bg-zinc-900 border border-zinc-850 rounded-lg px-3 py-2 text-xs text-white focus:border-purple-500 focus:outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="block text-[10px] text-zinc-500 font-bold uppercase tracking-wider mb-1">Categoría / Descripción</label>
                <textarea
                  rows={3}
                  value={editDescription}
                  onChange={(e) => setEditDescription(e.target.value)}
                  placeholder="Categoría o descripción para el bot..."
                  className="w-full bg-zinc-900 border border-zinc-850 rounded-lg px-3 py-2 text-xs text-white focus:border-purple-500 focus:outline-none resize-none"
                />
              </div>

              <div className="space-y-2 border-t border-zinc-900/60 pt-3">
                <label className="block text-[10px] text-zinc-500 font-bold uppercase tracking-wider">Imagen del Producto</label>
                
                {editImageUrl && (
                  <div className="flex items-center gap-3 bg-zinc-900/50 border border-zinc-900 p-2 rounded-lg">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={editImageUrl} alt="Preview" className="h-10 w-10 rounded object-cover" />
                    <span className="text-[10px] text-zinc-500 truncate max-w-[200px]">{editImageUrl}</span>
                    <button
                      type="button"
                      onClick={() => setEditImageUrl('')}
                      className="ml-auto text-[10px] text-red-400 hover:text-red-300 font-bold cursor-pointer"
                    >
                      Quitar
                    </button>
                  </div>
                )}

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[9px] text-zinc-650 mb-0.5">Subir nueva imagen</label>
                    <input
                      type="file"
                      accept="image/*"
                      onChange={(e) => setEditImageFile(e.target.files?.[0] || null)}
                      className="block w-full text-[10px] text-zinc-400 file:mr-2 file:py-1 file:px-2.5 file:rounded-md file:border-0 file:text-[10px] file:font-semibold file:bg-zinc-900 file:text-white hover:file:bg-zinc-800 file:cursor-pointer"
                    />
                  </div>
                  <div>
                    <label className="block text-[9px] text-zinc-650 mb-0.5">O pegar nueva URL</label>
                    <input
                      type="text"
                      value={editImageUrl}
                      onChange={(e) => setEditImageUrl(e.target.value)}
                      placeholder="https://ejemplo.com/imagen.jpg"
                      className="w-full bg-zinc-900 border border-zinc-850 rounded-lg px-2.5 py-1.5 text-xs text-white focus:border-purple-500 focus:outline-none"
                    />
                  </div>
                </div>
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-3 border-t border-zinc-900">
              <button
                type="button"
                onClick={() => setEditingProduct(null)}
                className="rounded-lg border border-zinc-850 px-4 py-2 text-xs font-bold text-zinc-400 hover:bg-zinc-900 transition-colors"
              >
                Cancelar
              </button>
              <button
                type="submit"
                disabled={isSavingEdit}
                className="rounded-lg bg-emerald-600 text-white px-4 py-2 text-xs font-bold hover:bg-emerald-500 transition-all disabled:opacity-50 flex items-center gap-1.5 cursor-pointer"
              >
                {isSavingEdit && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
                {isSavingEdit ? 'Guardando...' : 'Guardar Cambios'}
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  )
}

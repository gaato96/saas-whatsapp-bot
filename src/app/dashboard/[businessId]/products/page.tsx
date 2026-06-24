'use client'

import React, { useEffect, useState, use, useRef } from 'react'
import { createClient } from '@/lib/supabase/client'
import { FileText, Plus, X, Upload, CheckCircle } from 'lucide-react'

interface Product {
  id: string
  business_id: string
  name: string
  description: string
  price: number
  is_active: boolean
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
        const { data, error } = await supabase
          .from('products_services')
          .select('id, business_id, name, description, price, is_active')
          .eq('business_id', businessId)
          .order('created_at', { ascending: false })

        if (error) throw error
        setProducts(data || [])
      } catch {
        setDbConnected(false)
        setProducts([
          { id: 'p1', business_id: businessId, name: 'Pizza Muzzarella Individual', description: 'Pizzas', price: 1500, is_active: true },
          { id: 'p2', business_id: businessId, name: 'Hamburguesa Triple Cheese', description: 'Hamburguesas', price: 2100, is_active: true },
          { id: 'p3', business_id: businessId, name: 'Papas Fritas Medianas', description: 'Guarniciones', price: 350, is_active: true },
          { id: 'p4', business_id: businessId, name: 'Coca Cola 500ml', description: 'Bebidas', price: 400, is_active: true },
        ])
      } finally {
        setIsLoading(false)
      }
    }
    fetchProducts()
  }, [businessId, supabase])

  // ── Agregar uno ──────────────────────────────────────────
  const handleAddProduct = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!name || !price) return
    const payload = { business_id: businessId, name, description, price: parseFloat(price), stock: 0, is_active: true }
    try {
      if (!dbConnected) {
        setProducts(prev => [{ id: `mock-${Date.now()}`, ...payload }, ...prev])
      } else {
        const { data, error } = await supabase.from('products_services').insert(payload).select().single()
        if (error) throw error
        if (data) setProducts(prev => [data, ...prev])
      }
      setName(''); setDescription(''); setPrice('')
      setActiveView('catalog')
    } catch (err: any) {
      setErrorMsg('No se pudo guardar: ' + err.message)
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
          <h1 className="text-xl font-bold text-white">Catálogo / Menú</h1>
          <p className="text-xs text-zinc-500">
            El bot de WhatsApp lee estos ítems en tiempo real para responder consultas y tomar pedidos.
          </p>
        </div>
        <div className="flex gap-2">
          <button
            onClick={() => setActiveView(activeView === 'import' ? 'catalog' : 'import')}
            className={`rounded-xl px-4 py-2.5 text-xs font-bold border transition-all flex items-center gap-1.5 ${activeView === 'import' ? 'bg-emerald-600 border-emerald-500 text-white shadow-lg shadow-emerald-600/10' : 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400 hover:bg-emerald-500/20'}`}
          >
            <FileText className="h-3.5 w-3.5" />
            Cargar Menú Completo
          </button>
          <button
            onClick={() => setActiveView(activeView === 'add' ? 'catalog' : 'add')}
            className={`rounded-xl px-4 py-2.5 text-xs font-bold border transition-all flex items-center gap-1.5 ${activeView === 'add' ? 'bg-purple-600 border-purple-500 text-white' : 'bg-purple-500/10 border-purple-500/20 text-purple-400 hover:bg-purple-500/20'}`}
          >
            <Plus className="h-3.5 w-3.5" />
            Agregar Uno
          </button>
        </div>
      </div>

      {errorMsg && (
        <div className="p-3 bg-red-500/10 border border-red-500/20 text-red-400 rounded-xl text-xs">❌ {errorMsg}</div>
      )}

      {/* ─── PANEL: IMPORTAR MENÚ COMPLETO ─── */}
      {activeView === 'import' && (
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
            Nuevo Ítem al Catálogo
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-[11px] text-zinc-500 font-bold uppercase tracking-wider">Nombre del Ítem *</label>
              <input type="text" required className={inputClass} placeholder="Ej: Pasta Frola Membrillo" value={name} onChange={e => setName(e.target.value)} />
            </div>
            <div>
              <label className="block text-[11px] text-zinc-500 font-bold uppercase tracking-wider">Precio ($) *</label>
              <input type="number" step="0.01" required className={inputClass} placeholder="Ej: 1400" value={price} onChange={e => setPrice(e.target.value)} />
            </div>
          </div>
          <div>
            <label className="block text-[11px] text-zinc-500 font-bold uppercase tracking-wider">Categoría / Descripción</label>
            <input type="text" className={inputClass} placeholder="Ej: Pizzas, Bebidas, Postres..." value={description} onChange={e => setDescription(e.target.value)} />
          </div>
          <div className="flex justify-end gap-2">
            <button type="button" onClick={() => setActiveView('catalog')} className="rounded-lg border border-zinc-800 text-zinc-400 px-4 py-2 text-xs font-bold hover:bg-zinc-900 transition-colors">Cancelar</button>
            <button type="submit" className="rounded-lg bg-purple-600 text-white px-4 py-2 text-xs font-bold hover:bg-purple-500 transition-colors">Guardar en Catálogo</button>
          </div>
        </form>
      )}

      {/* ─── TABLA DEL CATÁLOGO ─── */}
      <div className="border border-zinc-900 bg-zinc-950 rounded-2xl overflow-hidden shadow-sm">
        <div className="p-4 border-b border-zinc-900 bg-zinc-950/60 flex items-center justify-between">
          <div>
            <span className="text-xs font-bold uppercase tracking-wider text-zinc-400">Ítems en el Catálogo</span>
            <span className="ml-3 text-[10px] text-zinc-600">{products.length} ítem{products.length !== 1 ? 's' : ''} total</span>
          </div>
          <span className="text-[10px] text-zinc-600">Click en el precio para editarlo inline</span>
        </div>
        <div className="overflow-x-auto">
          {isLoading ? (
            <div className="text-center py-20 text-xs text-zinc-500">Cargando catálogo...</div>
          ) : products.length === 0 ? (
            <div className="text-center py-20 space-y-3">
              <p className="text-xs text-zinc-600">No hay ítems en el catálogo todavía.</p>
              <div className="flex justify-center gap-2">
                <button onClick={() => setActiveView('import')} className="text-[11px] text-emerald-400 hover:text-emerald-300 underline transition-colors">Cargar menú completo</button>
                <span className="text-zinc-700 text-[11px]">o</span>
                <button onClick={() => setActiveView('add')} className="text-[11px] text-purple-400 hover:text-purple-300 underline transition-colors">agregar uno por uno</button>
              </div>
            </div>
          ) : (
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-zinc-900 text-[10px] uppercase tracking-wider text-zinc-500 bg-zinc-950 font-semibold">
                  <th className="px-6 py-4">Nombre</th>
                  <th className="px-6 py-4">Categoría / Descripción</th>
                  <th className="px-6 py-4 text-center w-36">Precio ($)</th>
                  <th className="px-6 py-4 text-center w-28">Visible en bot</th>
                  <th className="px-6 py-4 text-right w-24">Acciones</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-900/40 text-xs">
                {products.map(p => {
                  const state = savingStates[p.id] || 'idle'
                  return (
                    <tr key={p.id} className="hover:bg-zinc-900/10 transition-colors group">
                      <td className="px-6 py-4 font-bold text-white">
                        <div className="flex items-center gap-2">
                          {p.name}
                          {state === 'saving' && <span className="h-1.5 w-1.5 rounded-full bg-purple-500 animate-pulse" />}
                          {state === 'saved' && <span className="text-[10px] text-emerald-400 font-bold">✓</span>}
                          {state === 'error' && <span className="text-[10px] text-red-400 font-bold">✗</span>}
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
                        <button
                          onClick={() => handleDelete(p.id)}
                          className="rounded border border-red-900/30 text-red-500 bg-red-950/10 hover:bg-red-950/25 px-2 py-1 text-[11px] font-bold transition-all"
                        >
                          🗑️ Eliminar
                        </button>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </div>
  )
}

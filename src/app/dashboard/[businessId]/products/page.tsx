'use client'

import React, { useEffect, useState, use } from 'react'
import { createClient } from '@/lib/supabase/client'

interface Product {
  id: string
  business_id: string
  name: string
  description: string
  price: number
  stock: number
  is_active: boolean
}

interface ProductsPageProps {
  params: Promise<{ businessId: string }>
}

export default function ProductsPage({ params }: ProductsPageProps) {
  const { businessId } = use(params)
  const supabase = createClient()

  const [products, setProducts] = useState<Product[]>([])
  const [dbConnected, setDbConnected] = useState(true)
  const [isLoading, setIsLoading] = useState(true)
  const [errorMsg, setErrorMsg] = useState('')

  // Controladores de estado para agregar producto
  const [name, setName] = useState('')
  const [description, setDescription] = useState('')
  const [price, setPrice] = useState('')
  const [stock, setStock] = useState('')
  const [showAddForm, setShowAddForm] = useState(false)

  // Estados de carga de guardado por producto para feedback visual
  const [savingStates, setSavingStates] = useState<{ [productId: string]: 'idle' | 'saving' | 'saved' | 'error' }>({})

  // Cargar Catálogo
  useEffect(() => {
    const fetchProducts = async () => {
      setIsLoading(true)
      try {
        let rubro = 'Comida'
        try {
          const { data: biz } = await supabase
            .from('businesses')
            .select('rubro')
            .eq('id', businessId)
            .single()
          if (biz) rubro = biz.rubro
        } catch {
          if (businessId === 'demo-zapas-id' || businessId === 'zapas-premium') {
            rubro = 'E-commerce'
          }
        }

        const { data, error } = await supabase
          .from('products_services')
          .select('*')
          .eq('business_id', businessId)
          .order('created_at', { ascending: false })

        if (error) throw error
        setProducts(data || [])
      } catch (err: any) {
        setDbConnected(false)
        console.log("Error conectando a base de datos, cargando catálogo de demostración.")
        
        if (businessId === 'demo-zapas-id' || businessId === 'zapas-premium') {
          setProducts([
            { id: 'z1', business_id: businessId, name: 'Zapatillas Nike Air Max', description: 'Amortiguación premium. Talles del 38 al 44. Color Negro/Blanco.', price: 45000, stock: 12, is_active: true },
            { id: 'z2', business_id: businessId, name: 'Zapatillas Adidas Ultraboost', description: 'Adidas Ultraboost running. Talles 40 al 45. Color Azul Marino.', price: 58000, stock: 5, is_active: true },
            { id: 'z3', business_id: businessId, name: 'Zapatillas Puma Clyde Classic', description: 'Silueta clásica Puma de cuero. Talles 39 al 43. Color Rojo.', price: 29000, stock: 18, is_active: true },
          ])
        } else {
          setProducts([
            { id: 'p1', business_id: businessId, name: 'Pizza Muzzarella Individual', description: 'Salsa de tomate, queso muzzarella y aceitunas negras.', price: 1500, stock: 15, is_active: true },
            { id: 'p2', business_id: businessId, name: 'Hamburguesa Triple Cheese', description: 'Triple carne smash, triple cheddar y aderezo especial.', price: 2100, stock: 8, is_active: true },
            { id: 'p3', business_id: businessId, name: 'Papas Fritas Medianas', description: 'Papas fritas cortadas a mano en doble cocción.', price: 350, stock: 30, is_active: true },
          ])
        }
      } finally {
        setIsLoading(false)
      }
    }

    fetchProducts()
  }, [businessId, supabase])

  // Crear producto nuevo
  const handleAddProduct = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!name || !price) return

    const productPrice = parseFloat(price)
    const productStock = stock ? parseInt(stock) : 0

    const newProdPayload = {
      business_id: businessId,
      name,
      description,
      price: productPrice,
      stock: productStock,
      is_active: true,
    }

    try {
      if (!dbConnected || businessId === 'demo-business-id') {
        const mockNew: Product = {
          id: `product-mock-${Math.floor(Math.random() * 1000)}`,
          ...newProdPayload,
        }
        setProducts((prev) => [mockNew, ...prev])
      } else {
        const { data, error } = await supabase
          .from('products_services')
          .insert(newProdPayload)
          .select()
          .single()

        if (error) throw error
        if (data) {
          setProducts((prev) => [data, ...prev])
        }
      }

      // Limpiar Form
      setName('')
      setDescription('')
      setPrice('')
      setStock('')
      setShowAddForm(false)
    } catch (err: any) {
      console.error(err)
      setErrorMsg('No se pudo guardar el producto.')
    }
  }

  // Guardar Edición Inline (onBlur o cambio rápido)
  const saveInlineEdit = async (productId: string, field: 'price' | 'stock', value: string) => {
    const parsedValue = field === 'price' ? parseFloat(value) : parseInt(value)
    
    if (isNaN(parsedValue) || parsedValue < 0) return

    // Actualizar estado visual a guardando
    setSavingStates(prev => ({ ...prev, [productId]: 'saving' }))

    try {
      if (!dbConnected || businessId === 'demo-business-id') {
        // Simulación de guardado local
        setProducts(prev => prev.map(p => p.id === productId ? { ...p, [field]: parsedValue } : p))
        setTimeout(() => {
          setSavingStates(prev => ({ ...prev, [productId]: 'saved' }))
          setTimeout(() => setSavingStates(prev => ({ ...prev, [productId]: 'idle' })), 1500)
        }, 500)
        return
      }

      const { error } = await supabase
        .from('products_services')
        .update({ [field]: parsedValue })
        .eq('id', productId)

      if (error) throw error

      setProducts(prev => prev.map(p => p.id === productId ? { ...p, [field]: parsedValue } : p))
      setSavingStates(prev => ({ ...prev, [productId]: 'saved' }))
      
      // Limpiar feedback tras 1.5s
      setTimeout(() => {
        setSavingStates(prev => ({ ...prev, [productId]: 'idle' }))
      }, 1500)

    } catch (err) {
      console.error("Error guardando inline edit:", err)
      setSavingStates(prev => ({ ...prev, [productId]: 'error' }))
    }
  }

  // Modificar visibilidad (Activo / Inactivo)
  const handleToggleActive = async (productId: string, currentVal: boolean) => {
    try {
      if (!dbConnected || businessId === 'demo-business-id') {
        setProducts(prev => prev.map(p => p.id === productId ? { ...p, is_active: !currentVal } : p))
        return
      }

      const { error } = await supabase
        .from('products_services')
        .update({ is_active: !currentVal })
        .eq('id', productId)

      if (error) throw error
      setProducts(prev => prev.map(p => p.id === productId ? { ...p, is_active: !currentVal } : p))

    } catch (err) {
      console.error(err)
      alert("Error al actualizar el estado activo.")
    }
  }

  // Eliminar producto
  const handleDeleteProduct = async (productId: string) => {
    if (!confirm("¿Deseas eliminar este producto permanentemente del catálogo?")) return

    try {
      if (!dbConnected || businessId === 'demo-business-id') {
        setProducts(prev => prev.filter(p => p.id !== productId))
        return
      }

      const { error } = await supabase
        .from('products_services')
        .delete()
        .eq('id', productId)

      if (error) throw error
      setProducts(prev => prev.filter(p => p.id !== productId))

    } catch (err) {
      console.error(err)
      alert("Error al eliminar el producto.")
    }
  }

  return (
    <div className="space-y-6">
      {/* Alerta de demo */}
      {!dbConnected && (
        <div className="p-3 bg-zinc-900 border border-zinc-800 text-zinc-400 rounded-xl text-xs">
          ⚠️ <strong>Modo Demo Activo:</strong> Las modificaciones se mantendrán temporalmente en la memoria del navegador. Para producción, vincula tu base de datos de Supabase.
        </div>
      )}

      {/* Header de la Página */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-white">Inventario y Control de Catálogo</h1>
          <p className="text-xs text-zinc-500">
            Modifica precios y stock en línea. El bot de WhatsApp leerá estos valores inmediatamente para atender compras y agendar turnos.
          </p>
        </div>
        <button
          onClick={() => setShowAddForm(!showAddForm)}
          className="rounded-xl bg-purple-600 px-4 py-2.5 text-xs font-bold text-white hover:bg-purple-500 transition-all shadow-lg shadow-purple-600/10"
        >
          {showAddForm ? 'Cerrar Formulario' : '+ Agregar Producto'}
        </button>
      </div>

      {/* Formulario de Alta */}
      {showAddForm && (
        <form onSubmit={handleAddProduct} className="p-6 border border-zinc-900 bg-zinc-950 rounded-2xl max-w-2xl space-y-4">
          <h2 className="text-xs font-bold text-white uppercase tracking-wider">Nuevo Producto / Servicio</h2>
          
          {errorMsg && <div className="p-2 bg-red-500/10 text-red-400 border border-red-500/20 text-xs rounded">{errorMsg}</div>}

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-[11px] text-zinc-500 font-bold uppercase tracking-wider">Nombre del Ítem</label>
              <input
                type="text"
                required
                className="mt-1.5 block w-full rounded-lg border border-zinc-850 bg-zinc-900/40 px-3 py-2 text-xs text-white focus:border-purple-500 focus:outline-none"
                placeholder="Ej: Pasta Frola Membrillo"
                value={name}
                onChange={(e) => setName(e.target.value)}
              />
            </div>
            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="block text-[11px] text-zinc-500 font-bold uppercase tracking-wider">Precio ($)</label>
                <input
                  type="number"
                  step="0.01"
                  required
                  className="mt-1.5 block w-full rounded-lg border border-zinc-850 bg-zinc-900/40 px-3 py-2 text-xs text-white focus:border-purple-500 focus:outline-none"
                  placeholder="Ej: 1400.00"
                  value={price}
                  onChange={(e) => setPrice(e.target.value)}
                />
              </div>
              <div>
                <label className="block text-[11px] text-zinc-500 font-bold uppercase tracking-wider">Stock Inicial</label>
                <input
                  type="number"
                  className="mt-1.5 block w-full rounded-lg border border-zinc-850 bg-zinc-900/40 px-3 py-2 text-xs text-white focus:border-purple-500 focus:outline-none"
                  placeholder="Ej: 15"
                  value={stock}
                  onChange={(e) => setStock(e.target.value)}
                />
              </div>
            </div>
          </div>

          <div>
            <label className="block text-[11px] text-zinc-500 font-bold uppercase tracking-wider">Descripción Comercial</label>
            <textarea
              rows={2}
              className="mt-1.5 block w-full rounded-lg border border-zinc-850 bg-zinc-900/40 px-3 py-2 text-xs text-white focus:border-purple-500 focus:outline-none"
              placeholder="Ej: Porción abundante con masa casera..."
              value={description}
              onChange={(e) => setDescription(e.target.value)}
            />
          </div>

          <div className="flex justify-end">
            <button
              type="submit"
              className="rounded-lg bg-white text-black px-4 py-2 text-xs font-bold hover:bg-zinc-200 transition-colors"
            >
              Guardar en Catálogo
            </button>
          </div>
        </form>
      )}

      {/* Tabla Interactiva de Productos */}
      <div className="border border-zinc-900 bg-zinc-950 rounded-2xl overflow-hidden shadow-sm">
        <div className="p-4 border-b border-zinc-900 bg-zinc-950/60 flex items-center justify-between">
          <span className="text-xs font-bold uppercase tracking-wider text-zinc-400">Listado de Artículos</span>
          <span className="text-[10px] text-zinc-500">Haz click en los campos de <strong>Precio</strong> y <strong>Stock</strong> para modificarlos inline.</span>
        </div>
        <div className="overflow-x-auto">
          {isLoading ? (
            <div className="text-center py-20 text-xs text-zinc-500">Cargando inventario de productos...</div>
          ) : products.length === 0 ? (
            <div className="text-center py-20 text-xs text-zinc-600">No hay productos registrados en el catálogo.</div>
          ) : (
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-zinc-900 text-[10px] uppercase tracking-wider text-zinc-500 bg-zinc-950 font-semibold">
                  <th className="px-6 py-4">Nombre del Producto / Servicio</th>
                  <th className="px-6 py-4">Descripción</th>
                  <th className="px-6 py-4 text-center w-32">Precio ($)</th>
                  <th className="px-6 py-4 text-center w-28">Stock</th>
                  <th className="px-6 py-4 text-center w-28">Estado</th>
                  <th className="px-6 py-4 text-right w-24">Acciones</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-900/40 text-xs">
                {products.map((p) => {
                  const state = savingStates[p.id] || 'idle'
                  
                  return (
                    <tr key={p.id} className="hover:bg-zinc-900/10 transition-colors group">
                      {/* 1. Nombre */}
                      <td className="px-6 py-4 font-bold text-white">
                        <div className="flex items-center gap-2">
                          <span>{p.name}</span>
                          {/* Saving indicators */}
                          {state === 'saving' && <span className="h-1.5 w-1.5 rounded-full bg-purple-500 animate-pulse" title="Guardando..." />}
                          {state === 'saved' && <span className="text-[10px] text-emerald-400 font-bold" title="Guardado con éxito">✓</span>}
                          {state === 'error' && <span className="text-[10px] text-red-400 font-bold" title="Error al guardar">❌</span>}
                        </div>
                      </td>

                      {/* 2. Descripción */}
                      <td className="px-6 py-4 text-zinc-500 max-w-xs truncate" title={p.description}>
                        {p.description || 'Sin descripción'}
                      </td>

                      {/* 3. Precio (Inline Edit) */}
                      <td className="px-6 py-4 text-center">
                        <input
                          type="number"
                          step="0.01"
                          defaultValue={p.price}
                          onBlur={(e) => {
                            if (e.target.value !== String(p.price)) {
                              saveInlineEdit(p.id, 'price', e.target.value)
                            }
                          }}
                          className="bg-transparent border border-transparent focus:border-zinc-800 hover:border-zinc-900/60 rounded px-2.5 py-1 w-24 text-center text-zinc-200 font-mono font-bold focus:bg-zinc-900 focus:outline-none transition-all group-hover:border-zinc-900/50"
                        />
                      </td>

                      {/* 4. Stock (Inline Edit) */}
                      <td className="px-6 py-4 text-center">
                        <input
                          type="number"
                          defaultValue={p.stock}
                          onBlur={(e) => {
                            if (e.target.value !== String(p.stock)) {
                              saveInlineEdit(p.id, 'stock', e.target.value)
                            }
                          }}
                          className="bg-transparent border border-transparent focus:border-zinc-800 hover:border-zinc-900/60 rounded px-2.5 py-1 w-20 text-center text-zinc-200 font-mono font-bold focus:bg-zinc-900 focus:outline-none transition-all group-hover:border-zinc-900/50"
                        />
                      </td>

                      {/* 5. Estado */}
                      <td className="px-6 py-4 text-center">
                        <button
                          onClick={() => handleToggleActive(p.id, p.is_active)}
                          className={`inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold border transition-colors ${
                            p.is_active
                              ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400'
                              : 'bg-zinc-900 border-zinc-850 text-zinc-500'
                          }`}
                        >
                          {p.is_active ? 'Activo' : 'Pausado'}
                        </button>
                      </td>

                      {/* 6. Acciones */}
                      <td className="px-6 py-4 text-right">
                        <button
                          onClick={() => handleDeleteProduct(p.id)}
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

'use client'

import React, { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'

export default function DashboardRedirect() {
  const router = useRouter()
  const [statusText, setStatusText] = useState('Verificando sesión...')

  useEffect(() => {
    async function checkUserAndRedirect() {
      const supabase = createClient()
      
      // 1. Obtener sesión
      const { data: { session } } = await supabase.auth.getSession()

      if (!session) {
        // Si no hay sesión, podría ser porque estamos en modo demo local
        const isDemo = !process.env.NEXT_PUBLIC_SUPABASE_URL || 
                       !process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ||
                       process.env.NEXT_PUBLIC_SUPABASE_URL.includes('placeholder')

        if (isDemo) {
          setStatusText('Redirigiendo a panel demo...')
          router.replace('/dashboard/demo-business-id')
        } else {
          setStatusText('Redirigiendo a inicio de sesión...')
          router.replace('/login')
        }
        return
      }

      try {
        setStatusText('Buscando tu negocio...')
        // 2. Intentar buscar el primer negocio disponible para el usuario
        const { data: businesses, error } = await supabase
          .from('businesses')
          .select('id')
          .limit(1)

        if (error) throw error

        if (businesses && businesses.length > 0) {
          setStatusText('Redirigiendo a tu dashboard...')
          router.replace(`/dashboard/${businesses[0].id}`)
        } else {
          // Si está logueado pero no tiene negocios, redirigir a superadmin para crear uno
          setStatusText('No se encontraron negocios. Redirigiendo a superadmin...')
          router.replace('/admin')
        }
      } catch (err) {
        console.error('Error al redirigir:', err)
        setStatusText('Redirigiendo a panel demo de respaldo...')
        router.replace('/dashboard/demo-business-id')
      }
    }

    checkUserAndRedirect()
  }, [router])

  return (
    <div className="min-h-screen bg-zinc-950 text-zinc-100 flex flex-col items-center justify-center p-6 relative">
      <div className="absolute inset-0 bg-[linear-gradient(to_right,#1f2023_1px,transparent_1px),linear-gradient(to_bottom,#1f2023_1px,transparent_1px)] bg-[size:4rem_4rem] [mask-image:radial-gradient(ellipse_60%_50%_at_50%_50%,#000_70%,transparent_100%)] opacity-25 pointer-events-none" />
      
      <div className="relative z-10 text-center space-y-4">
        {/* Spinner animado verde WhatsApp */}
        <div className="inline-block relative w-12 h-12">
          <div className="absolute inset-0 border-4 border-zinc-900 rounded-full" />
          <div className="absolute inset-0 border-4 border-emerald-500 border-t-transparent rounded-full animate-spin" />
        </div>
        
        <p className="text-sm font-semibold tracking-wide text-zinc-400 animate-pulse">
          {statusText}
        </p>
      </div>
    </div>
  )
}

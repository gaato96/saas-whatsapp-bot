// Componente cliente para registrar el Service Worker de ZapFlow PWA
'use client'

import { useEffect } from 'react'

export function PwaRegister() {
  useEffect(() => {
    if (typeof window !== 'undefined' && 'serviceWorker' in navigator) {
      window.addEventListener('load', () => {
        navigator.serviceWorker
          .register('/sw.js', { scope: '/', updateViaCache: 'none' })
          .then((reg) => {
            console.log('[ZapFlow PWA] Service Worker registrado:', reg.scope)
          })
          .catch((err) => {
            console.warn('[ZapFlow PWA] Error al registrar SW:', err)
          })
      })
    }
  }, [])

  return null
}

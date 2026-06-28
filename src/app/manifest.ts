import type { MetadataRoute } from 'next'

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: 'ZapFlow — Gestión Inteligente para Negocios',
    short_name: 'ZapFlow',
    description: 'Administrá pedidos, turnos y reservas desde tu celular. Chatbot WhatsApp con IA para tu negocio.',
    start_url: '/dashboard',
    display: 'standalone',
    orientation: 'portrait',
    background_color: '#0b141a',
    theme_color: '#25d366',
    categories: ['business', 'productivity'],
    icons: [
      {
        src: '/zapflow-icon-192.png',
        sizes: '192x192',
        type: 'image/png',
        purpose: 'maskable',
      },
      {
        src: '/zapflow-icon-512.png',
        sizes: '512x512',
        type: 'image/png',
        purpose: 'any',
      },
    ],
    shortcuts: [
      {
        name: 'Ver Pedidos',
        url: '/dashboard',
        description: 'Acceder al tablero de pedidos en tiempo real',
      },
      {
        name: 'Ver Chats',
        url: '/dashboard',
        description: 'Inbox de conversaciones de WhatsApp',
      },
    ],
  }
}

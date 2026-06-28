'use client'

import React from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import {
  LayoutDashboard,
  MessageSquare,
  Calendar,
  Package,
  Users,
  Bot,
  Settings,
  MessageCircle,
} from 'lucide-react'

interface MobileNavProps {
  businessId: string
  rubro?: string
  enabledModules?: string[]
}

export function MobileNav({ businessId, rubro = 'Personalizado', enabledModules = [] }: MobileNavProps) {
  const pathname = usePathname()

  // Los 5 ítems más importantes para mobile (según módulos activos)
  const allItems = [
    {
      id: 'crm',
      name: 'Pedidos',
      href: `/dashboard/${businessId}`,
      icon: LayoutDashboard,
      exact: true,
    },
    {
      id: 'chat',
      name: 'Chat',
      href: `/dashboard/${businessId}/chat`,
      icon: MessageSquare,
    },
    {
      id: 'agenda',
      name: 'Agenda',
      href: `/dashboard/${businessId}/agenda`,
      icon: Calendar,
    },
    {
      id: 'clients',
      name: 'Clientes',
      href: `/dashboard/${businessId}/clientes`,
      icon: Users,
    },
    {
      id: 'catalog',
      name: rubro === 'Agencia' || rubro === 'Servicios' || rubro === 'Médico' ? 'Servicios' : 'Catálogo',
      href: `/dashboard/${businessId}/products`,
      icon: Package,
    },
    {
      id: 'ai_config',
      name: 'IA',
      href: `/dashboard/${businessId}/config-ia`,
      icon: Bot,
    },
    {
      id: 'business_config',
      name: 'Config',
      href: `/dashboard/${businessId}/config`,
      icon: Settings,
    },
    {
      id: 'whatsapp_config',
      name: 'WhatsApp',
      href: `/dashboard/${businessId}/whatsapp`,
      icon: MessageCircle,
    },
  ].filter(item => enabledModules.includes(item.id))

  // Mostrar máximo 5 en la bottom nav
  const navItems = allItems.slice(0, 5)

  const isActive = (item: { href: string; exact?: boolean }) => {
    if (item.exact) return pathname === item.href
    return pathname.startsWith(item.href)
  }

  if (navItems.length === 0) return null

  return (
    <nav className="lg:hidden fixed bottom-0 left-0 right-0 z-40 bg-zinc-950/95 backdrop-blur-lg border-t border-zinc-800 safe-bottom">
      <div className="flex items-center justify-around px-2 py-2">
        {navItems.map((item) => {
          const Icon = item.icon
          const active = isActive(item)
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`flex flex-col items-center gap-0.5 px-3 py-1.5 rounded-xl transition-all min-w-[52px] ${
                active
                  ? 'text-emerald-400'
                  : 'text-zinc-500 hover:text-zinc-300'
              }`}
            >
              <div className={`relative p-1.5 rounded-lg ${active ? 'bg-emerald-500/15' : ''}`}>
                <Icon className={`h-5 w-5 ${active ? 'text-emerald-400' : 'text-zinc-500'}`} />
                {active && (
                  <span className="absolute -bottom-0.5 left-1/2 -translate-x-1/2 h-1 w-1 rounded-full bg-emerald-400" />
                )}
              </div>
              <span className={`text-[9px] font-bold tracking-wide ${active ? 'text-emerald-400' : 'text-zinc-600'}`}>
                {item.name}
              </span>
            </Link>
          )
        })}
      </div>
    </nav>
  )
}

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
  MessageCircle
} from 'lucide-react'

interface DashboardNavProps {
  businessId: string
}

export function DashboardNav({ businessId }: DashboardNavProps) {
  const pathname = usePathname()

  const sections = [
    {
      title: 'Operaciones',
      items: [
        {
          name: 'Pedidos / Turnos (CRM)',
          href: `/dashboard/${businessId}`,
          icon: LayoutDashboard,
          exact: true,
        },
        {
          name: 'Chat Inbox',
          href: `/dashboard/${businessId}/chat`,
          icon: MessageSquare,
        },
        {
          name: 'Agenda / Reservas',
          href: `/dashboard/${businessId}/agenda`,
          icon: Calendar,
        },
      ],
    },
    {
      title: 'Inventario y Ventas',
      items: [
        {
          name: 'Catálogo y Stock',
          href: `/dashboard/${businessId}/products`,
          icon: Package,
        },
        {
          name: 'Clientes',
          href: `/dashboard/${businessId}/clientes`,
          icon: Users,
        },
      ],
    },
    {
      title: 'Configuración',
      items: [
        {
          name: 'Inteligencia Artificial',
          href: `/dashboard/${businessId}/config-ia`,
          icon: Bot,
        },
        {
          name: 'Datos del Negocio',
          href: `/dashboard/${businessId}/config`,
          icon: Settings,
        },
        {
          name: 'Configurar WhatsApp',
          href: `/dashboard/${businessId}/whatsapp`,
          icon: MessageCircle,
        },
      ],
    },
  ]

  const isActive = (item: typeof sections[0]['items'][0]) => {
    if (item.exact) {
      return pathname === item.href
    }
    return pathname.startsWith(item.href)
  }

  return (
    <div className="space-y-6">
      {sections.map((section) => (
        <div key={section.title} className="space-y-2">
          <h3 className="px-3 text-[10px] font-bold uppercase tracking-wider text-zinc-500">
            {section.title}
          </h3>
          <nav className="space-y-1">
            {section.items.map((item) => {
              const Icon = item.icon
              const active = isActive(item)
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`flex items-center gap-3 px-3 py-2 text-xs font-medium rounded-lg transition-all ${
                    active
                      ? 'bg-emerald-500/10 text-emerald-400 font-bold border-l-2 border-emerald-500 pl-2'
                      : 'text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800/40'
                  }`}
                >
                  <Icon className={`h-4 w-4 ${active ? 'text-emerald-400' : 'text-zinc-500'}`} />
                  <span>{item.name}</span>
                </Link>
              )
            })}
          </nav>
        </div>
      ))}
    </div>
  )
}

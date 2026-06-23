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
  rubro?: string
  enabledModules?: string[]
}

export function DashboardNav({ businessId, rubro = 'Personalizado', enabledModules = [] }: DashboardNavProps) {
  const pathname = usePathname()

  // Deducir qué módulos activar según la configuración
  const getEnabledModules = () => {
    if (enabledModules && enabledModules.length > 0) {
      return enabledModules
    }
    
    // Fallback por defecto según rubro comercial
    if (rubro === 'Comida' || rubro === 'E-commerce' || rubro === 'Cursos') {
      return ['chat', 'clients', 'ai_config', 'business_config', 'whatsapp_config', 'crm', 'catalog']
    } else {
      return ['chat', 'clients', 'ai_config', 'business_config', 'whatsapp_config', 'agenda', 'catalog']
    }
  }

  const activeModules = getEnabledModules()

  const sections = [
    {
      title: 'Operaciones',
      items: [
        {
          id: 'crm',
          name: 'Pedidos / Turnos (CRM)',
          href: `/dashboard/${businessId}`,
          icon: LayoutDashboard,
          exact: true,
        },
        {
          id: 'chat',
          name: 'Chat Inbox',
          href: `/dashboard/${businessId}/chat`,
          icon: MessageSquare,
        },
        {
          id: 'agenda',
          name: 'Agenda / Reservas',
          href: `/dashboard/${businessId}/agenda`,
          icon: Calendar,
        },
      ].filter(item => activeModules.includes(item.id)),
    },
    {
      title: 'Inventario y Ventas',
      items: [
        {
          id: 'catalog',
          name: (rubro === 'Agencia' || rubro === 'Servicios' || rubro === 'Médico') ? 'Servicios y Ofertas' : 'Catálogo y Stock',
          href: `/dashboard/${businessId}/products`,
          icon: Package,
        },
        {
          id: 'clients',
          name: 'Clientes',
          href: `/dashboard/${businessId}/clientes`,
          icon: Users,
        },
      ].filter(item => activeModules.includes(item.id)),
    },
    {
      title: 'Configuración',
      items: [
        {
          id: 'ai_config',
          name: 'Inteligencia Artificial',
          href: `/dashboard/${businessId}/config-ia`,
          icon: Bot,
        },
        {
          id: 'business_config',
          name: 'Datos del Negocio',
          href: `/dashboard/${businessId}/config`,
          icon: Settings,
        },
        {
          id: 'whatsapp_config',
          name: 'Configurar WhatsApp',
          href: `/dashboard/${businessId}/whatsapp`,
          icon: MessageCircle,
        },
      ].filter(item => activeModules.includes(item.id)),
    },
  ].filter(sec => sec.items.length > 0) // Ocultar secciones si no tienen ítems activos

  const isActive = (item: { href: string; exact?: boolean }) => {
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

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
  Smartphone,
  Briefcase,
  BookOpen,
  ShoppingCart,
  BarChart2,
  Megaphone,
} from 'lucide-react'

interface DashboardNavProps {
  businessId: string
  rubro?: string
  enabledModules?: string[]
  collapsed?: boolean
}

// ── Nombres y íconos de módulos según rubro ───────────────────────────────────
function getCrmLabel(rubro?: string): { name: string; icon: typeof LayoutDashboard } {
  switch (rubro) {
    case 'iPhones':    return { name: 'Ventas en Tiempo Real', icon: Smartphone }
    case 'E-commerce': return { name: 'Ventas en Tiempo Real', icon: ShoppingCart }
    case 'Agencia':    return { name: 'Proyectos y Consultas', icon: Briefcase }
    case 'Cursos':     return { name: 'Inscripciones',          icon: BookOpen }
    default:           return { name: 'Pedidos en Tiempo Real', icon: LayoutDashboard }
  }
}

function getAgendaLabel(rubro?: string): string {
  switch (rubro) {
    case 'Peluquería':  return 'Agenda de Turnos'
    case 'Gym':         return 'Clases y Turnos'
    case 'Médico':      return 'Turnos Médicos'
    case 'Hotel':       return 'Reservas'
    case 'Automotriz':  return 'Agenda de Taller'
    case 'Servicios':   return 'Agenda de Turnos'
    default:            return 'Agenda / Reservas'
  }
}

function getCatalogLabel(rubro?: string): string {
  switch (rubro) {
    case 'iPhones':     return 'Inventario de Equipos'
    case 'E-commerce':  return 'Catálogo e Inventario'
    case 'Cursos':      return 'Cursos y Programas'
    case 'Agencia':     return 'Servicios y Propuestas'
    case 'Médico':
    case 'Peluquería':
    case 'Gym':
    case 'Hotel':
    case 'Automotriz':
    case 'Servicios':   return 'Servicios'
    case 'Comida':      return 'Menú'
    default:            return 'Catálogo y Stock'
  }
}

export function DashboardNav({ businessId, rubro = 'Personalizado', enabledModules = [], collapsed = false }: DashboardNavProps) {
  const pathname = usePathname()

  const getEnabledModules = () => {
    if (enabledModules && enabledModules.length > 0) return enabledModules
    if (rubro === 'Comida' || rubro === 'E-commerce' || rubro === 'Cursos' || rubro === 'iPhones') {
      return ['chat', 'clients', 'crm_premium', 'ai_config', 'business_config', 'whatsapp_config', 'crm', 'catalog']
    }
    return ['chat', 'clients', 'crm_premium', 'ai_config', 'business_config', 'whatsapp_config', 'agenda', 'catalog']
  }

  const activeModules = getEnabledModules()
  const crmCfg = getCrmLabel(rubro)
  const CrmIcon = crmCfg.icon

  const sections = [
    {
      title: 'Operaciones',
      items: [
        {
          id: 'crm',
          name: crmCfg.name,
          href: `/dashboard/${businessId}`,
          icon: CrmIcon,
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
          name: getAgendaLabel(rubro),
          href: `/dashboard/${businessId}/agenda`,
          icon: Calendar,
        },
      ].filter(item => activeModules.includes(item.id)),
    },
    {
      title: 'Clientes y Catálogo',
      items: [
        {
          id: 'clients',
          name: 'Contactos',
          href: `/dashboard/${businessId}/clientes`,
          icon: Users,
        },
        {
          id: 'crm_premium',
          name: 'CRM Premium',
          href: `/dashboard/${businessId}/crm`,
          icon: BarChart2,
        },
        {
          id: 'catalog',
          name: getCatalogLabel(rubro),
          href: `/dashboard/${businessId}/products`,
          icon: Package,
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
  ].filter(sec => sec.items.length > 0)

  const isActive = (item: { href: string; exact?: boolean }) => {
    if (item.exact) return pathname === item.href
    return pathname.startsWith(item.href)
  }

  return (
    <div className="space-y-5">
      {sections.map(section => (
        <div key={section.title} className="space-y-1">
          {!collapsed && (
            <h3 className="px-3 text-[9px] font-black uppercase tracking-widest text-zinc-600 mb-1.5">
              {section.title}
            </h3>
          )}
          <nav className="space-y-0.5">
            {section.items.map(item => {
              const Icon = item.icon
              const active = isActive(item)
              return collapsed ? (
                <Link
                  key={item.href}
                  href={item.href}
                  title={item.name}
                  className={`flex items-center justify-center h-9 w-9 mx-auto rounded-xl transition-all ${
                    active
                      ? 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/30'
                      : 'text-zinc-500 hover:text-zinc-200 hover:bg-zinc-800/40'
                  }`}
                >
                  <Icon className="h-4 w-4 shrink-0" />
                </Link>
              ) : (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`flex items-center gap-2.5 px-3 py-2 text-xs font-medium rounded-xl transition-all ${
                    active
                      ? 'bg-emerald-500/10 text-emerald-400 font-bold border-l-2 border-emerald-500 pl-2.5'
                      : 'text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800/40'
                  }`}
                >
                  <Icon className={`h-3.5 w-3.5 shrink-0 ${active ? 'text-emerald-400' : 'text-zinc-500'}`} />
                  <span className="truncate">{item.name}</span>
                </Link>
              )
            })}
          </nav>
        </div>
      ))}
    </div>
  )
}

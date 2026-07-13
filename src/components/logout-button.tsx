'use client'

import React from 'react'
import { LogOut } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'

interface LogoutButtonProps {
  className?: string
  children?: React.ReactNode
  icon?: boolean
}

export function LogoutButton({ className, children, icon = false }: LogoutButtonProps) {
  const handleLogout = async (e: React.MouseEvent) => {
    e.preventDefault()
    const supabase = createClient()
    await supabase.auth.signOut()
    window.location.href = '/login'
  }

  return (
    <button
      onClick={handleLogout}
      className={className || "text-xs text-zinc-400 hover:text-white transition-colors cursor-pointer"}
    >
      {icon && <LogOut className="h-4 w-4" />}
      {children}
    </button>
  )
}

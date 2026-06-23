'use client'

import React, { useEffect, useState } from 'react'
import { Sun, Moon } from 'lucide-react'

export function ThemeToggle() {
  const [theme, setTheme] = useState<'light' | 'dark'>(() => {
    if (typeof window !== 'undefined') {
      return (localStorage.getItem('theme') as 'light' | 'dark') || 'dark'
    }
    return 'dark'
  })

  useEffect(() => {
    if (theme === 'light') {
      document.body.classList.add('theme-light')
    } else {
      document.body.classList.remove('theme-light')
    }
  }, [theme])

  const toggleTheme = () => {
    const nextTheme = theme === 'dark' ? 'light' : 'dark'
    setTheme(nextTheme)
    localStorage.setItem('theme', nextTheme)
  }

  return (
    <button
      onClick={toggleTheme}
      title={theme === 'dark' ? 'Cambiar a Modo Claro' : 'Cambiar a Modo Oscuro'}
      className="p-2 rounded-xl border border-zinc-850 hover:bg-zinc-800/40 text-zinc-400 hover:text-white transition-all cursor-pointer bg-zinc-950/20"
      aria-label="Alternar Tema Claro/Oscuro"
    >
      {theme === 'dark' ? (
        <Sun className="h-4 w-4 text-amber-400 animate-pulse" />
      ) : (
        <Moon className="h-4 w-4 text-indigo-500" />
      )}
    </button>
  )
}

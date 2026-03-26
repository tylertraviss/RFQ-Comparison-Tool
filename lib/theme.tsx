'use client'

import { createContext, useContext, useEffect, useState } from 'react'

type Theme = 'light' | 'dark'

const vars = {
  light: {
    '--bg': '#ffffff',
    '--bg-surface': '#f8fafc',
    '--border': '#e2e8f0',
    '--text': '#0f172a',
    '--text-muted': '#64748b',
    '--text-faint': '#94a3b8',
    '--btn-primary-bg': '#0f172a',
    '--btn-primary-text': '#ffffff',
    '--input-bg': '#ffffff',
    '--row-alt': '#f8fafc',
    '--highlight-green': '#f0fdf4',
    '--highlight-green-text': '#16a34a',
    '--highlight-blue': '#eff6ff',
    '--highlight-blue-text': '#2563eb',
  },
  dark: {
    '--bg': '#0a0e1a',
    '--bg-surface': '#111827',
    '--border': '#1e293b',
    '--text': '#f1f5f9',
    '--text-muted': '#64748b',
    '--text-faint': '#475569',
    '--btn-primary-bg': '#2563eb',
    '--btn-primary-text': '#ffffff',
    '--input-bg': '#0a0e1a',
    '--row-alt': '#0f172a',
    '--highlight-green': '#14532d',
    '--highlight-green-text': '#4ade80',
    '--highlight-blue': '#1e3a5f',
    '--highlight-blue-text': '#60a5fa',
  },
}

const ThemeContext = createContext<{ theme: Theme; toggle: () => void }>({
  theme: 'light',
  toggle: () => {},
})

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [theme, setTheme] = useState<Theme>('light')

  useEffect(() => {
    const stored = localStorage.getItem('theme') as Theme | null
    if (stored) setTheme(stored)
  }, [])

  useEffect(() => {
    localStorage.setItem('theme', theme)
    const root = document.documentElement
    Object.entries(vars[theme]).forEach(([k, v]) => {
      root.style.setProperty(k, v)
    })
    root.style.background = vars[theme]['--bg']
    document.body.style.background = vars[theme]['--bg']
    document.body.style.color = vars[theme]['--text']
  }, [theme])

  function toggle() {
    setTheme((t) => (t === 'light' ? 'dark' : 'light'))
  }

  return (
    <ThemeContext.Provider value={{ theme, toggle }}>
      {children}
    </ThemeContext.Provider>
  )
}

export function useTheme() {
  return useContext(ThemeContext)
}

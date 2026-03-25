'use client'

import Link from 'next/link'

export default function Navbar() {
  return (
    <nav
      style={{ background: '#0a0e1a' }}
      className="w-full px-6 py-4"
    >
      <div
        className="max-w-7xl mx-auto flex items-center justify-between"
      >
        <Link href="/" className="flex items-center gap-3 no-underline">
          <span className="text-2xl">🦅</span>
          <div>
            <div className="text-white font-bold text-xl tracking-tight">QuoteCompare</div>
            <div className="text-xs tracking-widest uppercase" style={{ color: '#64748b' }}>
              Defense Procurement Intelligence
            </div>
          </div>
        </Link>
        <div className="flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
          <span className="text-xs tracking-widest uppercase" style={{ color: '#64748b' }}>
            Live
          </span>
        </div>
      </div>
      {/* US flag accent border */}
      <div className="mt-4 h-[3px] w-full flex">
        <div className="flex-1" style={{ background: '#B22234' }} />
        <div className="flex-1" style={{ background: '#ffffff' }} />
        <div className="flex-1" style={{ background: '#3C3B6E' }} />
      </div>
    </nav>
  )
}

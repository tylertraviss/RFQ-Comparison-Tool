import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import './globals.css'
import Navbar from '@/components/Navbar'

const inter = Inter({ subsets: ['latin'] })

export const metadata: Metadata = {
  title: 'QuoteCompare — Defense Procurement Intelligence',
  description: 'AI-powered supplier quote comparison for defense procurement',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className="h-full">
      <body
        className={`${inter.className} min-h-full flex flex-col`}
        style={{ background: '#0a0e1a', color: '#f1f5f9' }}
      >
        <Navbar />
        <main className="flex-1 max-w-7xl mx-auto w-full px-6 py-8">
          {children}
        </main>
      </body>
    </html>
  )
}

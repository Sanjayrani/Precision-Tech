'use client'

import Sidebar from './Sidebar'

interface LayoutProps {
  children: React.ReactNode
}

export default function Layout({ children }: LayoutProps) {
  return (
    <div className="flex h-full bg-gray-50 overflow-hidden">
      <Sidebar />
      <main className="flex-1 h-full min-h-0 overflow-y-auto">
        {children}
      </main>
    </div>
  )
}

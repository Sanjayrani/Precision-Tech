'use client'

import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { 
  Home, 
  Users, 
  Briefcase,
  Search,
  BarChart3,
  Settings,
  LogOut,
  MessageSquare
} from 'lucide-react'

const navigation = [
  { name: 'Dashboard', href: '/dashboard', icon: Home },
  { name: 'Jobs', href: '/jobs', icon: Briefcase },
  { name: 'Candidates', href: '/candidates', icon: Users },
  { name: 'Source Candidates', href: '/candidates/source', icon: Search },
  { name: 'Communication', href: '/communications', icon: MessageSquare },
  { name: 'Settings', href: '/settings', icon: Settings },
]

export default function Sidebar() {
  const pathname = usePathname()
  const router = useRouter()

  const handleLogout = async () => {
    try {
      await fetch('/api/auth/logout', { method: 'POST' })
      router.push('/dashboard')
    } catch (error) {
      console.error('Logout error:', error)
    }
  }

  return (
    <div className="flex flex-col w-64 bg-white shadow-xl border-r border-gray-200">
      {/* Logo */}
      <div className="flex items-center justify-center h-16 px-4 bg-gradient-to-r from-indigo-600 to-purple-600">
        <h1 className="text-xl font-bold text-white tracking-wide">TalentFlow</h1>
      </div>

      {/* Navigation */}
      <nav className="flex-1 px-4 py-6 space-y-1">
        {navigation.map((item) => {
          const isActive = pathname === item.href || (item.href !== '/candidates' && pathname.startsWith(item.href + '/'))
          return (
            <Link
              key={item.name}
              href={item.href}
              className={`flex items-center px-4 py-3 text-sm font-medium rounded-xl transition-all duration-200 ${
                isActive
                  ? 'bg-gradient-to-r from-indigo-50 to-purple-50 text-indigo-700 border-l-4 border-indigo-500 shadow-sm'
                  : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900 hover:shadow-sm'
              }`}
            >
              <item.icon className={`w-5 h-5 mr-3 ${
                isActive ? 'text-indigo-600' : 'text-gray-500'
              }`} />
              {item.name}
            </Link>
          )
        })}
      </nav>


      {/* Logout */}
      <div className="px-4 py-4 border-t border-gray-200">
        <button
          onClick={handleLogout}
          className="flex items-center w-full px-4 py-3 text-sm font-medium text-red-600 bg-red-50 rounded-xl hover:bg-red-100 transition-all duration-200 border border-red-200"
        >
          <LogOut className="w-4 h-4 mr-2" />
          Logout
        </button>
      </div>
    </div>
  )
}

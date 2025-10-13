'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useState } from 'react'
import { 
  Home, 
  Users, 
  Briefcase,
  Search,
  MessageSquare,
  ChevronDown,
  ChevronRight
} from 'lucide-react'

const navigation = [
  { name: 'Dashboard', href: '/dashboard', icon: Home },
  { name: 'Jobs', href: '/jobs', icon: Briefcase },
  { name: 'Candidates', href: '/candidates', icon: Users },
  { name: 'Source Candidates', href: '/candidates/source', icon: Search },
  { name: 'Communication', href: '/communications/all', icon: MessageSquare },
]

export default function Sidebar() {
  const pathname = usePathname()
  const [expandedItems, setExpandedItems] = useState<string[]>([])

  const toggleExpanded = (itemName: string) => {
    setExpandedItems(prev => 
      prev.includes(itemName) 
        ? prev.filter(name => name !== itemName)
        : [...prev, itemName]
    )
  }

  return (
    <div className="flex flex-col w-64 bg-white shadow-xl border-r border-gray-200">
      {/* Logo */}
      <div className="flex items-center justify-center h-16 px-4 bg-gradient-to-r from-indigo-600 to-purple-600">
        <h1 className="text-xl font-bold text-white tracking-wide">Hireverse</h1>
      </div>

      {/* Navigation */}
      <nav className="flex-1 px-4 py-6 space-y-1">
        {navigation.map((item) => {
          const isActive = pathname === item.href || (item.href !== '/candidates' && pathname.startsWith(item.href + '/'))
          const hasSubmenu = item.submenu && item.submenu.length > 0
          const isExpanded = expandedItems.includes(item.name)
          
          return (
            <div key={item.name}>
              {hasSubmenu ? (
                <button
                  onClick={() => toggleExpanded(item.name)}
                  className={`w-full flex items-center justify-between px-4 py-3 text-sm font-medium rounded-xl transition-all duration-200 ${
                    isActive
                      ? 'bg-gradient-to-r from-indigo-50 to-purple-50 text-indigo-700 border-l-4 border-indigo-500 shadow-sm'
                      : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900 hover:shadow-sm'
                  }`}
                >
                  <div className="flex items-center">
                    <item.icon className={`w-5 h-5 mr-3 ${
                      isActive ? 'text-indigo-600' : 'text-gray-500'
                    }`} />
                    {item.name}
                  </div>
                  {isExpanded ? (
                    <ChevronDown className="w-4 h-4" />
                  ) : (
                    <ChevronRight className="w-4 h-4" />
                  )}
                </button>
              ) : (
                <Link
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
              )}
              
              {/* Submenu */}
              {hasSubmenu && isExpanded && (
                <div className="ml-4 mt-1 space-y-1">
                  {item.submenu.map((subItem) => {
                    const isSubActive = pathname === subItem.href
                    return (
                      <Link
                        key={subItem.name}
                        href={subItem.href}
                        className={`flex items-center px-4 py-2 text-sm font-medium rounded-lg transition-all duration-200 ${
                          isSubActive
                            ? 'bg-indigo-100 text-indigo-700'
                            : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                        }`}
                      >
                        <subItem.icon className={`w-4 h-4 mr-3 ${
                          isSubActive ? 'text-indigo-600' : 'text-gray-500'
                        }`} />
                        {subItem.name}
                      </Link>
                    )
                  })}
                </div>
              )}
            </div>
          )
        })}
      </nav>
    </div>
  )
}

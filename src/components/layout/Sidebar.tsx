'use client'

import { useState } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { 
  Home, 
  MessageSquare, 
  Users, 
  BarChart3, 
  Calendar, 
  Settings, 
  Shield,
  Phone,
  ChevronLeft,
  ChevronRight
} from 'lucide-react'

const navigation = [
  { name: 'Dashboard', href: '/', icon: Home },
  { name: 'Activity Feed', href: '/activity', icon: MessageSquare },
  { name: 'Contacts', href: '/contacts', icon: Users },
  { name: 'Analytics', href: '/analytics', icon: BarChart3 },
  { name: 'Calendar', href: '/calendar', icon: Calendar },
  { name: 'Settings', href: '/settings', icon: Settings },
  { name: 'Admin', href: '/admin', icon: Shield },
]

export function Sidebar() {
  const [collapsed, setCollapsed] = useState(false)
  const pathname = usePathname()

  return (
    <div className={`bg-white border-r border-gray-200 transition-all duration-300 ${
      collapsed ? 'w-16' : 'w-64'
    }`}>
      <div className="flex flex-col h-full">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-gray-200">
          {!collapsed && (
            <div className="flex items-center space-x-2">
              <div className="p-2 bg-blue-100 rounded-lg">
                <Phone className="h-6 w-6 text-blue-600" />
              </div>
              <div>
                <h2 className="text-lg font-semibold text-gray-900">CallCenter AI</h2>
                <p className="text-xs text-gray-500">Analytics Dashboard</p>
              </div>
            </div>
          )}
          
          <button
            onClick={() => setCollapsed(!collapsed)}
            className="p-1 rounded-lg hover:bg-gray-100 transition-colors"
          >
            {collapsed ? (
              <ChevronRight className="h-4 w-4 text-gray-600" />
            ) : (
              <ChevronLeft className="h-4 w-4 text-gray-600" />
            )}
          </button>
        </div>

        {/* Navigation */}
        <nav className="flex-1 p-4 space-y-2">
          {navigation.map((item) => {
            const isActive = pathname === item.href
            const Icon = item.icon
            
            return (
              <Link
                key={item.name}
                href={item.href}
                className={`flex items-center space-x-3 px-3 py-2 rounded-lg transition-colors ${
                  isActive
                    ? 'bg-blue-100 text-blue-700'
                    : 'text-gray-700 hover:bg-gray-100'
                }`}
              >
                <Icon className="h-5 w-5 flex-shrink-0" />
                {!collapsed && <span className="font-medium">{item.name}</span>}
              </Link>
            )
          })}
        </nav>

        {/* User Info */}
        {!collapsed && (
          <div className="p-4 border-t border-gray-200">
            <div className="flex items-center space-x-3">
              <div className="w-8 h-8 bg-blue-500 rounded-full flex items-center justify-center">
                <span className="text-white text-sm font-medium">JD</span>
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-gray-900 truncate">John Doe</p>
                <p className="text-xs text-gray-500 truncate">Admin</p>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
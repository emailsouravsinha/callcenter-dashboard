'use client'

import { Sidebar } from './Sidebar'
import { TopBar } from './TopBar'
import { NewCallNotification } from '@/components/notifications/NewCallNotification'

interface DashboardLayoutProps {
  children: React.ReactNode
}

export function DashboardLayout({ children }: DashboardLayoutProps) {
  return (
    <div className="min-h-screen bg-gray-50 flex">
      <Sidebar />
      
      <div className="flex-1 flex flex-col">
        <TopBar />
        
        <main className="flex-1 p-6 overflow-auto">
          <div className="max-w-7xl mx-auto">
            {children}
          </div>
        </main>
      </div>

      {/* Real-time Notifications */}
      <NewCallNotification />
    </div>
  )
}

import { Suspense } from 'react'
import { Sidebar } from '@/components/layout/Sidebar'
import { TopBar } from '@/components/layout/TopBar'
import { CallCenterKPIs } from '@/components/dashboard/CallCenterKPIs'
import { CallVolumeChart } from '@/components/dashboard/CallVolumeChart'
import { RecentCallsTable } from '@/components/dashboard/RecentCallsTable'
import { QuickActions } from '@/components/dashboard/QuickActions'
import { NewCallNotification } from '@/components/notifications/NewCallNotification'

export default function DashboardPage() {
  return (
    <div className="min-h-screen bg-gray-50 flex">
      <Sidebar />
      
      <div className="flex-1 flex flex-col">
        <TopBar />
        
        <main className="flex-1 p-6 overflow-auto">
          <div className="max-w-7xl mx-auto space-y-6">
            {/* Page Header */}
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-2xl font-bold text-gray-900">Dashboard Overview</h1>
                <p className="text-gray-600">Monitor your call center performance and AI assistant metrics</p>
              </div>
              <QuickActions />
            </div>

            {/* KPIs */}
            <Suspense fallback={<div className="animate-pulse h-32 bg-gray-200 rounded-lg" />}>
              <CallCenterKPIs />
            </Suspense>

            {/* Charts and Tables */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <Suspense fallback={<div className="animate-pulse h-96 bg-gray-200 rounded-lg" />}>
                <CallVolumeChart />
              </Suspense>
              
              <Suspense fallback={<div className="animate-pulse h-96 bg-gray-200 rounded-lg" />}>
                <RecentCallsTable />
              </Suspense>
            </div>
          </div>
        </main>
      </div>

      {/* Real-time Notifications */}
      <NewCallNotification />
    </div>
  )
}
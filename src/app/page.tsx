import { Suspense } from 'react'
import { DashboardLayout } from '@/components/layout/DashboardLayout'
import { CallCenterKPIs } from '@/components/dashboard/CallCenterKPIs'
import { CallVolumeChart } from '@/components/dashboard/CallVolumeChart'
import { RecentCallsTable } from '@/components/dashboard/RecentCallsTable'
import { QuickActions } from '@/components/dashboard/QuickActions'

export default function DashboardPage() {
  return (
    <DashboardLayout>
      <div className="space-y-6">
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
    </DashboardLayout>
  )
}
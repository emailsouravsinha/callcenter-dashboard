'use client'

import { 
  Phone, 
  PhoneCall, 
  Clock, 
  TrendingUp, 
  Calendar,
  Users,
  MessageSquare,
  Heart
} from 'lucide-react'
import { useRealtime } from '@/hooks/useRealtime'

// Base KPI structure
const baseKpis = [
  {
    id: 'totalCalls',
    title: 'Total Calls',
    icon: Phone,
    subtitle: 'Today',
  },
  {
    id: 'answerRate',
    title: 'Answer Rate',
    icon: PhoneCall,
    subtitle: 'Answered calls',
  },
  {
    id: 'avgDuration',
    title: 'Avg Call Duration',
    icon: Clock,
    subtitle: 'Minutes',
  },
  {
    id: 'unresolvedCalls',
    title: 'Unresolved Calls',
    icon: MessageSquare,
    subtitle: 'Need review',
  },
  {
    id: 'appointments',
    title: 'Appointments Booked',
    value: '89',
    change: '+15',
    trend: 'up',
    icon: Calendar,
    subtitle: 'This week',
  },
  {
    id: 'leads',
    title: 'Leads Captured',
    value: '156',
    change: '+23',
    trend: 'up',
    icon: Users,
    subtitle: '67% qualified',
  },
  {
    id: 'satisfaction',
    title: 'Customer Satisfaction',
    value: '4.7/5',
    change: '+0.2',
    trend: 'up',
    icon: Heart,
    subtitle: 'Avg rating',
  },
  {
    id: 'resolution',
    title: 'First Contact Resolution',
    value: '87.3%',
    change: '+3.1%',
    trend: 'up',
    icon: TrendingUp,
    subtitle: 'Resolved immediately',
  },
]

export function CallCenterKPIs() {
  const { data: realtimeData, isConnected } = useRealtime()

  // Merge real-time data with base KPIs
  const kpis = baseKpis.map(kpi => {
    if (realtimeData) {
      switch (kpi.id) {
        case 'totalCalls':
          return { ...kpi, value: realtimeData.totalCalls.toLocaleString(), change: '+12.5%', trend: 'up' as const }
        case 'answerRate':
          return { ...kpi, value: `${realtimeData.answerRate}%`, change: '+2.1%', trend: 'up' as const }
        case 'avgDuration':
          return { ...kpi, value: realtimeData.avgDuration, change: '-0:15', trend: 'down' as const }
        case 'unresolvedCalls':
          return { ...kpi, value: realtimeData.unresolvedCalls.toString(), change: '-8', trend: 'up' as const }
        default:
          return kpi
      }
    }
    return kpi
  })

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
      {kpis.map((kpi, index) => {
        const Icon = kpi.icon
        const isPositive = kpi.trend === 'up'
        const isRealtime = ['totalCalls', 'answerRate', 'avgDuration', 'unresolvedCalls'].includes(kpi.id)
        
        return (
          <div key={index} className={`bg-white rounded-lg shadow-sm border p-6 hover:shadow-md transition-all ${
            isRealtime && isConnected ? 'ring-2 ring-blue-100' : ''
          }`}>
            <div className="flex items-center justify-between mb-4">
              <div className={`p-3 rounded-full relative ${
                isPositive ? 'bg-green-100' : 'bg-blue-100'
              }`}>
                <Icon className={`h-6 w-6 ${
                  isPositive ? 'text-green-600' : 'text-blue-600'
                }`} />
                {isRealtime && isConnected && (
                  <div className="absolute -top-1 -right-1 w-3 h-3 bg-green-500 rounded-full animate-pulse"></div>
                )}
              </div>
              
              {kpi.change && (
                <div className={`text-sm font-medium px-2 py-1 rounded-full ${
                  isPositive 
                    ? 'text-green-700 bg-green-100' 
                    : 'text-red-700 bg-red-100'
                }`}>
                  {kpi.change}
                </div>
              )}
            </div>
            
            <div>
              <h3 className="text-sm font-medium text-gray-600 mb-1">{kpi.title}</h3>
              <p className={`text-2xl font-bold mb-1 transition-colors ${
                isRealtime && realtimeData ? 'text-blue-900' : 'text-gray-900'
              }`}>
                {kpi.value || 'Loading...'}
              </p>
              <p className="text-xs text-gray-500">{kpi.subtitle}</p>
            </div>
          </div>
        )
      })}
    </div>
  )
}
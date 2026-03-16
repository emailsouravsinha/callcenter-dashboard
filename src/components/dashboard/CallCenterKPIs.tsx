'use client'

import { useEffect, useState } from 'react'
import { Phone, PhoneCall, Clock, TrendingUp, Calendar, Users, MessageSquare, Heart } from 'lucide-react'

interface Stats {
  totalCalls: number
  answerRate: number
  avgDuration: string
  unresolvedCalls: number
  appointmentsBooked: number
  leadsQualified: number
  avgSatisfaction: number
  resolutionRate: number
}

export function CallCenterKPIs() {
  const [stats, setStats] = useState<Stats | null>(null)

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const token = localStorage.getItem('auth_token')
        const res = await fetch('/api/dashboard/stats', {
          headers: { Authorization: `Bearer ${token}` },
        })
        const data = await res.json()
        if (data.data) setStats(data.data)
      } catch { /* ignore */ }
    }

    fetchStats()
    const interval = setInterval(fetchStats, 10000) // refresh every 10s
    return () => clearInterval(interval)
  }, [])

  const kpis = [
    { title: 'Total Calls', value: stats ? stats.totalCalls.toLocaleString() : '—', icon: Phone, subtitle: 'Today' },
    { title: 'Answer Rate', value: stats ? `${stats.answerRate}%` : '—', icon: PhoneCall, subtitle: 'Answered calls' },
    { title: 'Avg Duration', value: stats ? stats.avgDuration : '—', icon: Clock, subtitle: 'Minutes' },
    { title: 'Unresolved', value: stats ? stats.unresolvedCalls.toString() : '—', icon: MessageSquare, subtitle: 'Need review' },
    { title: 'Appointments', value: stats ? stats.appointmentsBooked.toString() : '—', icon: Calendar, subtitle: 'This week' },
    { title: 'Leads', value: stats ? stats.leadsQualified.toString() : '—', icon: Users, subtitle: 'Qualified' },
    { title: 'Satisfaction', value: stats ? `${stats.avgSatisfaction}/5` : '—', icon: Heart, subtitle: 'Avg rating' },
    { title: 'Resolution', value: stats ? `${stats.resolutionRate}%` : '—', icon: TrendingUp, subtitle: 'First contact' },
  ]

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
      {kpis.map((kpi, i) => {
        const Icon = kpi.icon
        return (
          <div key={i} className="bg-white rounded-lg shadow-sm border p-6 hover:shadow-md transition-all">
            <div className="flex items-center justify-between mb-4">
              <div className="p-3 rounded-full bg-purple-100">
                <Icon className="h-6 w-6 text-purple-600" />
              </div>
            </div>
            <h3 className="text-sm font-medium text-gray-600 mb-1">{kpi.title}</h3>
            <p className="text-2xl font-bold text-gray-900 mb-1">{kpi.value}</p>
            <p className="text-xs text-gray-500">{kpi.subtitle}</p>
          </div>
        )
      })}
    </div>
  )
}

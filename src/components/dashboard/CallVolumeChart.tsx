'use client'

import { useEffect, useState } from 'react'
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar } from 'recharts'

export function CallVolumeChart() {
  const [hourlyData, setHourlyData] = useState<any[]>([])
  const [weeklyData, setWeeklyData] = useState<any[]>([])

  useEffect(() => {
    const fetchData = async () => {
      try {
        const token = localStorage.getItem('auth_token')
        const res = await fetch('/api/dashboard/stats', {
          headers: { Authorization: `Bearer ${token}` },
        })
        const data = await res.json()
        if (data.charts) {
          setHourlyData(data.charts.hourlyData || [])
          setWeeklyData(data.charts.weeklyData || [])
        }
      } catch { /* ignore */ }
    }

    fetchData()
    const interval = setInterval(fetchData, 30000)
    return () => clearInterval(interval)
  }, [])

  return (
    <div className="space-y-6">
      <div className="bg-white rounded-lg shadow-sm border p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Call Volume by Hour</h3>
        {hourlyData.length === 0 ? (
          <div className="h-64 flex items-center justify-center text-gray-400">No call data for today yet</div>
        ) : (
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={hourlyData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="hour" />
                <YAxis />
                <Tooltip />
                <Line type="monotone" dataKey="calls" stroke="#7c3aed" strokeWidth={2} name="Total" />
                <Line type="monotone" dataKey="answered" stroke="#10b981" strokeWidth={2} name="Answered" />
                <Line type="monotone" dataKey="missed" stroke="#ef4444" strokeWidth={2} name="Missed" />
              </LineChart>
            </ResponsiveContainer>
          </div>
        )}
      </div>

      <div className="bg-white rounded-lg shadow-sm border p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Weekly Performance</h3>
        {weeklyData.length === 0 ? (
          <div className="h-64 flex items-center justify-center text-gray-400">No weekly data available</div>
        ) : (
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={weeklyData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="day_name" />
                <YAxis />
                <Tooltip />
                <Bar dataKey="calls" fill="#7c3aed" name="Calls" />
                <Bar dataKey="appointments" fill="#8b5cf6" name="Appointments" />
                <Bar dataKey="leads" fill="#f59e0b" name="Leads" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        )}
      </div>
    </div>
  )
}

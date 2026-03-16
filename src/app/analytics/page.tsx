'use client'

import { useEffect, useState } from 'react'
import { BarChart, Bar, LineChart, Line, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts'
import { TrendingUp, Phone, Clock, Users, Calendar, RefreshCw } from 'lucide-react'
import { DashboardLayout } from '@/components/layout/DashboardLayout'

const SENTIMENT_COLORS: Record<string, string> = {
  positive: '#10b981',
  neutral: '#6b7280',
  negative: '#ef4444',
}

export default function AnalyticsPage() {
  const [stats, setStats] = useState<any>(null)
  const [charts, setCharts] = useState<any>(null)
  const [loading, setLoading] = useState(true)

  const fetchAnalytics = async () => {
    try {
      const res = await fetch('/api/dashboard/stats')
      const json = await res.json()
      setStats(json.data)
      setCharts(json.charts)
    } catch (error) {
      console.error('Error fetching analytics:', error)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchAnalytics()
    const interval = setInterval(fetchAnalytics, 30000)
    return () => clearInterval(interval)
  }, [])

  // Transform sentiment data for pie chart
  const sentimentData = (charts?.sentimentData || []).map((row: any) => ({
    name: (row.sentiment || 'unknown').charAt(0).toUpperCase() + (row.sentiment || 'unknown').slice(1),
    value: row.count,
    color: SENTIMENT_COLORS[row.sentiment?.toLowerCase()] || '#6b7280',
  }))

  // Transform intent data for bar chart
  const intentData = (charts?.intentData || []).map((row: any) => ({
    intent: (row.intent || 'Unknown').replace(/_/g, ' ').replace(/\b\w/g, (c: string) => c.toUpperCase()),
    count: row.count,
  }))

  if (loading) {
    return (
      <div className="p-6">
        <div className="animate-pulse">
          <div className="h-8 bg-gray-200 rounded w-1/4 mb-6"></div>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
            {[1, 2, 3, 4].map(i => (
              <div key={i} className="h-32 bg-gray-200 rounded"></div>
            ))}
          </div>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {[1, 2, 3, 4].map(i => (
              <div key={i} className="h-80 bg-gray-200 rounded"></div>
            ))}
          </div>
        </div>
      </div>
    )
  }

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-bold mb-2">Analytics & Insights</h1>
            <p className="text-gray-600">Deep dive into your call center performance</p>
          </div>
          <button onClick={fetchAnalytics} className="text-purple-600 hover:text-purple-800 text-sm font-medium flex items-center gap-1">
            <RefreshCw className="h-4 w-4" /> Refresh
          </button>
        </div>

        {/* Key Metrics */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center justify-between mb-2">
              <Phone className="w-8 h-8 text-blue-600" />
              <span className="flex items-center text-green-600 text-sm font-medium">
                <TrendingUp className="w-4 h-4 mr-1" />
                Live
              </span>
            </div>
            <p className="text-2xl font-bold">{stats?.totalCalls || 0}</p>
            <p className="text-sm text-gray-600">Total Calls Today</p>
          </div>

          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center justify-between mb-2">
              <Clock className="w-8 h-8 text-green-600" />
            </div>
            <p className="text-2xl font-bold">{stats?.answerRate || 0}%</p>
            <p className="text-sm text-gray-600">Answer Rate</p>
          </div>

          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center justify-between mb-2">
              <Users className="w-8 h-8 text-purple-600" />
            </div>
            <p className="text-2xl font-bold">{stats?.leadsQualified || 0}</p>
            <p className="text-sm text-gray-600">Leads Qualified (7d)</p>
          </div>

          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center justify-between mb-2">
              <Calendar className="w-8 h-8 text-orange-600" />
            </div>
            <p className="text-2xl font-bold">{stats?.appointmentsBooked || 0}</p>
            <p className="text-sm text-gray-600">Appointments (7d)</p>
          </div>
        </div>

        {/* Charts Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
          {/* Weekly Call Volume */}
          <div className="bg-white rounded-lg shadow p-6">
            <h3 className="text-lg font-semibold mb-4">Weekly Call Volume</h3>
            {(charts?.weeklyData || []).length > 0 ? (
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={charts.weeklyData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="day_name" />
                  <YAxis />
                  <Tooltip />
                  <Legend />
                  <Bar dataKey="calls" fill="#8b5cf6" name="Calls" />
                  <Bar dataKey="appointments" fill="#10b981" name="Appointments" />
                  <Bar dataKey="leads" fill="#3b82f6" name="Leads" />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-[300px] flex items-center justify-center text-gray-400">No data available</div>
            )}
          </div>

          {/* Sentiment Distribution */}
          <div className="bg-white rounded-lg shadow p-6">
            <h3 className="text-lg font-semibold mb-4">Sentiment Analysis</h3>
            {sentimentData.length > 0 ? (
              <ResponsiveContainer width="100%" height={300}>
                <PieChart>
                  <Pie
                    data={sentimentData}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                    outerRadius={100}
                    fill="#8884d8"
                    dataKey="value"
                  >
                    {sentimentData.map((entry: any, index: number) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-[300px] flex items-center justify-center text-gray-400">No sentiment data available</div>
            )}
          </div>

          {/* Intent Distribution */}
          <div className="bg-white rounded-lg shadow p-6">
            <h3 className="text-lg font-semibold mb-4">Top Call Intents</h3>
            {intentData.length > 0 ? (
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={intentData} layout="vertical">
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis type="number" />
                  <YAxis dataKey="intent" type="category" width={150} />
                  <Tooltip />
                  <Bar dataKey="count" fill="#3b82f6" />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-[300px] flex items-center justify-center text-gray-400">No intent data available</div>
            )}
          </div>

          {/* Peak Hours */}
          <div className="bg-white rounded-lg shadow p-6">
            <h3 className="text-lg font-semibold mb-4">Peak Call Hours</h3>
            {(charts?.peakHoursData || []).length > 0 ? (
              <ResponsiveContainer width="100%" height={300}>
                <LineChart data={charts.peakHoursData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="hour" />
                  <YAxis />
                  <Tooltip />
                  <Line type="monotone" dataKey="calls" stroke="#8b5cf6" strokeWidth={2} />
                </LineChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-[300px] flex items-center justify-center text-gray-400">No hourly data available</div>
            )}
          </div>
        </div>

        {/* Performance Metrics */}
        <div className="bg-white rounded-lg shadow p-6">
          <h3 className="text-lg font-semibold mb-4">Performance Metrics</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div>
              <p className="text-sm text-gray-600 mb-1">Average Call Duration</p>
              <p className="text-3xl font-bold text-blue-600">{stats?.avgDuration || '0:00'}</p>
              <p className="text-sm text-gray-500 mt-1">Today</p>
            </div>
            <div>
              <p className="text-sm text-gray-600 mb-1">First Contact Resolution</p>
              <p className="text-3xl font-bold text-green-600">{stats?.resolutionRate || 0}%</p>
              <p className="text-sm text-gray-500 mt-1">Today</p>
            </div>
            <div>
              <p className="text-sm text-gray-600 mb-1">Customer Satisfaction</p>
              <p className="text-3xl font-bold text-purple-600">{stats?.avgSatisfaction || 0}/5.0</p>
              <p className="text-sm text-gray-500 mt-1">Last 30 days</p>
            </div>
          </div>
        </div>
      </div>
    </DashboardLayout>
  )
}

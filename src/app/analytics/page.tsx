'use client'

import { useEffect, useState } from 'react'
import { BarChart, Bar, LineChart, Line, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts'
import { TrendingUp, TrendingDown, Phone, Clock, Users, Calendar } from 'lucide-react'

export default function AnalyticsPage() {
  const [stats, setStats] = useState<any>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchAnalytics()
  }, [])

  const fetchAnalytics = async () => {
    try {
      const response = await fetch('/api/dashboard/stats')
      const data = await response.json()
      setStats(data.data)
    } catch (error) {
      console.error('Error fetching analytics:', error)
    } finally {
      setLoading(false)
    }
  }

  // Mock data for charts
  const callVolumeData = [
    { day: 'Mon', calls: 145, answered: 138, missed: 7 },
    { day: 'Tue', calls: 167, answered: 159, missed: 8 },
    { day: 'Wed', calls: 189, answered: 182, missed: 7 },
    { day: 'Thu', calls: 156, answered: 148, missed: 8 },
    { day: 'Fri', calls: 198, answered: 190, missed: 8 },
    { day: 'Sat', calls: 123, answered: 115, missed: 8 },
    { day: 'Sun', calls: 98, answered: 92, missed: 6 },
  ]

  const sentimentData = [
    { name: 'Positive', value: 65, color: '#10b981' },
    { name: 'Neutral', value: 28, color: '#6b7280' },
    { name: 'Negative', value: 7, color: '#ef4444' },
  ]

  const intentData = [
    { intent: 'Schedule Appointment', count: 245 },
    { intent: 'Pricing Inquiry', count: 189 },
    { intent: 'Service Question', count: 156 },
    { intent: 'Support Request', count: 134 },
    { intent: 'General Info', count: 98 },
  ]

  const hourlyData = [
    { hour: '8am', calls: 12 },
    { hour: '9am', calls: 28 },
    { hour: '10am', calls: 45 },
    { hour: '11am', calls: 52 },
    { hour: '12pm', calls: 38 },
    { hour: '1pm', calls: 42 },
    { hour: '2pm', calls: 56 },
    { hour: '3pm', calls: 48 },
    { hour: '4pm', calls: 35 },
    { hour: '5pm', calls: 22 },
  ]

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
    <div className="p-6">
      <div className="mb-6">
        <h1 className="text-2xl font-bold mb-2">Analytics & Insights</h1>
        <p className="text-gray-600">Deep dive into your call center performance</p>
      </div>

      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center justify-between mb-2">
            <Phone className="w-8 h-8 text-blue-600" />
            <span className="flex items-center text-green-600 text-sm font-medium">
              <TrendingUp className="w-4 h-4 mr-1" />
              +12%
            </span>
          </div>
          <p className="text-2xl font-bold">{stats?.totalCalls || 0}</p>
          <p className="text-sm text-gray-600">Total Calls</p>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center justify-between mb-2">
            <Clock className="w-8 h-8 text-green-600" />
            <span className="flex items-center text-green-600 text-sm font-medium">
              <TrendingUp className="w-4 h-4 mr-1" />
              +3%
            </span>
          </div>
          <p className="text-2xl font-bold">{stats?.answerRate || 0}%</p>
          <p className="text-sm text-gray-600">Answer Rate</p>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center justify-between mb-2">
            <Users className="w-8 h-8 text-purple-600" />
            <span className="flex items-center text-green-600 text-sm font-medium">
              <TrendingUp className="w-4 h-4 mr-1" />
              +8%
            </span>
          </div>
          <p className="text-2xl font-bold">{stats?.leads || 0}</p>
          <p className="text-sm text-gray-600">Leads Qualified</p>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center justify-between mb-2">
            <Calendar className="w-8 h-8 text-orange-600" />
            <span className="flex items-center text-green-600 text-sm font-medium">
              <TrendingUp className="w-4 h-4 mr-1" />
              +15%
            </span>
          </div>
          <p className="text-2xl font-bold">{stats?.appointments || 0}</p>
          <p className="text-sm text-gray-600">Appointments</p>
        </div>
      </div>

      {/* Charts Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
        {/* Call Volume Trend */}
        <div className="bg-white rounded-lg shadow p-6">
          <h3 className="text-lg font-semibold mb-4">Weekly Call Volume</h3>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={callVolumeData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="day" />
              <YAxis />
              <Tooltip />
              <Legend />
              <Bar dataKey="answered" fill="#10b981" name="Answered" />
              <Bar dataKey="missed" fill="#ef4444" name="Missed" />
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Sentiment Distribution */}
        <div className="bg-white rounded-lg shadow p-6">
          <h3 className="text-lg font-semibold mb-4">Sentiment Analysis</h3>
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
                {sentimentData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.color} />
                ))}
              </Pie>
              <Tooltip />
            </PieChart>
          </ResponsiveContainer>
        </div>

        {/* Intent Distribution */}
        <div className="bg-white rounded-lg shadow p-6">
          <h3 className="text-lg font-semibold mb-4">Top Call Intents</h3>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={intentData} layout="vertical">
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis type="number" />
              <YAxis dataKey="intent" type="category" width={150} />
              <Tooltip />
              <Bar dataKey="count" fill="#3b82f6" />
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Peak Hours */}
        <div className="bg-white rounded-lg shadow p-6">
          <h3 className="text-lg font-semibold mb-4">Peak Call Hours</h3>
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={hourlyData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="hour" />
              <YAxis />
              <Tooltip />
              <Line type="monotone" dataKey="calls" stroke="#8b5cf6" strokeWidth={2} />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Performance Metrics */}
      <div className="bg-white rounded-lg shadow p-6">
        <h3 className="text-lg font-semibold mb-4">Performance Metrics</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div>
            <p className="text-sm text-gray-600 mb-1">Average Call Duration</p>
            <p className="text-3xl font-bold text-blue-600">{stats?.avgDuration || '0:00'}</p>
            <p className="text-sm text-gray-500 mt-1">Target: 5:00</p>
          </div>
          <div>
            <p className="text-sm text-gray-600 mb-1">First Contact Resolution</p>
            <p className="text-3xl font-bold text-green-600">{stats?.resolution || 0}%</p>
            <p className="text-sm text-gray-500 mt-1">Target: 85%</p>
          </div>
          <div>
            <p className="text-sm text-gray-600 mb-1">Customer Satisfaction</p>
            <p className="text-3xl font-bold text-purple-600">{stats?.satisfaction || 0}/5.0</p>
            <p className="text-sm text-gray-500 mt-1">Target: 4.5</p>
          </div>
        </div>
      </div>
    </div>
  )
}


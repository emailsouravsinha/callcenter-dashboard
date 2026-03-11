'use client'

import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar } from 'recharts'

// Mock data - will be replaced with real database data
const revenueData = [
  { month: 'Jan', revenue: 45000, users: 1200 },
  { month: 'Feb', revenue: 52000, users: 1350 },
  { month: 'Mar', revenue: 48000, users: 1280 },
  { month: 'Apr', revenue: 61000, users: 1520 },
  { month: 'May', revenue: 55000, users: 1450 },
  { month: 'Jun', revenue: 67000, users: 1680 },
]

const performanceData = [
  { category: 'System Integration', projects: 12, revenue: 45000 },
  { category: 'Corporate AI', projects: 8, revenue: 38000 },
  { category: 'Legacy Modernization', projects: 15, revenue: 52000 },
  { category: 'Process Automation', projects: 10, revenue: 41000 },
]

export function ChartsSection() {
  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      {/* Revenue Trend Chart */}
      <div className="bg-white rounded-lg shadow-sm border p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Revenue Trend</h3>
        <div className="h-80">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={revenueData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="month" />
              <YAxis />
              <Tooltip formatter={(value) => [`$${value.toLocaleString()}`, 'Revenue']} />
              <Line 
                type="monotone" 
                dataKey="revenue" 
                stroke="#2563eb" 
                strokeWidth={3}
                dot={{ fill: '#2563eb', strokeWidth: 2, r: 4 }}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Service Performance Chart */}
      <div className="bg-white rounded-lg shadow-sm border p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Service Performance</h3>
        <div className="h-80">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={performanceData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="category" angle={-45} textAnchor="end" height={80} />
              <YAxis />
              <Tooltip formatter={(value) => [`$${value.toLocaleString()}`, 'Revenue']} />
              <Bar dataKey="revenue" fill="#3b82f6" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  )
}
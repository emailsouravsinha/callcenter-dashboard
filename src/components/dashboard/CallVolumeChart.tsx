'use client'

import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar } from 'recharts'

// Mock data - will be replaced with real database data
const hourlyData = [
  { hour: '6AM', calls: 12, answered: 11, missed: 1 },
  { hour: '7AM', calls: 28, answered: 26, missed: 2 },
  { hour: '8AM', calls: 45, answered: 42, missed: 3 },
  { hour: '9AM', calls: 67, answered: 63, missed: 4 },
  { hour: '10AM', calls: 89, answered: 84, missed: 5 },
  { hour: '11AM', calls: 92, answered: 87, missed: 5 },
  { hour: '12PM', calls: 78, answered: 74, missed: 4 },
  { hour: '1PM', calls: 85, answered: 80, missed: 5 },
  { hour: '2PM', calls: 94, answered: 89, missed: 5 },
  { hour: '3PM', calls: 87, answered: 82, missed: 5 },
  { hour: '4PM', calls: 76, answered: 72, missed: 4 },
  { hour: '5PM', calls: 54, answered: 51, missed: 3 },
]

const weeklyData = [
  { day: 'Mon', calls: 234, appointments: 45, leads: 67 },
  { day: 'Tue', calls: 267, appointments: 52, leads: 73 },
  { day: 'Wed', calls: 298, appointments: 48, leads: 81 },
  { day: 'Thu', calls: 312, appointments: 59, leads: 89 },
  { day: 'Fri', calls: 289, appointments: 43, leads: 76 },
  { day: 'Sat', calls: 156, appointments: 28, leads: 42 },
  { day: 'Sun', calls: 123, appointments: 21, leads: 35 },
]

export function CallVolumeChart() {
  return (
    <div className="space-y-6">
      {/* Hourly Call Volume */}
      <div className="bg-white rounded-lg shadow-sm border p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-gray-900">Call Volume by Hour</h3>
          <div className="flex items-center space-x-4 text-sm">
            <div className="flex items-center space-x-2">
              <div className="w-3 h-3 bg-blue-500 rounded-full"></div>
              <span className="text-gray-600">Total Calls</span>
            </div>
            <div className="flex items-center space-x-2">
              <div className="w-3 h-3 bg-green-500 rounded-full"></div>
              <span className="text-gray-600">Answered</span>
            </div>
            <div className="flex items-center space-x-2">
              <div className="w-3 h-3 bg-red-500 rounded-full"></div>
              <span className="text-gray-600">Missed</span>
            </div>
          </div>
        </div>
        
        <div className="h-64">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={hourlyData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="hour" />
              <YAxis />
              <Tooltip />
              <Line 
                type="monotone" 
                dataKey="calls" 
                stroke="#3b82f6" 
                strokeWidth={2}
                name="Total Calls"
              />
              <Line 
                type="monotone" 
                dataKey="answered" 
                stroke="#10b981" 
                strokeWidth={2}
                name="Answered"
              />
              <Line 
                type="monotone" 
                dataKey="missed" 
                stroke="#ef4444" 
                strokeWidth={2}
                name="Missed"
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Weekly Performance */}
      <div className="bg-white rounded-lg shadow-sm border p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-gray-900">Weekly Performance</h3>
          <div className="flex items-center space-x-4 text-sm">
            <div className="flex items-center space-x-2">
              <div className="w-3 h-3 bg-blue-500 rounded-full"></div>
              <span className="text-gray-600">Calls</span>
            </div>
            <div className="flex items-center space-x-2">
              <div className="w-3 h-3 bg-purple-500 rounded-full"></div>
              <span className="text-gray-600">Appointments</span>
            </div>
            <div className="flex items-center space-x-2">
              <div className="w-3 h-3 bg-orange-500 rounded-full"></div>
              <span className="text-gray-600">Leads</span>
            </div>
          </div>
        </div>
        
        <div className="h-64">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={weeklyData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="day" />
              <YAxis />
              <Tooltip />
              <Bar dataKey="calls" fill="#3b82f6" name="Calls" />
              <Bar dataKey="appointments" fill="#8b5cf6" name="Appointments" />
              <Bar dataKey="leads" fill="#f59e0b" name="Leads" />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  )
}
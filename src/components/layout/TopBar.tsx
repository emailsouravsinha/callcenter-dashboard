'use client'

import { useState } from 'react'
import { Bell, Search, Filter, Download, RefreshCw, Wifi, WifiOff } from 'lucide-react'
import { useRealtime } from '@/hooks/useRealtime'

export function TopBar() {
  const [timeFilter, setTimeFilter] = useState('today')
  const { isConnected, lastUpdate } = useRealtime()

  return (
    <header className="bg-white border-b border-gray-200 px-6 py-4">
      <div className="flex items-center justify-between">
        {/* Time Filter */}
        <div className="flex items-center space-x-4">
          <select
            value={timeFilter}
            onChange={(e) => setTimeFilter(e.target.value)}
            className="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="today">Today</option>
            <option value="yesterday">Yesterday</option>
            <option value="last7days">Last 7 days</option>
            <option value="thismonth">This month</option>
            <option value="custom">Custom range</option>
          </select>
          
          {/* Real-time Status */}
          <div className="flex items-center space-x-2 text-sm">
            {isConnected ? (
              <>
                <Wifi className="h-4 w-4 text-green-500" />
                <span className="text-green-600 font-medium">Live</span>
              </>
            ) : (
              <>
                <WifiOff className="h-4 w-4 text-red-500" />
                <span className="text-red-600 font-medium">Disconnected</span>
              </>
            )}
            {lastUpdate && (
              <span className="text-gray-500">
                • Updated {lastUpdate.toLocaleTimeString()}
              </span>
            )}
          </div>
        </div>

        {/* Search and Actions */}
        <div className="flex items-center space-x-4">
          {/* Search */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
            <input
              type="text"
              placeholder="Search calls, contacts..."
              className="pl-10 pr-4 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 w-64"
            />
          </div>

          {/* Action Buttons */}
          <button className="p-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors">
            <Filter className="h-5 w-5" />
          </button>
          
          <button className="p-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors">
            <Download className="h-5 w-5" />
          </button>
          
          <button className="p-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors">
            <RefreshCw className="h-5 w-5" />
          </button>

          {/* Notifications */}
          <button className="relative p-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors">
            <Bell className="h-5 w-5" />
            <span className="absolute -top-1 -right-1 h-4 w-4 bg-red-500 text-white text-xs rounded-full flex items-center justify-center">
              3
            </span>
          </button>
        </div>
      </div>
    </header>
  )
}
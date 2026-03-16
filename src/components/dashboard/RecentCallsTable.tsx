'use client'

import { useEffect, useState } from 'react'
import { Eye, Download, Phone, Clock, User, MessageSquare, RefreshCw } from 'lucide-react'

interface Call {
  id: number
  caller_name: string
  caller_phone: string
  time_ago: string
  duration: string
  outcome: string
  sentiment: string
  intent: string
  status: string
}

const getOutcomeColor = (outcome: string) => {
  const o = (outcome || '').toLowerCase()
  if (o.includes('appointment') || o.includes('booked')) return 'bg-green-100 text-green-800'
  if (o.includes('lead') || o.includes('qualified')) return 'bg-blue-100 text-blue-800'
  if (o.includes('missed') || o.includes('no_answer')) return 'bg-red-100 text-red-800'
  if (o.includes('complaint') || o.includes('resolved')) return 'bg-yellow-100 text-yellow-800'
  if (o.includes('info') || o.includes('information')) return 'bg-gray-100 text-gray-800'
  return 'bg-gray-100 text-gray-800'
}

const getSentimentColor = (sentiment: string) => {
  const s = (sentiment || '').toLowerCase()
  if (s.includes('positive')) return 'text-green-600'
  if (s.includes('negative')) return 'text-red-600'
  return 'text-gray-600'
}

const formatOutcome = (outcome: string) => {
  if (!outcome) return 'Unknown'
  return outcome.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase())
}

export function RecentCallsTable() {
  const [calls, setCalls] = useState<Call[]>([])
  const [loading, setLoading] = useState(true)

  const fetchCalls = async () => {
    try {
      const res = await fetch('/api/dashboard/stats')
      const json = await res.json()
      if (json.recentCalls) {
        setCalls(json.recentCalls)
      }
    } catch (err) {
      console.error('Error fetching recent calls:', err)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchCalls()
    const interval = setInterval(fetchCalls, 10000)
    return () => clearInterval(interval)
  }, [])

  if (loading) {
    return (
      <div className="bg-white rounded-lg shadow-sm border p-6">
        <div className="animate-pulse space-y-4">
          <div className="h-6 bg-gray-200 rounded w-1/4"></div>
          {[1, 2, 3].map(i => (
            <div key={i} className="h-12 bg-gray-100 rounded"></div>
          ))}
        </div>
      </div>
    )
  }

  return (
    <div className="bg-white rounded-lg shadow-sm border">
      <div className="px-6 py-4 border-b border-gray-200">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-lg font-semibold text-gray-900">Recent Calls</h3>
            <p className="text-sm text-gray-500 mt-1">Latest customer interactions and AI responses</p>
          </div>
          <button onClick={fetchCalls} className="text-purple-600 hover:text-purple-800 text-sm font-medium flex items-center gap-1">
            <RefreshCw className="h-3 w-3" /> Refresh
          </button>
        </div>
      </div>

      {calls.length === 0 ? (
        <div className="px-6 py-12 text-center text-gray-500">
          <Phone className="h-8 w-8 mx-auto mb-2 text-gray-300" />
          <p>No recent calls found</p>
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Caller</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Time & Duration</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Outcome</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Intent & Sentiment</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {calls.map((call) => (
                <tr key={call.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center">
                      <div className={`p-2 rounded-full mr-3 ${call.status === 'missed' ? 'bg-red-100' : 'bg-green-100'}`}>
                        {call.status === 'missed' ? (
                          <Phone className="h-4 w-4 text-red-600" />
                        ) : (
                          <User className="h-4 w-4 text-green-600" />
                        )}
                      </div>
                      <div>
                        <div className="text-sm font-medium text-gray-900">{call.caller_name || 'Unknown Caller'}</div>
                        <div className="text-sm text-gray-500">{call.caller_phone || '-'}</div>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center text-sm text-gray-900">
                      <Clock className="h-4 w-4 mr-2 text-gray-400" />
                      <div>
                        <div>{call.time_ago}</div>
                        <div className="text-gray-500">{call.duration || '-'}</div>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getOutcomeColor(call.outcome)}`}>
                      {formatOutcome(call.outcome)}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm">
                      <div className="text-gray-900">{formatOutcome(call.intent) || '-'}</div>
                      <div className={getSentimentColor(call.sentiment)}>{formatOutcome(call.sentiment) || '-'}</div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                    <div className="flex space-x-2">
                      <button className="text-purple-600 hover:text-purple-900" title="View Transcript">
                        <Eye className="h-4 w-4" />
                      </button>
                      <button className="text-green-600 hover:text-green-900" title="View Details">
                        <MessageSquare className="h-4 w-4" />
                      </button>
                      <button className="text-gray-600 hover:text-gray-900" title="Download">
                        <Download className="h-4 w-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}

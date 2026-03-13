'use client'

import { useEffect, useState } from 'react'
import { Phone, Clock, TrendingUp, MessageSquare, Calendar, User } from 'lucide-react'

interface Call {
  id: number
  caller_name: string
  caller_phone: string
  caller_email: string
  start_time: string
  duration: string
  status: string
  outcome: string
  sentiment: string
  intent: string
  transcript: string
  ai_summary: string
  time_ago: string
}

export default function ActivityPage() {
  const [calls, setCalls] = useState<Call[]>([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState('all')

  useEffect(() => {
    fetchCalls()
  }, [])

  const fetchCalls = async () => {
    try {
      const response = await fetch('/api/data')
      const data = await response.json()
      setCalls(data.recentCalls || [])
    } catch (error) {
      console.error('Error fetching calls:', error)
    } finally {
      setLoading(false)
    }
  }

  const filteredCalls = calls.filter(call => {
    if (filter === 'all') return true
    if (filter === 'answered') return call.status === 'answered'
    if (filter === 'missed') return call.status === 'missed'
    if (filter === 'appointments') return call.outcome === 'appointment_booked'
    return true
  })

  const getSentimentColor = (sentiment: string) => {
    switch (sentiment) {
      case 'positive': return 'text-green-600 bg-green-50'
      case 'negative': return 'text-red-600 bg-red-50'
      default: return 'text-gray-600 bg-gray-50'
    }
  }

  const getOutcomeColor = (outcome: string) => {
    switch (outcome) {
      case 'appointment_booked': return 'text-blue-600 bg-blue-50'
      case 'lead_qualified': return 'text-purple-600 bg-purple-50'
      case 'info_only': return 'text-gray-600 bg-gray-50'
      default: return 'text-gray-600 bg-gray-50'
    }
  }

  if (loading) {
    return (
      <div className="p-6">
        <div className="animate-pulse">
          <div className="h-8 bg-gray-200 rounded w-1/4 mb-4"></div>
          <div className="space-y-4">
            {[1, 2, 3].map(i => (
              <div key={i} className="h-32 bg-gray-200 rounded"></div>
            ))}
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="p-6">
      <div className="mb-6">
        <h1 className="text-2xl font-bold mb-2">Activity Feed</h1>
        <p className="text-gray-600">Complete call history and conversation logs</p>
      </div>

      {/* Filters */}
      <div className="mb-6 flex gap-2">
        <button
          onClick={() => setFilter('all')}
          className={`px-4 py-2 rounded-lg ${filter === 'all' ? 'bg-blue-600 text-white' : 'bg-gray-100 text-gray-700'}`}
        >
          All Calls ({calls.length})
        </button>
        <button
          onClick={() => setFilter('answered')}
          className={`px-4 py-2 rounded-lg ${filter === 'answered' ? 'bg-blue-600 text-white' : 'bg-gray-100 text-gray-700'}`}
        >
          Answered
        </button>
        <button
          onClick={() => setFilter('missed')}
          className={`px-4 py-2 rounded-lg ${filter === 'missed' ? 'bg-blue-600 text-white' : 'bg-gray-100 text-gray-700'}`}
        >
          Missed
        </button>
        <button
          onClick={() => setFilter('appointments')}
          className={`px-4 py-2 rounded-lg ${filter === 'appointments' ? 'bg-blue-600 text-white' : 'bg-gray-100 text-gray-700'}`}
        >
          Appointments
        </button>
      </div>

      {/* Call List */}
      <div className="space-y-4">
        {filteredCalls.map((call) => (
          <div key={call.id} className="bg-white rounded-lg shadow p-6 hover:shadow-md transition-shadow">
            <div className="flex items-start justify-between mb-4">
              <div className="flex items-start gap-4">
                <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center">
                  <Phone className="w-6 h-6 text-blue-600" />
                </div>
                <div>
                  <h3 className="font-semibold text-lg">{call.caller_name || 'Unknown Caller'}</h3>
                  <p className="text-gray-600">{call.caller_phone}</p>
                  {call.caller_email && (
                    <p className="text-sm text-gray-500">{call.caller_email}</p>
                  )}
                </div>
              </div>
              <div className="text-right">
                <p className="text-sm text-gray-500">{call.time_ago}</p>
                <div className="flex items-center gap-2 mt-1">
                  <Clock className="w-4 h-4 text-gray-400" />
                  <span className="text-sm text-gray-600">{call.duration}</span>
                </div>
              </div>
            </div>

            {/* Tags */}
            <div className="flex flex-wrap gap-2 mb-4">
              <span className={`px-3 py-1 rounded-full text-xs font-medium ${getSentimentColor(call.sentiment)}`}>
                {call.sentiment}
              </span>
              <span className={`px-3 py-1 rounded-full text-xs font-medium ${getOutcomeColor(call.outcome)}`}>
                {call.outcome.replace('_', ' ')}
              </span>
              {call.intent && (
                <span className="px-3 py-1 rounded-full text-xs font-medium text-indigo-600 bg-indigo-50">
                  {call.intent}
                </span>
              )}
            </div>

            {/* AI Summary */}
            {call.ai_summary && (
              <div className="mb-4 p-4 bg-gray-50 rounded-lg">
                <div className="flex items-start gap-2">
                  <MessageSquare className="w-4 h-4 text-gray-400 mt-1" />
                  <div>
                    <p className="text-sm font-medium text-gray-700 mb-1">AI Summary</p>
                    <p className="text-sm text-gray-600">{call.ai_summary}</p>
                  </div>
                </div>
              </div>
            )}

            {/* Transcript */}
            {call.transcript && (
              <details className="cursor-pointer">
                <summary className="text-sm font-medium text-blue-600 hover:text-blue-700">
                  View Full Transcript
                </summary>
                <div className="mt-2 p-4 bg-gray-50 rounded-lg">
                  <p className="text-sm text-gray-700 whitespace-pre-wrap">{call.transcript}</p>
                </div>
              </details>
            )}
          </div>
        ))}

        {filteredCalls.length === 0 && (
          <div className="text-center py-12">
            <Phone className="w-16 h-16 text-gray-300 mx-auto mb-4" />
            <p className="text-gray-500">No calls found</p>
          </div>
        )}
      </div>
    </div>
  )
}


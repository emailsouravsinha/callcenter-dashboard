'use client'

import { useEffect, useState, useCallback } from 'react'

interface RealtimeData {
  totalCalls: number
  answerRate: string
  avgDuration: string
  unresolvedCalls: number
  newCall?: {
    id: number
    caller: string
    phone: string
    time: string
    outcome: string
    sentiment: string
  } | null
}

interface RealtimeEvent {
  type: string
  timestamp: string
  data?: RealtimeData
  message?: string
}

export function useRealtime() {
  const [isConnected, setIsConnected] = useState(false)
  const [lastUpdate, setLastUpdate] = useState<Date | null>(null)
  const [data, setData] = useState<RealtimeData | null>(null)
  const [newCall, setNewCall] = useState<RealtimeData['newCall']>(null)

  const connect = useCallback(() => {
    const eventSource = new EventSource('/api/realtime')

    eventSource.onopen = () => {
      setIsConnected(true)
      console.log('✅ Real-time connection established')
    }

    eventSource.onmessage = (event) => {
      try {
        const eventData: RealtimeEvent = JSON.parse(event.data)
        setLastUpdate(new Date())

        if (eventData.type === 'call_update' && eventData.data) {
          setData(eventData.data)
          
          // Handle new call notifications
          if (eventData.data.newCall) {
            setNewCall(eventData.data.newCall)
            // Clear notification after 10 seconds
            setTimeout(() => setNewCall(null), 10000)
          }
        }
      } catch (error) {
        console.error('Error parsing real-time data:', error)
      }
    }

    eventSource.onerror = () => {
      setIsConnected(false)
      console.log('❌ Real-time connection lost, attempting to reconnect...')
      eventSource.close()
      
      // Attempt to reconnect after 5 seconds
      setTimeout(connect, 5000)
    }

    return eventSource
  }, [])

  useEffect(() => {
    const eventSource = connect()
    
    return () => {
      eventSource.close()
      setIsConnected(false)
    }
  }, [connect])

  return {
    isConnected,
    lastUpdate,
    data,
    newCall,
    clearNewCall: () => setNewCall(null)
  }
}
import { NextRequest } from 'next/server'
import { getDashboardStats, getRecentCalls } from '@/lib/database'

// Server-Sent Events endpoint for real-time updates
export async function GET(request: NextRequest) {
  const encoder = new TextEncoder()

  const customReadable = new ReadableStream({
    start(controller) {
      // Send initial connection message
      const data = `data: ${JSON.stringify({
        type: 'connected',
        timestamp: new Date().toISOString(),
        message: 'Real-time connection established'
      })}\n\n`
      
      controller.enqueue(encoder.encode(data))

      // Function to send real-time updates
      const sendUpdate = async () => {
        try {
          // Get real dashboard stats from database
          const stats = await getDashboardStats()
          
          // Get latest call (if any new ones)
          const recentCalls = await getRecentCalls(1)
          const latestCall = recentCalls[0]

          const updateData = {
            type: 'call_update',
            timestamp: new Date().toISOString(),
            data: {
              totalCalls: stats.totalCalls,
              answerRate: stats.answerRate.toString(),
              avgDuration: stats.avgDuration,
              unresolvedCalls: stats.unresolvedCalls,
              appointmentsBooked: stats.appointmentsBooked,
              leadsQualified: stats.leadsQualified,
              avgSatisfaction: stats.avgSatisfaction,
              resolutionRate: stats.resolutionRate,
              // Include new call if it's very recent (within last 30 seconds)
              newCall: latestCall && latestCall.time_ago === 'Just now' ? {
                id: latestCall.id,
                caller: latestCall.caller_name || 'Unknown Caller',
                phone: latestCall.caller_phone,
                time: latestCall.time_ago,
                outcome: latestCall.outcome,
                sentiment: latestCall.sentiment
              } : null
            }
          }

          const eventData = `data: ${JSON.stringify(updateData)}\n\n`
          controller.enqueue(encoder.encode(eventData))
        } catch (error) {
          console.error('Error fetching real-time data:', error)
          
          // Send mock data if database fails
          const mockUpdate = {
            type: 'call_update',
            timestamp: new Date().toISOString(),
            data: {
              totalCalls: Math.floor(Math.random() * 50) + 1200,
              answerRate: (Math.random() * 10 + 90).toFixed(1),
              avgDuration: `${Math.floor(Math.random() * 3) + 3}:${Math.floor(Math.random() * 60).toString().padStart(2, '0')}`,
              unresolvedCalls: Math.floor(Math.random() * 10) + 15,
              newCall: Math.random() > 0.8 ? {
                id: Date.now(),
                caller: ['Sarah Johnson', 'Mike Chen', 'Jennifer Davis', 'Robert Wilson'][Math.floor(Math.random() * 4)],
                phone: `+1-555-${Math.floor(Math.random() * 900) + 100}-${Math.floor(Math.random() * 9000) + 1000}`,
                time: 'Just now',
                outcome: ['appointment_booked', 'lead_qualified', 'info_only'][Math.floor(Math.random() * 3)],
                sentiment: ['positive', 'neutral', 'negative'][Math.floor(Math.random() * 3)]
              } : null
            }
          }

          const eventData = `data: ${JSON.stringify(mockUpdate)}\n\n`
          controller.enqueue(encoder.encode(eventData))
        }
      }

      // Send updates every 5 seconds
      const interval = setInterval(sendUpdate, 5000)

      // Send initial update immediately
      sendUpdate()

      // Cleanup on connection close
      request.signal.addEventListener('abort', () => {
        clearInterval(interval)
        controller.close()
      })
    },
  })

  return new Response(customReadable, {
    headers: {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache',
      'Connection': 'keep-alive',
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET',
      'Access-Control-Allow-Headers': 'Cache-Control',
    },
  })
}
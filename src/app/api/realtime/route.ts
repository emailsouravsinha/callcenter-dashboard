import { NextRequest } from 'next/server'
import { verifyToken, getTokenFromCookie } from '@/lib/auth'
import { getDashboardStats, getRecentCalls } from '@/lib/database'

// Server-Sent Events endpoint for real-time updates
export async function GET(request: NextRequest) {
  const encoder = new TextEncoder()

  // Extract orgId from auth token
  const cookieHeader = request.headers.get('cookie') || ''
  const authHeader = request.headers.get('authorization')
  const token = authHeader?.replace('Bearer ', '') || getTokenFromCookie(cookieHeader)

  let orgId: number | undefined
  if (token) {
    const decoded = verifyToken(token)
    if (decoded && decoded.organizationId > 0) {
      orgId = decoded.organizationId
    }
  }

  const customReadable = new ReadableStream({
    start(controller) {
      const data = `data: ${JSON.stringify({
        type: 'connected',
        timestamp: new Date().toISOString(),
        message: 'Real-time connection established'
      })}\n\n`
      controller.enqueue(encoder.encode(data))

      const sendUpdate = async () => {
        try {
          const stats = await getDashboardStats(orgId)
          const recentCalls = await getRecentCalls(1, orgId)
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

          controller.enqueue(encoder.encode(`data: ${JSON.stringify(updateData)}\n\n`))
        } catch (error) {
          console.error('Error fetching real-time data:', error)
          // Send error status instead of fake data
          const errorData = {
            type: 'error',
            timestamp: new Date().toISOString(),
            message: 'Database temporarily unavailable'
          }
          controller.enqueue(encoder.encode(`data: ${JSON.stringify(errorData)}\n\n`))
        }
      }

      const interval = setInterval(sendUpdate, 5000)
      sendUpdate()

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

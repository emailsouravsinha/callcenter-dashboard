import { NextRequest, NextResponse } from 'next/server'
import { verifyToken, getTokenFromCookie } from '@/lib/auth'
import { getDashboardStats, getHourlyCallData, getWeeklyCallData, getSentimentData, getIntentData, getPeakHoursData, getRecentCalls } from '@/lib/database'

export async function GET(request: NextRequest) {
  try {
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

    const [stats, hourlyData, weeklyData, sentimentData, intentData, peakHoursData, recentCalls] = await Promise.all([
      getDashboardStats(orgId),
      getHourlyCallData(orgId),
      getWeeklyCallData(orgId),
      getSentimentData(orgId),
      getIntentData(orgId),
      getPeakHoursData(orgId),
      getRecentCalls(5, orgId),
    ])

    return NextResponse.json({
      success: true,
      data: {
        ...stats,
        timestamp: new Date().toISOString(),
      },
      charts: {
        hourlyData,
        weeklyData,
        sentimentData,
        intentData,
        peakHoursData,
      },
      recentCalls,
    })
  } catch (error) {
    console.error('Error fetching dashboard stats:', error)
    return NextResponse.json({
      success: false,
      data: {
        totalCalls: 0, answerRate: 0, avgDuration: '00:00:00', unresolvedCalls: 0,
        appointmentsBooked: 0, leadsQualified: 0, avgSatisfaction: 0, resolutionRate: 0,
        timestamp: new Date().toISOString(),
      },
      charts: { hourlyData: [], weeklyData: [], sentimentData: [], intentData: [], peakHoursData: [] },
      recentCalls: [],
      error: 'Database unavailable',
    })
  }
}

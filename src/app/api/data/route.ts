import { NextResponse } from 'next/server'
import { executeQuery } from '@/lib/database'

export async function GET() {
  try {
    // Example queries - replace with your actual table names and structure
    const [users, projects, revenue] = await Promise.all([
      executeQuery('SELECT COUNT(*) as count FROM users'),
      executeQuery('SELECT COUNT(*) as count FROM projects WHERE status = "active"'),
      executeQuery('SELECT SUM(amount) as total FROM revenue WHERE MONTH(created_at) = MONTH(CURRENT_DATE())')
    ])

    // Sample data structure - adjust based on your actual database schema
    const stats = {
      totalUsers: Array.isArray(users) && users.length > 0 ? (users[0] as any).count : 0,
      activeProjects: Array.isArray(projects) && projects.length > 0 ? (projects[0] as any).count : 0,
      monthlyRevenue: Array.isArray(revenue) && revenue.length > 0 ? (revenue[0] as any).total || 0 : 0
    }

    return NextResponse.json({
      success: true,
      data: stats,
      timestamp: new Date().toISOString()
    })
  } catch (error) {
    console.error('API Error:', error)
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to fetch data',
        timestamp: new Date().toISOString()
      },
      { status: 500 }
    )
  }
}
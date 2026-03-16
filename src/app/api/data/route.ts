import { NextRequest, NextResponse } from 'next/server'
import mysql from 'mysql2/promise'
import { verifyToken } from '@/lib/auth'

const dbConfig = {
  host: process.env.DB_HOST || 'localhost',
  port: parseInt(process.env.DB_PORT || '3306'),
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD || '',
  database: process.env.DB_NAME || 'callcenter_saas',
}

export async function GET(request: NextRequest) {
  try {
    // Get token from Authorization header
    const authHeader = request.headers.get('Authorization')
    const token = authHeader?.replace('Bearer ', '')

    if (!token) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    // Verify token
    const decoded = verifyToken(token)
    if (!decoded) {
      return NextResponse.json(
        { error: 'Invalid token' },
        { status: 401 }
      )
    }

    const connection = await mysql.createConnection(dbConfig)

    // Get recent calls for this organization
    const [calls] = await connection.execute(
      `SELECT 
        id, caller_name, caller_phone, caller_email, start_time, duration,
        status, outcome, sentiment, intent, transcript, ai_summary,
        CASE 
          WHEN start_time >= NOW() - INTERVAL 1 MINUTE THEN 'Just now'
          WHEN start_time >= NOW() - INTERVAL 1 HOUR THEN CONCAT(TIMESTAMPDIFF(MINUTE, start_time, NOW()), ' minutes ago')
          WHEN start_time >= NOW() - INTERVAL 1 DAY THEN CONCAT(TIMESTAMPDIFF(HOUR, start_time, NOW()), ' hours ago')
          ELSE DATE_FORMAT(start_time, '%M %d, %Y')
        END as time_ago
      FROM calls 
      WHERE organization_id = ?
      ORDER BY created_at DESC
      LIMIT 50`,
      [decoded.organizationId]
    )

    connection.end()

    return NextResponse.json({
      success: true,
      recentCalls: calls,
    })
  } catch (error) {
    console.error('Error fetching data:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

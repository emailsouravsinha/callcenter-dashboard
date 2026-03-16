import { NextRequest, NextResponse } from 'next/server'
import mysql from 'mysql2/promise'
import { verifyToken, getTokenFromCookie } from '@/lib/auth'

const dbConfig = {
  host: process.env.DB_HOST || 'localhost',
  port: parseInt(process.env.DB_PORT || '3306'),
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD || '',
  database: process.env.DB_NAME || 'callcenter_saas',
  ...(process.env.DB_SSL === 'true' && { ssl: { rejectUnauthorized: false } }),
}

export async function GET(request: NextRequest) {
  try {
    const cookieHeader = request.headers.get('cookie') || ''
    const authHeader = request.headers.get('Authorization')
    const token = authHeader?.replace('Bearer ', '') || getTokenFromCookie(cookieHeader)

    if (!token) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const decoded = verifyToken(token)
    if (!decoded) {
      return NextResponse.json({ error: 'Invalid token' }, { status: 401 })
    }

    const orgId = decoded.organizationId
    const connection = await mysql.createConnection(dbConfig)

    // Group conversation turns into single call entries.
    // The Python AI Caller logs one row per turn. We group by caller_phone
    // within a 10-minute window to reconstruct the full conversation.
    const [calls] = await connection.execute(
      `SELECT 
        MIN(c.id) as id,
        c.caller_name,
        c.caller_phone,
        c.caller_email,
        MIN(c.start_time) as start_time,
        TIMEDIFF(MAX(c.end_time), MIN(c.start_time)) as duration,
        MAX(c.status) as status,
        -- Pick the most meaningful outcome (appointment > lead > info)
        CASE
          WHEN SUM(c.outcome = 'appointment_booked') > 0 THEN 'appointment_booked'
          WHEN SUM(c.outcome = 'lead_qualified') > 0 THEN 'lead_qualified'
          WHEN SUM(c.outcome = 'complaint') > 0 THEN 'complaint'
          ELSE MAX(c.outcome)
        END as outcome,
        -- Pick the strongest sentiment
        CASE
          WHEN SUM(c.sentiment = 'negative') > 0 THEN 'negative'
          WHEN SUM(c.sentiment = 'positive') > 0 THEN 'positive'
          ELSE 'neutral'
        END as sentiment,
        MAX(c.intent) as intent,
        -- Concatenate all transcripts and AI responses as a conversation
        GROUP_CONCAT(
          CONCAT('Caller: ', COALESCE(c.transcript, ''), '\nSophie: ', COALESCE(c.ai_summary, ''))
          ORDER BY c.start_time ASC
          SEPARATOR '\n\n'
        ) as transcript,
        -- Use the last AI summary as the overall summary
        SUBSTRING_INDEX(
          GROUP_CONCAT(c.ai_summary ORDER BY c.start_time DESC SEPARATOR '|||'),
          '|||', 1
        ) as ai_summary,
        COUNT(*) as turn_count,
        CASE 
          WHEN MIN(c.start_time) >= NOW() - INTERVAL 1 MINUTE THEN 'Just now'
          WHEN MIN(c.start_time) >= NOW() - INTERVAL 1 HOUR THEN CONCAT(TIMESTAMPDIFF(MINUTE, MIN(c.start_time), NOW()), ' minutes ago')
          WHEN MIN(c.start_time) >= NOW() - INTERVAL 1 DAY THEN CONCAT(TIMESTAMPDIFF(HOUR, MIN(c.start_time), NOW()), ' hours ago')
          ELSE DATE_FORMAT(MIN(c.start_time), '%M %d, %Y')
        END as time_ago
      FROM calls c
      WHERE c.organization_id = ?
      GROUP BY c.caller_phone, c.caller_name, c.caller_email,
        -- Group turns within a 10-minute window as one call
        FLOOR(UNIX_TIMESTAMP(c.start_time) / 600)
      ORDER BY MIN(c.start_time) DESC
      LIMIT 50`,
      [orgId]
    )

    connection.end()

    return NextResponse.json({
      success: true,
      recentCalls: calls,
    })
  } catch (error: any) {
    console.error('Error fetching data:', error)
    const msg = error.message?.includes('Database connection') ? error.message : 'Internal server error'
    return NextResponse.json({ error: msg }, { status: 500 })
  }
}

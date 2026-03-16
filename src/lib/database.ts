import mysql from 'mysql2/promise'

const dbConfig = {
  host: process.env.DB_HOST || 'localhost',
  port: parseInt(process.env.DB_PORT || '3306'),
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD || '',
  database: process.env.DB_NAME || 'callcenter_saas',
  ...(process.env.DB_SSL === 'true' && {
    ssl: { rejectUnauthorized: false }
  }),
}

const pool = mysql.createPool({
  ...dbConfig,
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0,
})

export async function testConnection() {
  try {
    const connection = await pool.getConnection()
    await connection.ping()
    connection.release()
    return true
  } catch (error) {
    console.error('Database connection failed:', error)
    return false
  }
}

export async function executeQuery<T = any>(query: string, params: any[] = []): Promise<T[]> {
  try {
    const [rows] = await pool.execute(query, params)
    return rows as T[]
  } catch (error) {
    console.error('Database query error:', error)
    throw error
  }
}

// Dashboard KPIs - all filtered by organization_id
export async function getDashboardStats(orgId?: number) {
  const orgFilter = orgId ? 'AND organization_id = ?' : ''
  const orgParams = orgId ? [orgId] : []

  try {
    const [totalCalls] = await executeQuery(
      `SELECT COUNT(*) as total FROM calls WHERE DATE(created_at) = CURDATE() ${orgFilter}`, orgParams
    )
    const [answerRate] = await executeQuery(
      `SELECT ROUND(COALESCE(COUNT(CASE WHEN status = 'answered' THEN 1 END) * 100.0 / NULLIF(COUNT(*), 0), 0), 1) as rate FROM calls WHERE DATE(created_at) = CURDATE() ${orgFilter}`, orgParams
    )
    const [avgDuration] = await executeQuery(
      `SELECT COALESCE(SEC_TO_TIME(AVG(TIME_TO_SEC(duration))), '00:00:00') as avg_duration FROM calls WHERE status = 'answered' AND DATE(created_at) = CURDATE() ${orgFilter}`, orgParams
    )
    const [unresolvedCalls] = await executeQuery(
      `SELECT COUNT(*) as count FROM calls WHERE first_contact_resolution = FALSE AND DATE(created_at) = CURDATE() ${orgFilter}`, orgParams
    )
    const [appointmentsBooked] = await executeQuery(
      `SELECT COUNT(*) as count FROM appointments WHERE DATE(created_at) >= DATE_SUB(CURDATE(), INTERVAL 7 DAY) ${orgFilter}`, orgParams
    )
    const [leadsQualified] = await executeQuery(
      `SELECT COUNT(*) as count FROM leads WHERE status IN ('qualified', 'converted') AND DATE(created_at) >= DATE_SUB(CURDATE(), INTERVAL 7 DAY) ${orgFilter}`, orgParams
    )
    const [avgSatisfaction] = await executeQuery(
      `SELECT ROUND(COALESCE(AVG(rating), 0), 1) as avg_rating FROM surveys WHERE survey_type = 'csat' AND DATE(created_at) >= DATE_SUB(CURDATE(), INTERVAL 30 DAY) ${orgFilter}`, orgParams
    )
    const [resolutionRate] = await executeQuery(
      `SELECT ROUND(COALESCE(COUNT(CASE WHEN first_contact_resolution = TRUE THEN 1 END) * 100.0 / NULLIF(COUNT(*), 0), 0), 1) as rate FROM calls WHERE status = 'answered' AND DATE(created_at) = CURDATE() ${orgFilter}`, orgParams
    )

    return {
      totalCalls: totalCalls?.total || 0,
      answerRate: answerRate?.rate || 0,
      avgDuration: avgDuration?.avg_duration || '00:00:00',
      unresolvedCalls: unresolvedCalls?.count || 0,
      appointmentsBooked: appointmentsBooked?.count || 0,
      leadsQualified: leadsQualified?.count || 0,
      avgSatisfaction: avgSatisfaction?.avg_rating || 0,
      resolutionRate: resolutionRate?.rate || 0,
    }
  } catch (error) {
    console.error('Error fetching dashboard stats:', error)
    throw error
  }
}

// Recent calls for activity feed
export async function getRecentCalls(limit: number = 10, orgId?: number) {
  const orgFilter = orgId ? 'WHERE c.organization_id = ?' : ''
  const params: any[] = orgId ? [orgId, limit] : [limit]

  const query = `
    SELECT c.id, c.caller_name, c.caller_phone, c.caller_email, c.start_time, c.duration,
      c.status, c.outcome, c.sentiment, c.intent, c.transcript, c.ai_summary,
      c.first_contact_resolution,
      CASE 
        WHEN c.start_time >= NOW() - INTERVAL 1 MINUTE THEN 'Just now'
        WHEN c.start_time >= NOW() - INTERVAL 1 HOUR THEN CONCAT(TIMESTAMPDIFF(MINUTE, c.start_time, NOW()), ' min ago')
        WHEN c.start_time >= NOW() - INTERVAL 1 DAY THEN CONCAT(TIMESTAMPDIFF(HOUR, c.start_time, NOW()), ' hours ago')
        ELSE DATE_FORMAT(c.start_time, '%b %d, %Y')
      END as time_ago
    FROM calls c ${orgFilter}
    ORDER BY c.created_at DESC LIMIT ?
  `
  return await executeQuery(query, params)
}

// Hourly call volume for charts
export async function getHourlyCallData(orgId?: number) {
  const orgFilter = orgId ? 'AND organization_id = ?' : ''
  const params = orgId ? [orgId] : []

  const query = `
    SELECT HOUR(start_time) as hour,
      COUNT(*) as total_calls,
      COUNT(CASE WHEN status = 'answered' THEN 1 END) as answered,
      COUNT(CASE WHEN status = 'missed' THEN 1 END) as missed
    FROM calls WHERE DATE(start_time) = CURDATE() ${orgFilter}
    GROUP BY HOUR(start_time) ORDER BY hour
  `
  const results = await executeQuery(query, params)
  return results.map((row: any) => ({
    hour: `${row.hour}:00`,
    calls: row.total_calls,
    answered: row.answered,
    missed: row.missed,
  }))
}

// Weekly call volume for charts
export async function getWeeklyCallData(orgId?: number) {
  const orgFilter = orgId ? 'AND c.organization_id = ?' : ''
  const params = orgId ? [orgId, orgId, orgId] : []

  const query = `
    SELECT DATE_FORMAT(d.day, '%a') as day_name, d.day,
      COALESCE(calls.total, 0) as calls,
      COALESCE(appts.total, 0) as appointments,
      COALESCE(lds.total, 0) as leads
    FROM (
      SELECT CURDATE() - INTERVAL n DAY as day
      FROM (SELECT 0 n UNION SELECT 1 UNION SELECT 2 UNION SELECT 3 UNION SELECT 4 UNION SELECT 5 UNION SELECT 6) nums
    ) d
    LEFT JOIN (SELECT DATE(created_at) as dt, COUNT(*) as total FROM calls WHERE DATE(created_at) >= DATE_SUB(CURDATE(), INTERVAL 7 DAY) ${orgFilter} GROUP BY dt) calls ON d.day = calls.dt
    LEFT JOIN (SELECT DATE(created_at) as dt, COUNT(*) as total FROM appointments WHERE DATE(created_at) >= DATE_SUB(CURDATE(), INTERVAL 7 DAY) ${orgFilter} GROUP BY dt) appts ON d.day = appts.dt
    LEFT JOIN (SELECT DATE(created_at) as dt, COUNT(*) as total FROM leads WHERE DATE(created_at) >= DATE_SUB(CURDATE(), INTERVAL 7 DAY) ${orgFilter} GROUP BY dt) lds ON d.day = lds.dt
    ORDER BY d.day
  `
  return await executeQuery(query, params)
}

// Sentiment distribution for analytics
export async function getSentimentData(orgId?: number) {
  const orgFilter = orgId ? 'AND organization_id = ?' : ''
  const params = orgId ? [orgId] : []

  const query = `
    SELECT sentiment, COUNT(*) as count
    FROM calls WHERE sentiment IS NOT NULL AND DATE(created_at) >= DATE_SUB(CURDATE(), INTERVAL 30 DAY) ${orgFilter}
    GROUP BY sentiment
  `
  return await executeQuery(query, params)
}

// Intent distribution for analytics
export async function getIntentData(orgId?: number) {
  const orgFilter = orgId ? 'AND organization_id = ?' : ''
  const params = orgId ? [orgId] : []

  const query = `
    SELECT intent, COUNT(*) as count
    FROM calls WHERE intent IS NOT NULL AND DATE(created_at) >= DATE_SUB(CURDATE(), INTERVAL 30 DAY) ${orgFilter}
    GROUP BY intent ORDER BY count DESC LIMIT 10
  `
  return await executeQuery(query, params)
}

// Peak hours for analytics
export async function getPeakHoursData(orgId?: number) {
  const orgFilter = orgId ? 'AND organization_id = ?' : ''
  const params = orgId ? [orgId] : []

  const query = `
    SELECT HOUR(start_time) as hour, COUNT(*) as calls
    FROM calls WHERE DATE(start_time) >= DATE_SUB(CURDATE(), INTERVAL 7 DAY) ${orgFilter}
    GROUP BY HOUR(start_time) ORDER BY hour
  `
  const results = await executeQuery(query, params)
  return results.map((row: any) => ({
    hour: `${row.hour > 12 ? row.hour - 12 : row.hour}${row.hour >= 12 ? 'pm' : 'am'}`,
    calls: row.calls,
  }))
}

export default pool

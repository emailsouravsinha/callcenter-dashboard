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

    // Get appointments for this organization
    const [appointments] = await connection.execute(
      `SELECT 
        a.id, a.appointment_date, a.service_type, a.status, a.notes,
        c.name as contact_name, c.phone as contact_phone, c.email as contact_email
      FROM appointments a
      LEFT JOIN contacts c ON a.contact_id = c.id
      WHERE a.organization_id = ?
      ORDER BY a.appointment_date DESC
      LIMIT 50`,
      [decoded.organizationId]
    )

    connection.end()

    return NextResponse.json({
      success: true,
      appointments: appointments,
    })
  } catch (error) {
    console.error('Error fetching appointments:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

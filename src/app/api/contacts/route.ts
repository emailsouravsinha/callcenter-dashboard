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

    // Get contacts for this organization
    const [contacts] = await connection.execute(
      `SELECT 
        id, name, company, phone, email, total_calls, status, last_contact_date
      FROM contacts 
      WHERE organization_id = ? AND status = 'active'
      ORDER BY last_contact_date DESC
      LIMIT 50`,
      [decoded.organizationId]
    )

    connection.end()

    return NextResponse.json({
      success: true,
      contacts: contacts,
    })
  } catch (error) {
    console.error('Error fetching contacts:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

import { NextRequest, NextResponse } from 'next/server'
import mysql from 'mysql2/promise'
import bcrypt from 'bcryptjs'
import crypto from 'crypto'
import { verifyToken, getTokenFromCookie } from '@/lib/auth'
import { sendEmail, generateWelcomeEmail } from '@/lib/email'

const dbConfig = {
  host: process.env.DB_HOST || 'localhost',
  port: parseInt(process.env.DB_PORT || '3306'),
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD || '',
  database: process.env.DB_NAME || 'callcenter_saas',
  ...(process.env.DB_SSL === 'true' && { ssl: { rejectUnauthorized: false } }),
}

async function getConnection() {
  try {
    return await mysql.createConnection(dbConfig)
  } catch (error: any) {
    console.error('Database connection failed:', error.message)
    throw new Error(`Database connection failed: ${error.code || error.message}. Check your DB_HOST, DB_USER, and DB_PASSWORD in .env.local`)
  }
}

// GET - List users (filtered by org for non-admin)
export async function GET(request: NextRequest) {
  try {
    const cookieHeader = request.headers.get('cookie') || ''
    const authHeader = request.headers.get('authorization')
    const token = authHeader?.replace('Bearer ', '') || getTokenFromCookie(cookieHeader)

    if (!token) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const decoded = verifyToken(token)
    if (!decoded) {
      return NextResponse.json({ error: 'Invalid token' }, { status: 401 })
    }

    const connection = await getConnection()

    // Platform admin (orgId 0) sees all users, org users see only their org
    const isAdmin = decoded.organizationId === 0 || decoded.role === 'owner'
    const orgFilter = request.nextUrl.searchParams.get('organizationId')

    let query = `
      SELECT u.id, u.email, u.first_name, u.last_name, u.created_at,
             ou.role, ou.is_active, ou.organization_id, o.name as org_name
      FROM users u
      JOIN organization_users ou ON u.id = ou.user_id
      JOIN organizations o ON ou.organization_id = o.id
    `
    const params: any[] = []

    if (orgFilter) {
      query += ' WHERE ou.organization_id = ?'
      params.push(orgFilter)
    } else if (!isAdmin) {
      query += ' WHERE ou.organization_id = ?'
      params.push(decoded.organizationId)
    }

    query += ' ORDER BY u.created_at DESC'

    const [users] = await connection.execute(query, params)
    connection.end()

    return NextResponse.json({ users })
  } catch (error: any) {
    console.error('Get users error:', error)
    const msg = error.message?.includes('Database connection') ? error.message : 'Internal server error'
    return NextResponse.json({ error: msg }, { status: 500 })
  }
}

// POST - Create new user
export async function POST(request: NextRequest) {
  try {
    const cookieHeader = request.headers.get('cookie') || ''
    const authHeader = request.headers.get('authorization')
    const token = authHeader?.replace('Bearer ', '') || getTokenFromCookie(cookieHeader)

    if (!token) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const decoded = verifyToken(token)
    if (!decoded || (decoded.role !== 'owner' && decoded.role !== 'admin')) {
      return NextResponse.json({ error: 'Insufficient permissions' }, { status: 403 })
    }

    const { email, firstName, lastName, role, organizationId } = await request.json()

    if (!email || !firstName || !lastName || !role || !organizationId) {
      return NextResponse.json({ error: 'All fields are required' }, { status: 400 })
    }

    const connection = await getConnection()

    // Check if email already exists
    const [existing] = await connection.execute('SELECT id FROM users WHERE email = ?', [email])
    if (Array.isArray(existing) && existing.length > 0) {
      connection.end()
      return NextResponse.json({ error: 'Email already exists' }, { status: 409 })
    }

    // Generate temporary password
    const tempPassword = crypto.randomBytes(6).toString('base64url')
    const passwordHash = await bcrypt.hash(tempPassword, 12)

    // Create user
    const [result] = await connection.execute(
      'INSERT INTO users (email, password_hash, first_name, last_name, email_verified) VALUES (?, ?, ?, ?, TRUE)',
      [email, passwordHash, firstName, lastName]
    )

    const userId = (result as any).insertId

    // Link user to organization
    await connection.execute(
      'INSERT INTO organization_users (user_id, organization_id, role, is_active) VALUES (?, ?, ?, TRUE)',
      [userId, organizationId, role]
    )

    connection.end()

    // Send welcome email with credentials
    try {
      await sendEmail({
        to: email,
        subject: 'Welcome to Sophie AI - Your Login Details',
        html: generateWelcomeEmail(firstName, email, tempPassword),
      })
    } catch (emailError) {
      console.warn('Failed to send welcome email:', emailError)
    }

    return NextResponse.json({
      success: true,
      user: { id: userId, email, firstName, lastName, role, organizationId },
      tempPassword, // Return so admin can share manually if email fails
    })
  } catch (error: any) {
    console.error('Create user error:', error)
    const msg = error.message?.includes('Database connection') ? error.message : 'Internal server error'
    return NextResponse.json({ error: msg }, { status: 500 })
  }
}

// DELETE - Remove user
export async function DELETE(request: NextRequest) {
  try {
    const cookieHeader = request.headers.get('cookie') || ''
    const authHeader = request.headers.get('authorization')
    const token = authHeader?.replace('Bearer ', '') || getTokenFromCookie(cookieHeader)

    if (!token) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const decoded = verifyToken(token)
    if (!decoded || (decoded.role !== 'owner' && decoded.role !== 'admin')) {
      return NextResponse.json({ error: 'Insufficient permissions' }, { status: 403 })
    }

    const { userId } = await request.json()

    if (!userId) {
      return NextResponse.json({ error: 'User ID required' }, { status: 400 })
    }

    const connection = await getConnection()
    await connection.execute('UPDATE organization_users SET is_active = FALSE WHERE user_id = ?', [userId])
    connection.end()

    return NextResponse.json({ success: true })
  } catch (error: any) {
    console.error('Delete user error:', error)
    const msg = error.message?.includes('Database connection') ? error.message : 'Internal server error'
    return NextResponse.json({ error: msg }, { status: 500 })
  }
}

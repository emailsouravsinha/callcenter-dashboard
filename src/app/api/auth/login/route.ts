import { NextRequest, NextResponse } from 'next/server'
import mysql from 'mysql2/promise'
import { generateToken } from '@/lib/auth'

const dbConfig = {
  host: process.env.DB_HOST || 'localhost',
  port: parseInt(process.env.DB_PORT || '3306'),
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD || '',
  database: process.env.DB_NAME || 'callcenter_saas',
}

export async function POST(request: NextRequest) {
  try {
    const { email, password } = await request.json()

    if (!email || !password) {
      return NextResponse.json(
        { error: 'Email and password required' },
        { status: 400 }
      )
    }

    const connection = await mysql.createConnection(dbConfig)

    // Get user and organization
    const [users] = await connection.execute(
      `SELECT u.id, u.email, ou.organization_id, ou.role 
       FROM users u 
       JOIN organization_users ou ON u.id = ou.user_id 
       WHERE u.email = ? AND ou.is_active = TRUE`,
      [email]
    )

    connection.end()

    if (!Array.isArray(users) || users.length === 0) {
      return NextResponse.json(
        { error: 'Invalid credentials' },
        { status: 401 }
      )
    }

    const user = users[0] as any

    // Generate JWT token
    const token = generateToken({
      userId: user.id,
      organizationId: user.organization_id,
      email: user.email,
      role: user.role,
    })

    const response = NextResponse.json({
      success: true,
      token,
      user: {
        id: user.id,
        email: user.email,
        organizationId: user.organization_id,
        role: user.role,
      },
    })

    // Set secure HTTP-only cookie
    response.cookies.set('auth', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 7 * 24 * 60 * 60, // 7 days
    })

    return response
  } catch (error) {
    console.error('Login error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

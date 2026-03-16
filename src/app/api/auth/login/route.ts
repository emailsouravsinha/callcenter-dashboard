import { NextRequest, NextResponse } from 'next/server'
import mysql from 'mysql2/promise'
import bcrypt from 'bcryptjs'
import { generateToken } from '@/lib/auth'

// Demo users fallback (when DB is unavailable)
const DEMO_USERS: Record<string, { id: number; email: string; organizationId: number; role: 'owner' | 'admin' | 'manager' | 'agent' | 'read_only'; passwordHash: string }> = {}

// Pre-hash demo passwords at module load
;(async () => {
  DEMO_USERS['admin@rpaclick.com'] = {
    id: 1,
    email: 'admin@rpaclick.com',
    organizationId: 0,
    role: 'owner',
    passwordHash: await bcrypt.hash('admin123', 10),
  }
})()

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
      return NextResponse.json({ error: 'Email and password required' }, { status: 400 })
    }

    let user = null

    // Try database first
    try {
      const connection = await mysql.createConnection(dbConfig)

      const [users] = await connection.execute(
        `SELECT u.id, u.email, u.password_hash, u.first_name, u.last_name,
                ou.organization_id, ou.role, o.name as org_name
         FROM users u
         JOIN organization_users ou ON u.id = ou.user_id
         JOIN organizations o ON ou.organization_id = o.id
         WHERE u.email = ? AND ou.is_active = TRUE`,
        [email]
      )

      connection.end()

      if (Array.isArray(users) && users.length > 0) {
        const dbUser = users[0] as any
        const passwordValid = await bcrypt.compare(password, dbUser.password_hash)

        if (!passwordValid) {
          return NextResponse.json({ error: 'Invalid credentials' }, { status: 401 })
        }

        user = {
          id: dbUser.id,
          email: dbUser.email,
          firstName: dbUser.first_name,
          lastName: dbUser.last_name,
          organizationId: dbUser.organization_id,
          orgName: dbUser.org_name,
          role: dbUser.role,
        }
      }
    } catch (dbError) {
      console.warn('Database unavailable, using demo users:', dbError)
      // Fallback to demo users
      const demoUser = DEMO_USERS[email]
      if (demoUser) {
        const valid = await bcrypt.compare(password, demoUser.passwordHash)
        if (valid) {
          user = {
            id: demoUser.id,
            email: demoUser.email,
            firstName: 'Admin',
            lastName: '',
            organizationId: demoUser.organizationId,
            orgName: 'RPA Click',
            role: demoUser.role,
          }
        }
      }
    }

    if (!user) {
      return NextResponse.json({ error: 'Invalid credentials' }, { status: 401 })
    }

    const token = generateToken({
      userId: user.id,
      organizationId: user.organizationId,
      email: user.email,
      role: user.role,
    })

    const response = NextResponse.json({
      success: true,
      token,
      user: {
        id: user.id,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        organizationId: user.organizationId,
        orgName: user.orgName,
        role: user.role,
      },
    })

    response.cookies.set('auth', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 7 * 24 * 60 * 60,
    })

    return response
  } catch (error) {
    console.error('Login error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

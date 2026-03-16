import { NextRequest, NextResponse } from 'next/server'
import mysql from 'mysql2/promise'
import { verifyToken, getTokenFromCookie } from '@/lib/auth'

const dbConfig = {
  host: process.env.DB_HOST || 'localhost',
  port: parseInt(process.env.DB_PORT || '3306'),
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD || '',
  database: process.env.DB_NAME || 'callcenter_saas',
}

// GET - List organizations
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

    const connection = await mysql.createConnection(dbConfig)

    const [orgs] = await connection.execute(`
      SELECT o.id, o.name, o.slug, o.status, o.created_at,
             COUNT(DISTINCT ou.user_id) as user_count
      FROM organizations o
      LEFT JOIN organization_users ou ON o.id = ou.organization_id AND ou.is_active = TRUE
      GROUP BY o.id
      ORDER BY o.created_at DESC
    `)

    connection.end()

    return NextResponse.json({ organizations: orgs })
  } catch (error) {
    console.error('Get organizations error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// POST - Create organization
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

    const { name, slug } = await request.json()

    if (!name || !slug) {
      return NextResponse.json({ error: 'Name and slug are required' }, { status: 400 })
    }

    const connection = await mysql.createConnection(dbConfig)

    // Check if slug exists
    const [existing] = await connection.execute('SELECT id FROM organizations WHERE slug = ?', [slug])
    if (Array.isArray(existing) && existing.length > 0) {
      connection.end()
      return NextResponse.json({ error: 'Organization slug already exists' }, { status: 409 })
    }

    const [result] = await connection.execute(
      'INSERT INTO organizations (name, slug, status) VALUES (?, ?, ?)',
      [name, slug, 'active']
    )

    const orgId = (result as any).insertId
    connection.end()

    return NextResponse.json({
      success: true,
      organization: { id: orgId, name, slug, status: 'active' },
    })
  } catch (error) {
    console.error('Create organization error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

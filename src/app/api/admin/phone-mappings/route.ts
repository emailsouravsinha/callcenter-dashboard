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

// GET - List phone mappings
export async function GET(request: NextRequest) {
  try {
    const cookieHeader = request.headers.get('cookie') || ''
    const authHeader = request.headers.get('authorization')
    const token = authHeader?.replace('Bearer ', '') || getTokenFromCookie(cookieHeader)

    if (!token) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    const decoded = verifyToken(token)
    if (!decoded) return NextResponse.json({ error: 'Invalid token' }, { status: 401 })

    const connection = await mysql.createConnection(dbConfig)
    const [mappings] = await connection.execute(`
      SELECT dm.id, dm.organization_id, dm.phone_number, dm.vector_store_id,
             dm.is_active, dm.created_at, o.name as org_name
      FROM doc_mappings dm
      JOIN organizations o ON dm.organization_id = o.id
      ORDER BY dm.created_at DESC
    `)
    connection.end()

    return NextResponse.json({ mappings })
  } catch (error) {
    console.error('Get phone mappings error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// POST - Create phone mapping
export async function POST(request: NextRequest) {
  try {
    const cookieHeader = request.headers.get('cookie') || ''
    const authHeader = request.headers.get('authorization')
    const token = authHeader?.replace('Bearer ', '') || getTokenFromCookie(cookieHeader)

    if (!token) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    const decoded = verifyToken(token)
    if (!decoded || (decoded.role !== 'owner' && decoded.role !== 'admin')) {
      return NextResponse.json({ error: 'Insufficient permissions' }, { status: 403 })
    }

    const { organizationId, phoneNumber, vectorStoreId } = await request.json()

    if (!organizationId || !phoneNumber || !vectorStoreId) {
      return NextResponse.json({ error: 'Organization, phone number, and vector store ID are required' }, { status: 400 })
    }

    const connection = await mysql.createConnection(dbConfig)

    // Check if phone number already mapped
    const [existing] = await connection.execute(
      'SELECT id FROM doc_mappings WHERE phone_number = ? AND is_active = TRUE', [phoneNumber]
    )
    if (Array.isArray(existing) && existing.length > 0) {
      connection.end()
      return NextResponse.json({ error: 'This phone number is already mapped to an organization' }, { status: 409 })
    }

    const [result] = await connection.execute(
      'INSERT INTO doc_mappings (organization_id, phone_number, vector_store_id, is_active) VALUES (?, ?, ?, TRUE)',
      [organizationId, phoneNumber, vectorStoreId]
    )

    const mappingId = (result as any).insertId
    connection.end()

    return NextResponse.json({
      success: true,
      mapping: { id: mappingId, organizationId, phoneNumber, vectorStoreId },
    })
  } catch (error) {
    console.error('Create phone mapping error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// DELETE - Deactivate phone mapping
export async function DELETE(request: NextRequest) {
  try {
    const cookieHeader = request.headers.get('cookie') || ''
    const authHeader = request.headers.get('authorization')
    const token = authHeader?.replace('Bearer ', '') || getTokenFromCookie(cookieHeader)

    if (!token) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    const decoded = verifyToken(token)
    if (!decoded || (decoded.role !== 'owner' && decoded.role !== 'admin')) {
      return NextResponse.json({ error: 'Insufficient permissions' }, { status: 403 })
    }

    const { mappingId } = await request.json()
    if (!mappingId) return NextResponse.json({ error: 'Mapping ID required' }, { status: 400 })

    const connection = await mysql.createConnection(dbConfig)
    await connection.execute('UPDATE doc_mappings SET is_active = FALSE WHERE id = ?', [mappingId])
    connection.end()

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Delete phone mapping error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

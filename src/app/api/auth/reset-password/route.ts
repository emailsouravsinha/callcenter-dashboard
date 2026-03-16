import { NextRequest, NextResponse } from 'next/server'
import mysql from 'mysql2/promise'
import bcrypt from 'bcryptjs'

const dbConfig = {
  host: process.env.DB_HOST || 'localhost',
  port: parseInt(process.env.DB_PORT || '3306'),
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD || '',
  database: process.env.DB_NAME || 'callcenter_saas',
}

export async function POST(request: NextRequest) {
  try {
    const { token, password } = await request.json()

    if (!token || !password) {
      return NextResponse.json({ error: 'Token and password are required' }, { status: 400 })
    }

    if (password.length < 8) {
      return NextResponse.json({ error: 'Password must be at least 8 characters' }, { status: 400 })
    }

    const connection = await mysql.createConnection(dbConfig)

    const [users] = await connection.execute(
      'SELECT id FROM users WHERE reset_token = ? AND reset_token_expires > NOW()',
      [token]
    )

    if (!Array.isArray(users) || users.length === 0) {
      connection.end()
      return NextResponse.json({ error: 'Invalid or expired reset token' }, { status: 400 })
    }

    const user = users[0] as any
    const passwordHash = await bcrypt.hash(password, 12)

    await connection.execute(
      'UPDATE users SET password_hash = ?, reset_token = NULL, reset_token_expires = NULL WHERE id = ?',
      [passwordHash, user.id]
    )

    connection.end()

    return NextResponse.json({ message: 'Password reset successfully' })
  } catch (error) {
    console.error('Reset password error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

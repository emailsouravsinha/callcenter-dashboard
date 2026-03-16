import { NextRequest, NextResponse } from 'next/server'
import mysql from 'mysql2/promise'
import crypto from 'crypto'
import { sendEmail } from '@/lib/email'

const dbConfig = {
  host: process.env.DB_HOST || 'localhost',
  port: parseInt(process.env.DB_PORT || '3306'),
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD || '',
  database: process.env.DB_NAME || 'callcenter_saas',
}

export async function POST(request: NextRequest) {
  try {
    const { email } = await request.json()

    if (!email) {
      return NextResponse.json({ message: 'If an account exists, a reset link has been sent.' })
    }

    try {
      const connection = await mysql.createConnection(dbConfig)

      const [users] = await connection.execute(
        'SELECT id, email, first_name FROM users WHERE email = ?',
        [email]
      )

      if (Array.isArray(users) && users.length > 0) {
        const user = users[0] as any
        const resetToken = crypto.randomBytes(32).toString('hex')
        const resetExpiry = new Date(Date.now() + 3600000) // 1 hour

        await connection.execute(
          'UPDATE users SET reset_token = ?, reset_token_expires = ? WHERE id = ?',
          [resetToken, resetExpiry, user.id]
        )

        const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3001'
        const resetUrl = `${baseUrl}/reset-password?token=${resetToken}`

        await sendEmail({
          to: user.email,
          subject: 'Sophie AI - Password Reset',
          html: `
            <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
              <div style="text-align: center; margin-bottom: 30px;">
                <h1 style="color: #7c3aed; margin: 0;">Sophie</h1>
                <p style="color: #6b7280; margin: 4px 0 0;">The AI Receptionist</p>
              </div>
              <div style="background: #f9fafb; border-radius: 12px; padding: 30px;">
                <h2 style="color: #111827; margin-top: 0;">Password Reset</h2>
                <p style="color: #4b5563;">Hi ${user.first_name || 'there'},</p>
                <p style="color: #4b5563;">We received a request to reset your password. Click the button below to set a new one:</p>
                <div style="text-align: center; margin: 30px 0;">
                  <a href="${resetUrl}" style="background: linear-gradient(to right, #7c3aed, #4f46e5); color: white; padding: 12px 32px; border-radius: 8px; text-decoration: none; font-weight: 600;">Reset Password</a>
                </div>
                <p style="color: #9ca3af; font-size: 14px;">This link expires in 1 hour. If you didn't request this, you can safely ignore this email.</p>
              </div>
              <p style="text-align: center; color: #9ca3af; font-size: 12px; margin-top: 20px;">Powered by RPA Click</p>
            </div>
          `,
        })
      }

      connection.end()
    } catch (dbError) {
      console.warn('Database error during password reset:', dbError)
    }

    // Always return same message to prevent email enumeration
    return NextResponse.json({ message: 'If an account exists, a reset link has been sent.' })
  } catch (error) {
    console.error('Forgot password error:', error)
    return NextResponse.json({ message: 'If an account exists, a reset link has been sent.' })
  }
}

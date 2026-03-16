import nodemailer from 'nodemailer'

const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST || 'smtp.gmail.com',
  port: parseInt(process.env.SMTP_PORT || '587'),
  secure: false,
  auth: {
    user: process.env.SMTP_USER || '',
    pass: process.env.SMTP_PASS || '',
  },
})

interface EmailOptions {
  to: string
  subject: string
  html: string
}

export async function sendEmail({ to, subject, html }: EmailOptions) {
  try {
    await transporter.sendMail({
      from: process.env.SMTP_FROM || '"Sophie AI" <noreply@rpaclick.com>',
      to,
      subject,
      html,
    })
    return true
  } catch (error) {
    console.error('Email send error:', error)
    return false
  }
}

export function generateWelcomeEmail(firstName: string, email: string, tempPassword: string): string {
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3001'
  return `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
      <div style="text-align: center; margin-bottom: 30px;">
        <h1 style="color: #7c3aed; margin: 0;">Sophie</h1>
        <p style="color: #6b7280; margin: 4px 0 0;">The AI Receptionist</p>
      </div>
      <div style="background: #f9fafb; border-radius: 12px; padding: 30px;">
        <h2 style="color: #111827; margin-top: 0;">Welcome to Sophie AI!</h2>
        <p style="color: #4b5563;">Hi ${firstName},</p>
        <p style="color: #4b5563;">Your account has been created. Here are your login details:</p>
        <div style="background: white; border-radius: 8px; padding: 20px; margin: 20px 0; border: 1px solid #e5e7eb;">
          <p style="margin: 0 0 8px; color: #4b5563;"><strong>Email:</strong> ${email}</p>
          <p style="margin: 0; color: #4b5563;"><strong>Temporary Password:</strong> ${tempPassword}</p>
        </div>
        <p style="color: #ef4444; font-size: 14px;">Please change your password after your first login.</p>
        <div style="text-align: center; margin: 30px 0;">
          <a href="${baseUrl}/login" style="background: linear-gradient(to right, #7c3aed, #4f46e5); color: white; padding: 12px 32px; border-radius: 8px; text-decoration: none; font-weight: 600;">Sign In Now</a>
        </div>
      </div>
      <p style="text-align: center; color: #9ca3af; font-size: 12px; margin-top: 20px;">Powered by RPA Click</p>
    </div>
  `
}

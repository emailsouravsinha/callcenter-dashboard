import jwt from 'jsonwebtoken'

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key-change-in-production'

export interface AuthToken {
  userId: number
  organizationId: number
  email: string
  role: 'owner' | 'admin' | 'manager' | 'agent' | 'read_only'
  iat: number
  exp: number
}

export function generateToken(payload: Omit<AuthToken, 'iat' | 'exp'>, expiresIn = '7d'): string {
  return jwt.sign(payload, JWT_SECRET, { expiresIn })
}

export function verifyToken(token: string): AuthToken | null {
  try {
    return jwt.verify(token, JWT_SECRET) as AuthToken
  } catch (error) {
    return null
  }
}

export function getTokenFromCookie(cookieString: string): string | null {
  const cookies = cookieString.split(';').map(c => c.trim())
  const authCookie = cookies.find(c => c.startsWith('auth='))
  return authCookie ? authCookie.substring(5) : null
}

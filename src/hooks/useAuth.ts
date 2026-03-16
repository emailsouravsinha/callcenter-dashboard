'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'

export interface User {
  id: number
  email: string
  firstName?: string
  lastName?: string
  organizationId: number
  orgName?: string
  role: 'owner' | 'admin' | 'manager' | 'agent' | 'read_only'
}

export function useAuth() {
  const router = useRouter()
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)
  const [token, setToken] = useState<string | null>(null)

  useEffect(() => {
    const storedToken = localStorage.getItem('auth_token')
    const storedUser = localStorage.getItem('user')

    if (storedToken && storedUser) {
      try {
        setToken(storedToken)
        setUser(JSON.parse(storedUser))
      } catch (error) {
        console.error('Failed to parse user data:', error)
        logout()
      }
    } else {
      router.push('/login')
    }

    setLoading(false)
  }, [router])

  const logout = () => {
    localStorage.removeItem('auth_token')
    localStorage.removeItem('user')
    setUser(null)
    setToken(null)
    router.push('/login')
  }

  return { user, token, loading, logout }
}

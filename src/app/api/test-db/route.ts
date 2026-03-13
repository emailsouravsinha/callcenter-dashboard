import { NextResponse } from 'next/server'
import { testConnection, getDashboardStats } from '@/lib/database'

export async function GET() {
  try {
    // Test database connection
    const isConnected = await testConnection()
    
    if (!isConnected) {
      return NextResponse.json(
        { 
          success: false, 
          message: 'Database connection failed',
          timestamp: new Date().toISOString()
        },
        { status: 500 }
      )
    }

    // Try to fetch some stats
    const stats = await getDashboardStats()

    return NextResponse.json({
      success: true,
      message: 'Database connection successful',
      data: stats,
      timestamp: new Date().toISOString()
    })

  } catch (error) {
    console.error('Database test error:', error)
    return NextResponse.json(
      { 
        success: false, 
        message: 'Database test failed',
        error: error instanceof Error ? error.message : 'Unknown error',
        timestamp: new Date().toISOString()
      },
      { status: 500 }
    )
  }
}
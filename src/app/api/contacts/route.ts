import { NextResponse } from 'next/server'
import { getContacts } from '@/lib/database'

export async function GET() {
  try {
    const contacts = await getContacts(100)
    
    return NextResponse.json({
      success: true,
      contacts,
      timestamp: new Date().toISOString()
    })
  } catch (error) {
    console.error('Error fetching contacts:', error)
    return NextResponse.json(
      { 
        success: false, 
        error: 'Failed to fetch contacts',
        contacts: []
      },
      { status: 500 }
    )
  }
}

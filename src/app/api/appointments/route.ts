import { NextResponse } from 'next/server'
import { executeQuery } from '@/lib/database'

export async function GET() {
  try {
    const orgId = parseInt(process.env.ORGANIZATION_ID || '1')
    
    const query = `
      SELECT 
        a.id,
        a.appointment_date,
        a.service_type,
        a.status,
        a.notes,
        c.name as contact_name,
        c.phone as contact_phone,
        c.email as contact_email
      FROM appointments a
      JOIN contacts c ON a.contact_id = c.id
      WHERE a.organization_id = ?
      ORDER BY a.appointment_date DESC
      LIMIT 100
    `
    
    const appointments = await executeQuery(query, [orgId])
    
    return NextResponse.json({
      success: true,
      appointments,
      timestamp: new Date().toISOString()
    })
  } catch (error) {
    console.error('Error fetching appointments:', error)
    return NextResponse.json(
      { 
        success: false, 
        error: 'Failed to fetch appointments',
        appointments: []
      },
      { status: 500 }
    )
  }
}

import { createClient } from '@supabase/supabase-js'
import { NextResponse } from 'next/server'

const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_KEY)

export async function GET() {
  try {
    const {
      data: { users },
      error,
    } = await supabase.auth.admin.listUsers({
      page: 1,
      perPage: 1000,
    })

    if (error) throw error
    
    const { count: reportsCount } = await supabase
      .from('reports')
      .select('*', { count: 'exact', head: true })

    const timeSaved = "45%"
    
    const environmentalImpact = "30%"

    return NextResponse.json({
      stats: {
        usersCount: users.length,
        reportsCount: reportsCount || 0,
        timeSaved,
        environmentalImpact
      }
    })
  } catch (error) {
    console.error('Error fetching stats:', error)
    return NextResponse.json(
      { error: 'Could not fetch statistics' },
      { status: 500 }
    )
  }
} 
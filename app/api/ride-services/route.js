import { createClient } from '@supabase/supabase-js'
import { NextResponse } from 'next/server'

const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY)

export async function GET() {
  try {
    const { data, error } = await supabase
      .from('ride_services')
      .select('*')
      .order('name')

    if (error) throw error

    const hour = new Date().getHours()
    
    const servicesWithCurrentPrice = data.map(service => {
      let currentPrice
      if (hour >= 0 && hour < 8) {
        currentPrice = service.price_night
      } else if (hour >= 8 && hour < 15) {
        currentPrice = service.price_morning
      } else if (hour >= 15 && hour < 18) {
        currentPrice = service.price_peak
      } else {
        currentPrice = service.price_evening
      }

      return {
        ...service,
        currentPrice
      }
    })

    return NextResponse.json({ services: servicesWithCurrentPrice })
  } catch (error) {
    console.error('Error fetching ride services:', error)
    return NextResponse.json({ error: 'Could not fetch ride services' }, { status: 500 })
  }
} 
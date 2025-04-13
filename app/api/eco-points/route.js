import { createClient } from '@supabase/supabase-js'
import { NextResponse } from 'next/server'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_KEY
)

export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url)
    const userId = searchParams.get('user_id')

    if (!userId) {
      return NextResponse.json({ error: 'User ID is required' }, { status: 400 })
    }

    const { data, error } = await supabase
      .from('eco_points')
      .select('points')
      .eq('user_id', userId)
      .single()

    if (error && error.code !== 'PGRST116') {
      throw error
    }

    return NextResponse.json({ points: data?.points || 0 })
  } catch (error) {
    console.error('Error in eco-points route:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}

export async function PATCH(request) {
  try {
    const { user_id, points_to_add } = await request.json()

    if (!user_id || points_to_add === undefined) {
      return NextResponse.json(
        { error: 'User ID and points_to_add are required' },
        { status: 400 }
      )
    }

    // First, get current points or initialize with 0
    const { data: currentData, error: getError } = await supabase
      .from('eco_points')
      .select('points')
      .eq('user_id', user_id)
      .single()

    if (getError && getError.code !== 'PGRST116') {
      throw getError
    }

    const currentPoints = currentData?.points || 0
    const newPoints = currentPoints + points_to_add

    // Use upsert to either update existing record or create new one
    const { data: updatedData, error: updateError } = await supabase
      .from('eco_points')
      .upsert(
        {
          user_id,
          points: newPoints,
          updated_at: new Date().toISOString()
        },
        {
          onConflict: 'user_id',
          returning: true
        }
      )
      .select()
      .single()

    if (updateError) throw updateError

    return NextResponse.json(updatedData)
  } catch (error) {
    console.error('Error in eco-points route:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
} 
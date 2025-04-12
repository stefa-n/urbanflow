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

    let { data: points, error: getError } = await supabase
      .from('eco_points')
      .select('*')
      .eq('user_id', userId)
      .single()

    if (getError && getError.code !== 'PGRST116') {
      throw getError
    }

    if (!points) {
      const { data: newPoints, error: insertError } = await supabase
        .from('eco_points')
        .insert([{ user_id: userId, points: 0 }])
        .select()
        .single()

      if (insertError) {
        throw insertError
      }

      points = newPoints
    }

    return NextResponse.json(points)
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

    const { data: currentPoints, error: getError } = await supabase
      .from('eco_points')
      .select('points')
      .eq('user_id', user_id)
      .single()

    if (getError && getError.code !== 'PGRST116') {
      throw getError
    }

    const newPoints = (currentPoints?.points || 0) + points_to_add

    const { data: updatedPoints, error: updateError } = await supabase
      .from('eco_points')
      .upsert({
        user_id,
        points: newPoints,
        updated_at: new Date().toISOString()
      })
      .select()
      .single()

    if (updateError) {
      throw updateError
    }

    return NextResponse.json(updatedPoints)
  } catch (error) {
    console.error('Error in eco-points route:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
} 
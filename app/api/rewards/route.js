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

    const { data: availableRewards, error: availableError } = await supabase
      .from('rewards')
      .select('*')
      .is('owned_by', null)
      .order('points_cost', { ascending: true })

    if (availableError) throw availableError

    const { data: redeemedRewards, error: redeemedError } = await supabase
      .from('rewards')
      .select('*')
      .eq('owned_by', userId)
      .order('redeemed_at', { ascending: false })

    if (redeemedError) throw redeemedError

    return NextResponse.json({
      available: availableRewards,
      redeemed: redeemedRewards
    })
  } catch (error) {
    console.error('Error in rewards route:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}

export async function POST(request) {
  try {
    const { user_id, reward_id } = await request.json()

    if (!user_id || !reward_id) {
      return NextResponse.json(
        { error: 'User ID and reward ID are required' },
        { status: 400 }
      )
    }

    const { data: reward, error: rewardError } = await supabase
      .from('rewards')
      .select('*')
      .eq('id', reward_id)
      .is('owned_by', null)
      .single()

    if (rewardError) throw rewardError
    if (!reward) {
      return NextResponse.json(
        { error: 'Reward not available' },
        { status: 400 }
      )
    }

    const { data: userPoints, error: pointsError } = await supabase
      .from('eco_points')
      .select('points')
      .eq('user_id', user_id)
      .single()

    if (pointsError) throw pointsError
    if (!userPoints || userPoints.points < reward.points_cost) {
      return NextResponse.json(
        { error: 'Insufficient points' },
        { status: 400 }
      )
    }

    const { error: updateRewardError } = await supabase
      .from('rewards')
      .update({
        owned_by: user_id,
        redeemed_at: new Date().toISOString()
      })
      .eq('id', reward_id)

    if (updateRewardError) throw updateRewardError

    const { error: updatePointsError } = await supabase
      .from('eco_points')
      .update({
        points: userPoints.points - reward.points_cost,
        updated_at: new Date().toISOString()
      })
      .eq('user_id', user_id)

    if (updatePointsError) throw updatePointsError

    return NextResponse.json(reward)
  } catch (error) {
    console.error('Error in rewards route:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
} 
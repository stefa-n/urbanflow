import { createClient } from '@supabase/supabase-js'
import { NextResponse } from 'next/server'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_KEY
)

const ACHIEVEMENTS = {
    bike_master: {
        id: 'bike_master',
        name: 'Ciclist Expert',
        description: 'Completează 5 trasee cu bicicleta',
        requiredCount: 5,
        transportMode: 'bike',
        points: 500
    },
    walking_master: {
        id: 'walking_master',
        name: 'Pieton Dedicat',
        description: 'Completează 5 trasee pe jos',
        requiredCount: 5,
        transportMode: 'walking',
        points: 750
    }
}

export async function GET(request) {
    try {
        const { searchParams } = new URL(request.url)
        const userId = searchParams.get('user_id')

        if (!userId) {
            return NextResponse.json({ error: 'User ID is required' }, { status: 400 })
        }

        const { data: { user }, error: userError } = await supabase.auth.admin.getUserById(userId)
        if (userError) throw userError

        const stats = user.user_metadata.route_stats || {}
        const claimedAchievements = user.user_metadata.claimed_achievements || []

        const availableAchievements = Object.values(ACHIEVEMENTS).filter(achievement => {
            const count = stats[achievement.transportMode] || 0
            return count >= achievement.requiredCount && !claimedAchievements.includes(achievement.id)
        })

        return NextResponse.json({
            stats,
            claimedAchievements,
            availableAchievements
        })
    } catch (error) {
        console.error('Error in achievements route:', error)
        return NextResponse.json({ error: error.message }, { status: 500 })
    }
}

export async function POST(request) {
    try {
        const { user_id, achievement_id } = await request.json()

        if (!user_id || !achievement_id) {
            return NextResponse.json(
                { error: 'User ID and achievement ID are required' },
                { status: 400 }
            )
        }

        const { data: { user }, error: userError } = await supabase.auth.admin.getUserById(user_id)
        if (userError) throw userError

        const stats = user.user_metadata.route_stats || {}
        const claimedAchievements = user.user_metadata.claimed_achievements || []
        const achievement = ACHIEVEMENTS[achievement_id]

        if (!achievement) {
            return NextResponse.json({ error: 'Invalid achievement ID' }, { status: 400 })
        }

        const count = stats[achievement.transportMode] || 0
        if (count < achievement.requiredCount) {
            return NextResponse.json({ error: 'Achievement requirements not met' }, { status: 400 })
        }

        if (claimedAchievements.includes(achievement_id)) {
            return NextResponse.json({ error: 'Achievement already claimed' }, { status: 400 })
        }

        const { error: updateError } = await supabase.auth.admin.updateUserById(
            user_id,
            {
                user_metadata: {
                    ...user.user_metadata,
                    claimed_achievements: [...claimedAchievements, achievement_id]
                }
            }
        )
        if (updateError) throw updateError

        const response = await fetch(`${process.env.NEXT_PUBLIC_APP_URL}/api/eco-points`, {
            method: 'PATCH',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                user_id,
                points_to_add: achievement.points
            })
        })

        if (!response.ok) {
            throw new Error('Failed to update eco points')
        }

        const pointsData = await response.json()

        return NextResponse.json({
            success: true,
            achievement,
            points_awarded: achievement.points,
            total_points: pointsData.points
        })
    } catch (error) {
        console.error('Error in achievements route:', error)
        return NextResponse.json({ error: error.message }, { status: 500 })
    }
} 
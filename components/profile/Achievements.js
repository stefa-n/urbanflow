"use client"

import { useState, useEffect } from 'react'
import { Trophy, Bike, FootprintsIcon, Leaf } from 'lucide-react'
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY)

const achievementsList = {
    bike_master: {
        name: 'Ciclist Expert',
        description: 'Ai completat 5 trasee cu bicicleta',
        icon: Bike,
        color: 'bg-blue-500',
        points: 500
    },
    walking_master: {
        name: 'Pieton Dedicat',
        description: 'Ai completat 5 trasee pe jos',
        icon: FootprintsIcon,
        color: 'bg-green-500',
        points: 750
    }
}

export default function Achievements() {
    const [stats, setStats] = useState({})
    const [claimedAchievements, setClaimedAchievements] = useState([])
    const [availableAchievements, setAvailableAchievements] = useState([])
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState(null)
    const [claimingId, setClaimingId] = useState(null)

    const fetchAchievements = async () => {
        try {
            const { data: { user } } = await supabase.auth.getUser()
            if (!user) return

            const response = await fetch(`/api/achievements?user_id=${user.id}`)
            const data = await response.json()

            if (!response.ok) throw new Error(data.error)

            setStats(data.stats)
            setClaimedAchievements(data.claimedAchievements)
            setAvailableAchievements(data.availableAchievements)
        } catch (error) {
            console.error('Error fetching achievements:', error)
            setError('Nu am putut încărca realizările')
        } finally {
            setLoading(false)
        }
    }

    useEffect(() => {
        fetchAchievements()
    }, [])

    const handleClaim = async (achievementId) => {
        try {
            setClaimingId(achievementId)
            const { data: { user } } = await supabase.auth.getUser()
            if (!user) return

            const response = await fetch('/api/achievements', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    user_id: user.id,
                    achievement_id: achievementId
                })
            })

            const data = await response.json()
            if (!response.ok) throw new Error(data.error)

            await fetchAchievements()
        } catch (error) {
            console.error('Error claiming achievement:', error)
            setError('Nu am putut revendica realizarea')
        } finally {
            setClaimingId(null)
        }
    }

    const getProgressToNextAchievement = (mode) => {
        const count = stats[mode] || 0
        const required = 5
        const progress = Math.min((count / required) * 100, 100)
        return {
            count,
            required,
            progress
        }
    }

    if (loading) {
        return (
            <div className="bg-white rounded-lg shadow-sm p-6">
                <div className="flex items-center space-x-2 mb-4">
                    <Trophy className="w-6 h-6 text-yellow-500" />
                    <h2 className="text-xl font-bold">Realizări</h2>
                </div>
                <div className="animate-pulse space-y-4">
                    <div className="h-24 bg-gray-200 rounded-lg"></div>
                    <div className="h-24 bg-gray-200 rounded-lg"></div>
                </div>
            </div>
        )
    }

    if (error) {
        return (
            <div className="bg-white rounded-lg shadow-sm p-6">
                <div className="bg-red-100 border-l-4 border-red-500 text-red-700 p-4">
                    <p>{error}</p>
                </div>
            </div>
        )
    }

    return (
        <div className="bg-white rounded-lg shadow-sm p-6">
            <div className="flex items-center space-x-2 mb-6">
                <Trophy className="w-6 h-6 text-yellow-500" />
                <h2 className="text-xl font-bold">Realizări</h2>
            </div>

            <div className="space-y-6">
                {Object.entries(achievementsList).map(([id, achievement]) => {
                    const isUnlocked = claimedAchievements.includes(id)
                    const isAvailable = availableAchievements.some(a => a.id === id)
                    const progress = getProgressToNextAchievement(id.split('_')[0])
                    const Icon = achievement.icon

                    return (
                        <div
                            key={id}
                            className={`p-4 rounded-lg border-2 ${
                                isUnlocked ? achievement.color + ' border-transparent' : 'border-gray-200'
                            }`}
                        >
                            <div className="flex items-start justify-between">
                                <div className="flex items-center space-x-3">
                                    <div className={`p-2 rounded-lg ${isUnlocked ? 'bg-white bg-opacity-20' : 'bg-gray-100'}`}>
                                        <Icon className={`w-6 h-6 ${isUnlocked ? 'text-white' : 'text-gray-500'}`} />
                                    </div>
                                    <div>
                                        <h3 className={`font-semibold ${isUnlocked ? 'text-white' : 'text-gray-900'}`}>
                                            {achievement.name}
                                        </h3>
                                        <p className={`text-sm ${isUnlocked ? 'text-white text-opacity-90' : 'text-gray-500'}`}>
                                            {achievement.description}
                                        </p>
                                    </div>
                                </div>
                                {isUnlocked ? (
                                    <div className="flex items-center text-white">
                                        <Leaf className="w-4 h-4 mr-1" />
                                        <span>+{achievement.points}</span>
                                    </div>
                                ) : isAvailable && (
                                    <button
                                        onClick={() => handleClaim(id)}
                                        disabled={claimingId === id}
                                        className={`px-4 py-2 rounded-lg bg-green-500 text-white text-sm font-medium hover:bg-green-600 focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2 ${
                                            claimingId === id ? 'opacity-75 cursor-not-allowed' : ''
                                        }`}
                                    >
                                        {claimingId === id ? 'Se revendică...' : 'Revendică EcoPoints'}
                                    </button>
                                )}
                            </div>

                            {!isUnlocked && (
                                <div className="mt-4">
                                    <div className="flex justify-between text-sm text-gray-500 mb-1">
                                        <span>Progres</span>
                                        <span>{progress.count}/{progress.required} trasee</span>
                                    </div>
                                    <div className="w-full bg-gray-200 rounded-full h-2">
                                        <div
                                            className={`h-2 rounded-full ${achievement.color}`}
                                            style={{ width: `${progress.progress}%` }}
                                        />
                                    </div>
                                </div>
                            )}
                        </div>
                    )
                })}
            </div>
        </div>
    )
} 
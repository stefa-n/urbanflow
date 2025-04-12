"use client"

import { useState, useEffect } from 'react'
import { createClient } from '@supabase/supabase-js'
import { Leaf, History } from 'lucide-react'
import RedeemedRewardCard from '@/components/rewards/RedeemedRewardCard'

const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY)

export default function GiftCardHistory() {
  const [user, setUser] = useState(null)
  const [redeemedRewards, setRedeemedRewards] = useState([])
  const [ecoPoints, setEcoPoints] = useState(0)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    const fetchUserAndHistory = async () => {
      try {
        const { data: { user } } = await supabase.auth.getUser()
        if (!user) {
          setError('Trebuie să fii autentificat pentru a vedea istoricul gift cardurilor')
          return
        }

        setUser(user)

        // Fetch eco points
        const pointsResponse = await fetch(`/api/eco-points?user_id=${user.id}`)
        const pointsData = await pointsResponse.json()
        
        if (!pointsResponse.ok) throw new Error(pointsData.error)
        setEcoPoints(pointsData.points)

        // Fetch redeemed rewards
        const rewardsResponse = await fetch(`/api/rewards?user_id=${user.id}`)
        const rewardsData = await rewardsResponse.json()
        
        if (!rewardsResponse.ok) throw new Error(rewardsData.error)
        setRedeemedRewards(rewardsData.redeemed)
      } catch (error) {
        console.error("Error fetching gift card history:", error)
        setError("Nu am putut încărca istoricul gift cardurilor. Te rugăm să încerci din nou.")
      } finally {
        setLoading(false)
      }
    }

    fetchUserAndHistory()
  }, [])

  if (loading) {
    return (
      <div className="min-h-[calc(100vh-4rem)] bg-[oklch(93.8%_0.127_124.321)] py-6">
        <div className="container mx-auto px-4">
          <div className="bg-white rounded-lg shadow-sm p-6">
            <p className="text-center text-gray-500">Se încarcă...</p>
          </div>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="min-h-[calc(100vh-4rem)] bg-[oklch(93.8%_0.127_124.321)] py-6">
        <div className="container mx-auto px-4">
          <div className="bg-white rounded-lg shadow-sm p-6">
            <p className="text-center text-red-500">{error}</p>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-[calc(100vh-4rem)] bg-[oklch(93.8%_0.127_124.321)] py-6">
      <div className="container mx-auto px-4">
        <div className="bg-white rounded-lg shadow-sm p-6">
          <div className="flex justify-between items-center mb-6">
            <div className="flex items-center gap-2">
              <History size={24} />
              <h1 className="text-2xl font-bold">Istoricul Gift Cardurilor</h1>
            </div>
            <div className="flex items-center bg-lime-300 px-4 py-2 rounded-full">
              <Leaf size={20} className="mr-2" />
              <span className="font-medium">{ecoPoints} puncte eco</span>
            </div>
          </div>

          {redeemedRewards.length > 0 ? (
            <div className="space-y-4">
              {redeemedRewards.map((reward) => (
                <RedeemedRewardCard key={reward.id} reward={reward} />
              ))}
            </div>
          ) : (
            <div className="text-center py-12 bg-gray-50 rounded-lg">
              <History size={48} className="mx-auto mb-4 text-gray-400" />
              <p className="text-gray-500">Nu ai revendicat încă niciun gift card</p>
              <a
                href="/reward"
                className="mt-4 inline-block px-4 py-2 bg-lime-300 hover:bg-lime-400 text-black rounded-lg font-medium"
              >
                Vezi recompensele disponibile
              </a>
            </div>
          )}
        </div>
      </div>
    </div>
  )
} 
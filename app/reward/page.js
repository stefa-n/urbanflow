"use client"

import { useState, useEffect } from 'react'
import { createClient } from '@supabase/supabase-js'
import { Leaf, AlertCircle } from 'lucide-react'
import RewardCard from '@/components/rewards/RewardCard'
import RedeemedRewardCard from '@/components/rewards/RedeemedRewardCard'

const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY)

export default function RewardPage() {
  const [user, setUser] = useState(null)
  const [ecoPoints, setEcoPoints] = useState(0)
  const [availableRewards, setAvailableRewards] = useState([])
  const [redeemedRewards, setRedeemedRewards] = useState([])
  const [error, setError] = useState('')
  const [successMessage, setSuccessMessage] = useState('')

  useEffect(() => {
    const fetchUserAndRewards = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      if (user) {
        setUser(user)
        
        try {
          const pointsResponse = await fetch(`/api/eco-points?user_id=${user.id}`)
          const pointsData = await pointsResponse.json()
          
          if (!pointsResponse.ok) throw new Error(pointsData.error)
          setEcoPoints(pointsData.points)

          const rewardsResponse = await fetch(`/api/rewards?user_id=${user.id}`)
          const rewardsData = await rewardsResponse.json()
          
          if (!rewardsResponse.ok) throw new Error(rewardsData.error)
          setAvailableRewards(rewardsData.available)
          setRedeemedRewards(rewardsData.redeemed)
        } catch (error) {
          console.error("Error fetching data:", error)
          setError("Nu am putut încărca datele. Te rugăm să încerci din nou.")
        }
      }
    }

    fetchUserAndRewards()
  }, [])

  const handleRedeem = async (reward) => {
    try {
      setError('')
      setSuccessMessage('')

      if (ecoPoints < reward.points_cost) {
        setError("Nu ai suficiente puncte eco pentru această recompensă")
        return
      }

      const response = await fetch('/api/rewards', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          user_id: user.id,
          reward_id: reward.id
        })
      })

      const data = await response.json()
      
      if (!response.ok) {
        throw new Error(data.error)
      }

      setEcoPoints(prev => prev - reward.points_cost)
      setAvailableRewards(prev => prev.filter(r => r.id !== reward.id))
      setRedeemedRewards(prev => [data, ...prev])
      setSuccessMessage(`Ai revendicat cu succes ${reward.title}! Codul tău este: ${reward.gift_card_code}`)
    } catch (error) {
      console.error("Error redeeming reward:", error)
      setError("A apărut o eroare la revendicarea recompensei. Te rugăm să încerci din nou.")
    }
  }

  return (
    <div className="min-h-[calc(100vh-4rem)] bg-[oklch(93.8%_0.127_124.321)] py-6">
      <div className="container mx-auto px-4">
        <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
          <div className="flex justify-between items-center mb-6">
            <h1 className="text-2xl font-bold">Recompense</h1>
            <div className="flex items-center bg-lime-300 px-4 py-2 rounded-full">
              <Leaf size={20} className="mr-2" />
              <span className="font-medium">{ecoPoints} puncte eco</span>
            </div>
          </div>

          {error && (
            <div className="mb-6 p-4 bg-red-100 border-l-4 border-red-500 text-red-700 flex items-center">
              <AlertCircle size={20} className="mr-2" />
              <p>{error}</p>
            </div>
          )}

          {successMessage && (
            <div className="mb-6 p-4 bg-green-100 border-l-4 border-green-500 text-green-700">
              <p>{successMessage}</p>
            </div>
          )}

          <div className="mb-8">
            <h2 className="text-xl font-semibold mb-4">Recompense Disponibile</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {availableRewards.map((reward) => (
                <RewardCard
                  key={reward.id}
                  reward={reward}
                  userPoints={ecoPoints}
                  onRedeem={handleRedeem}
                />
              ))}
            </div>
          </div>

          {redeemedRewards.length > 0 && (
            <div>
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-xl font-semibold">Recompense Revendicate Recent</h2>
                <a
                  href="/profile/gift-cards"
                  className="text-sm text-gray-500 hover:text-gray-700"
                >
                  Vezi tot istoricul →
                </a>
              </div>
              <div className="space-y-4">
                {redeemedRewards.slice(0, 3).map((reward) => (
                  <RedeemedRewardCard key={reward.id} reward={reward} />
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
import { Gift } from 'lucide-react'

export default function RedeemedRewardCard({ reward }) {
  return (
    <div className="border rounded-lg p-4 bg-gray-50">
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-2">
          <Gift size={20} className={reward.type === 'amazon' ? 'text-yellow-600' : 'text-blue-600'} />
          <h3 className="font-medium">{reward.title}</h3>
        </div>
        <span className="text-sm text-gray-500">
          {new Date(reward.redeemed_at).toLocaleDateString('ro-RO')}
        </span>
      </div>
      <p className="text-gray-600 text-sm mb-2">{reward.description}</p>
      <div className="bg-white p-3 rounded border">
        <p className="text-sm font-mono select-all">{reward.gift_card_code}</p>
      </div>
    </div>
  )
} 
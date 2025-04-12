import { Gift } from 'lucide-react'
import { motion } from 'framer-motion'

export default function RewardCard({ reward, userPoints, onRedeem }) {
  return (
    <motion.div
      className="border rounded-lg p-4 hover:shadow-md transition-shadow"
      whileHover={{ scale: 1.02 }}
      whileTap={{ scale: 0.98 }}
    >
      <div className="flex items-center justify-between mb-2">
        <h3 className="font-medium">{reward.title}</h3>
        <Gift size={20} className={reward.type === 'amazon' ? 'text-yellow-600' : 'text-blue-600'} />
      </div>
      <p className="text-gray-600 text-sm mb-4">{reward.description}</p>
      <div className="flex justify-between items-center">
        <span className="text-sm font-medium">{reward.points_cost} puncte</span>
        <button
          onClick={() => onRedeem(reward)}
          disabled={userPoints < reward.points_cost}
          className={`px-4 py-2 rounded-lg text-sm font-medium ${
            userPoints >= reward.points_cost
              ? 'bg-lime-300 hover:bg-lime-400 text-black'
              : 'bg-gray-100 text-gray-400 cursor-not-allowed'
          }`}
        >
          Revendică
        </button>
      </div>
    </motion.div>
  )
} 
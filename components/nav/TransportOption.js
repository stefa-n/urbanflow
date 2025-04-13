"use client"

export default function TransportOption({ mode, icon: Icon, time, isSelected, onClick }) {
    const getEcoMultiplier = (mode) => {
        const multipliers = {
            "Mașină": "0x",
            "Bicicletă": "1x",
            "Mers pe jos": "1.5x",
            "Cursa": "0.3x"
        }
        return multipliers[mode] || "0x"
    }

    return (
        <div
            onClick={onClick}
            className={`p-3 rounded-lg cursor-pointer transition-all ${isSelected ? "bg-lime-300 shadow-md" : "bg-white hover:bg-gray-50"
                }`}
        >
            <div className="flex flex-col items-center">
                <Icon size={22} className={isSelected ? "text-black" : "text-gray-600"} />
                <h3 className="font-medium mt-1 text-sm">{mode}</h3>
                <div className="flex flex-col items-center mt-1">
                    <span className="text-xs font-semibold">{time === "--" ? "--" : `${time} min`}</span>
                    <span className="text-xs text-gray-500 mt-0.5">
                        {getEcoMultiplier(mode)} puncte eco
                    </span>
                </div>
            </div>
        </div>
    )
}

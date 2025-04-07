"use client"

export default function TransportOption({ mode, icon: Icon, time, isSelected, onClick }) {
    return (
        <div
            onClick={onClick}
            className={`p-3 rounded-lg cursor-pointer transition-all ${isSelected ? "bg-lime-300 shadow-md" : "bg-white hover:bg-gray-50"
                }`}
        >
            <div className="flex flex-col items-center">
                <Icon size={22} className={isSelected ? "text-black" : "text-gray-600"} />
                <h3 className="font-medium mt-1 text-sm">{mode}</h3>
                <div className="flex items-center mt-1">
                    <span className="text-xs font-semibold">{time === "--" ? "--" : `${time} min`}</span>
                </div>
            </div>
        </div>
    )
}

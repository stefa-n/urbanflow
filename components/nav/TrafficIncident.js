import { AlertTriangle } from "lucide-react"

export default function TrafficIncident({ incident }) {
    const getSeverityColor = (severity) => {
        switch (severity.toLowerCase()) {
            case "ridicat":
                return "red-500"
            case "mediu":
                return "orange-500"
            case "scazut":
                return "yellow-500"
            default:
                return "gray-500"
        }
    }

    return (
        <div className={`border-l-4 border-${getSeverityColor(incident.severity)} pl-3 py-2 mb-4`}>
            <div className="flex justify-between items-start">
                <div>
                    <h3 className="font-semibold text-gray-900">{incident.location}</h3>
                    <p className="text-sm text-gray-600">{incident.type}</p>
                    <div className={`flex items-center mt-1 text-${getSeverityColor(incident.severity)}`}>
                        <AlertTriangle size={14} className={`mr-1`} />
                        <span className="text-xs">Severitate: {incident.severity}</span>
                    </div>
                </div>
                <span className="text-xs text-gray-500">{incident.time}</span>
            </div>
        </div>
    )
}


"use client"

import { useState, useEffect } from 'react'
import { Car, ChevronDown } from 'lucide-react'

export default function RideServiceOption({ distance, isSelected, onClick }) {
    const [services, setServices] = useState([])
    const [selectedService, setSelectedService] = useState(null)
    const [isLoading, setIsLoading] = useState(true)
    const [error, setError] = useState(null)
    const [isDropdownOpen, setIsDropdownOpen] = useState(false)

    useEffect(() => {
        const fetchServices = async () => {
            try {
                const response = await fetch('/api/ride-services')
                const data = await response.json()

                if (!response.ok) throw new Error(data.error)
                setServices(data.services)
            } catch (error) {
                console.error('Error fetching ride services:', error)
                setError('Nu am putut încărca serviciile de transport')
            } finally {
                setIsLoading(false)
            }
        }

        fetchServices()
    }, [])

    const handleServiceChange = (service) => {
        setSelectedService(service)
        setIsDropdownOpen(false)
        onClick()
    }

    const calculatePrice = (pricePerKm) => {
        if (!distance) return null
        const totalPrice = (distance * pricePerKm).toFixed(0)
        return totalPrice
    }

    const getServiceIcon = (serviceName) => {
        switch (serviceName.toLowerCase()) {
            case 'uber':
                return '🚙'
            case 'bolt':
                return '🟢'
            default:
                return '🚖'
        }
    }

    return (
        <div
            className={`p-3 rounded-lg cursor-pointer transition-all ${
                isSelected ? "bg-lime-300 shadow-md" : "bg-white hover:bg-gray-50"
            }`}
        >
            <div className="flex flex-col items-center">
                <Car size={22} className={isSelected ? "text-black" : "text-gray-600"} />
                <h3 className="font-medium mt-1 text-sm">Cursa</h3>
                
                {isLoading ? (
                    <div className="mt-2 text-xs text-gray-500 flex items-center">
                        <div className="w-4 h-4 border-2 border-gray-300 border-t-gray-600 rounded-full animate-spin mr-2"></div>
                        Se încarcă...
                    </div>
                ) : error ? (
                    <div className="mt-2 text-xs text-red-500">{error}</div>
                ) : (
                    <div className="w-full mt-2 relative">
                        <button
                            onClick={() => setIsDropdownOpen(!isDropdownOpen)}
                            className={`w-full px-3 py-2 text-sm rounded-lg border transition-all flex items-center justify-between
                                ${isSelected ? 'bg-lime-200 border-lime-400' : 'bg-white border-gray-300 hover:border-gray-400'}
                                ${isDropdownOpen ? 'ring-2 ring-black border-transparent' : ''}`}
                        >
                            <span className="flex items-center">
                                {selectedService ? (
                                    <>
                                        <span className="mr-2">{getServiceIcon(selectedService.name)}</span>
                                        <span>{selectedService.name}</span>
                                    </>
                                ) : (
                                    'Alege serviciul'
                                )}
                            </span>
                            <ChevronDown size={16} className={`transition-transform ${isDropdownOpen ? 'rotate-180' : ''}`} />
                        </button>
                        
                        {isDropdownOpen && (
                            <div className="absolute left-0 right-0 mt-1 bg-white border border-gray-200 rounded-lg shadow-lg z-50 py-1 max-h-48 overflow-y-auto">
                                {services.map(service => (
                                    <button
                                        key={service.id}
                                        onClick={() => handleServiceChange(service)}
                                        className="w-full px-3 py-2 text-sm text-left hover:bg-gray-50 flex items-center justify-between group"
                                    >
                                        <span className="flex items-center">
                                            <span className="mr-2">{getServiceIcon(service.name)}</span>
                                            <span>{service.name}</span>
                                        </span>
                                        <span className="text-gray-500 group-hover:text-gray-700">
                                            {service.currentPrice} lei/km
                                        </span>
                                    </button>
                                ))}
                            </div>
                        )}
                        
                        {selectedService && distance && (
                            <div className="mt-2 text-center">
                                <div className="text-xs font-medium text-gray-500">Cost estimat</div>
                                <div className="text-sm font-bold">
                                    ~{calculatePrice(selectedService.currentPrice)} lei
                                </div>
                            </div>
                        )}
                    </div>
                )}
            </div>
        </div>
    )
} 
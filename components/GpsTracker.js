"use client"

import { useState, useEffect, useRef } from 'react'
import { MapPin, Navigation, Leaf } from 'lucide-react'
import { motion } from 'framer-motion'
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY)

const transportModeMultipliers = {
    car: 0,
    bike: 1,
    walking: 1.5,
    ride: 0.3
}

export default function GpsTracker({ isTracking, selectedRoute, onDistanceUpdate, transportMode = 'car' }) {
    const [positions, setPositions] = useState([])
    const [watchId, setWatchId] = useState(null)
    const [totalDistance, setTotalDistance] = useState(0)
    const [lastPosition, setLastPosition] = useState(null)
    const [lastTimestamp, setLastTimestamp] = useState(null)
    const [currentSpeed, setCurrentSpeed] = useState(0)
    const [ecoPoints, setEcoPoints] = useState(0)
    const [error, setError] = useState(null)
    const [lastPointsDistance, setLastPointsDistance] = useState(0)
    const basePointsPerKm = 100

    useEffect(() => {
        if (isTracking) {
            if ("geolocation" in navigator) {
                const id = navigator.geolocation.watchPosition(
                    (position) => {
                        const { latitude, longitude } = position.coords
                        const newPosition = [latitude, longitude]
                        
                        setPositions(prev => [...prev, newPosition])

                        if (lastPosition) {
                            const newDistance = calculateDistance(
                                lastPosition[0],
                                lastPosition[1],
                                latitude,
                                longitude
                            )
                            const updatedTotalDistance = totalDistance + newDistance
                            setTotalDistance(updatedTotalDistance)

                            const distanceSinceLastPoints = updatedTotalDistance - lastPointsDistance
                            if (distanceSinceLastPoints >= 0.1) {
                                const pointsToAward = calculateEcoPoints(distanceSinceLastPoints)
                                if (pointsToAward > 0) {
                                    updateEcoPoints(pointsToAward)
                                    setLastPointsDistance(updatedTotalDistance)
                                }
                            }

                            if (lastTimestamp) {
                                const timeElapsed = (position.timestamp - lastTimestamp) / 1000
                                const speedMps = newDistance / timeElapsed
                                const speedKph = speedMps * 3.6
                                setCurrentSpeed(speedKph)
                            }
                        }

                        setLastPosition(newPosition)
                        setLastTimestamp(position.timestamp)
                        
                        onDistanceUpdate(totalDistance, currentSpeed)
                    },
                    (error) => {
                        console.error("Error getting location:", error)
                        setError("Error getting location: " + error.message)
                    },
                    {
                        enableHighAccuracy: true,
                        timeout: 5000,
                        maximumAge: 0
                    }
                )
                setWatchId(id)
            }
        } else {
            if (watchId) {
                navigator.geolocation.clearWatch(watchId)
                setWatchId(null)
            }
            const remainingDistance = totalDistance - lastPointsDistance
            if (remainingDistance > 0) {
                const finalPoints = calculateEcoPoints(remainingDistance)
                if (finalPoints > 0) {
                    updateEcoPoints(finalPoints)
                }
            }
            setPositions([])
            setTotalDistance(0)
            setLastPosition(null)
            setLastTimestamp(null)
            setCurrentSpeed(0)
            setLastPointsDistance(0)
        }

        return () => {
            if (watchId) {
                navigator.geolocation.clearWatch(watchId)
            }
        }
    }, [isTracking, totalDistance, lastPointsDistance])

    const calculateDistance = (lat1, lon1, lat2, lon2) => {
        const R = 6371
        const dLat = (lat2 - lat1) * Math.PI / 180
        const dLon = (lon2 - lon1) * Math.PI / 180
        const a = 
            Math.sin(dLat/2) * Math.sin(dLat/2) +
            Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * 
            Math.sin(dLon/2) * Math.sin(dLon/2)
        const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a))
        return R * c
    }

    const calculateEcoPoints = (distance) => {
        const multiplier = transportModeMultipliers[transportMode] || 0
        return Math.floor(distance * basePointsPerKm * multiplier)
    }

    const updateEcoPoints = async (newPoints) => {
        if (newPoints <= 0) return

        try {
            const { data: { user } } = await supabase.auth.getUser()
            if (!user) return

            const response = await fetch('/api/eco-points', {
                method: 'PATCH',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    user_id: user.id,
                    points_to_add: newPoints
                })
            })

            if (!response.ok) {
                throw new Error('Failed to update eco points')
            }

            const data = await response.json()
            setEcoPoints(data.points)
        } catch (error) {
            console.error('Error updating eco points:', error)
        }
    }

    const getTransportModeInfo = () => {
        const multiplier = transportModeMultipliers[transportMode]
        const pointsPerKm = Math.floor(basePointsPerKm * multiplier)
        return `${pointsPerKm} puncte eco/km`
    }

    return (
        <div className="bg-white rounded-lg shadow-sm p-4 mb-4">
            <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold">GPS Tracking</h3>
                <div className="flex items-center space-x-2">
                    <div className="text-sm text-gray-600">{getTransportModeInfo()}</div>
                    <div className="flex items-center bg-lime-300 px-3 py-1 rounded-full">
                        <Leaf size={16} className="mr-1" />
                        <span className="font-medium">{ecoPoints} puncte eco</span>
                    </div>
                </div>
            </div>

            {error && (
                <div className="bg-red-100 border-l-4 border-red-500 text-red-700 p-3 mb-4 rounded">
                    <p>{error}</p>
                </div>
            )}

            <div className="space-y-4">
                <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                    <div className="flex items-center">
                        <MapPin className="w-5 h-5 text-gray-600 mr-2" />
                        <div>
                            <div className="text-sm font-medium">Distanță parcursă</div>
                            <div className="text-lg font-bold">{totalDistance.toFixed(2)} km</div>
                        </div>
                    </div>
                </div>

                {selectedRoute && (
                    <div className="p-3 bg-gray-50 rounded-lg">
                        <div className="flex items-center mb-2">
                            <Navigation className="w-5 h-5 text-gray-600 mr-2" />
                            <div className="text-sm font-medium">Rută selectată</div>
                        </div>
                        <div className="text-sm text-gray-600">
                            {selectedRoute.startLocation} → {selectedRoute.endLocation}
                        </div>
                    </div>
                )}
            </div>
        </div>
    )
} 
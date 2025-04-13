"use client"

import { useState, useEffect, useRef } from 'react'
import { MapPin, Navigation, Leaf, StopCircle, Gauge } from 'lucide-react'
import { motion } from 'framer-motion'
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY)

const transportModeMultipliers = {
    car: 0,
    bike: 1,
    walking: 1.5,
    ride: 0.3
}

const achievements = {
    bike_master: {
        id: 'bike_master',
        name: 'Ciclist Expert',
        description: 'Completează 5 trasee cu bicicleta',
        requiredCount: 5,
        transportMode: 'bike',
        points: 500
    },
    walking_master: {
        id: 'walking_master',
        name: 'Pieton Dedicat',
        description: 'Completează 5 trasee pe jos',
        requiredCount: 5,
        transportMode: 'walking',
        points: 750
    }
}

export default function GpsTracker({ isTracking, selectedRoute, onDistanceUpdate, transportMode = 'car' }) {
    const [tracking, setTracking] = useState(false)
    const [distance, setDistance] = useState(0)
    const [currentPosition, setCurrentPosition] = useState(null)
    const [ecoPoints, setEcoPoints] = useState(0)
    const [currentSpeed, setCurrentSpeed] = useState(0)
    const [pendingPoints, setPendingPoints] = useState(0)
    const [error, setError] = useState(null)
    const [routeCompleted, setRouteCompleted] = useState(false)
    const watchIdRef = useRef(null)
    const lastPositionRef = useRef(null)
    const lastTimeRef = useRef(null)
    const basePointsPerKm = 100

    useEffect(() => {
        setTracking(isTracking)
        if (isTracking) {
            startTracking()
        } else {
            stopTracking()
        }
        return () => {
            if (watchIdRef.current) {
                stopTracking()
            }
        }
    }, [isTracking])

    const handleRouteCompletion = async () => {
        if (routeCompleted) return
        setRouteCompleted(true)

        try {
            const { data: { user } } = await supabase.auth.getUser()
            if (!user) return

            const currentStats = user.user_metadata.route_stats || {}
            const newStats = {
                ...currentStats,
                [transportMode]: (currentStats[transportMode] || 0) + 1
            }

            const { error: updateError } = await supabase.auth.updateUser({
                data: {
                    ...user.user_metadata,
                    route_stats: newStats
                }
            })

            if (updateError) throw updateError

            const { error: routeError } = await supabase
                .from('completed_routes')
                .insert({
                    user_id: user.id,
                    transport_mode: transportMode,
                    distance: distance,
                    start_location: selectedRoute?.startLocation || 'Free tracking',
                    end_location: selectedRoute?.endLocation || 'Free tracking'
                })

            if (routeError) throw routeError

            if (pendingPoints > 0) {
                await updateEcoPoints(pendingPoints)
                setPendingPoints(0)
            }

            setDistance(0)
            setCurrentSpeed(0)
            lastPositionRef.current = null
            lastTimeRef.current = null
        } catch (error) {
            console.error('Error handling route completion:', error)
        }
    }

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

    const startTracking = () => {
        if (!navigator.geolocation) {
            setError('Geolocation is not supported by your browser')
            return
        }

        setRouteCompleted(false)
        setPendingPoints(0)

        watchIdRef.current = navigator.geolocation.watchPosition(
            (position) => {
                const { latitude, longitude } = position.coords
                const currentTime = Date.now()
                setCurrentPosition({ latitude, longitude })

                if (lastPositionRef.current && lastTimeRef.current) {
                    const newDistance = calculateDistance(
                        lastPositionRef.current.latitude,
                        lastPositionRef.current.longitude,
                        latitude,
                        longitude
                    )
                    
                    if (newDistance > 0.01) {
                        const totalDistance = distance + newDistance
                        setDistance(totalDistance)
                        onDistanceUpdate?.(totalDistance)

                        const timeDiff = (currentTime - lastTimeRef.current) / 1000 / 3600
                        const speed = newDistance / timeDiff
                        setCurrentSpeed(speed)

                        const earnedPoints = calculateEcoPoints(newDistance)
                        if (earnedPoints > 0) {
                            setPendingPoints(prev => {
                                const total = prev + earnedPoints
                                if (total >= 1) {
                                    const pointsToAward = Math.floor(total)
                                    updateEcoPoints(pointsToAward)
                                    return total - pointsToAward
                                }
                                return total
                            })
                        }
                    }
                }

                lastPositionRef.current = { latitude, longitude }
                lastTimeRef.current = currentTime
            },
            (error) => {
                setError('Error getting your location: ' + error.message)
            },
            {
                enableHighAccuracy: true,
                timeout: 5000,
                maximumAge: 0
            }
        )
    }

    const stopTracking = () => {
        if (watchIdRef.current) {
            navigator.geolocation.clearWatch(watchIdRef.current)
            watchIdRef.current = null
            if (tracking && distance > 0) {
                handleRouteCompletion()
            }
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
                        {pendingPoints > 0 && (
                            <span className="text-xs ml-1">(+{pendingPoints.toFixed(2)})</span>
                        )}
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
                            <div className="text-lg font-bold">{distance.toFixed(2)} km</div>
                        </div>
                    </div>
                    <div className="flex items-center">
                        <Gauge className="w-5 h-5 text-gray-600 mr-2" />
                        <div>
                            <div className="text-sm font-medium">Viteză curentă</div>
                            <div className="text-lg font-bold">{currentSpeed.toFixed(1)} km/h</div>
                        </div>
                    </div>
                </div>

                {tracking && (
                    <button
                        onClick={() => setTracking(false)}
                        className="w-full flex items-center justify-center space-x-2 bg-red-500 hover:bg-red-600 text-white py-2 px-4 rounded-lg transition-colors"
                    >
                        <StopCircle className="w-5 h-5" />
                        <span>Termină cursa</span>
                    </button>
                )}

                {selectedRoute && (
                    <div className="p-3 bg-gray-50 rounded-lg">
                        <div className="flex items-center mb-2">
                            <Navigation className="w-5 h-5 text-gray-600 mr-2" />
                            <div className="text-sm font-medium">Rută selectată</div>
                        </div>
                        <div className="text-sm text-gray-600">
                            <div>De la: {selectedRoute.startLocation}</div>
                            <div>Până la: {selectedRoute.endLocation}</div>
                        </div>
                    </div>
                )}
            </div>
        </div>
    )
} 
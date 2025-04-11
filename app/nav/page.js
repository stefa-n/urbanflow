"use client"

import { useState, useEffect } from "react"
import {
    Navigation,
    MapPin,
    LocateFixed,
    Car,
    Bus,
    Bike,
    FootprintsIcon as Walking,
    Leaf,
    BadgePlus,
} from "lucide-react"
import { motion } from "framer-motion"
import dynamic from "next/dynamic"
import TrafficIncident from "@/components/nav/TrafficIncident"
import TransportOption from "@/components/nav/TransportOption"
import ReportTrafficIncident from "@/components/nav/ReportTrafficIncident"

const coords = [46.9255, 26.37]

const Map = dynamic(() => import("../../components/Map"), {
    ssr: false,
    loading: () => (
        <div className="w-full h-full bg-gray-100 animate-pulse flex items-center justify-center rounded-lg">
            <p className="text-gray-500">Se încarcă harta...</p>
        </div>
    ),
})

const transportModes = [
    { id: "car", name: "Mașină", icon: Car, speedFactor: 1 },
    { id: "bus", name: "Autobuz", icon: Bus, speedFactor: 1.2 },
    { id: "bike", name: "Bicicletă", icon: Bike, speedFactor: 3 },
    { id: "walking", name: "Mers pe jos", icon: Walking, speedFactor: 5 },
]

const placeholderIncidents = [
    {
        id: 1,
        location: "Strada Mihai Viteazu",
        type: "Accident",
        severity: "Mediu",
        time: "10:30",
        coordinates: [46.9255, 26.37],
    },
]

export default function NavPage() {
    const [startInput, setStartInput] = useState("")
    const [endInput, setEndInput] = useState("")
    const [startLocation, setStartLocation] = useState("")
    const [endLocation, setEndLocation] = useState("")
    const [startCoordinates, setStartCoordinates] = useState(null)
    const [endCoordinates, setEndCoordinates] = useState(null)
    const [isSearching, setIsSearching] = useState(false)
    const [searchResults, setSearchResults] = useState([])
    const [searchType, setSearchType] = useState("start")
    const [currentLocation, setCurrentLocation] = useState(null)
    const [routeInfo, setRouteInfo] = useState(null)
    const [error, setError] = useState("")
    const [mapKey, setMapKey] = useState(1)
    const [shouldCalculateRoute, setShouldCalculateRoute] = useState(false)
    const [selectedMode, setSelectedMode] = useState("car")
    const [incidents, setIncidents] = useState(placeholderIncidents)
    const [ecoPoints, setEcoPoints] = useState(120)
    const [searchTimeout, setSearchTimeout] = useState(null)
    const [createIncident, setCreateIncident] = useState(false)
    const [busStopsCount, setBusStopsCount] = useState(0)

    const searchLocation = async (query, type) => {
        if (!query.trim()) {
            setSearchResults([])
            return
        }

        setIsSearching(true)
        setSearchType(type)
        setError("")

        try {
            const response = await fetch(`/api/geocode/search?q=${encodeURIComponent(query)}&limit=5`)

            if (!response.ok) {
                throw new Error(`Eroare server: ${response.status}`)
            }

            const data = await response.json()

            if (!data.features || data.features.length === 0) {
                setError(`Nu am găsit locația "${query}". Încearcă o altă căutare.`)
                setSearchResults([])
            } else {
                setSearchResults(data.features)
            }
        } catch (error) {
            console.error("error searching location:", error)
            setError("A apărut o eroare la căutarea locației. Încearcă din nou.")
            setSearchResults([])
        } finally {
            setIsSearching(false)
        }
    }

    const handleInputChange = (value, type) => {
        if (type === "start") {
            setStartInput(value)
        } else {
            setEndInput(value)
        }

        if (searchTimeout) {
            clearTimeout(searchTimeout)
        }

        if (value.trim().length > 2) {
            const newTimeout = setTimeout(() => {
                searchLocation(value, type)
            }, 300)
            setSearchTimeout(newTimeout)
        } else {
            setSearchResults([])
        }
    }

    const selectLocation = (feature) => {
        const name = feature.properties.name || ""
        const street = feature.properties.street || ""
        const city = feature.properties.city || ""
        const state = feature.properties.state || ""
        const country = feature.properties.country || ""

        const displayName = [name, street, city, state, country].filter(Boolean).join(", ")

        // Extragem coordonatele din feature
        const coordinates = feature.geometry.coordinates

        if (searchType === "start") {
            setStartInput(displayName)
            setStartLocation(displayName)
            setStartCoordinates([coordinates[1], coordinates[0]]) // Inversăm ordinea pentru Leaflet (lat, lng)
        } else {
            setEndInput(displayName)
            setEndLocation(displayName)
            setEndCoordinates([coordinates[1], coordinates[0]]) // Inversăm ordinea pentru Leaflet (lat, lng)
        }

        setShouldCalculateRoute(true)
        setSearchResults([])
    }

    const getCurrentLocation = () => {
        setError("")

        if (navigator.geolocation) {
            navigator.geolocation.getCurrentPosition(
                (position) => {
                    const { latitude, longitude } = position.coords
                    setCurrentLocation([latitude, longitude])
                    setStartInput("Locația mea curentă")
                    setStartLocation("Locația mea curentă")
                    setStartCoordinates([latitude, longitude])

                    reverseGeocode(latitude, longitude)
                        .then((address) => {
                            if (address) {
                                setStartInput(address)
                                setStartLocation(address)
                            }
                        })
                        .catch((err) => {
                            console.error("error with geocoding:", err)
                        })
                },
                (error) => {
                    console.error("error getting location:", error)
                    setError("Nu am putut obține locația curentă. Te rugăm să introduci manual adresa de pornire.")
                },
            )
        } else {
            setError("Geolocation nu este suportat de browser-ul tău. Te rugăm să introduci manual adresa de pornire.")
        }
    }

    const reverseGeocode = async (lat, lon) => {
        try {
            const response = await fetch(`/api/geocode/reverse?lat=${lat}&lon=${lon}`)

            if (!response.ok) {
                throw new Error(`Eroare server: ${response.status}`)
            }

            const data = await response.json()
            if (data.features && data.features.length > 0) {
                const feature = data.features[0]
                const name = feature.properties.name || ""
                const street = feature.properties.street || ""
                const city = feature.properties.city || ""
                const state = feature.properties.state || ""
                const country = feature.properties.country || ""

                return [name, street, city, state, country].filter(Boolean).join(", ")
            }
            return null
        } catch (error) {
            console.error("error with geocoding:", error)
            return null
        }
    }

    const calculateRoute = () => {
        if (!startInput || !endInput) {
            setError("Te rugăm să introduci atât locația de start cât și destinația")
            return
        }

        setError("")
        setStartLocation(startInput)
        setEndLocation(endInput)

        // Resetăm starea de calcul a rutei pentru a forța recalcularea
        setShouldCalculateRoute(false)

        // Folosim setTimeout pentru a ne asigura că starea a fost actualizată
        setTimeout(() => {
            setShouldCalculateRoute(true)
        }, 100)
    }

    const handleRouteFound = (routeData) => {
        if (routeData) {
            const baseDistance = routeData.summary.totalDistance / 1000
            const baseDuration = routeData.summary.totalTime / 60

            const transportTimes = transportModes.reduce((acc, mode) => {
                acc[mode.id] = Math.round(baseDuration * mode.speedFactor)
                return acc
            }, {})

            setRouteInfo({
                distance: baseDistance.toFixed(1),
                duration: Math.round(baseDuration),
                transportTimes,
            })

            // Actualizăm numărul de stații de autobuz
            if (routeData.busStops !== undefined) {
                setBusStopsCount(routeData.busStops)
            } else {
                setBusStopsCount(0)
            }
        } else {
            setBusStopsCount(0)
        }
        setShouldCalculateRoute(false)
    }

    // Resetăm numărul de stații de autobuz când se schimbă modul de transport
    useEffect(() => {
        if (selectedMode !== "bus") {
            setBusStopsCount(0)
        }
    }, [selectedMode])

    // Funcție pentru adăugarea unui nou incident
    const handleAddIncident = (incidentData) => {
        const newIncident = {
            ...incidentData,
            id: Date.now(), // Generăm un ID unic
        }

        setIncidents((prevIncidents) => [newIncident, ...prevIncidents])
        setCreateIncident(false)

        // Adăugăm puncte eco pentru raportare
        setEcoPoints((prev) => prev + 50)
    }

    return (
        <div className="min-h-[calc(100vh-4rem)] bg-[oklch(93.8%_0.127_124.321)] py-6">
            <div className="container mx-auto px-4">
                <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
                    <div className="lg:col-span-3">
                        <div className="bg-white rounded-lg shadow-sm p-4 mb-6">
                            <div className="space-y-3 mb-4">
                                <div className="flex items-center space-x-2">
                                    <div className="relative flex-1">
                                        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                            <MapPin size={18} className="text-gray-400" />
                                        </div>
                                        <input
                                            type="text"
                                            placeholder="Punct de plecare"
                                            value={startInput}
                                            onChange={(e) => handleInputChange(e.target.value, "start")}
                                            className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-black focus:border-transparent bg-white"
                                        />
                                        {searchResults.length > 0 && searchType === "start" && (
                                            <div className="absolute mt-1 w-full bg-white border border-gray-300 rounded-lg shadow-lg z-50 max-h-60 overflow-y-auto">
                                                {searchResults.map((feature, index) => (
                                                    <div
                                                        key={index}
                                                        className="px-4 py-2 hover:bg-gray-100 cursor-pointer text-sm border-b last:border-b-0"
                                                        onClick={() => selectLocation(feature)}
                                                    >
                                                        {feature.properties.name || ""} {feature.properties.street || ""},{" "}
                                                        {feature.properties.city || ""}, {feature.properties.country || ""}
                                                    </div>
                                                ))}
                                            </div>
                                        )}
                                    </div>
                                    <motion.button
                                        onClick={getCurrentLocation}
                                        className="p-3 bg-blue-500 text-white rounded-lg hover:bg-blue-600 flex items-center justify-center"
                                        title="Folosește locația curentă"
                                        whileHover={{ scale: 1.05 }}
                                        whileTap={{ scale: 0.95 }}
                                    >
                                        <LocateFixed size={18} />
                                    </motion.button>
                                </div>

                                <div className="flex items-center space-x-2">
                                    <div className="relative flex-1">
                                        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                            <MapPin size={18} className="text-gray-400" />
                                        </div>
                                        <input
                                            type="text"
                                            placeholder="Destinație"
                                            value={endInput}
                                            onChange={(e) => handleInputChange(e.target.value, "end")}
                                            className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-black focus:border-transparent bg-white"
                                        />
                                        {searchResults.length > 0 && searchType === "end" && (
                                            <div className="absolute mt-1 w-full bg-white border border-gray-300 rounded-lg shadow-lg z-50 max-h-60 overflow-y-auto">
                                                {searchResults.map((feature, index) => (
                                                    <div
                                                        key={index}
                                                        className="px-4 py-2 hover:bg-gray-100 cursor-pointer text-sm border-b last:border-b-0"
                                                        onClick={() => selectLocation(feature)}
                                                    >
                                                        {feature.properties.name || ""} {feature.properties.street || ""},{" "}
                                                        {feature.properties.city || ""}, {feature.properties.country || ""}
                                                    </div>
                                                ))}
                                            </div>
                                        )}
                                    </div>
                                </div>

                                <motion.button
                                    onClick={calculateRoute}
                                    className="w-full py-3 bg-lime-300 text-black font-semibold rounded-lg hover:bg-lime-400 flex items-center justify-center"
                                    whileHover={{ scale: 1.02 }}
                                    whileTap={{ scale: 0.98 }}
                                    disabled={!startInput || !endInput}
                                >
                                    <Navigation size={18} className="mr-2" />
                                    {routeInfo ? "Recalculează Ruta" : "Calculează Ruta"}
                                </motion.button>
                            </div>

                            <div className="bg-gray-50 rounded-lg p-4 mb-4">
                                <div className="flex justify-between items-center mb-4">
                                    <h3 className="font-bold">Opțiuni de Transport</h3>
                                    <div className="flex items-center bg-lime-300 px-3 py-1 rounded-full">
                                        <Leaf size={16} className="mr-1" />
                                        <span className="font-medium">{ecoPoints} puncte eco</span>
                                    </div>
                                </div>

                                <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                                    {transportModes.map((mode) => (
                                        <TransportOption
                                            key={mode.id}
                                            mode={mode.name}
                                            icon={mode.icon}
                                            time={routeInfo ? routeInfo.transportTimes[mode.id] : "--"}
                                            isSelected={selectedMode === mode.id}
                                            busStops={mode.id === "bus" ? busStopsCount : 0}
                                            onClick={() => {
                                                setSelectedMode(mode.id)
                                                if (startLocation && endLocation) {
                                                    setShouldCalculateRoute(true)
                                                    setMapKey((prev) => prev + 1)
                                                }
                                            }}
                                        />
                                    ))}
                                </div>
                            </div>

                            {error && (
                                <div className="mb-4 p-3 bg-red-100 border-l-4 border-red-500 text-red-700 rounded">
                                    <p>{error}</p>
                                </div>
                            )}

                            <div className="h-[500px] rounded-lg overflow-hidden border border-gray-200">
                                <Map
                                    key={mapKey}
                                    initialCenter={coords}
                                    startLocation={startLocation}
                                    endLocation={endLocation}
                                    startCoordinates={startCoordinates}
                                    endCoordinates={endCoordinates}
                                    currentLocation={currentLocation}
                                    onRouteFound={handleRouteFound}
                                    shouldCalculateRoute={shouldCalculateRoute}
                                    transportMode={selectedMode}
                                    incidents={incidents}
                                />
                            </div>
                        </div>
                    </div>

                    <div className="lg:col-span-1">
                        <div className="bg-white rounded-lg shadow-sm p-4 mb-6">
                            <div className="flex justify-between items-center mb-4">
                                <h2 className="text-xl font-bold">Incidente Trafic</h2>
                                <button
                                    onClick={() => setCreateIncident(!createIncident)}
                                    className="p-1.5 bg-lime-300 text-black rounded-full hover:bg-lime-400 flex items-center justify-center transition-colors"
                                    title="Raportează un incident"
                                >
                                    <BadgePlus size={20} />
                                </button>
                            </div>

                            {createIncident && (
                                <div className="mb-6 border-b pb-4">
                                    <ReportTrafficIncident onClose={() => setCreateIncident(false)} onSubmit={handleAddIncident} />
                                </div>
                            )}

                            {incidents.length > 0 ? (
                                <div className="space-y-4">
                                    {incidents.map((incident) => (
                                        <TrafficIncident key={incident.id} incident={incident} />
                                    ))}
                                </div>
                            ) : (
                                <div className="text-center py-6 text-gray-500">
                                    <p>Nu există incidente raportate în zonă</p>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    )
}

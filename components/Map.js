"use client"

import { useEffect, useRef, useState } from "react"
import L from "leaflet"
import "leaflet/dist/leaflet.css"
import "leaflet-routing-machine"

const fixLeafletIcons = () => {
    if (typeof window !== "undefined") {
        delete L.Icon.Default.prototype._getIconUrl

        L.Icon.Default.mergeOptions({
            iconRetinaUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png",
            iconUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png",
            shadowUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",
        })
    }
}

const transportModeConfig = {
    car: {
        profile: "driving",
        lineColor: "#000000",
    },
    bike: {
        profile: "cycling",
        lineColor: "#2196F3",
    },
    walking: {
        profile: "walking",
        lineColor: "#4CAF50",
    },
    ride: {
        profile: "driving",
        lineColor: "#F50057",
    },
}

export default function Map({
    initialCenter,
    startLocation,
    endLocation,
    currentLocation,
    onRouteFound,
    shouldCalculateRoute,
    transportMode = "car",
    incidents = [],
    isTracking,
    reports = [],
    selectedReport,
    onMarkerClick,
}) {
    const mapRef = useRef(null)
    const mapInstanceRef = useRef(null)
    const routingControlRef = useRef(null)
    const incidentMarkersRef = useRef([])
    const trackingMarkerRef = useRef(null)
    const [isLoading, setIsLoading] = useState(false)
    const [error, setError] = useState("")
    const markersRef = useRef([])

    useEffect(() => {
        fixLeafletIcons()

        if (mapRef.current && !mapInstanceRef.current) {
            const mapInstance = L.map(mapRef.current).setView(initialCenter, 13)
            mapInstanceRef.current = mapInstance

            L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
                attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
            }).addTo(mapInstance)

            L.control
                .zoom({
                    position: "topleft",
                })
                .addTo(mapInstance)

            setTimeout(() => {
                mapInstance.invalidateSize()
            }, 100)
        }

        return () => {
            if (mapInstanceRef.current) {
                if (routingControlRef.current) {
                    routingControlRef.current.remove()
                }
                mapInstanceRef.current.remove()
                mapInstanceRef.current = null
            }
        }
    }, [initialCenter])

    useEffect(() => {
        if (mapInstanceRef.current && currentLocation) {
            const customIcon = L.divIcon({
                html: `<div class="flex items-center justify-center w-8 h-8 rounded-full bg-blue-500">
                <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                  <circle cx="12" cy="12" r="10"></circle>
                  <polygon points="16.24 7.76 14.12 14.12 7.76 16.24 9.88 9.88 16.24 7.76"></polygon>
                </svg>
              </div>`,
                className: "custom-div-icon",
                iconSize: [30, 30],
                iconAnchor: [15, 15],
            })

            if (window.currentLocationMarker) {
                window.currentLocationMarker.remove()
            }

            window.currentLocationMarker = L.marker(currentLocation, { icon: customIcon }).addTo(mapInstanceRef.current)

            mapInstanceRef.current.setView(currentLocation, 15)
        }
    }, [currentLocation])

    useEffect(() => {
        if (!mapInstanceRef.current) return

        incidentMarkersRef.current.forEach((marker) => {
            if (marker) marker.remove()
        })
        incidentMarkersRef.current = []

        incidents.forEach((incident) => {
            if (!incident.coordinates) return

            const incidentIcon = L.divIcon({
                html: `<div class="flex items-center justify-center w-8 h-8 rounded-full bg-orange-500">
                <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                  <path d="m21.73 18-8-14a2 2 0 0 0-3.48 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3Z"></path>
                  <path d="M12 9v4"></path>
                  <path d="M12 17h.01"></path>
                </svg>
              </div>`,
                className: "custom-div-icon",
                iconSize: [30, 30],
                iconAnchor: [15, 15],
            })

            const marker = L.marker(incident.coordinates, {
                icon: incidentIcon,
                draggable: false,
            }).addTo(mapInstanceRef.current)

            marker.bindPopup(`
        <div class="p-2">
          <h3 class="font-bold">${incident.location}</h3>
          <p>${incident.type}</p>
          <p class="text-sm">Severitate: ${incident.severity}</p>
          <p class="text-xs text-gray-500">${incident.time}</p>
        </div>
      `)

            incidentMarkersRef.current.push(marker)
        })
    }, [incidents, mapInstanceRef.current])

    useEffect(() => {
        if (!shouldCalculateRoute) return

        const calculateRoute = async () => {
            if (!mapInstanceRef.current || !startLocation || !endLocation) return

            setIsLoading(true)
            setError("")

            try {
                if (routingControlRef.current) {
                    routingControlRef.current.remove()
                }

                let startCoords = currentLocation
                if (!startCoords && startLocation !== "Locația mea curentă") {
                    const startResult = await geocodeLocation(startLocation)
                    if (startResult) {
                        startCoords = [startResult.lat, startResult.lon]
                    } else {
                        throw new Error("Nu am putut găsi locația de start")
                    }
                }

                const endResult = await geocodeLocation(endLocation)
                let endCoords
                if (endResult) {
                    endCoords = [endResult.lat, endResult.lon]
                } else {
                    throw new Error("Nu am putut găsi destinația")
                }

                if (!startCoords || !endCoords) {
                    throw new Error("Nu am putut găsi una dintre locații")
                }

                const modeConfig = transportModeConfig[transportMode] || transportModeConfig.car

                const routingRouter = L.Routing.osrmv1({
                    serviceUrl: "https://router.project-osrm.org/route/v1",
                    profile: modeConfig.profile,
                })

                const routingControl = L.Routing.control({
                    router: routingRouter,
                    waypoints: [L.latLng(startCoords[0], startCoords[1]), L.latLng(endCoords[0], endCoords[1])],
                    routeWhileDragging: false,
                    showAlternatives: true,
                    fitSelectedRoutes: true,
                    lineOptions: {
                        styles: [
                            { color: modeConfig.lineColor, opacity: 0.8, weight: 6 },
                            { color: "#FFFFFF", opacity: 0.3, weight: 4 },
                        ],
                    },
                    altLineOptions: {
                        styles: [
                            { color: "#9ACD32", opacity: 0.4, weight: 6 },
                            { color: "#FFFFFF", opacity: 0.3, weight: 4 },
                        ],
                    },
                    createMarker: (i, waypoint) => {
                        const marker = L.marker(waypoint.latLng, {
                            draggable: false,
                            icon: L.divIcon({
                                html:
                                    i === 0
                                        ? `<div class="flex items-center justify-center w-8 h-8 rounded-full bg-blue-500">
                        <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                          <circle cx="12" cy="12" r="10"></circle>
                          <polygon points="16.24 7.76 14.12 14.12 7.76 16.24 9.88 9.88 16.24 7.76"></polygon>
                        </svg>
                      </div>`
                                        : `<div class="flex items-center justify-center w-8 h-8 rounded-full bg-green-500">
                        <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                          <path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0Z"></path>
                          <circle cx="12" cy="10" r="3"></circle>
                        </svg>
                      </div>`,
                                className: "custom-div-icon",
                                iconSize: [30, 30],
                                iconAnchor: [15, 15],
                            }),
                        })
                        return marker
                    },
                }).addTo(mapInstanceRef.current)

                routingControlRef.current = routingControl

                const container = routingControl.getContainer()
                if (container) {
                    container.style.display = "none"
                }

                routingControl.on("routesfound", (e) => {
                    const routes = e.routes
                    const summary = routes[0].summary
                    onRouteFound &&
                        onRouteFound({
                            summary: summary,
                        })
                })
            } catch (error) {
                console.error("error calculating route:", error)
                setError(error.message || "A apărut o eroare la calcularea rutei")
                onRouteFound && onRouteFound(null)
            } finally {
                setIsLoading(false)
            }
        }

        calculateRoute()
    }, [shouldCalculateRoute, startLocation, endLocation, currentLocation, onRouteFound, transportMode])

    useEffect(() => {
        if (mapInstanceRef.current && isTracking && currentLocation) {
            const trackingIcon = L.divIcon({
                html: `<div class="flex items-center justify-center w-8 h-8 rounded-full bg-blue-500 border-2 border-white shadow-lg">
                    <div class="w-4 h-4 bg-white rounded-full animate-ping"></div>
                </div>`,
                className: "tracking-marker",
                iconSize: [32, 32],
                iconAnchor: [16, 16]
            })

            if (trackingMarkerRef.current) {
                trackingMarkerRef.current.setLatLng(currentLocation)
            } else {
                trackingMarkerRef.current = L.marker(currentLocation, { 
                    icon: trackingIcon,
                    zIndexOffset: 1000
                }).addTo(mapInstanceRef.current)
            }

            mapInstanceRef.current.setView(currentLocation, mapInstanceRef.current.getZoom())
        } else if (!isTracking && trackingMarkerRef.current) {
            trackingMarkerRef.current.remove()
            trackingMarkerRef.current = null
        }
    }, [isTracking, currentLocation])

    useEffect(() => {
        if (!mapInstanceRef.current) return

        markersRef.current.forEach((marker) => {
            if (marker) marker.remove()
        })
        markersRef.current = []

        reports.forEach((report) => {
            if (!report.coordinates) return

            const getSeverityColor = (severity) => {
                switch (severity?.toLowerCase()) {
                    case 'high':
                        return 'bg-red-500'
                    case 'medium':
                        return 'bg-orange-500'
                    case 'low':
                        return 'bg-yellow-500'
                    default:
                        return 'bg-gray-500'
                }
            }

            const reportIcon = L.divIcon({
                html: `<div class="flex items-center justify-center w-8 h-8 rounded-full ${getSeverityColor(report.severity)}">
                <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                  <path d="m21.73 18-8-14a2 2 0 0 0-3.48 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3Z"></path>
                  <path d="M12 9v4"></path>
                  <path d="M12 17h.01"></path>
                </svg>
              </div>`,
                className: "custom-div-icon",
                iconSize: [30, 30],
                iconAnchor: [15, 15],
            })

            const marker = L.marker(report.coordinates, {
                icon: reportIcon,
                draggable: false,
            }).addTo(mapInstanceRef.current)

            marker.on('click', () => {
                onMarkerClick && onMarkerClick(report)
            })

            marker.bindPopup(`
                <div class="p-2">
                    <h3 class="font-bold">${report.location || 'Locație necunoscută'}</h3>
                    <p>${report.type || 'Tip necunoscut'}</p>
                    <p class="text-sm">Severitate: ${report.severity || 'Necunoscută'}</p>
                    <p class="text-xs text-gray-500">${new Date(report.created_at).toLocaleString('ro-RO')}</p>
                </div>
            `)

            markersRef.current.push(marker)
        })
    }, [reports, mapInstanceRef.current])

    useEffect(() => {
        if (mapInstanceRef.current && selectedReport?.coordinates) {
            mapInstanceRef.current.setView(selectedReport.coordinates, 15)
            
            const marker = markersRef.current.find(m => 
                m.getLatLng().lat === selectedReport.coordinates[0] && 
                m.getLatLng().lng === selectedReport.coordinates[1]
            )
            
            if (marker) {
                marker.openPopup()
            }
        }
    }, [selectedReport])

    const geocodeLocation = async (query) => {
        try {
            const response = await fetch(`/api/geocode/search?q=${encodeURIComponent(query)}&limit=1`)

            if (!response.ok) {
                throw new Error(`Eroare server: ${response.status}`)
            }

            const data = await response.json()
            if (data.features && data.features.length > 0) {
                const feature = data.features[0]
                const coordinates = feature.geometry.coordinates
                return {
                    lon: coordinates[0],
                    lat: coordinates[1],
                }
            }
            return null
        } catch (error) {
            console.error("error with geocoding:", error)
            return null
        }
    }

    if (error) {
        return (
            <div className="flex items-center justify-center h-full">
                <div className="text-red-500">Eroare: {error}</div>
            </div>
        )
    }

    return (
        <div className="relative w-full h-full rounded-lg overflow-hidden">
            {isLoading && (
                <div className="absolute inset-0 bg-white bg-opacity-70 z-20 flex items-center justify-center">
                    <div className="flex flex-col items-center">
                        <div className="w-12 h-12 border-4 border-black border-t-transparent rounded-full animate-spin"></div>
                        <p className="mt-2 text-gray-700">Se calculează ruta...</p>
                    </div>
                </div>
            )}

            <div ref={mapRef} className="w-full h-full z-10" />
        </div>
    )
}

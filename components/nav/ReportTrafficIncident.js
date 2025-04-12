"use client"

import { useState, useEffect } from "react"
import { AlertTriangle, MapPin, X, Check } from 'lucide-react'
import { motion } from "framer-motion"
import { createClient } from "@supabase/supabase-js"

const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY)

const incidentTypes = [
  { id: "accident", label: "Accident" },
  { id: "roadwork", label: "Lucrări" },
  { id: "closure", label: "Drum închis" },
  { id: "traffic", label: "Trafic intens" }
]

const severityLevels = [
  { id: "low", label: "Scăzut", color: "bg-yellow-500" },
  { id: "medium", label: "Mediu", color: "bg-orange-500" },
  { id: "high", label: "Ridicat", color: "bg-red-500" }
]

export default function ReportTrafficIncident({ onClose, onSubmit }) {
  const [incidentType, setIncidentType] = useState("")
  const [severity, setSeverity] = useState("")
  const [location, setLocation] = useState("")
  const [description, setDescription] = useState("")
  const [useCurrentLocation, setUseCurrentLocation] = useState(false)
  const [currentCoordinates, setCurrentCoordinates] = useState(null)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState("")
  const [success, setSuccess] = useState(false)
  const [searchTimeout, setSearchTimeout] = useState(null)
  const [searchResults, setSearchResults] = useState([])
  const [isSearching, setIsSearching] = useState(false)

  useEffect(() => {
    if (useCurrentLocation) {
      if (navigator.geolocation) {
        navigator.geolocation.getCurrentPosition(
          (position) => {
            const { latitude, longitude } = position.coords
            setCurrentCoordinates([latitude, longitude])
            reverseGeocode(latitude, longitude)
          },
          (error) => {
            console.error("error getting location:", error)
            setError("Nu am putut obține locația curentă. Te rugăm să introduci manual adresa.")
            setUseCurrentLocation(false)
          }
        )
      } else {
        setError("Te rugăm să introduci manual adresa.")
        setUseCurrentLocation(false)
      }
    }
  }, [useCurrentLocation])

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

        const displayName = [name, street, city, state, country].filter(Boolean).join(", ")
        setLocation(displayName)
      }
    } catch (error) {
      console.error("error reverse geocode:", error)
      setError("Nu am putut determina adresa locației curente.")
    }
  }

  const searchLocation = async (query) => {
    if (!query.trim()) {
      setSearchResults([])
      return
    }

    setIsSearching(true)
    setError("")

    try {
      const response = await fetch(`/api/geocode/search?q=${encodeURIComponent(query)}&limit=5`)

      if (!response.ok) {
        throw new Error(`Eroare server: ${response.status}`)
      }

      const data = await response.json()

      if (!data.features || data.features.length === 0) {
        setSearchResults([])
      } else {
        setSearchResults(data.features)
      }
    } catch (error) {
      console.error("error searching 4 address:", error)
      setError("A apărut o eroare la căutarea locației. Încearcă din nou.")
      setSearchResults([])
    } finally {
      setIsSearching(false)
    }
  }

  const handleLocationChange = (value) => {
    setLocation(value)
    setUseCurrentLocation(false)

    if (searchTimeout) {
      clearTimeout(searchTimeout)
    }

    if (value.trim().length > 2) {
      const newTimeout = setTimeout(() => {
        searchLocation(value)
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
    setLocation(displayName)

    const coordinates = feature.geometry.coordinates
    setCurrentCoordinates([coordinates[1], coordinates[0]])
    
    setSearchResults([])
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError("")
    setIsSubmitting(true)

    if (!incidentType) {
      setError("Te rugăm să selectezi tipul incidentului")
      setIsSubmitting(false)
      return
    }

    if (!severity) {
      setError("Te rugăm să selectezi severitatea")
      setIsSubmitting(false)
      return
    }

    if (!location) {
      setError("Te rugăm să introduci locația")
      setIsSubmitting(false)
      return
    }

    if (!currentCoordinates) {
      setError("Nu am putut determina coordonatele locației")
      setIsSubmitting(false)
      return
    }

    try {
      const { data: { user }, error: userError } = await supabase.auth.getUser()
      
      if (userError) throw userError

      if (!user) {
        setError("Trebuie să fii autentificat pentru a raporta un incident")
        return
      }

      const { error: insertError } = await supabase
        .from('reports')
        .insert({
          created_by: user.id,
          type: incidentTypes.find(t => t.id === incidentType)?.label || incidentType,
          severity: severityLevels.find(s => s.id === severity)?.label || severity,
          locationx: currentCoordinates[0],
          locationy: currentCoordinates[1],
          description: description || location
        })

      if (insertError) throw insertError

      setSuccess(true)
      
      if (onSubmit) {
        onSubmit({
          type: incidentTypes.find(t => t.id === incidentType)?.label || incidentType,
          severity: severityLevels.find(s => s.id === severity)?.label || severity,
          location,
          description,
          coordinates: currentCoordinates,
          time: new Date().toLocaleTimeString('ro-RO', { hour: '2-digit', minute: '2-digit' })
        })
      }

      setIncidentType("")
      setSeverity("")
      setLocation("")
      setDescription("")
      setCurrentCoordinates(null)
    } catch (error) {
      console.error("error when reporting:", error)
      setError("A apărut o eroare la raportarea incidentului. Te rugăm să încerci din nou.")
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="bg-white rounded-lg p-4">
      <div className="flex justify-between items-center mb-4">
        <h3 className="text-lg font-semibold">Raportează un incident</h3>
        {onClose && (
          <button 
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700"
          >
            <X size={20} />
          </button>
        )}
      </div>

      {success ? (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-green-100 border-l-4 border-green-500 text-green-700 p-4 mb-4 rounded"
        >
          <div className="flex items-center">
            <Check className="mr-2" size={20} />
            <p>Incidentul a fost raportat cu succes! Îți mulțumim pentru contribuție.</p>
          </div>
        </motion.div>
      ) : (
        <form onSubmit={handleSubmit}>
          {error && (
            <div className="bg-red-100 border-l-4 border-red-500 text-red-700 p-3 mb-4 rounded">
              <p>{error}</p>
            </div>
          )}

          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-1">Tip incident</label>
            <div className="grid grid-cols-2 gap-2">
              {incidentTypes.map((type) => (
                <button
                  key={type.id}
                  type="button"
                  className={`py-2 px-3 text-sm rounded-md border ${
                    incidentType === type.id
                      ? "bg-black text-white border-black"
                      : "bg-white text-gray-700 border-gray-300 hover:bg-gray-50"
                  }`}
                  onClick={() => setIncidentType(type.id)}
                >
                  {type.label}
                </button>
              ))}
            </div>
          </div>

          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-1">Severitate</label>
            <div className="flex space-x-2">
              {severityLevels.map((level) => (
                <button
                  key={level.id}
                  type="button"
                  className={`flex-1 py-2 px-3 text-sm rounded-md border flex items-center justify-center ${
                    severity === level.id
                      ? "bg-black text-white border-black"
                      : "bg-white text-gray-700 border-gray-300 hover:bg-gray-50"
                  }`}
                  onClick={() => setSeverity(level.id)}
                >
                  <span className={`w-2 h-2 rounded-full ${level.color} mr-1`}></span>
                  {level.label}
                </button>
              ))}
            </div>
          </div>

          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-1">Locație</label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <MapPin size={16} className="text-gray-400" />
              </div>
              <input
                type="text"
                value={location}
                onChange={(e) => handleLocationChange(e.target.value)}
                placeholder="Introdu adresa incidentului"
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-black focus:border-transparent"
              />
              {searchResults.length > 0 && (
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
            <div className="mt-2">
              <button
                type="button"
                onClick={() => setUseCurrentLocation(!useCurrentLocation)}
                className={`text-sm flex items-center ${
                  useCurrentLocation ? "text-blue-600" : "text-gray-600"
                }`}
              >
                <input
                  type="checkbox"
                  checked={useCurrentLocation}
                  onChange={() => {}}
                  className="mr-2 h-4 w-4"
                />
                Folosește locația mea curentă
              </button>
            </div>
          </div>

          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-1">Descriere (opțional)</label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Adaugă detalii despre incident..."
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-black focus:border-transparent"
              rows={3}
            ></textarea>
          </div>

          <div className="flex justify-end">
            {onClose && (
              <button
                type="button"
                onClick={onClose}
                className="mr-2 px-4 py-2 border border-gray-300 rounded-md text-gray-700 bg-white hover:bg-gray-50"
              >
                Anulează
              </button>
            )}
            <button
              type="submit"
              disabled={isSubmitting}
              className="px-4 py-2 bg-black text-white rounded-md hover:bg-gray-800 flex items-center"
            >
              {isSubmitting ? (
                <>
                  <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  Se trimite...
                </>
              ) : (
                <>
                  <AlertTriangle size={16} className="mr-2" />
                  Raportează
                </>
              )}
            </button>
          </div>
        </form>
      )}
    </div>
  )
}

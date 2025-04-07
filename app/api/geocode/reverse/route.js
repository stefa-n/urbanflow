import { NextResponse } from "next/server"

export async function GET(request) {
    const { searchParams } = new URL(request.url)
    const lat = searchParams.get("lat")
    const lon = searchParams.get("lon")
    const lang = searchParams.get("lang") || "ro"

    if (!lat || !lon) {
        return NextResponse.json({ error: "Latitude and longitude parameters are required" }, { status: 400 })
    }

    try {
        const response = await fetch(`https://photon.komoot.io/reverse/?lat=${lat}&lon=${lon}&lang=${lang}`, {
            headers: {
                "User-Agent": "UrbanFlow/1.0",
            },
        })

        if (!response.ok) {
            throw new Error(`Photon API responded with status: ${response.status}`)
        }

        const data = await response.json()
        return NextResponse.json(data)
    } catch (error) {
        console.error("error fetching from photon:", error)
        return NextResponse.json({ error: "Failed to fetch location data" }, { status: 500 })
    }
}

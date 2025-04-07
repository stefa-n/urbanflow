import { NextResponse } from "next/server"

export async function GET(request) {
    const { searchParams } = new URL(request.url)
    const query = searchParams.get("q")
    const limit = searchParams.get("limit") || 5
    const lang = searchParams.get("lang") || "ro"

    if (!query) {
        return NextResponse.json({ error: "Query parameter is required" }, { status: 400 })
    }

    try {
        const response = await fetch(
            `https://photon.komoot.io/api/?q=${encodeURIComponent(query)}&limit=${limit}`,
            {
                headers: {
                    "User-Agent": "UrbanFlow/1.0",
                },
            },
        )

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

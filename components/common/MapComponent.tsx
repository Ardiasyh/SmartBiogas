"use client"

import { useEffect, useState } from "react"
import dynamic from "next/dynamic"
import "leaflet/dist/leaflet.css"
import L from "leaflet"

// Fix icon Leaflet
delete (L.Icon.Default.prototype as any)._getIconUrl
L.Icon.Default.mergeOptions({
  iconRetinaUrl: "/leaflet/marker-icon-2x.png",
  iconUrl: "/leaflet/marker-icon.png",
  shadowUrl: "/leaflet/marker-shadow.png",
})

// Dynamic import react-leaflet (sekali, bersih)
const MapContainer = dynamic(
  () => import("react-leaflet").then(m => m.MapContainer),
  { ssr: false }
)
const TileLayer = dynamic(
  () => import("react-leaflet").then(m => m.TileLayer),
  { ssr: false }
)
const Marker = dynamic(
  () => import("react-leaflet").then(m => m.Marker),
  { ssr: false }
)
const Popup = dynamic(
  () => import("react-leaflet").then(m => m.Popup),
  { ssr: false }
)

type Props = {
  lat?: number
  lng?: number
  label?: string
}

export default function MapComponent({ lat, lng, label }: Props) {
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
  }, [])

  const isValid =
    typeof lat === "number" && typeof lng === "number"

  if (!mounted || !isValid) {
    return (
      <div className="h-[250px] flex items-center justify-center text-sm text-muted-foreground border rounded">
        Lokasi belum tersedia
      </div>
    )
  }

  return (
    <div className="h-[250px] w-full rounded overflow-hidden border">
      <MapContainer
        center={[lat, lng]}
        zoom={16}
        scrollWheelZoom={false}
        className="h-full w-full"
      >
        <TileLayer
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          attribution="© OpenStreetMap contributors"
        />
        <Marker position={[lat, lng]}>
          <Popup>{label ?? "Lokasi perangkat"}</Popup>
        </Marker>
      </MapContainer>
    </div>
  )
}

"use client"

import { useEffect, useMemo, useState } from "react"
import dynamic from "next/dynamic"
import type { Icon } from "leaflet"
import { onAuthStateChanged } from "firebase/auth"
import { doc, getDoc } from "firebase/firestore"
import {
  ExternalLink,
  LocateFixed,
  LockKeyhole,
  MapPinned,
  Navigation,
} from "lucide-react"

import { auth, db } from "@/lib/firebase"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"

import "leaflet/dist/leaflet.css"

const MapContainer = dynamic(
  () => import("react-leaflet").then((module) => module.MapContainer),
  { ssr: false },
)

const TileLayer = dynamic(
  () => import("react-leaflet").then((module) => module.TileLayer),
  { ssr: false },
)

const Marker = dynamic(
  () => import("react-leaflet").then((module) => module.Marker),
  { ssr: false },
)

type LocationData = {
  lat: number | null
  lng: number | null
  locationName: string
  province: string
  city: string
}

const EMPTY_LOCATION: LocationData = {
  lat: null,
  lng: null,
  locationName: "",
  province: "",
  city: "",
}

export default function UserEditableMap() {
  const [location, setLocation] = useState<LocationData>(EMPTY_LOCATION)
  const [loading, setLoading] = useState(true)
  const [defaultIcon, setDefaultIcon] = useState<Icon | null>(null)

  useEffect(() => {
    if (typeof window === "undefined") return

    import("leaflet").then((L) => {
      setDefaultIcon(
        L.icon({
          iconUrl: "/leaflet/marker-icon.png",
          iconRetinaUrl: "/leaflet/marker-icon-2x.png",
          shadowUrl: "/leaflet/marker-shadow.png",
          iconSize: [25, 41],
          iconAnchor: [12, 41],
          popupAnchor: [1, -34],
          shadowSize: [41, 41],
        }),
      )
    })
  }, [])

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (!user) {
        setLoading(false)
        return
      }

      try {
        const snapshot = await getDoc(doc(db, "users", user.uid))
        const data = snapshot.data()

        setLocation({
          lat: typeof data?.lat === "number" ? data.lat : null,
          lng: typeof data?.lng === "number" ? data.lng : null,
          locationName: typeof data?.locationName === "string" ? data.locationName : "",
          province: typeof data?.province === "string" ? data.province : "",
          city: typeof data?.city === "string" ? data.city : "",
        })
      } catch (error) {
        console.error("Gagal memuat lokasi instalasi:", error)
        setLocation(EMPTY_LOCATION)
      } finally {
        setLoading(false)
      }
    })

    return () => unsubscribe()
  }, [])

  const hasLocation = location.lat !== null && location.lng !== null

  const placeLabel = useMemo(() => {
    if (location.locationName) return location.locationName
    return [location.city, location.province].filter(Boolean).join(", ") || "Lokasi instalasi"
  }, [location.city, location.locationName, location.province])

  const regionLabel = [location.city, location.province].filter(Boolean).join(", ")
  const googleMapsUrl = hasLocation
    ? `https://www.google.com/maps?q=${location.lat},${location.lng}`
    : ""

  if (loading) {
    return (
      <div className="space-y-4">
        <div className="h-[360px] animate-pulse rounded-xl bg-muted" />
        <div className="grid gap-3 sm:grid-cols-3">
          <div className="h-16 animate-pulse rounded-lg bg-muted" />
          <div className="h-16 animate-pulse rounded-lg bg-muted" />
          <div className="h-16 animate-pulse rounded-lg bg-muted" />
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex flex-wrap items-center gap-2">
          <Badge variant="secondary" className="gap-1.5 font-normal">
            <LocateFixed className="h-3 w-3" /> Lokasi perangkat
          </Badge>
          <Badge variant="outline" className="gap-1.5 font-normal text-muted-foreground">
            <LockKeyhole className="h-3 w-3" /> Read only
          </Badge>
        </div>

        {hasLocation ? (
          <Button asChild variant="outline" size="sm" className="w-full sm:w-auto">
            <a href={googleMapsUrl} target="_blank" rel="noreferrer">
              Buka Google Maps
              <ExternalLink className="ml-2 h-3.5 w-3.5" />
            </a>
          </Button>
        ) : null}
      </div>

      <div className="relative overflow-hidden rounded-xl border bg-muted/20 shadow-sm">
        <div className="pointer-events-none absolute inset-x-0 top-0 z-[400] h-20 bg-gradient-to-b from-background/35 to-transparent" />

        <div className="h-[360px] sm:h-[400px]">
          <MapContainer
            center={[location.lat ?? -2.5, location.lng ?? 118]}
            zoom={hasLocation ? 15 : 5}
            scrollWheelZoom={false}
            className="h-full w-full"
          >
            <TileLayer
              attribution="&copy; OpenStreetMap contributors"
              url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
            />

            {hasLocation && defaultIcon ? (
              <Marker
                position={[location.lat!, location.lng!]}
                icon={defaultIcon}
                draggable={false}
              />
            ) : null}
          </MapContainer>
        </div>

        <div className="pointer-events-none absolute inset-x-3 bottom-3 z-[450] sm:left-4 sm:right-auto sm:max-w-sm">
          <div className="rounded-xl border bg-background/90 p-3 shadow-lg backdrop-blur-md">
            <div className="flex items-start gap-3">
              <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
                <MapPinned className="h-4 w-4" />
              </div>
              <div className="min-w-0">
                <p className="truncate text-sm font-semibold">{placeLabel}</p>
                <p className="mt-0.5 text-xs text-muted-foreground">
                  {regionLabel || (hasLocation ? "Titik instalasi terdaftar" : "Lokasi belum ditentukan admin")}
                </p>
                {hasLocation ? (
                  <p className="mt-1 font-mono text-[11px] text-muted-foreground">
                    {location.lat!.toFixed(5)}, {location.lng!.toFixed(5)}
                  </p>
                ) : null}
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="grid gap-3 sm:grid-cols-3">
        <LocationMeta
          icon={MapPinned}
          label="Nama lokasi"
          value={location.locationName || "Belum diatur"}
        />
        <LocationMeta
          icon={Navigation}
          label="Wilayah"
          value={regionLabel || "Belum tersedia"}
        />
        <LocationMeta
          icon={LockKeyhole}
          label="Pengelolaan"
          value="Dikelola administrator"
        />
      </div>

      <p className="text-xs leading-5 text-muted-foreground">
        Peta ini hanya untuk melihat lokasi instalasi. Perubahan titik koordinat dilakukan oleh administrator.
      </p>
    </div>
  )
}

function LocationMeta({
  icon: Icon,
  label,
  value,
}: {
  icon: typeof MapPinned
  label: string
  value: string
}) {
  return (
    <div className="flex items-start gap-3 rounded-lg border bg-muted/15 p-3">
      <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-md border bg-background text-muted-foreground">
        <Icon className="h-3.5 w-3.5" />
      </div>
      <div className="min-w-0">
        <p className="text-[11px] text-muted-foreground">{label}</p>
        <p className="mt-0.5 truncate text-sm font-medium">{value}</p>
      </div>
    </div>
  )
}

"use client"

import { useEffect, useState } from "react"
import dynamic from "next/dynamic"
import type { Icon, LeafletEvent, Marker as LeafletMarker } from "leaflet"
import { useMapEvents } from "react-leaflet"
import { onAuthStateChanged } from "firebase/auth"
import { doc, getDoc, updateDoc } from "firebase/firestore"
import { LocateFixed, MapPin, Save } from "lucide-react"
import { toast } from "sonner"

import { auth, db } from "@/lib/firebase"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"

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

function MapClickHandler({ onPick }: { onPick: (lat: number, lng: number) => void }) {
  useMapEvents({
    click(event) {
      onPick(event.latlng.lat, event.latlng.lng)
    },
  })

  return null
}

export default function UserEditableMap({
  onSaved,
}: {
  onSaved?: (lat: number, lng: number) => void
}) {
  const [lat, setLat] = useState<number | null>(null)
  const [lng, setLng] = useState<number | null>(null)
  const [uid, setUid] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
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

      setUid(user.uid)

      try {
        const snap = await getDoc(doc(db, "users", user.uid))
        if (snap.exists()) {
          const data = snap.data()
          if (typeof data.lat === "number" && typeof data.lng === "number") {
            setLat(data.lat)
            setLng(data.lng)
          }
        }
      } catch (error) {
        console.error("Gagal memuat lokasi:", error)
        toast.error("Lokasi instalasi gagal dimuat.")
      } finally {
        setLoading(false)
      }
    })

    return () => unsubscribe()
  }, [])

  const handleSave = async () => {
    if (!uid || lat === null || lng === null) return

    setSaving(true)

    try {
      await updateDoc(doc(db, "users", uid), { lat, lng })
      onSaved?.(lat, lng)
      toast.success("Lokasi instalasi berhasil disimpan.")
    } catch (error) {
      console.error("Gagal menyimpan lokasi:", error)
      toast.error("Lokasi gagal disimpan.")
    } finally {
      setSaving(false)
    }
  }

  if (loading) {
    return (
      <div className="space-y-3">
        <div className="h-[340px] animate-pulse rounded-lg bg-muted" />
        <div className="h-9 w-36 animate-pulse rounded-md bg-muted" />
      </div>
    )
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex flex-wrap items-center gap-2">
          <Badge variant="secondary" className="gap-1.5 font-normal">
            <LocateFixed className="h-3 w-3" /> Koordinat instalasi
          </Badge>
          {lat !== null && lng !== null ? (
            <span className="text-xs text-muted-foreground">
              <span className="font-mono text-foreground">{lat.toFixed(5)}</span>, {" "}
              <span className="font-mono text-foreground">{lng.toFixed(5)}</span>
            </span>
          ) : (
            <span className="text-xs text-muted-foreground">Klik peta untuk menentukan lokasi.</span>
          )}
        </div>

        <Button
          onClick={handleSave}
          disabled={saving || lat === null || lng === null}
          size="sm"
          className="w-full sm:w-auto"
        >
          <Save className="mr-2 h-4 w-4" />
          {saving ? "Menyimpan..." : "Simpan lokasi"}
        </Button>
      </div>

      <div className="relative h-[340px] overflow-hidden rounded-lg border bg-muted/20">
        <MapContainer
          center={[lat ?? -2.5, lng ?? 118]}
          zoom={lat !== null && lng !== null ? 15 : 5}
          scrollWheelZoom={false}
          className="h-full w-full"
        >
          <TileLayer
            attribution="&copy; OpenStreetMap contributors"
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          />

          <MapClickHandler
            onPick={(nextLat, nextLng) => {
              setLat(nextLat)
              setLng(nextLng)
            }}
          />

          {lat !== null && lng !== null && defaultIcon && (
            <Marker
              position={[lat, lng]}
              icon={defaultIcon}
              draggable
              eventHandlers={{
                dragend: (event: LeafletEvent) => {
                  const position = (event.target as LeafletMarker).getLatLng()
                  setLat(position.lat)
                  setLng(position.lng)
                },
              }}
            />
          )}
        </MapContainer>

        {lat === null || lng === null ? (
          <div className="pointer-events-none absolute inset-x-0 bottom-4 flex justify-center">
            <div className="flex items-center gap-2 rounded-md border bg-background/90 px-3 py-2 text-xs shadow-sm backdrop-blur">
              <MapPin className="h-3.5 w-3.5 text-primary" />
              Klik peta untuk meletakkan marker
            </div>
          </div>
        ) : null}
      </div>

      <p className="text-xs leading-5 text-muted-foreground">
        Klik peta untuk memindahkan marker secara cepat, atau geser marker untuk posisi yang lebih presisi.
      </p>
    </div>
  )
}

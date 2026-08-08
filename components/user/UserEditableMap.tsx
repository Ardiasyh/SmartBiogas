"use client"

import { useEffect, useState } from "react"
import dynamic from "next/dynamic"
import type { Icon, LeafletEvent, Marker as LeafletMarker } from "leaflet"
import { onAuthStateChanged } from "firebase/auth"
import { auth, db } from "@/lib/firebase"
import { doc, getDoc, updateDoc } from "firebase/firestore"
import { Button } from "@/components/ui/button"
import "leaflet/dist/leaflet.css"

/* ================= DYNAMIC IMPORT ================= */

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

/* ================= MAIN COMPONENT ================= */

export default function UserEditableMap() {
  const [lat, setLat] = useState<number | null>(null)
  const [lng, setLng] = useState<number | null>(null)
  const [uid, setUid] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [defaultIcon, setDefaultIcon] = useState<Icon | null>(null)

  /* LOAD LEAFLET ICON DI CLIENT */
  useEffect(() => {
    if (typeof window !== "undefined") {
      import("leaflet").then((L) => {

      const icon = L.icon({
        iconUrl: "/leaflet/marker-icon.png",
        iconRetinaUrl: "/leaflet/marker-icon-2x.png",
        shadowUrl: "/leaflet/marker-shadow.png",
        iconSize: [25, 41],
        iconAnchor: [12, 41],
        popupAnchor: [1, -34],
        shadowSize: [41, 41],
      })

        setDefaultIcon(icon)
      })
    }
  }, [])

  /* AUTH + LOAD DATA */
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (!user) {
        setLoading(false)
        return
      }

      setUid(user.uid)

      const snap = await getDoc(doc(db, "users", user.uid))
      if (snap.exists()) {
        const data = snap.data()
        if (typeof data.lat === "number" && typeof data.lng === "number") {
          setLat(data.lat)
          setLng(data.lng)
        }
      }

      setLoading(false)
    })

    return () => unsubscribe()
  }, [])

  const handleSave = async () => {
    if (!uid || lat === null || lng === null) return

    setSaving(true)

    await updateDoc(doc(db, "users", uid), {
      lat,
      lng,
    })

    setSaving(false)
  }

  if (loading) {
    return <p>Memuat peta...</p>
  }

  return (
    <div className="space-y-3">
      <div className="h-[350px] rounded border overflow-hidden">
        <MapContainer
          center={[lat ?? -2.5, lng ?? 118]}
          zoom={lat && lng ? 15 : 5}
          scrollWheelZoom={false}
          className="h-full w-full"
        >
          <TileLayer
            attribution="&copy; OpenStreetMap"
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          />

          {lat !== null && lng !== null && defaultIcon && (
            <Marker
              position={[lat, lng]}
              icon={defaultIcon}
              draggable
              eventHandlers={{
                dragend: (e: LeafletEvent) => {
                  const pos = (e.target as LeafletMarker).getLatLng()
                  setLat(pos.lat)
                  setLng(pos.lng)
                },
              }}
            />
          )}
        </MapContainer>
      </div>

      <Button
        onClick={handleSave}
        disabled={saving || lat === null || lng === null}
        className="w-full"
      >
        {saving ? "Menyimpan..." : "Simpan Lokasi"}
      </Button>
    </div>
  )
}

"use client";

import { useEffect, useState } from "react";
import dynamic from "next/dynamic";
import type { Icon } from "leaflet";
import { useMapEvents } from "react-leaflet";

import { loadLeafletMarkerIcon } from "@/lib/leaflet-marker";

import "leaflet/dist/leaflet.css";

const MapContainer = dynamic(
  () => import("react-leaflet").then((m) => m.MapContainer),
  { ssr: false },
);
const TileLayer = dynamic(
  () => import("react-leaflet").then((m) => m.TileLayer),
  { ssr: false },
);
const Marker = dynamic(
  () => import("react-leaflet").then((m) => m.Marker),
  { ssr: false },
);

function Picker({
  onPick,
}: {
  onPick: (lat: number, lng: number) => void;
}) {
  useMapEvents({
    click(e) {
      onPick(e.latlng.lat, e.latlng.lng);
    },
  });
  return null;
}

export default function UserLocationEditor({
  lat,
  lng,
  onChange,
}: {
  lat: number | null;
  lng: number | null;
  onChange: (lat: number, lng: number) => void;
}) {
  const [markerIcon, setMarkerIcon] = useState<Icon | null>(null);

  useEffect(() => {
    let active = true;

    loadLeafletMarkerIcon()
      .then((icon) => {
        if (active) setMarkerIcon(icon);
      })
      .catch((error) => console.error("Gagal memuat marker Leaflet:", error));

    return () => {
      active = false;
    };
  }, []);

  const hasLocation = lat !== null && lng !== null;

  return (
    <div className="h-[250px] w-full overflow-hidden rounded border">
      <MapContainer
        center={[lat ?? -2.5, lng ?? 118]}
        zoom={hasLocation ? 15 : 5}
        scrollWheelZoom={false}
        className="h-full w-full"
      >
        <TileLayer
          attribution="&copy; OpenStreetMap contributors"
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        <Picker onPick={onChange} />
        {hasLocation && markerIcon ? (
          <Marker position={[lat!, lng!]} icon={markerIcon} />
        ) : null}
      </MapContainer>
    </div>
  );
}

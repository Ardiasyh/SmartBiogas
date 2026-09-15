"use client";

import { MapContainer, TileLayer, Marker, Popup } from "react-leaflet";
import "leaflet/dist/leaflet.css";
import L from "leaflet";

import { LEAFLET_MARKER_ICON_OPTIONS } from "@/lib/leaflet-marker";

const markerIcon = L.icon(LEAFLET_MARKER_ICON_OPTIONS);

export default function UserLocationMap({
  lat,
  lng,
  locationName,
}: {
  lat: number;
  lng: number;
  locationName: string;
}) {
  return (
    <MapContainer
      center={[lat, lng]}
      zoom={15}
      scrollWheelZoom={false}
      className="h-full w-full"
    >
      <TileLayer
        attribution="&copy; OpenStreetMap contributors"
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
      />
      <Marker position={[lat, lng]} icon={markerIcon}>
        <Popup>{locationName}</Popup>
      </Marker>
    </MapContainer>
  );
}

"use client";

import { MapContainer, TileLayer, Marker, Popup } from "react-leaflet";
import "leaflet/dist/leaflet.css";
import { useEffect, useState } from "react";
import { db } from "@/lib/firebase";
import { collection, getDocs } from "firebase/firestore";
import L from "leaflet";

/* FIX ICON */
const defaultIcon = L.icon({
  iconUrl: "/leaflet/marker-icon.png",
  iconRetinaUrl: "/leaflet/marker-icon-2x.png",
  shadowUrl: "/leaflet/marker-shadow.png",
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41],
});

interface UserMapData {
  id: string;
  fullname?: string;
  province?: string;
  lat?: number;
  lng?: number;
}

export default function LeafletMapInner({
  selectedProvince,
}: {
  selectedProvince: string | null;
}) {
  const [users, setUsers] = useState<UserMapData[]>([]);

  /* FETCH ALL USERS */
  useEffect(() => {
    async function fetchUsers() {
      const snap = await getDocs(collection(db, "users"));

      const data = snap.docs
        .map((d) => ({
          id: d.id,
          ...(d.data() as Omit<UserMapData, "id">),
        }))
        .filter(
          (u) =>
            typeof u.lat === "number" &&
            typeof u.lng === "number"
        );

      setUsers(data);
    }

    fetchUsers();
  }, []);

  /* FILTER BY PROVINCE */
  const filteredUsers = selectedProvince
    ? users.filter((u) => u.province === selectedProvince)
    : users;

  return (
    <MapContainer
      center={[-2.5, 118]}
      zoom={5}
      scrollWheelZoom={false}
      style={{ height: 420, width: "100%" }}
    >
      <TileLayer
        attribution="&copy; OpenStreetMap"
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
      />

      {filteredUsers.map((u) => (
        <Marker
          key={u.id}
          position={[u.lat!, u.lng!]}
          icon={defaultIcon}
        >
          <Popup>
            <strong>{u.fullname ?? "Tanpa Nama"}</strong>
            <br />
            {u.province ?? "-"}
          </Popup>
        </Marker>
      ))}
    </MapContainer>
  );
}

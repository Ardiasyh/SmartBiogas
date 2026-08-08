"use client";

import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { db } from "@/lib/firebase";
import { collection, getDocs } from "firebase/firestore";
import { MapContainer, Marker, Popup, TileLayer } from "react-leaflet";
import L from "leaflet";

const markerIcon = L.icon({
  iconUrl: "/marker-icon.png",
  shadowUrl: "/marker-shadow.png",
  iconSize: [25, 41],
  iconAnchor: [12, 41],
});

type DeviceLocation = {
  id: string;
  fullname: string;
  lat: number;
  lng: number;
  locationName?: string;
};

export default function DeviceMapPageClient() {
  const [devices, setDevices] = useState<DeviceLocation[]>([]);

  useEffect(() => {
    getDocs(collection(db, "users")).then((snapshot) => {
      setDevices(snapshot.docs.flatMap((document) => {
        const user = document.data();
        if (typeof user.lat !== "number" || typeof user.lng !== "number") return [];
        return [{
          id: document.id,
          fullname: typeof user.fullname === "string" ? user.fullname : document.id,
          lat: user.lat,
          lng: user.lng,
          locationName: typeof user.locationName === "string" ? user.locationName : undefined,
        }];
      }));
    });
  }, []);

  return (
    <div className="p-6 space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="text-xl font-semibold">Lokasi Perangkat Biogas</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="w-full h-[500px] rounded-xl overflow-hidden">
            <MapContainer center={[-6.9175, 107.6191]} zoom={12} scrollWheelZoom className="h-full w-full">
              <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" attribution="&copy; OpenStreetMap" />
              {devices.map((device) => (
                <Marker key={device.id} position={[device.lat, device.lng]} icon={markerIcon}>
                  <Popup>
                    <div className="space-y-1">
                      <p className="font-semibold">{device.fullname}</p>
                      <p className="text-sm text-muted-foreground">{device.locationName}</p>
                      <p className="text-xs text-muted-foreground">Lat: {device.lat}, Lng: {device.lng}</p>
                    </div>
                  </Popup>
                </Marker>
              ))}
            </MapContainer>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

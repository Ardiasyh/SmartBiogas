"use client";

import { useEffect, useState } from "react";
import { db } from "@/lib/firebase";
import { collection, getDocs } from "firebase/firestore";

import { MapContainer, TileLayer, Marker, Popup } from "react-leaflet";
import L from "leaflet";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

const markerIcon = L.icon({
  iconUrl: "/marker-icon.png",
  shadowUrl: "/marker-shadow.png",
  iconSize: [25, 41],
  iconAnchor: [12, 41]
});

// FIX: typing untuk devices
type Device = {
  id: string;
  name: string;
  lat: number;
  lng: number;
  alamat?: string;
};

export default function DeviceMapPage() {
  const [devices, setDevices] = useState<Device[]>([]); // FIX

  useEffect(() => {
    const fetchDevices = async () => {
      const snap = await getDocs(collection(db, "devices"));
      const list = snap.docs.map(
        d =>
          ({
            id: d.id,
            ...d.data()
          } as Device)
      );

      setDevices(list);
    };

    fetchDevices();
  }, []);

  return (
    <div className="p-6 space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="text-xl font-semibold">
            Lokasi Perangkat Biogas
          </CardTitle>
        </CardHeader>

        <CardContent>
          <div className="w-full h-[500px] rounded-xl overflow-hidden">

            <MapContainer
              center={[-6.9175, 107.6191]}
              zoom={12}
              scrollWheelZoom
              className="h-full w-full"
            >
              <TileLayer
                url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                attribution="&copy; OpenStreetMap"
              />

              {devices.map(d => (
                <Marker
                  key={d.id}
                  position={[d.lat, d.lng]}
                  icon={markerIcon}
                >
                  <Popup>
                    <div className="space-y-1">
                      <p className="font-semibold">{d.name}</p>
                      <p className="text-sm text-muted-foreground">{d.alamat}</p>
                      <p className="text-xs text-muted-foreground">
                        Lat: {d.lat}, Lng: {d.lng}
                      </p>
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

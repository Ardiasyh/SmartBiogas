"use client";

import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { db } from "@/lib/firebase";
import { collection, onSnapshot } from "firebase/firestore";
import { MapContainer, Marker, Popup, TileLayer } from "react-leaflet";
import L from "leaflet";

import { watchDeviceTelemetry } from "@/lib/device-telemetry";
import { deviceStatusMarkerOptions, type DeviceMarkerStatus } from "@/lib/leaflet-marker";
import { DEVICE_OFFLINE_TIMEOUT_MS, deviceStatus, type Telemetry } from "@/lib/telemetry";

const markerIcons = {
  online: L.divIcon(deviceStatusMarkerOptions("online")),
  offline: L.divIcon(deviceStatusMarkerOptions("offline")),
};

type DeviceLocation = {
  id: string;
  fullname: string;
  lat: number;
  lng: number;
  locationName?: string;
  deviceId?: string;
  markerStatus: DeviceMarkerStatus;
};

export default function DeviceMapPageClient() {
  const [devices, setDevices] = useState<DeviceLocation[]>([]);

  useEffect(() => {
    let currentDevices: Omit<DeviceLocation, "markerStatus">[] = [];
    const telemetry = new Map<string, Telemetry | null>();
    const stops = new Map<string, () => void>();

    const refresh = () => {
      const now = Date.now();
      setDevices(currentDevices.map((device) => ({
        ...device,
        markerStatus:
          device.deviceId &&
          deviceStatus(telemetry.get(device.deviceId) ?? null, now, DEVICE_OFFLINE_TIMEOUT_MS) === "ONLINE"
            ? "online"
            : "offline",
      })));
    };

    const unsubscribe = onSnapshot(collection(db, "users"), (snapshot) => {
      currentDevices = snapshot.docs.flatMap((document) => {
        const user = document.data();
        if (typeof user.lat !== "number" || typeof user.lng !== "number") return [];
        return [{
          id: document.id,
          fullname: typeof user.fullname === "string" ? user.fullname : document.id,
          lat: user.lat,
          lng: user.lng,
          locationName: typeof user.locationName === "string" ? user.locationName : undefined,
          deviceId: typeof user.deviceId === "string" ? user.deviceId : undefined,
        }];
      });

      const deviceIds = new Set(currentDevices.flatMap((device) => device.deviceId ? [device.deviceId] : []));
      stops.forEach((stop, deviceId) => {
        if (deviceIds.has(deviceId)) return;
        stop();
        stops.delete(deviceId);
        telemetry.delete(deviceId);
      });
      deviceIds.forEach((deviceId) => {
        if (stops.has(deviceId)) return;
        stops.set(deviceId, watchDeviceTelemetry(deviceId, (value) => {
          telemetry.set(deviceId, value);
          refresh();
        }));
      });
      refresh();
    });

    const interval = window.setInterval(refresh, 5_000);
    return () => {
      unsubscribe();
      window.clearInterval(interval);
      stops.forEach((stop) => stop());
    };
  }, []);

  return (
    <div className="p-6 space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="text-xl font-semibold">Lokasi Perangkat Biogas</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="relative w-full h-[500px] rounded-xl overflow-hidden">
            <MapContainer center={[-6.9175, 107.6191]} zoom={12} scrollWheelZoom className="h-full w-full">
              <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" attribution="&copy; OpenStreetMap" />
              {devices.map((device) => (
                <Marker key={device.id} position={[device.lat, device.lng]} icon={markerIcons[device.markerStatus]}>
                  <Popup>
                    <div className="space-y-1">
                      <p className="font-semibold">{device.fullname}</p>
                      <p className="text-sm text-muted-foreground">{device.locationName}</p>
                      <p className={device.markerStatus === "online" ? "text-xs font-medium text-cyan-600" : "text-xs font-medium text-rose-600"}>
                        Perangkat {device.markerStatus === "online" ? "online" : "offline"}
                      </p>
                      <p className="text-xs text-muted-foreground">Lat: {device.lat}, Lng: {device.lng}</p>
                    </div>
                  </Popup>
                </Marker>
              ))}
            </MapContainer>
            <div className="pointer-events-none absolute right-3 top-3 z-[450] flex gap-3 rounded-lg border bg-background/90 px-3 py-2 text-xs shadow-md backdrop-blur-sm">
              <span className="flex items-center gap-1.5"><span className="h-2.5 w-2.5 rounded-full bg-cyan-500" />Online</span>
              <span className="flex items-center gap-1.5"><span className="h-2.5 w-2.5 rounded-full bg-rose-500" />Offline</span>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

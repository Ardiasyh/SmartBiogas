"use client";

import { MapContainer, TileLayer, Marker, Popup } from "react-leaflet";
import "leaflet/dist/leaflet.css";
import { useEffect, useState } from "react";
import { db } from "@/lib/firebase";
import { collection, onSnapshot } from "firebase/firestore";
import L from "leaflet";

import { watchDeviceTelemetry } from "@/lib/device-telemetry";
import {
  deviceStatusMarkerOptions,
  type DeviceMarkerStatus,
} from "@/lib/leaflet-marker";
import { DEVICE_OFFLINE_TIMEOUT_MS, deviceStatus, type Telemetry } from "@/lib/telemetry";

const markerIcons = {
  online: L.divIcon(deviceStatusMarkerOptions("online")),
  offline: L.divIcon(deviceStatusMarkerOptions("offline")),
};

interface UserMapData {
  id: string;
  fullname?: string;
  province?: string;
  deviceId?: string;
  lat?: number;
  lng?: number;
  markerStatus: DeviceMarkerStatus;
}

export default function LeafletMapInner({
  selectedProvince,
}: {
  selectedProvince: string | null;
}) {
  const [users, setUsers] = useState<UserMapData[]>([]);

  useEffect(() => {
    let currentUsers: Omit<UserMapData, "markerStatus">[] = [];
    const telemetry = new Map<string, Telemetry | null>();
    const telemetryStops = new Map<string, () => void>();

    const refreshMarkers = () => {
      const now = Date.now();
      setUsers(currentUsers.map((user) => ({
        ...user,
        markerStatus:
          user.deviceId &&
          deviceStatus(telemetry.get(user.deviceId) ?? null, now, DEVICE_OFFLINE_TIMEOUT_MS) === "ONLINE"
            ? "online"
            : "offline",
      })));
    };

    const unsubscribeUsers = onSnapshot(collection(db, "users"), (snap) => {
      currentUsers = snap.docs
        .map((d) => ({
          id: d.id,
          ...(d.data() as Omit<UserMapData, "id" | "markerStatus">),
        }))
        .filter(
          (u) =>
            typeof u.lat === "number" &&
            typeof u.lng === "number",
        );

      const deviceIds = new Set(
        currentUsers
          .map((user) => user.deviceId)
          .filter((value): value is string => typeof value === "string" && value.length > 0),
      );

      telemetryStops.forEach((stop, deviceId) => {
        if (deviceIds.has(deviceId)) return;
        stop();
        telemetryStops.delete(deviceId);
        telemetry.delete(deviceId);
      });

      deviceIds.forEach((deviceId) => {
        if (telemetryStops.has(deviceId)) return;
        telemetryStops.set(
          deviceId,
          watchDeviceTelemetry(deviceId, (value) => {
            telemetry.set(deviceId, value);
            refreshMarkers();
          }),
        );
      });

      refreshMarkers();
    });

    const interval = window.setInterval(refreshMarkers, 5_000);

    return () => {
      unsubscribeUsers();
      window.clearInterval(interval);
      telemetryStops.forEach((stop) => stop());
    };
  }, []);

  const filteredUsers = selectedProvince
    ? users.filter((u) => u.province === selectedProvince)
    : users;

  return (
    <div className="relative overflow-hidden rounded-lg">
      <MapContainer
        center={[-2.5, 118]}
        zoom={5}
        scrollWheelZoom={false}
        style={{ height: 420, width: "100%" }}
      >
        <TileLayer
          attribution="&copy; OpenStreetMap contributors"
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />

        {filteredUsers.map((u) => (
          <Marker
            key={u.id}
            position={[u.lat!, u.lng!]}
            icon={markerIcons[u.markerStatus]}
          >
            <Popup>
              <strong>{u.fullname ?? "Tanpa Nama"}</strong>
              <br />
              {u.province ?? "-"}
              <br />
              <span className={u.markerStatus === "online" ? "text-cyan-600" : "text-rose-600"}>
                Perangkat {u.markerStatus === "online" ? "online" : "offline"}
              </span>
            </Popup>
          </Marker>
        ))}
      </MapContainer>

      <div className="pointer-events-none absolute right-3 top-3 z-[450] flex gap-3 rounded-lg border bg-background/90 px-3 py-2 text-xs shadow-md backdrop-blur-sm">
        <span className="flex items-center gap-1.5"><span className="h-2.5 w-2.5 rounded-full bg-cyan-500" />Online</span>
        <span className="flex items-center gap-1.5"><span className="h-2.5 w-2.5 rounded-full bg-rose-500" />Offline</span>
      </div>
    </div>
  );
}

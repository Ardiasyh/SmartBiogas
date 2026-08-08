"use client";

import { useEffect, useState, useMemo } from "react";
import dynamic from "next/dynamic";
import Link from "next/link";

import {
  Table,
  TableBody,
  TableCell,
  TableFooter,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Activity, Power } from "lucide-react";

import { db } from "@/lib/firebase";
import { collection, getDocs, updateDoc, doc } from "firebase/firestore";
import type { LeafletMouseEvent } from "leaflet";
import { watchDeviceTelemetry } from "@/lib/device-telemetry";
import { deviceStatus as telemetryStatus, type Telemetry } from "@/lib/telemetry";

import "leaflet/dist/leaflet.css";
import { useMapEvents } from "react-leaflet";

const MapContainer = dynamic(() => import("react-leaflet").then(m => m.MapContainer), { ssr: false });
const TileLayer = dynamic(() => import("react-leaflet").then(m => m.TileLayer), { ssr: false });
const Marker = dynamic(() => import("react-leaflet").then(m => m.Marker), { ssr: false });

/* ===== PARSER ===== */
function extractLatLngFromGoogleMaps(url: string) {
  const qMatch = url.match(/[?&]q=(-?\d+\.?\d*),(-?\d+\.?\d*)/);
  if (qMatch) return { lat: +qMatch[1], lng: +qMatch[2] };

  const atMatch = url.match(/@(-?\d+\.?\d*),(-?\d+\.?\d*)/);
  if (atMatch) return { lat: +atMatch[1], lng: +atMatch[2] };

  return null;
}

/* ===== TYPES ===== */
interface UserData {
  id: string;
  fullname?: string;
  email?: string;
  province?: string;
  status?: string;
  deviceId?: string;
  locationName?: string;
  lat?: number;
  lng?: number;
}

type DeviceLiveStatus = "ONLINE" | "OFFLINE" | "UNKNOWN";

/* ===== STATUS UI ===== */
function DeviceStatus({ status }: { status: DeviceLiveStatus }) {
  if (status === "UNKNOWN") return <span className="text-xs text-muted-foreground">Unknown</span>;

  return status === "ONLINE" ? (
    <span className="flex items-center gap-1 text-xs text-green-600">
      <Activity className="w-3 h-3 animate-pulse" /> Online
    </span>
  ) : (
    <span className="flex items-center gap-1 text-xs text-red-600">
      <Power className="w-3 h-3" /> Offline
    </span>
  );
}

/* ===== MAP PICKER ===== */
function LocationPicker({ lat, lng, onPick }: { lat: number | null; lng: number | null; onPick: (lat: number, lng: number) => void }) {
  useMapEvents({
    click(e: LeafletMouseEvent) {
      onPick(e.latlng.lat, e.latlng.lng);
    },
  });

  return lat && lng ? <Marker position={[lat, lng]} /> : null;
}

/* ===== MAIN ===== */
export default function UserTable({ filterProvince }: { filterProvince?: string | null }) {
  const [users, setUsers] = useState<UserData[]>([]);
  const [deviceStatus, setDeviceStatus] = useState<Record<string, DeviceLiveStatus>>({});
  const [sortBy, setSortBy] = useState<"name" | "status" | "device">("name");

  const [open, setOpen] = useState(false);
  const [activeUser, setActiveUser] = useState<UserData | null>(null);

  const [deviceIdInput, setDeviceIdInput] = useState("");
  const [locationInput, setLocationInput] = useState("");
  const [lat, setLat] = useState<number | null>(null);
  const [lng, setLng] = useState<number | null>(null);

  /* FETCH USER */
  useEffect(() => {
    getDocs(collection(db, "users")).then(snap => {
      setUsers(snap.docs.map(d => ({ id: d.id, ...d.data() })) as UserData[]);
    });
  }, []);

  /* DEVICE STATUS */
  useEffect(() => {
    const telemetry = new Map<string, Telemetry | null>();
    const deviceIds = [...new Set(users.map((user) => user.deviceId).filter((id): id is string => Boolean(id)))];
    const refresh = () => setDeviceStatus(Object.fromEntries(deviceIds.map((id) => [id, telemetryStatus(telemetry.get(id) ?? null)])));
    const stops = deviceIds.map((deviceId) => watchDeviceTelemetry(deviceId, (value) => {
      telemetry.set(deviceId, value);
      refresh();
    }));
    const interval = window.setInterval(refresh, 5_000);

    return () => {
      stops.forEach((stop) => stop());
      window.clearInterval(interval);
    };
  }, [users]);

  /* SORT */
  const processedUsers = useMemo(() => {
    const list = filterProvince ? users.filter((user) => user.province === filterProvince) : [...users];

    if (sortBy === "name") {
      list.sort((a, b) => (a.fullname || "").localeCompare(b.fullname || ""));
    }

    if (sortBy === "device") {
      list.sort((a, b) => (a.deviceId || "").localeCompare(b.deviceId || ""));
    }

    if (sortBy === "status") {
      const order = { ONLINE: 0, OFFLINE: 1, UNKNOWN: 2 };

      list.sort((a, b) => {
        const sA = deviceStatus[a.deviceId || ""] || "UNKNOWN";
        const sB = deviceStatus[b.deviceId || ""] || "UNKNOWN";
        return order[sA] - order[sB];
      });
    }

    return list;
  }, [users, filterProvince, sortBy, deviceStatus]);

  /* APPROVE */
  const handleApprove = async () => {
    if (!activeUser || !deviceIdInput || lat === null || lng === null) return;

    await updateDoc(doc(db, "users", activeUser.id), {
      status: "active",
      deviceId: deviceIdInput,
      locationName: locationInput,
      lat,
      lng,
    });

    setOpen(false);
  };

  return (
    <div className="rounded-xl border bg-card">

      {/* SORT */}
      <div className="p-3 flex gap-2 border-b">
        <Button size="sm" onClick={() => setSortBy("name")}>A-Z</Button>
        <Button size="sm" onClick={() => setSortBy("status")}>Status</Button>
        <Button size="sm" onClick={() => setSortBy("device")}>Device</Button>
      </div>

      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Nama</TableHead>
            <TableHead>Email</TableHead>
            <TableHead>Status</TableHead>
            <TableHead>Device</TableHead>
            <TableHead>Aksi</TableHead>
          </TableRow>
        </TableHeader>

        <TableBody>
          {processedUsers.map(user => (
            <TableRow key={user.id}>
              <TableCell>{user.fullname || "-"}</TableCell>
              <TableCell>{user.email || "-"}</TableCell>

              <TableCell>
                <Badge variant="outline">{user.status || "Pending"}</Badge>
                {user.deviceId && (
                  <DeviceStatus status={deviceStatus[user.deviceId] ?? "UNKNOWN"} />
                )}
              </TableCell>

              <TableCell>{user.deviceId || "-"}</TableCell>

              <TableCell>
                <div className="flex gap-2">
                  <Button onClick={() => {
                    setActiveUser(user);
                    setLat(user.lat ?? null);
                    setLng(user.lng ?? null);
                    setOpen(true);
                  }}>
                    Review
                  </Button>
                  {user.deviceId && (
                    <Button asChild variant="outline">
                      <Link href={`/admin/user/device/${user.deviceId}`}>Detail</Link>
                    </Button>
                  )}
                </div>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>

        <TableFooter>
          <TableRow>
            <TableCell colSpan={5}>
              Total User: {processedUsers.length}
            </TableCell>
          </TableRow>
        </TableFooter>
      </Table>

      {/* DIALOG */}
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Set Lokasi</DialogTitle>
            <DialogDescription>Paste link Google Maps atau klik map</DialogDescription>
          </DialogHeader>

          <Input placeholder="Device ID" onChange={e => setDeviceIdInput(e.target.value)} />
          <Input placeholder="Nama Lokasi" onChange={e => setLocationInput(e.target.value)} />

          <Input
            placeholder="Link Google Maps"
            onBlur={(e) => {
              const res = extractLatLngFromGoogleMaps(e.target.value);
              if (res) {
                setLat(res.lat);
                setLng(res.lng);
              } else {
                alert("Link tidak valid");
              }
            }}
          />

          <div className="h-[250px]">
            <MapContainer center={[lat ?? -2.5, lng ?? 118]} zoom={lat ? 15 : 5} className="h-full w-full">
              <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
              <LocationPicker lat={lat} lng={lng} onPick={(la: number, ln: number) => {
                setLat(la);
                setLng(ln);
              }} />
            </MapContainer>
          </div>

          <Button onClick={handleApprove}>Simpan</Button>
        </DialogContent>
      </Dialog>
    </div>
  );
}

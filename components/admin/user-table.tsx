"use client";

import { useEffect, useState, useMemo } from "react";
import dynamic from "next/dynamic";

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

import { db, rtdb } from "@/lib/firebase";
import { collection, getDocs, updateDoc, doc } from "firebase/firestore";
import { ref, onValue } from "firebase/database";

import "leaflet/dist/leaflet.css";
import { useMapEvents } from "react-leaflet";
const MapContainer = dynamic(() => import("react-leaflet").then(m => m.MapContainer), { ssr: false });
const TileLayer = dynamic(() => import("react-leaflet").then(m => m.TileLayer), { ssr: false });
const Marker = dynamic(() => import("react-leaflet").then(m => m.Marker), { ssr: false });

/* ================= TYPES ================= */
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

/* ================= STATUS CHIP ================= */
function DeviceStatus({ status }: { status: DeviceLiveStatus }) {
  if (status === "UNKNOWN") {
    return <span className="text-[11px] text-muted-foreground">Unknown</span>;
  }

  return status === "ONLINE" ? (
    <span className="flex items-center gap-1 text-[11px] text-green-600">
      <Activity className="w-3 h-3 animate-pulse" /> Online
    </span>
  ) : (
    <span className="flex items-center gap-1 text-[11px] text-red-600">
      <Power className="w-3 h-3" /> Offline
    </span>
  );
}

/* ================= MAP PICKER ================= */
function LocationPicker({
  lat,
  lng,
  onPick,
}: {
  lat: number | null;
  lng: number | null;
  onPick: (lat: number, lng: number) => void;
}) {
  useMapEvents({
    click(e: any) {
      onPick(e.latlng.lat, e.latlng.lng);
    },
  });

  return lat !== null && lng !== null ? (
    <Marker position={[lat, lng]} />
  ) : null;
}

/* ================= MAIN ================= */
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

  /* ===== FETCH USERS ===== */
  useEffect(() => {
    getDocs(collection(db, "users")).then((snap) => {
      setUsers(snap.docs.map(d => ({ id: d.id, ...d.data() })) as UserData[]);
    });
  }, []);

  /* ===== DEVICE STATUS FROM LOG TERAKHIR ===== */
  useEffect(() => {
  const r = ref(rtdb, "biogasData");

  const unsubscribe = onValue(r, (snap) => {
    const data = snap.val();
    const map: Record<string, DeviceLiveStatus> = {};

    if (!data) {
      setDeviceStatus({});
      return;
    }

    Object.keys(data).forEach((deviceId) => {
      const logs = data[deviceId]?.logs;

      if (!logs) {
        map[deviceId] = "UNKNOWN";
        return;
      }

      const logArray = Object.values(logs);

      if (!logArray.length) {
        map[deviceId] = "UNKNOWN";
        return;
      }

      // ambil log dengan timestamp terbesar
      const latestLog = logArray.reduce((prev: any, current: any) =>
        current.timestamp > prev.timestamp ? current : prev
      ) as { status?: string; timestamp?: number };

      const status = latestLog?.status;

      if (status === "ONLINE") map[deviceId] = "ONLINE";
      else if (status === "OFFLINE") map[deviceId] = "OFFLINE";
      else map[deviceId] = "UNKNOWN";
    });

    setDeviceStatus(map);
  });

  return () => unsubscribe();
}, []);

  /* ===== FILTER + SORT ===== */
  const processedUsers = useMemo(() => {
  let list = users.filter(u =>
    filterProvince ? u.province === filterProvince : true
  );

  if (sortBy === "name") {
    list = [...list].sort((a, b) =>
      (a.fullname || "").localeCompare(b.fullname || "")
    );
  }

  if (sortBy === "device") {
    list = [...list].sort((a, b) =>
      (a.deviceId || "").localeCompare(b.deviceId || "")
    );
  }

  if (sortBy === "status") {
    const order: Record<DeviceLiveStatus, number> = {
      ONLINE: 0,
      OFFLINE: 1,
      UNKNOWN: 2,
    };

    list = [...list].sort((a, b) => {
      const sA = deviceStatus[a.deviceId || ""] || "UNKNOWN";
      const sB = deviceStatus[b.deviceId || ""] || "UNKNOWN";
      return order[sA] - order[sB];
    });
  }

  return list;
}, [users, filterProvince, sortBy, deviceStatus]);

  /* ===== APPROVE ===== */
  const handleApprove = async () => {
    if (!activeUser || !deviceIdInput || lat === null || lng === null) return;

    await updateDoc(doc(db, "users", activeUser.id), {
      status: "Active",
      deviceId: deviceIdInput,
      locationName: locationInput,
      lat,
      lng,
    });

    setUsers(prev =>
      prev.map(u =>
        u.id === activeUser.id
          ? { ...u, status: "Active", deviceId: deviceIdInput, locationName: locationInput, lat, lng }
          : u
      )
    );

    setOpen(false);
  };

  /* ================= RENDER ================= */
  return (
    <div className="rounded-xl border bg-card shadow-sm">

      {/* SORT CONTROL */}
      <div className="p-3 border-b flex gap-2">
        <Button size="sm" variant={sortBy === "name" ? "default" : "outline"} onClick={() => setSortBy("name")}>
          Sort A-Z
        </Button>
        <Button size="sm" variant={sortBy === "status" ? "default" : "outline"} onClick={() => setSortBy("status")}>
          Sort Status
        </Button>
        <Button
          size="sm"
          variant={sortBy === "device" ? "default" : "outline"}
          onClick={() => setSortBy("device")}
        >
          Sort Device
        </Button>
      </div>

      <div className="max-h-[420px] overflow-y-auto">
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
                  <Badge variant="outline" className="text-[11px]">
                    {user.status || "Pending"}
                  </Badge>
                  {user.deviceId && (
                    <DeviceStatus status={deviceStatus[user.deviceId] ?? "UNKNOWN"} />
                  )}
                </TableCell>

                <TableCell>{user.deviceId || "-"}</TableCell>

                <TableCell>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => {
                      setActiveUser(user);
                      setDeviceIdInput(user.deviceId || "");
                      setLocationInput(user.locationName || "");
                      setLat(user.lat ?? null);
                      setLng(user.lng ?? null);
                      setOpen(true);
                    }}
                  >
                    Review
                  </Button>
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
      </div>

      {/* DIALOG REVIEW */}
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Review Pengguna</DialogTitle>
            <DialogDescription>
              Aktivasi device & tentukan lokasi
            </DialogDescription>
          </DialogHeader>

          <Input
            placeholder="Device ID"
            value={deviceIdInput}
            onChange={(e) => setDeviceIdInput(e.target.value)}
          />

          <Input
            placeholder="Nama Lokasi"
            value={locationInput}
            onChange={(e) => setLocationInput(e.target.value)}
          />

          <div className="h-[250px] rounded border overflow-hidden">
            <MapContainer
              center={[lat ?? -2.5, lng ?? 118]}
              zoom={lat && lng ? 15 : 5}
              className="h-full w-full"
            >
              <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
              <LocationPicker
                lat={lat}
                lng={lng}
                onPick={(la, ln) => {
                  setLat(la);
                  setLng(ln);
                }}
              />
            </MapContainer>
          </div>

          <Button onClick={handleApprove} className="w-full">
            Approve & Simpan
          </Button>
        </DialogContent>
      </Dialog>
    </div>
  );
}

"use client";

import { useEffect, useMemo, useState } from "react";
import dynamic from "next/dynamic";
import Link from "next/link";
import type { LeafletMouseEvent } from "leaflet";
import { useMapEvents } from "react-leaflet";
import {
  Activity,
  ArrowUpDown,
  CircleHelp,
  ExternalLink,
  MapPin,
  Power,
  Search,
  UserRound,
} from "lucide-react";
import { collection, doc, getDocs, updateDoc } from "firebase/firestore";

import { db } from "@/lib/firebase";
import { watchDeviceTelemetry } from "@/lib/device-telemetry";
import { deviceStatus as telemetryStatus, type Telemetry } from "@/lib/telemetry";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Table,
  TableBody,
  TableCell,
  TableFooter,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

import "leaflet/dist/leaflet.css";

const MapContainer = dynamic(() => import("react-leaflet").then((module) => module.MapContainer), { ssr: false });
const TileLayer = dynamic(() => import("react-leaflet").then((module) => module.TileLayer), { ssr: false });
const Marker = dynamic(() => import("react-leaflet").then((module) => module.Marker), { ssr: false });

function extractLatLngFromGoogleMaps(url: string) {
  const qMatch = url.match(/[?&]q=(-?\d+\.?\d*),(-?\d+\.?\d*)/);
  if (qMatch) return { lat: +qMatch[1], lng: +qMatch[2] };

  const atMatch = url.match(/@(-?\d+\.?\d*),(-?\d+\.?\d*)/);
  if (atMatch) return { lat: +atMatch[1], lng: +atMatch[2] };

  return null;
}

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
type SortMode = "name" | "status" | "device";

function DeviceStatus({ status }: { status: DeviceLiveStatus }) {
  if (status === "ONLINE") {
    return (
      <Badge variant="outline" className="gap-1.5 border-cyan-500/20 bg-cyan-500/10 text-cyan-700 dark:text-cyan-300">
        <span className="relative flex h-1.5 w-1.5">
          <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-cyan-400 opacity-60" />
          <span className="relative inline-flex h-1.5 w-1.5 rounded-full bg-cyan-500" />
        </span>
        Online
      </Badge>
    );
  }

  if (status === "OFFLINE") {
    return (
      <Badge variant="outline" className="gap-1.5 border-rose-500/20 bg-rose-500/10 text-rose-700 dark:text-rose-300">
        <Power className="h-3 w-3" />
        Offline
      </Badge>
    );
  }

  return (
    <Badge variant="outline" className="gap-1.5 text-muted-foreground">
      <CircleHelp className="h-3 w-3" />
      Unknown
    </Badge>
  );
}

function AccountStatus({ status }: { status?: string }) {
  const active = status?.toLowerCase() === "active";

  return (
    <Badge variant={active ? "secondary" : "outline"} className={active ? "bg-primary/10 text-primary" : "text-muted-foreground"}>
      {active ? "Active" : status || "Pending"}
    </Badge>
  );
}

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
    click(event: LeafletMouseEvent) {
      onPick(event.latlng.lat, event.latlng.lng);
    },
  });

  return lat !== null && lng !== null ? <Marker position={[lat, lng]} /> : null;
}

export default function UserTable({ filterProvince }: { filterProvince?: string | null }) {
  const [users, setUsers] = useState<UserData[]>([]);
  const [deviceStatus, setDeviceStatus] = useState<Record<string, DeviceLiveStatus>>({});
  const [sortBy, setSortBy] = useState<SortMode>("name");
  const [search, setSearch] = useState("");

  const [open, setOpen] = useState(false);
  const [activeUser, setActiveUser] = useState<UserData | null>(null);
  const [deviceIdInput, setDeviceIdInput] = useState("");
  const [locationInput, setLocationInput] = useState("");
  const [lat, setLat] = useState<number | null>(null);
  const [lng, setLng] = useState<number | null>(null);

  useEffect(() => {
    getDocs(collection(db, "users")).then((snapshot) => {
      setUsers(snapshot.docs.map((document) => ({ id: document.id, ...document.data() })) as UserData[]);
    });
  }, []);

  useEffect(() => {
    const telemetry = new Map<string, Telemetry | null>();
    const deviceIds = [...new Set(users.map((user) => user.deviceId).filter((id): id is string => Boolean(id)))];
    const refresh = () => setDeviceStatus(Object.fromEntries(deviceIds.map((id) => [id, telemetryStatus(telemetry.get(id) ?? null)])));

    const stops = deviceIds.map((deviceId) =>
      watchDeviceTelemetry(deviceId, (value) => {
        telemetry.set(deviceId, value);
        refresh();
      }),
    );

    const interval = window.setInterval(refresh, 5_000);

    return () => {
      stops.forEach((stop) => stop());
      window.clearInterval(interval);
    };
  }, [users]);

  const processedUsers = useMemo(() => {
    const keyword = search.trim().toLowerCase();
    const list = users.filter((user) => {
      if (filterProvince && user.province !== filterProvince) return false;
      if (!keyword) return true;

      return [user.fullname, user.email, user.deviceId, user.locationName, user.province]
        .filter(Boolean)
        .some((value) => String(value).toLowerCase().includes(keyword));
    });

    if (sortBy === "name") {
      list.sort((a, b) => (a.fullname || "").localeCompare(b.fullname || ""));
    } else if (sortBy === "device") {
      list.sort((a, b) => (a.deviceId || "").localeCompare(b.deviceId || ""));
    } else {
      const order = { ONLINE: 0, OFFLINE: 1, UNKNOWN: 2 };
      list.sort((a, b) => {
        const statusA = deviceStatus[a.deviceId || ""] || "UNKNOWN";
        const statusB = deviceStatus[b.deviceId || ""] || "UNKNOWN";
        return order[statusA] - order[statusB];
      });
    }

    return list;
  }, [users, filterProvince, sortBy, deviceStatus, search]);

  const openReview = (user: UserData) => {
    setActiveUser(user);
    setDeviceIdInput(user.deviceId || "");
    setLocationInput(user.locationName || "");
    setLat(user.lat ?? null);
    setLng(user.lng ?? null);
    setOpen(true);
  };

  const handleApprove = async () => {
    if (!activeUser || !deviceIdInput.trim() || lat === null || lng === null) return;

    const nextUser: UserData = {
      ...activeUser,
      status: "active",
      deviceId: deviceIdInput.trim(),
      locationName: locationInput.trim(),
      lat,
      lng,
    };

    await updateDoc(doc(db, "users", activeUser.id), {
      status: nextUser.status,
      deviceId: nextUser.deviceId,
      locationName: nextUser.locationName,
      lat,
      lng,
    });

    setUsers((current) => current.map((user) => (user.id === activeUser.id ? nextUser : user)));
    setOpen(false);
  };

  return (
    <div className="overflow-hidden rounded-xl border bg-card text-card-foreground shadow-sm">
      <div className="flex flex-col gap-3 border-b bg-muted/20 p-4 lg:flex-row lg:items-center lg:justify-between">
        <div className="relative w-full lg:max-w-sm">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            placeholder="Cari nama, email, device, lokasi..."
            className="h-9 bg-background pl-9"
          />
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <div className="mr-1 hidden items-center gap-1.5 text-xs text-muted-foreground sm:flex">
            <ArrowUpDown className="h-3.5 w-3.5" />
            Urutkan
          </div>
          {([
            ["name", "A–Z"],
            ["status", "Status"],
            ["device", "Device"],
          ] as Array<[SortMode, string]>).map(([value, label]) => (
            <Button
              key={value}
              size="sm"
              variant={sortBy === value ? "secondary" : "ghost"}
              onClick={() => setSortBy(value)}
              className="h-8"
            >
              {label}
            </Button>
          ))}
        </div>
      </div>

      <div className="overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow className="bg-muted/35 hover:bg-muted/35">
              <TableHead className="min-w-[220px]">Pengguna</TableHead>
              <TableHead className="min-w-[190px]">Status akun</TableHead>
              <TableHead className="min-w-[150px]">Perangkat</TableHead>
              <TableHead className="min-w-[180px]">Lokasi</TableHead>
              <TableHead className="w-[180px] text-right">Aksi</TableHead>
            </TableRow>
          </TableHeader>

          <TableBody>
            {processedUsers.length === 0 ? (
              <TableRow>
                <TableCell colSpan={5} className="h-32 text-center text-sm text-muted-foreground">
                  Tidak ada pengguna yang cocok dengan filter saat ini.
                </TableCell>
              </TableRow>
            ) : (
              processedUsers.map((user) => {
                const liveStatus = user.deviceId ? deviceStatus[user.deviceId] ?? "UNKNOWN" : "UNKNOWN";
                const initial = (user.fullname || user.email || "U").trim().charAt(0).toUpperCase();

                return (
                  <TableRow key={user.id} className="group transition-colors hover:bg-muted/30">
                    <TableCell>
                      <div className="flex items-center gap-3">
                        <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full border bg-muted text-xs font-semibold text-muted-foreground">
                          {initial || <UserRound className="h-4 w-4" />}
                        </div>
                        <div className="min-w-0">
                          <p className="truncate font-medium">{user.fullname || "Tanpa nama"}</p>
                          <p className="truncate text-xs text-muted-foreground">{user.email || "Email belum tersedia"}</p>
                        </div>
                      </div>
                    </TableCell>

                    <TableCell>
                      <div className="flex flex-wrap items-center gap-2">
                        <AccountStatus status={user.status} />
                        {user.deviceId && <DeviceStatus status={liveStatus} />}
                      </div>
                    </TableCell>

                    <TableCell>
                      {user.deviceId ? (
                        <Badge variant="outline" className="font-mono text-[11px]">{user.deviceId}</Badge>
                      ) : (
                        <span className="text-sm text-muted-foreground">Belum ditetapkan</span>
                      )}
                    </TableCell>

                    <TableCell>
                      <div className="flex max-w-[220px] items-start gap-2 text-sm">
                        <MapPin className="mt-0.5 h-3.5 w-3.5 shrink-0 text-muted-foreground" />
                        <span className="line-clamp-2 text-muted-foreground">{user.locationName || user.province || "Lokasi belum diatur"}</span>
                      </div>
                    </TableCell>

                    <TableCell>
                      <div className="flex justify-end gap-2">
                        <Button size="sm" variant="outline" onClick={() => openReview(user)}>
                          Review
                        </Button>
                        {user.deviceId && (
                          <Button size="sm" variant="ghost" asChild>
                            <Link href={`/admin/user/device/${user.deviceId}`}>
                              Detail
                              <ExternalLink className="ml-1 h-3.5 w-3.5" />
                            </Link>
                          </Button>
                        )}
                      </div>
                    </TableCell>
                  </TableRow>
                );
              })
            )}
          </TableBody>

          <TableFooter>
            <TableRow>
              <TableCell colSpan={5} className="text-xs text-muted-foreground">
                Menampilkan {processedUsers.length} dari {users.length} pengguna
                {filterProvince ? ` • Filter provinsi: ${filterProvince}` : ""}
              </TableCell>
            </TableRow>
          </TableFooter>
        </Table>
      </div>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="sm:max-w-2xl">
          <DialogHeader>
            <DialogTitle>Review pengguna & perangkat</DialogTitle>
            <DialogDescription>
              Atur device ID dan titik instalasi. Klik peta untuk memindahkan marker secara langsung.
            </DialogDescription>
          </DialogHeader>

          <div className="grid gap-4 py-2 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="device-id">Device ID</Label>
              <Input id="device-id" value={deviceIdInput} onChange={(event) => setDeviceIdInput(event.target.value)} placeholder="Contoh: 001" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="location-name">Nama lokasi</Label>
              <Input id="location-name" value={locationInput} onChange={(event) => setLocationInput(event.target.value)} placeholder="Contoh: Digester Utama" />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="maps-link">Link Google Maps</Label>
            <Input
              id="maps-link"
              placeholder="Tempel link Google Maps untuk mengambil koordinat"
              onBlur={(event) => {
                if (!event.target.value.trim()) return;
                const result = extractLatLngFromGoogleMaps(event.target.value);
                if (result) {
                  setLat(result.lat);
                  setLng(result.lng);
                } else {
                  alert("Link Google Maps tidak valid");
                }
              }}
            />
          </div>

          <div className="overflow-hidden rounded-lg border">
            <div className="flex items-center justify-between border-b bg-muted/30 px-3 py-2 text-xs text-muted-foreground">
              <span className="flex items-center gap-1.5"><MapPin className="h-3.5 w-3.5" /> Pilih lokasi instalasi</span>
              <span>{lat !== null && lng !== null ? `${lat.toFixed(5)}, ${lng.toFixed(5)}` : "Belum dipilih"}</span>
            </div>
            <div className="h-[280px]">
              <MapContainer center={[lat ?? -2.5, lng ?? 118]} zoom={lat !== null ? 15 : 5} className="h-full w-full">
                <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
                <LocationPicker lat={lat} lng={lng} onPick={(nextLat, nextLng) => {
                  setLat(nextLat);
                  setLng(nextLng);
                }} />
              </MapContainer>
            </div>
          </div>

          <div className="flex justify-end gap-2 pt-2">
            <Button variant="outline" onClick={() => setOpen(false)}>Batal</Button>
            <Button onClick={handleApprove} disabled={!deviceIdInput.trim() || lat === null || lng === null}>
              <Activity className="mr-2 h-4 w-4" />
              Simpan perubahan
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}

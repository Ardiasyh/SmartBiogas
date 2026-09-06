"use client";

import { useEffect, useMemo, useState } from "react";
import dynamic from "next/dynamic";
import Link from "next/link";
import type { LeafletMouseEvent } from "leaflet";
import { useMapEvents } from "react-leaflet";
import {
  Activity,
  ArrowUpDown,
  CheckCircle2,
  CircleHelp,
  ExternalLink,
  Mail,
  MapPin,
  Power,
  Search,
  UserRound,
} from "lucide-react";
import { collection, getDocs } from "firebase/firestore";
import { toast } from "sonner";

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

const MapContainer = dynamic(
  () => import("react-leaflet").then((module) => module.MapContainer),
  { ssr: false },
);
const TileLayer = dynamic(
  () => import("react-leaflet").then((module) => module.TileLayer),
  { ssr: false },
);
const Marker = dynamic(
  () => import("react-leaflet").then((module) => module.Marker),
  { ssr: false },
);

function extractLatLngFromGoogleMaps(url: string) {
  const qMatch = url.match(/[?&]q=(-?\d+\.?\d*),(-?\d+\.?\d*)/);
  if (qMatch) return { lat: +qMatch[1], lng: +qMatch[2] };

  const atMatch = url.match(/@(-?\d+\.?\d*),(-?\d+\.?\d*)/);
  if (atMatch) return { lat: +atMatch[1], lng: +atMatch[2] };

  return null;
}

function validEmail(value: string) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value.trim());
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
      <Badge
        variant="outline"
        className="gap-1.5 border-cyan-500/20 bg-cyan-500/10 text-cyan-700 dark:text-cyan-300"
      >
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
      <Badge
        variant="outline"
        className="gap-1.5 border-rose-500/20 bg-rose-500/10 text-rose-700 dark:text-rose-300"
      >
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
    <Badge
      variant={active ? "secondary" : "outline"}
      className={active ? "bg-primary/10 text-primary" : "text-muted-foreground"}
    >
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
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [activeUser, setActiveUser] = useState<UserData | null>(null);
  const [fullnameInput, setFullnameInput] = useState("");
  const [emailInput, setEmailInput] = useState("");
  const [deviceIdInput, setDeviceIdInput] = useState("");
  const [locationInput, setLocationInput] = useState("");
  const [lat, setLat] = useState<number | null>(null);
  const [lng, setLng] = useState<number | null>(null);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    getDocs(collection(db, "users")).then((snapshot) => {
      setUsers(
        snapshot.docs.map((document) => ({ id: document.id, ...document.data() })) as UserData[],
      );
    });
  }, []);

  useEffect(() => {
    const telemetry = new Map<string, Telemetry | null>();
    const deviceIds = [
      ...new Set(users.map((user) => user.deviceId).filter((id): id is string => Boolean(id))),
    ];
    const refresh = () =>
      setDeviceStatus(
        Object.fromEntries(
          deviceIds.map((id) => [id, telemetryStatus(telemetry.get(id) ?? null)]),
        ),
      );

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

  const accountActive = activeUser?.status?.toLowerCase() === "active";
  const installationComplete =
    deviceIdInput.trim().length > 0 && lat !== null && lng !== null;
  const emailChanged = Boolean(activeUser) && emailInput.trim() !== (activeUser?.email ?? "");
  const formValid = Boolean(fullnameInput.trim()) && validEmail(emailInput);

  const openReview = (user: UserData) => {
    setActiveUser(user);
    setFullnameInput(user.fullname || "");
    setEmailInput(user.email || "");
    setDeviceIdInput(user.deviceId || "");
    setLocationInput(user.locationName || "");
    setLat(user.lat ?? null);
    setLng(user.lng ?? null);
    setConfirmOpen(false);
    setOpen(true);
  };

  const saveUser = async ({ activate }: { activate: boolean }) => {
    if (!activeUser || saving) return;

    const fullname = fullnameInput.trim();
    const email = emailInput.trim();

    if (!fullname) {
      toast.error("Nama pengguna tidak boleh kosong.");
      return;
    }

    if (!validEmail(email)) {
      toast.error("Format email pengguna tidak valid.");
      return;
    }

    if (activate && !installationComplete) {
      toast.error("Lengkapi Device ID dan titik lokasi sebelum mengaktifkan user.");
      return;
    }

    setSaving(true);

    try {
      const response = await fetch("/api/admin/users/update", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          uid: activeUser.id,
          fullname,
          email,
          activate,
          deviceId: deviceIdInput.trim(),
          locationName: locationInput.trim(),
          lat,
          lng,
        }),
      });

      const body = await response.json();
      if (!response.ok) {
        throw new Error(body.error ?? "Gagal memperbarui pengguna.");
      }

      const returnedUser = body.user as Partial<UserData>;
      const nextUser: UserData = {
        ...activeUser,
        ...returnedUser,
        id: activeUser.id,
      };

      setUsers((current) =>
        current.map((user) => (user.id === activeUser.id ? nextUser : user)),
      );
      setActiveUser(nextUser);
      setEmailInput(nextUser.email || email);
      setConfirmOpen(false);
      setOpen(false);

      if (body.emailChanged) {
        toast.success(
          activate
            ? `${fullname} berhasil diaktifkan. Email login juga diperbarui dan perlu diverifikasi ulang.`
            : "Data pengguna dan email login berhasil diperbarui. Email baru perlu diverifikasi ulang.",
        );
      } else {
        toast.success(
          activate
            ? `${fullname} berhasil dikonfirmasi dan diaktifkan.`
            : "Perubahan pengguna berhasil disimpan.",
        );
      }
    } catch (error) {
      console.error("Gagal menyimpan perubahan pengguna:", error);
      toast.error(error instanceof Error ? error.message : "Perubahan pengguna gagal disimpan.");
    } finally {
      setSaving(false);
    }
  };

  const openNewUserConfirmation = () => {
    if (!fullnameInput.trim()) {
      toast.error("Nama pengguna tidak boleh kosong.");
      return;
    }

    if (!validEmail(emailInput)) {
      toast.error("Format email pengguna tidak valid.");
      return;
    }

    if (!installationComplete) {
      toast.error("Lengkapi Device ID dan titik lokasi sebelum konfirmasi user baru.");
      return;
    }

    setOpen(false);
    setConfirmOpen(true);
  };

  const backToReview = () => {
    setConfirmOpen(false);
    setOpen(true);
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
                const liveStatus = user.deviceId
                  ? deviceStatus[user.deviceId] ?? "UNKNOWN"
                  : "UNKNOWN";
                const initial = (user.fullname || user.email || "U")
                  .trim()
                  .charAt(0)
                  .toUpperCase();
                const isActive = user.status?.toLowerCase() === "active";

                return (
                  <TableRow key={user.id} className="group transition-colors hover:bg-muted/30">
                    <TableCell>
                      <div className="flex items-center gap-3">
                        <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full border bg-muted text-xs font-semibold text-muted-foreground">
                          {initial || <UserRound className="h-4 w-4" />}
                        </div>
                        <div className="min-w-0">
                          <p className="truncate font-medium">{user.fullname || "Tanpa nama"}</p>
                          <p className="truncate text-xs text-muted-foreground">
                            {user.email || "Email belum tersedia"}
                          </p>
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
                        <Badge variant="outline" className="font-mono text-[11px]">
                          {user.deviceId}
                        </Badge>
                      ) : (
                        <span className="text-sm text-muted-foreground">Belum ditetapkan</span>
                      )}
                    </TableCell>

                    <TableCell>
                      <div className="flex max-w-[220px] items-start gap-2 text-sm">
                        <MapPin className="mt-0.5 h-3.5 w-3.5 shrink-0 text-muted-foreground" />
                        <span className="line-clamp-2 text-muted-foreground">
                          {user.locationName || user.province || "Lokasi belum diatur"}
                        </span>
                      </div>
                    </TableCell>

                    <TableCell>
                      <div className="flex justify-end gap-2">
                        <Button size="sm" variant="outline" onClick={() => openReview(user)}>
                          {isActive ? "Edit" : "Review"}
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
        <DialogContent className="flex max-h-[90vh] flex-col gap-0 overflow-hidden p-0 sm:max-w-2xl">
          <DialogHeader className="shrink-0 border-b px-6 pb-4 pt-6 pr-12">
            <DialogTitle>{accountActive ? "Edit pengguna & perangkat" : "Review user baru"}</DialogTitle>
            <DialogDescription>
              {accountActive
                ? "Perbarui nama, email login, Device ID, dan titik instalasi pengguna."
                : "Periksa data user baru, tetapkan perangkat dan lokasi, lalu konfirmasi sebelum akun diaktifkan."}
            </DialogDescription>
          </DialogHeader>

          <div className="min-h-0 flex-1 space-y-4 overflow-y-auto px-6 py-4">
            <div className="grid gap-4">
              <div className="space-y-2">
                <Label htmlFor="fullname">Nama pengguna</Label>
                <Input
                  id="fullname"
                  value={fullnameInput}
                  onChange={(event) => setFullnameInput(event.target.value)}
                  placeholder="Nama lengkap pengguna"
                  autoComplete="off"
                />
                <p className="text-xs text-muted-foreground">
                  Nama ini digunakan pada daftar user dan dashboard pengguna.
                </p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="user-email">Email login</Label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                  <Input
                    id="user-email"
                    type="email"
                    value={emailInput}
                    onChange={(event) => setEmailInput(event.target.value)}
                    placeholder="nama@email.com"
                    className="pl-9"
                  />
                </div>
                <p className={`text-xs ${emailChanged ? "text-amber-600 dark:text-amber-300" : "text-muted-foreground"}`}>
                  {emailChanged
                    ? "Email login akan ikut diubah di Firebase Authentication. Status verifikasi email baru akan menjadi belum terverifikasi, sedangkan password tetap sama."
                    : "Email ini digunakan untuk login. Perubahan email hanya dapat dilakukan administrator."}
                </p>
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="device-id">Device ID</Label>
                  <Input
                    id="device-id"
                    value={deviceIdInput}
                    onChange={(event) => setDeviceIdInput(event.target.value)}
                    placeholder="Contoh: 001"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="location-name">Nama lokasi</Label>
                  <Input
                    id="location-name"
                    value={locationInput}
                    onChange={(event) => setLocationInput(event.target.value)}
                    placeholder="Contoh: Digester Utama"
                  />
                </div>
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
                    toast.error("Link Google Maps tidak valid.");
                  }
                }}
              />
            </div>

            <div className="overflow-hidden rounded-lg border">
              <div className="flex items-center justify-between border-b bg-muted/30 px-3 py-2 text-xs text-muted-foreground">
                <span className="flex items-center gap-1.5">
                  <MapPin className="h-3.5 w-3.5" /> Pilih lokasi instalasi
                </span>
                <span>
                  {lat !== null && lng !== null
                    ? `${lat.toFixed(5)}, ${lng.toFixed(5)}`
                    : "Belum dipilih"}
                </span>
              </div>
              <div className="h-[220px] sm:h-[240px]">
                <MapContainer
                  center={[lat ?? -2.5, lng ?? 118]}
                  zoom={lat !== null ? 15 : 5}
                  className="h-full w-full"
                >
                  <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
                  <LocationPicker
                    lat={lat}
                    lng={lng}
                    onPick={(nextLat, nextLng) => {
                      setLat(nextLat);
                      setLng(nextLng);
                    }}
                  />
                </MapContainer>
              </div>
            </div>

            {!accountActive && !installationComplete ? (
              <div className="rounded-lg border border-amber-500/20 bg-amber-500/5 px-4 py-3 text-xs leading-5 text-amber-700 dark:text-amber-300">
                Untuk mengaktifkan user baru, Device ID dan titik koordinat harus sudah ditentukan. Nama dan email tetap dapat disimpan sebagai draft.
              </div>
            ) : null}
          </div>

          <div className="flex shrink-0 flex-wrap justify-end gap-2 border-t bg-background px-6 py-4">
            <Button variant="outline" onClick={() => setOpen(false)} disabled={saving}>
              Batal
            </Button>

            {!accountActive ? (
              <>
                <Button
                  variant="secondary"
                  onClick={() => saveUser({ activate: false })}
                  disabled={saving || !formValid}
                >
                  {saving ? "Menyimpan..." : "Simpan draft"}
                </Button>
                <Button
                  onClick={openNewUserConfirmation}
                  disabled={saving || !formValid || !installationComplete}
                >
                  <CheckCircle2 className="mr-2 h-4 w-4" />
                  Konfirmasi user
                </Button>
              </>
            ) : (
              <Button
                onClick={() => saveUser({ activate: false })}
                disabled={saving || !formValid}
              >
                <Activity className="mr-2 h-4 w-4" />
                {saving ? "Menyimpan..." : "Simpan perubahan"}
              </Button>
            )}
          </div>
        </DialogContent>
      </Dialog>

      <Dialog open={confirmOpen} onOpenChange={setConfirmOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <div className="mb-2 flex h-11 w-11 items-center justify-center rounded-full bg-primary/10 text-primary">
              <CheckCircle2 className="h-5 w-5" />
            </div>
            <DialogTitle>Konfirmasi user baru?</DialogTitle>
            <DialogDescription>
              Periksa kembali data berikut. Setelah dikonfirmasi, status akun akan berubah menjadi Active.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-3 rounded-lg border bg-muted/20 p-4 text-sm">
            <ConfirmationRow label="Nama" value={fullnameInput.trim() || "-"} />
            <ConfirmationRow label="Email login" value={emailInput.trim() || "-"} />
            <ConfirmationRow label="Device ID" value={deviceIdInput.trim() || "-"} mono />
            <ConfirmationRow label="Nama lokasi" value={locationInput.trim() || "-"} />
            <ConfirmationRow
              label="Koordinat"
              value={
                lat !== null && lng !== null
                  ? `${lat.toFixed(6)}, ${lng.toFixed(6)}`
                  : "-"
              }
              mono
            />
          </div>

          <div className="rounded-lg border border-primary/15 bg-primary/5 px-4 py-3 text-xs leading-5 text-muted-foreground">
            User akan mendapatkan akses setelah status menjadi Active. Email belum terverifikasi tetap dapat digunakan untuk login, sedangkan verifikasi email tetap disarankan.
          </div>

          <div className="flex justify-end gap-2 pt-2">
            <Button variant="outline" onClick={backToReview} disabled={saving}>
              Kembali
            </Button>
            <Button onClick={() => saveUser({ activate: true })} disabled={saving || !formValid}>
              <CheckCircle2 className="mr-2 h-4 w-4" />
              {saving ? "Mengaktifkan..." : "Ya, aktifkan user"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}

function ConfirmationRow({
  label,
  value,
  mono = false,
}: {
  label: string;
  value: string;
  mono?: boolean;
}) {
  return (
    <div className="flex items-start justify-between gap-4">
      <span className="text-muted-foreground">{label}</span>
      <span className={`max-w-[65%] text-right font-medium ${mono ? "font-mono" : ""}`}>
        {value}
      </span>
    </div>
  );
}

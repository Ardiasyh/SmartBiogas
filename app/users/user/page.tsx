"use client"

import { useEffect, useMemo, useState } from "react"
import { onAuthStateChanged, sendPasswordResetEmail } from "firebase/auth"
import { doc, getDoc, updateDoc } from "firebase/firestore"
import { useTheme } from "next-themes"
import { toast } from "sonner"
import {
  BadgeCheck,
  Building2,
  CheckCircle2,
  CircleHelp,
  Clock3,
  Cpu,
  ExternalLink,
  Laptop,
  LocateFixed,
  Mail,
  MapPin,
  Moon,
  Pencil,
  ShieldCheck,
  Sun,
  UserRound,
  WifiOff,
} from "lucide-react"

import { auth, db } from "@/lib/firebase"
import { watchDeviceTelemetry } from "@/lib/device-telemetry"
import { deviceStatus as getDeviceStatus, type Telemetry } from "@/lib/telemetry"
import UserEditableMap from "@/components/user/UserEditableMap"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Separator } from "@/components/ui/separator"


type UserData = {
  fullname: string
  email: string
  locationName?: string
  province?: string
  city?: string
  status?: string
  deviceId?: string
  lat?: number
  lng?: number
}

type EditableProfile = {
  fullname: string
  locationName: string
  province: string
  city: string
}

function initials(name: string) {
  const parts = name.trim().split(/\s+/).filter(Boolean)
  if (parts.length === 0) return "SB"
  return parts.slice(0, 2).map((part) => part[0]?.toUpperCase()).join("")
}

function formatUpdatedAt(timestamp?: number) {
  if (!timestamp) return "Belum ada data"

  return new Date(timestamp).toLocaleString("id-ID", {
    day: "2-digit",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
  })
}

export default function UserProfilePage() {
  const { theme, setTheme } = useTheme()
  const [mounted, setMounted] = useState(false)
  const [user, setUser] = useState<UserData | null>(null)
  const [realtime, setRealtime] = useState<Telemetry | null>(null)
  const [loading, setLoading] = useState(true)
  const [now, setNow] = useState(Date.now())
  const [editing, setEditing] = useState(false)
  const [saving, setSaving] = useState(false)
  const [sendingReset, setSendingReset] = useState(false)
  const [form, setForm] = useState<EditableProfile>({
    fullname: "",
    locationName: "",
    province: "",
    city: "",
  })

  useEffect(() => setMounted(true), [])

  useEffect(() => {
    const timer = window.setInterval(() => setNow(Date.now()), 5_000)
    return () => window.clearInterval(timer)
  }, [])

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
      if (!currentUser) {
        setLoading(false)
        return
      }

      try {
        const snap = await getDoc(doc(db, "users", currentUser.uid))

        if (snap.exists()) {
          const data = snap.data() as UserData
          setUser(data)
          setForm({
            fullname: data.fullname ?? "",
            locationName: data.locationName ?? "",
            province: data.province ?? "",
            city: data.city ?? "",
          })
        }
      } catch (error) {
        console.error("Error fetch user:", error)
        toast.error("Gagal memuat profil pengguna.")
      } finally {
        setLoading(false)
      }
    })

    return () => unsubscribe()
  }, [])

  useEffect(() => {
    if (!user?.deviceId) {
      setRealtime(null)
      return
    }

    return watchDeviceTelemetry(user.deviceId, setRealtime)
  }, [user?.deviceId])

  const deviceStatus = useMemo(
    () => getDeviceStatus(realtime, now),
    [realtime, now],
  )

  const saveProfile = async () => {
    const currentUser = auth.currentUser
    if (!currentUser || !user) return

    const next = {
      fullname: form.fullname.trim(),
      locationName: form.locationName.trim(),
      province: form.province.trim(),
      city: form.city.trim(),
    }

    if (!next.fullname) {
      toast.error("Nama tidak boleh kosong.")
      return
    }

    setSaving(true)

    try {
      await updateDoc(doc(db, "users", currentUser.uid), next)
      setUser((current) => current ? { ...current, ...next } : current)
      setEditing(false)
      toast.success("Profil berhasil diperbarui.")
    } catch (error) {
      console.error("Error update profile:", error)
      toast.error("Profil gagal diperbarui.")
    } finally {
      setSaving(false)
    }
  }

  const sendResetPassword = async () => {
    if (!user?.email) return

    setSendingReset(true)
    try {
      await sendPasswordResetEmail(auth, user.email)
      toast.success("Link reset password telah dikirim ke email Anda.")
    } catch (error) {
      console.error("Error reset password:", error)
      toast.error("Gagal mengirim link reset password.")
    } finally {
      setSendingReset(false)
    }
  }

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="space-y-2">
          <div className="h-8 w-40 animate-pulse rounded-md bg-muted" />
          <div className="h-4 w-80 max-w-full animate-pulse rounded-md bg-muted" />
        </div>
        <div className="grid gap-6 lg:grid-cols-[280px_minmax(0,1fr)]">
          <div className="h-72 animate-pulse rounded-xl border bg-card" />
          <div className="h-72 animate-pulse rounded-xl border bg-card" />
        </div>
      </div>
    )
  }

  if (!user) {
    return (
      <Card>
        <CardContent className="flex min-h-64 flex-col items-center justify-center gap-3 text-center">
          <CircleHelp className="h-8 w-8 text-muted-foreground" />
          <div>
            <p className="font-medium">Profil tidak ditemukan</p>
            <p className="text-sm text-muted-foreground">Data pengguna belum tersedia di Firestore.</p>
          </div>
        </CardContent>
      </Card>
    )
  }

  const hasLocation = typeof user.lat === "number" && typeof user.lng === "number"
  const googleMapsUrl = hasLocation
    ? `https://www.google.com/maps?q=${user.lat},${user.lng}`
    : ""
  const accountActive = user.status?.toLowerCase() === "active"

  return (
    <div className="space-y-6 pb-8">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <div className="mb-2 flex items-center gap-2">
            <Badge variant="secondary" className="gap-1.5 font-normal">
              <UserRound className="h-3 w-3" /> Account center
            </Badge>
          </div>
          <h1 className="text-3xl font-semibold tracking-tight">Profil Saya</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Kelola informasi akun, perangkat, lokasi instalasi, dan preferensi tampilan.
          </p>
        </div>

        <Button variant="outline" onClick={() => setEditing(true)}>
          <Pencil className="mr-2 h-4 w-4" />
          Edit profil
        </Button>
      </div>

      <div className="grid gap-6 lg:grid-cols-[280px_minmax(0,1fr)]">
        <Card className="h-fit overflow-hidden">
          <CardContent className="p-6 text-center">
            <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-full border bg-muted text-2xl font-semibold tracking-tight">
              {initials(user.fullname)}
            </div>
            <h2 className="mt-4 text-xl font-semibold">{user.fullname}</h2>
            <p className="mt-1 break-all text-sm text-muted-foreground">{user.email}</p>

            <div className="mt-5 flex flex-wrap justify-center gap-2">
              <Badge variant={accountActive ? "secondary" : "outline"} className={accountActive ? "gap-1.5 bg-primary/10 text-primary" : "gap-1.5"}>
                {accountActive ? <BadgeCheck className="h-3 w-3" /> : <CircleHelp className="h-3 w-3" />}
                {accountActive ? "Active" : user.status || "Pending"}
              </Badge>
              <DeviceBadge status={deviceStatus} />
            </div>
          </CardContent>

          <Separator />

          <CardContent className="space-y-3 p-5 text-sm">
            <InfoRow icon={Cpu} label="Device ID" value={user.deviceId || "Belum terhubung"} mono />
            <InfoRow icon={Clock3} label="Update terakhir" value={formatUpdatedAt(realtime?.timestamp)} />
          </CardContent>
        </Card>

        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Informasi akun</CardTitle>
              <CardDescription>Identitas pengguna dan informasi wilayah instalasi.</CardDescription>
            </CardHeader>
            <CardContent className="grid gap-x-8 gap-y-5 sm:grid-cols-2">
              <DetailItem icon={UserRound} label="Nama lengkap" value={user.fullname} />
              <DetailItem icon={Mail} label="Email" value={user.email} />
              <DetailItem icon={Building2} label="Provinsi" value={user.province || "Belum diisi"} />
              <DetailItem icon={MapPin} label="Kota / Kabupaten" value={user.city || "Belum diisi"} />
              <div className="sm:col-span-2">
                <DetailItem icon={LocateFixed} label="Nama lokasi instalasi" value={user.locationName || "Belum diisi"} />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-start justify-between gap-4">
              <div>
                <CardTitle className="text-base">Perangkat terhubung</CardTitle>
                <CardDescription className="mt-1">Status perangkat yang terhubung dengan akun ini.</CardDescription>
              </div>
              <DeviceBadge status={deviceStatus} />
            </CardHeader>
            <CardContent className="grid gap-4 sm:grid-cols-3">
              <DeviceMetric label="Device ID" value={user.deviceId || "-"} />
              <DeviceMetric label="Status" value={deviceStatus === "ONLINE" ? "Online" : deviceStatus === "OFFLINE" ? "Offline" : "Unknown"} />
              <DeviceMetric label="Update terakhir" value={formatUpdatedAt(realtime?.timestamp)} />
            </CardContent>
            <CardFooter className="border-t bg-muted/20 px-6 py-4">
              <p className="text-xs text-muted-foreground">
                Device ID bersifat read-only dan dikelola melalui akun administrator.
              </p>
            </CardFooter>
          </Card>
        </div>
      </div>

      <div className="grid gap-6 xl:grid-cols-[minmax(0,1.35fr)_minmax(320px,0.65fr)]">
        <Card className="overflow-hidden">
          <CardHeader className="flex flex-row items-start justify-between gap-4">
            <div>
              <CardTitle className="text-base">Lokasi instalasi</CardTitle>
              <CardDescription className="mt-1">
                Geser marker lalu simpan jika lokasi perangkat perlu diperbarui.
              </CardDescription>
            </div>
            {hasLocation && (
              <Button asChild variant="outline" size="sm">
                <a href={googleMapsUrl} target="_blank" rel="noreferrer">
                  Maps <ExternalLink className="ml-2 h-3.5 w-3.5" />
                </a>
              </Button>
            )}
          </CardHeader>
          <CardContent>
            <UserEditableMap />
          </CardContent>
          {hasLocation && (
            <CardFooter className="border-t bg-muted/20 px-6 py-4">
              <div className="flex flex-wrap gap-x-6 gap-y-1 text-xs text-muted-foreground">
                <span>Lat: <span className="font-mono text-foreground">{user.lat?.toFixed(6)}</span></span>
                <span>Lng: <span className="font-mono text-foreground">{user.lng?.toFixed(6)}</span></span>
              </div>
            </CardFooter>
          )}
        </Card>

        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Tampilan</CardTitle>
              <CardDescription>Atur tema antarmuka dashboard.</CardDescription>
            </CardHeader>
            <CardContent className="grid grid-cols-3 gap-2">
              <ThemeButton
                active={mounted && theme === "light"}
                icon={Sun}
                label="Light"
                onClick={() => setTheme("light")}
              />
              <ThemeButton
                active={mounted && theme === "dark"}
                icon={Moon}
                label="Dark"
                onClick={() => setTheme("dark")}
              />
              <ThemeButton
                active={mounted && theme === "system"}
                icon={Laptop}
                label="System"
                onClick={() => setTheme("system")}
              />
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <div className="flex h-9 w-9 items-center justify-center rounded-lg border bg-background text-primary">
                <ShieldCheck className="h-4 w-4" />
              </div>
              <CardTitle className="pt-2 text-base">Keamanan akun</CardTitle>
              <CardDescription>
                Reset password akan dikirim ke email yang terhubung dengan akun Firebase.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Button
                variant="outline"
                className="w-full"
                onClick={sendResetPassword}
                disabled={sendingReset}
              >
                {sendingReset ? "Mengirim..." : "Kirim link reset password"}
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>

      <Dialog open={editing} onOpenChange={setEditing}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>Edit profil</DialogTitle>
            <DialogDescription>
              Perbarui informasi akun dan lokasi instalasi. Email dan Device ID tidak dapat diubah dari sini.
            </DialogDescription>
          </DialogHeader>

          <div className="grid gap-4 py-2">
            <div className="grid gap-2">
              <Label htmlFor="profile-name">Nama lengkap</Label>
              <Input
                id="profile-name"
                value={form.fullname}
                onChange={(event) => setForm((current) => ({ ...current, fullname: event.target.value }))}
              />
            </div>

            <div className="grid gap-2">
              <Label htmlFor="profile-location">Nama lokasi</Label>
              <Input
                id="profile-location"
                value={form.locationName}
                onChange={(event) => setForm((current) => ({ ...current, locationName: event.target.value }))}
                placeholder="Contoh: Digester Kampus"
              />
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <div className="grid gap-2">
                <Label htmlFor="profile-province">Provinsi</Label>
                <Input
                  id="profile-province"
                  value={form.province}
                  onChange={(event) => setForm((current) => ({ ...current, province: event.target.value }))}
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="profile-city">Kota / Kabupaten</Label>
                <Input
                  id="profile-city"
                  value={form.city}
                  onChange={(event) => setForm((current) => ({ ...current, city: event.target.value }))}
                />
              </div>
            </div>

            <div className="grid gap-2">
              <Label>Email</Label>
              <Input value={user.email} disabled />
            </div>

            <div className="grid gap-2">
              <Label>Device ID</Label>
              <Input value={user.deviceId || "Belum terhubung"} disabled className="font-mono" />
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setEditing(false)} disabled={saving}>
              Batal
            </Button>
            <Button onClick={saveProfile} disabled={saving}>
              {saving ? "Menyimpan..." : "Simpan perubahan"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}

function DeviceBadge({ status }: { status: "ONLINE" | "OFFLINE" | "UNKNOWN" }) {
  if (status === "ONLINE") {
    return (
      <Badge variant="outline" className="gap-1.5 border-cyan-500/20 bg-cyan-500/10 text-cyan-700 dark:text-cyan-300">
        <span className="relative flex h-1.5 w-1.5">
          <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-cyan-400 opacity-60" />
          <span className="relative inline-flex h-1.5 w-1.5 rounded-full bg-cyan-500" />
        </span>
        Online
      </Badge>
    )
  }

  if (status === "OFFLINE") {
    return (
      <Badge variant="outline" className="gap-1.5 border-rose-500/20 bg-rose-500/10 text-rose-700 dark:text-rose-300">
        <WifiOff className="h-3 w-3" />
        Offline
      </Badge>
    )
  }

  return (
    <Badge variant="outline" className="gap-1.5 text-muted-foreground">
      <CircleHelp className="h-3 w-3" />
      Unknown
    </Badge>
  )
}

function InfoRow({
  icon: Icon,
  label,
  value,
  mono = false,
}: {
  icon: typeof Cpu
  label: string
  value: string
  mono?: boolean
}) {
  return (
    <div className="flex items-start gap-3">
      <Icon className="mt-0.5 h-4 w-4 shrink-0 text-muted-foreground" />
      <div className="min-w-0">
        <p className="text-xs text-muted-foreground">{label}</p>
        <p className={`truncate font-medium ${mono ? "font-mono" : ""}`}>{value}</p>
      </div>
    </div>
  )
}

function DetailItem({
  icon: Icon,
  label,
  value,
}: {
  icon: typeof UserRound
  label: string
  value: string
}) {
  return (
    <div className="flex items-start gap-3">
      <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-md border bg-muted/30">
        <Icon className="h-3.5 w-3.5 text-muted-foreground" />
      </div>
      <div className="min-w-0">
        <p className="text-xs text-muted-foreground">{label}</p>
        <p className="mt-0.5 break-words text-sm font-medium">{value}</p>
      </div>
    </div>
  )
}

function DeviceMetric({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-lg border bg-muted/20 p-4">
      <p className="text-xs text-muted-foreground">{label}</p>
      <p className="mt-1 break-words text-sm font-medium tabular-nums">{value}</p>
    </div>
  )
}

function ThemeButton({
  active,
  icon: Icon,
  label,
  onClick,
}: {
  active: boolean
  icon: typeof Sun
  label: string
  onClick: () => void
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`flex flex-col items-center gap-2 rounded-lg border p-3 text-xs font-medium transition-colors ${
        active
          ? "border-primary bg-primary/5 text-primary"
          : "bg-background text-muted-foreground hover:bg-muted hover:text-foreground"
      }`}
    >
      {active ? <CheckCircle2 className="h-4 w-4" /> : <Icon className="h-4 w-4" />}
      {label}
    </button>
  )
}

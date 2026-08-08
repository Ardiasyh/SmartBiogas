"use client"

import { useEffect, useState } from "react"
import { auth, db } from "@/lib/firebase"
import { doc, setDoc, serverTimestamp } from "firebase/firestore"
import { useRouter } from "next/navigation"
import { onAuthStateChanged } from "firebase/auth"
import { toast } from "sonner"
import { motion } from "framer-motion"

// UI
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"

// ICON
import { User, Mail, MapPin, ArrowLeft } from "lucide-react"
import Link from "next/link"

export default function CompleteProfilePage() {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [uid, setUid] = useState<string | null>(null)

  const [form, setForm] = useState({
    fullname: "",
    email: "",
    province: "",
    city: "",
    address: "",
  })

  // ===============================
  // AUTH GUARD + PREFILL
  // ===============================
  useEffect(() => {
    const unsub = onAuthStateChanged(auth, (user) => {
      if (!user) {
        router.push("/login")
        return
      }

      setUid(user.uid)

      setForm((p) => ({
        ...p,
        fullname: user.displayName || "",
        email: user.email || "",
      }))
    })

    return () => unsub()
  }, [router])

  const update = (k: string, v: string) =>
    setForm((p) => ({ ...p, [k]: v }))

  // ===============================
  // SUBMIT PROFILE
  // ===============================
  const submit = async () => {
    if (!uid) return

    const { fullname, email, province, city, address } = form

    if (!fullname || !email || !province || !city || !address) {
      toast.error("Lengkapi semua data dulu")
      return
    }

    try {
      setLoading(true)

      await setDoc(doc(db, "users", uid), {
        uid,
        fullname,
        email,
        province,
        city,
        address,
        role: "user",
        status: "pending", // nunggu admin
        profileCompleted: true,
        createdAt: serverTimestamp(),
      })

      toast.success("Profil berhasil disimpan")
      router.push("/pending")
    } catch (err) {
      toast.error("Gagal menyimpan profil")
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-muted px-4">
      <motion.div
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
        className="w-full max-w-2xl"
      >
        <Card className="shadow-xl border-0 relative">

          {/* BACK */}
          <div className="absolute top-4 left-4">
            <Link
              href="/login"
              className="flex items-center gap-1 text-sm text-muted-foreground hover:text-primary"
            >
              <ArrowLeft className="w-4 h-4" />
              Login
            </Link>
          </div>

          <CardHeader className="pt-12 text-center">
            <CardTitle className="text-3xl font-bold">
              Lengkapi Profil
            </CardTitle>
            <CardDescription>
              Satu langkah lagi sebelum masuk dashboard
            </CardDescription>
          </CardHeader>

          <CardContent className="space-y-5">

            {/* NAMA */}
            <div>
              <Label>Nama Lengkap</Label>
              <div className="relative">
                <User className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                <Input
                  className="pl-9"
                  value={form.fullname}
                  onChange={(e) => update("fullname", e.target.value)}
                />
              </div>
            </div>

            {/* EMAIL */}
            <div>
              <Label>Email</Label>
              <div className="relative">
                <Mail className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                <Input
                  disabled
                  className="pl-9 bg-muted"
                  value={form.email}
                />
              </div>
            </div>

            {/* PROVINSI */}
            <div>
              <Label>Provinsi</Label>
              <Input
                placeholder="Nusa Tenggara Barat"
                onChange={(e) => update("province", e.target.value)}
              />
            </div>

            {/* KOTA */}
            <div>
              <Label>Kota / Kabupaten</Label>
              <Input
                placeholder="Kota Mataram"
                onChange={(e) => update("city", e.target.value)}
              />
            </div>

            {/* ALAMAT */}
            <div>
              <Label>Alamat Lengkap</Label>
              <div className="relative">
                <MapPin className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                <Input
                  className="pl-9"
                  placeholder="Jalan, RT/RW, dll"
                  onChange={(e) => update("address", e.target.value)}
                />
              </div>
            </div>

            <Button
              className="w-full"
              onClick={submit}
              disabled={loading}
            >
              {loading ? "Menyimpan..." : "Simpan & Lanjutkan"}
            </Button>

          </CardContent>
        </Card>
      </motion.div>
    </div>
  )
}

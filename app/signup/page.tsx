"use client"

import { useState } from "react"
import { createUserWithEmailAndPassword, sendEmailVerification } from "firebase/auth"
import { auth, db } from "@/lib/firebase"
import { doc, setDoc, serverTimestamp } from "firebase/firestore"
import { useRouter } from "next/navigation"
import Link from "next/link"

import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"

import { ArrowLeft } from "lucide-react"
import { motion, AnimatePresence } from "framer-motion"
import { cn } from "@/lib/utils"

export default function SignupPage() {
  const router = useRouter()
  const [step, setStep] = useState(1)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")

  const [form, setForm] = useState({
    fullname: "",
    email: "",
    password: "",
    province: "",
    city: "",
    address: "",
  })

  const update = (k: string, v: string) =>
    setForm((p) => ({ ...p, [k]: v }))

  const next = () => {
    if (!form.fullname || !form.email || !form.password) {
      setError("Lengkapi data akun dulu.")
      return
    }

    if (form.password.length < 8) {
      setError("Password minimal 8 karakter.")
      return
    }

    setError("")
    setStep(2)
  }

  const submit = async () => {
    if (!form.province || !form.city || !form.address) {
      setError("Alamat belum lengkap.")
      return
    }

    try {
      setLoading(true)
      setError("")

      const cred = await createUserWithEmailAndPassword(
        auth,
        form.email,
        form.password
      )

      // kirim email verifikasi
      await sendEmailVerification(cred.user)

      // simpan ke firestore (UID = doc id)
      await setDoc(doc(db, "users", cred.user.uid), {
        uid: cred.user.uid,
        fullname: form.fullname,
        email: form.email,
        role: "user",
        province: form.province,
        city: form.city,
        address: form.address,
        status: "Pending",          // admin approval
        profileCompleted: true,
        createdAt: serverTimestamp(),
      })

      router.push("/verify-email")
    } catch (err: any) {
      setError(err.message || "Gagal mendaftar.")
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-muted px-4">
      <Card className="w-full max-w-3xl shadow-xl relative overflow-hidden">

        <div className="absolute top-4 left-4">
          <Link href="/login" className="flex items-center gap-1 text-sm text-muted-foreground hover:text-primary">
            <ArrowLeft className="w-4 h-4" />
            Login
          </Link>
        </div>

        <CardHeader className="pt-12 text-center">
          <CardTitle className="text-3xl font-bold">Buat Akun Baru</CardTitle>
          <CardDescription>
            {step === 1 ? "Informasi akun" : "Alamat instalasi"}
          </CardDescription>

          <div className="flex justify-center gap-2 pt-4">
            {[1, 2].map((s) => (
              <div
                key={s}
                className={cn(
                  "h-2 w-12 rounded-full",
                  step === s ? "bg-primary" : "bg-muted-foreground/30"
                )}
              />
            ))}
          </div>
        </CardHeader>

        <CardContent className="py-8">
          {error && (
            <div className="mb-4 rounded-md border border-destructive/30 bg-destructive/10 p-3 text-sm text-destructive">
              {error}
            </div>
          )}

          <AnimatePresence mode="wait">
            {step === 1 && (
              <motion.div
                key="step1"
                initial={{ opacity: 0, x: 30 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -30 }}
                className="space-y-4"
              >
                <Label>Nama Lengkap</Label>
                <Input onChange={(e) => update("fullname", e.target.value)} />

                <Label>Email</Label>
                <Input type="email" onChange={(e) => update("email", e.target.value)} />

                <Label>Password</Label>
                <Input type="password" onChange={(e) => update("password", e.target.value)} />

                <Button className="w-full" onClick={next}>
                  Lanjutkan
                </Button>
              </motion.div>
            )}

            {step === 2 && (
              <motion.div
                key="step2"
                initial={{ opacity: 0, x: 30 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -30 }}
                className="space-y-4"
              >
                <Label>Provinsi</Label>
                <Input onChange={(e) => update("province", e.target.value)} />

                <Label>Kota / Kabupaten</Label>
                <Input onChange={(e) => update("city", e.target.value)} />

                <Label>Alamat Lengkap</Label>
                <Input onChange={(e) => update("address", e.target.value)} />

                <div className="flex gap-2">
                  <Button variant="outline" onClick={() => setStep(1)}>Kembali</Button>
                  <Button onClick={submit} disabled={loading}>
                    {loading ? "Menyimpan..." : "Daftar"}
                  </Button>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </CardContent>
      </Card>
    </div>
  )
}

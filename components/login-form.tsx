"use client"

import { useState } from "react"
import { auth, db } from "@/lib/firebase"
import {
  signInWithEmailAndPassword,
  signInWithPopup,
  GoogleAuthProvider,
} from "firebase/auth"
import { doc, getDoc } from "firebase/firestore"
import { useRouter } from "next/navigation"
import { setCookie } from "cookies-next"
import { motion } from "framer-motion"
import { toast } from "sonner"

// UI
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import {
  Field,
  FieldDescription,
  FieldGroup,
  FieldLabel,
} from "@/components/ui/field"
import { Input } from "@/components/ui/input"
import Image from "next/image"

// ICON
import {
  Mail,
  Lock,
  Eye,
  EyeOff,
} from "lucide-react"

const GoogleIcon = () => (
  <svg width="20" height="20" viewBox="0 0 24 24">
    <path
      d="M21.35 11.1h-9.2v2.8h5.3c-.2 1.3-1.3 3.8-5.3 3.8-3.2 0-5.8-2.7-5.8-6s2.6-6 5.8-6c1.8 0 3 .8 3.7 1.5l2.3-2.2C17 3.1 15 2 12.5 2 7.6 2 3.6 5.9 3.6 11s4 9 8.9 9c5.1 0 8.5-3.6 8.5-8.7 0-.6-.1-1-.1-1.2z"
      fill="#4285F4"
    />
  </svg>
)

export default function LoginForm({
  className,
}: React.ComponentProps<"div">) {
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [showPassword, setShowPassword] = useState(false)
  const [remember, setRemember] = useState(true)
  const [loading, setLoading] = useState(false)
  const router = useRouter()

  const cookieAge = remember ? 60 * 60 * 24 * 7 : 60 * 60 * 24

  // ===============================
  // POST LOGIN CHECK
  // ===============================
  const afterLogin = async (uid: string) => {
  const snap = await getDoc(doc(db, "users", uid))

  if (!snap.exists()) {
    toast.info("Lengkapi profil dulu ya")
    router.push("/signup/complete-profile")
    return
  }

  const data = snap.data()

  if (data.status !== "Active") {
    toast.warning("Akun kamu belum disetujui admin")
    return
  }

  setCookie("uid", uid, { maxAge: cookieAge })
  setCookie("role", data.role, { maxAge: cookieAge })

  toast.success("Login berhasil")

  router.push(
    data.role === "admin"
      ? "/admin/dashboard"
      : "/users/dashboard"
  )
}

  // ===============================
  // EMAIL LOGIN
  // ===============================
  const handleLogin = async () => {
    setLoading(true)
    try {
      const cred = await signInWithEmailAndPassword(auth, email, password)

      if (!cred.user.emailVerified) {
        toast.error("Email belum diverifikasi")
        return
      }

      await afterLogin(cred.user.uid)
    } catch {
      toast.error("Email atau password salah")
    } finally {
      setLoading(false)
    }
  }

  // ===============================
  // GOOGLE LOGIN
  // ===============================
  const handleGoogleLogin = async () => {
    setLoading(true)
    try {
      const provider = new GoogleAuthProvider()
      const cred = await signInWithPopup(auth, provider)
      await afterLogin(cred.user.uid)
    } catch {
      toast.error("Login Google gagal")
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className={cn("flex min-h-screen items-center justify-center px-4", className)}>
      <motion.div
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
        className="w-full max-w-4xl"
      >
        <Card className="border-0 shadow-xl">
          <CardContent className="grid md:grid-cols-2 p-0">

            {/* FORM */}
            <form
              onSubmit={(e) => {
                e.preventDefault()
                handleLogin()
              }}
              className="p-8 md:p-10 space-y-6"
            >
              <div className="text-center">
                <h1 className="text-3xl font-bold">Welcome back</h1>
                <p className="text-muted-foreground">
                  Login dulu, abis itu ngoding lagi
                </p>
              </div>

              <FieldGroup className="space-y-4">
                {/* EMAIL */}
                <Field>
                  <FieldLabel>Email</FieldLabel>
                  <div className="relative">
                    <Mail className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                    <Input
                      type="email"
                      required
                      className="pl-9"
                      onChange={(e) => setEmail(e.target.value)}
                    />
                  </div>
                </Field>

                {/* PASSWORD */}
                <Field>
                  <FieldLabel>Password</FieldLabel>
                  <div className="relative">
                    <Lock className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                    <Input
                      type={showPassword ? "text" : "password"}
                      required
                      className="pl-9 pr-10"
                      onChange={(e) => setPassword(e.target.value)}
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-2.5 text-muted-foreground"
                    >
                      {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                    </button>

                    <button
                    type="button"
                    onClick={() => router.push("/reset-password")}
                    className="text-sm underline text-muted-foreground"
                  >
                    Lupa password?
                  </button>
                  </div>
                </Field>

                {/* REMEMBER */}
                <label className="flex items-center gap-2 text-sm">
                  <input
                    type="checkbox"
                    checked={remember}
                    onChange={() => setRemember(!remember)}
                  />
                  Remember me
                </label>

                <Button type="submit" disabled={loading} className="w-full">
                  {loading ? "Logging in..." : "Login"}
                </Button>

                {/* OR */}
                <div className="relative py-2">
                  <div className="absolute inset-0 flex items-center">
                    <div className="w-full border-t" />
                  </div>
                  <div className="relative flex justify-center text-xs uppercase">
                    <span className="bg-background px-2 text-muted-foreground">
                      atau
                    </span>
                  </div>
                </div>

                <Button
                  type="button"
                  variant="outline"
                  onClick={handleGoogleLogin}
                  disabled={loading}
                  className="flex gap-2"
                >
                  <GoogleIcon />
                  Login dengan Google
                </Button>

                <FieldDescription className="text-center">
                  Belum punya akun?{" "}
                  <a href="/signup" className="underline">
                    Daftar
                  </a>
                </FieldDescription>
              </FieldGroup>
            </form>

            {/* IMAGE */}
            <div className="relative hidden md:block bg-muted">
              <Image
                src="/placeholder.svg"
                alt="login"
                fill
                className="object-cover dark:brightness-[0.35]"
              />
            </div>

          </CardContent>
        </Card>
      </motion.div>
    </div>
  )
}

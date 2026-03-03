import { auth, db } from "@/lib/firebase"
import { doc, getDoc } from "firebase/firestore"

export async function loginGuard() {
  const user = auth.currentUser
  if (!user) throw new Error("Belum login")

  await user.reload()

  if (!user.emailVerified) {
    throw new Error("EMAIL_NOT_VERIFIED")
  }

  const snap = await getDoc(doc(db, "users", user.uid))
  if (!snap.exists()) {
    throw new Error("USER_NOT_FOUND")
  }

  const data = snap.data()

  if (data.status !== "Active") {
    throw new Error("ACCOUNT_NOT_APPROVED")
  }

  return data
}

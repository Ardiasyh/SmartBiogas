"use client";

import { useEffect, useState } from "react";
import { doc, getDoc } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { loginGuard } from "@/lib/auth-guard";

export function useUserData() {
  const [user, setUser] = useState<any>(null);
  const [uid, setUid] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let isMounted = true;

    const fetchUser = async () => {
      try {
        const authUser = await loginGuard();

        if (!authUser?.uid) {
          throw new Error("User tidak memiliki UID");
        }

        if (!isMounted) return;

        setUid(authUser.uid);

        const docRef = doc(db, "users", authUser.uid);
        const snap = await getDoc(docRef);

        if (!isMounted) return;

        if (snap.exists()) {
          setUser(snap.data());
        } else {
          setError("Data user tidak ditemukan di Firestore");
        }
      } catch (err: any) {
        if (!isMounted) return;
        setError(err.message || "Gagal mengambil data user");
      } finally {
        if (isMounted) setLoading(false);
      }
    };

    fetchUser();

    return () => {
      isMounted = false;
    };
  }, []);

  return { user, uid, loading, error };
}


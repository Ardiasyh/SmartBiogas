"use client";

import { useEffect, useState } from "react";
import { auth, db, rtdb } from "@/lib/firebase";
import { onAuthStateChanged } from "firebase/auth";
import { doc, getDoc } from "firebase/firestore";
import { ref, query, limitToLast, onValue } from "firebase/database";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

type UserData = {
  fullname: string;
  email: string;
  locationName?: string;
  deviceId?: string;
  lat?: number;
  lng?: number;
};

type RealtimeData = {
  temperature: number;
  pressure: number;
  flowrate: number;
  energy: number;
};

export default function UserProfilePage() {
  const [user, setUser] = useState<UserData | null>(null);
  const [realtime, setRealtime] = useState<RealtimeData | null>(null);
  const [loading, setLoading] = useState(true);

  /* ================= FETCH USER ================= */
  useEffect(() => {
  const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
    if (!currentUser) {
      setLoading(false);
      return;
    }

    try {
      const userRef = doc(db, "users", currentUser.uid);
      const snap = await getDoc(userRef);

      if (snap.exists()) {
        setUser(snap.data() as UserData);
      } else {
        console.log("User document tidak ditemukan");
      }
    } catch (error) {
      console.error("Error fetch user:", error);
    }

    setLoading(false);
  });

  return () => unsubscribe();
}, []);

  /* ================= FETCH REALTIME ================= */
  useEffect(() => {
    if (!user?.deviceId) return;

    const logsRef = query(
      ref(rtdb, `biogasData/${user.deviceId}/logs`),
      limitToLast(1)
    );

    return onValue(logsRef, (snap) => {
      const data = snap.val();
      if (!data) return;

      const arr = Object.values(data) as any[];
      const last = arr[0];

      setRealtime({
        temperature: last.temperature ?? 0,
        pressure: last.pressure ?? 0,
        flowrate: last.flowrate ?? 0,
        energy: last.energy ?? 0,
      });
    });
  }, [user]);

  if (loading) return <p className="p-6">Loading...</p>;
  if (!user) return <p className="p-6">User tidak ditemukan</p>;

  const hasLocation =
    typeof user.lat === "number" &&
    typeof user.lng === "number";

  const googleMapsUrl = hasLocation
    ? `https://www.google.com/maps?q=${user.lat},${user.lng}`
    : "";

  return (
    <div className="p-6 space-y-6">

      {/* PROFILE INFO */}
      <Card>
        <CardHeader>
          <CardTitle>Profile Saya</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2 text-sm">
          <p><b>Nama:</b> {user.fullname}</p>
          <p><b>Email:</b> {user.email}</p>

          {user.locationName && (
            <>
              <p><b>Lokasi:</b> {user.locationName}</p>
              {hasLocation && (
                <a
                  href={googleMapsUrl}
                  target="_blank"
                  className="text-primary underline text-xs"
                >
                  Buka di Google Maps
                </a>
              )}
            </>
          )}
        </CardContent>
      </Card>

      {/* DEVICE INFO */}
      <Card>
        <CardHeader>
          <CardTitle>Data Realtime Perangkat</CardTitle>
        </CardHeader>
        <CardContent className="grid grid-cols-2 gap-6 text-sm">
          <div>
            <b>Flowrate</b><br />
            {realtime?.flowrate?.toFixed(3) ?? 0} m³/h
          </div>

          <div>
            <b>Energi</b><br />
            {realtime?.energy?.toFixed(3) ?? 0} kWh
          </div>

          <div>
            <b>Suhu</b><br />
            {realtime?.temperature?.toFixed(2) ?? 0} °C
          </div>

          <div>
            <b>Tekanan</b><br />
            {realtime?.pressure?.toFixed(3) ?? 0} kPa
          </div>
        </CardContent>
      </Card>

    </div>
  );
}
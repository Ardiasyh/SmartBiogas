"use client"

import { useEffect, useState } from "react"
import {
  ref,
  onValue,
  off,
  query,
  orderByChild,
  limitToLast,
} from "firebase/database"
import { onAuthStateChanged } from "firebase/auth"
import { doc, getDoc } from "firebase/firestore"

import { rtdb, auth, db } from "@/lib/firebase"

import UserEditableMap from "@/components/user/UserEditableMap"
import UserHeader from "@/components/user/UserHeader"
import UserBiogasCard from "@/components/user/UserBiogasCard"
import ChartTotalEnergyUser from "@/components/charts/user/ChartTotalEnergyUser"
import ChartFlowrateUser from "@/components/charts/user/ChartFlowrateUse"
import ChartPressureUser from "@/components/charts/user/ChartPressureUser"

import { calculateEnergyKwh } from "@/lib/biogas"
import type { FlowUnit, PressureUnit, EnergyUnit } from "@/lib/converters"

export default function UserPage() {

  // ================= DEVICE =================
  const [deviceId, setDeviceId] = useState<string>("")

  // ================= DATA STATE =================
  const [flowRate, setFlowRate] = useState<number>(0)
  const [pressure, setPressure] = useState<number>(0)
  const [temperature, setTemperature] = useState<number>(0)
  const [energy, setEnergy] = useState<number>(0)
  const [status, setStatus] = useState<string>("offline")

  // ================= UNIT STATE =================
  const [flowUnit, setFlowUnit] = useState<FlowUnit>("m3h")
  const [pressureUnit, setPressureUnit] =
    useState<PressureUnit>("kpa")
  const [energyUnit, setEnergyUnit] =
    useState<EnergyUnit>("kwh")

  useEffect(() => {

    let dbRef: any = null
    let intervalCheck: any = null

    // batas waktu tidak ada data baru = dianggap offline
    const OFFLINE_TIMEOUT = 60000 // 60 detik

    const unsubscribeAuth = onAuthStateChanged(auth, async (user) => {

      if (!user) {
        setStatus("offline")
        return
      }

      try {

        const userSnap = await getDoc(doc(db, "users", user.uid))
        const fetchedDeviceId = userSnap.data()?.deviceId

        if (!fetchedDeviceId) {
          console.log("deviceId tidak ditemukan")
          setStatus("offline")
          return
        }

        setDeviceId(fetchedDeviceId)

        dbRef = query(
          ref(rtdb, `biogasData/${fetchedDeviceId}/logs`),
          orderByChild("timestamp"),
          limitToLast(1)
        )

        let lastTimestamp = 0

        onValue(dbRef, (snapshot) => {

          if (!snapshot.exists()) {
            setStatus("offline")
            return
          }

          snapshot.forEach((child) => {

            const latest = child.val()

            const rawFlow = Number(latest.flowrate ?? 0)
            const rawPressure = Number(latest.pressure ?? 0)
            const rawTemp = Number(latest.temperature ?? 0)

            setFlowRate(rawFlow)
            setPressure(rawPressure)
            setTemperature(rawTemp)

            const calculatedEnergy = calculateEnergyKwh(rawFlow)
            setEnergy(calculatedEnergy)

            // simpan waktu terakhir data masuk
            lastTimestamp = Number(latest.timestamp ?? 0)

            // kalau ada data baru berarti online
            setStatus("online")

          })

        })

        // interval pengecekan apakah alat masih kirim data
        intervalCheck = setInterval(() => {

          const now = Date.now()

          // kalau selisih waktu terlalu lama → offline
          if (now - lastTimestamp > OFFLINE_TIMEOUT) {

            setStatus("offline")

          }

        }, 10000) // cek tiap 10 detik

      } catch (error) {

        console.error("gagal ambil data user:", error)
        setStatus("offline")

      }

    })

    return () => {

      unsubscribeAuth()

      if (dbRef) off(dbRef)

      if (intervalCheck) clearInterval(intervalCheck)

    }

  }, [])


  return (

    <div className="p-8 space-y-6">

      <UserHeader status={status} />

      <UserBiogasCard
        flowRate={flowRate}
        pressure={pressure}
        temperature={temperature}
        energy={energy}
        totalUsage={0}
        flowUnit={flowUnit}
        pressureUnit={pressureUnit}
        energyUnit={energyUnit}
        onChangeFlowUnit={setFlowUnit}
        onChangePressureUnit={setPressureUnit}
        onChangeEnergyUnit={setEnergyUnit}
      />


      {/* render chart hanya jika deviceId ada */}
      {deviceId && (

        <div className="space-y-6">

          {/* ENERGY */}
          <ChartTotalEnergyUser deviceId={deviceId} />

          {/* FLOW + PRESSURE */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">

            <ChartFlowrateUser deviceId={deviceId} />

            <ChartPressureUser deviceId={deviceId} />

          </div>

        </div>

      )}


      <div className="bg-card border rounded-xl p-6 shadow-sm space-y-4">

        <div>

          <h2 className="text-lg font-semibold">

            Lokasi Instalasi Biogas

          </h2>

          <p className="text-sm text-muted-foreground">

            Geser atau klik peta untuk mengatur lokasi lebih akurat.

          </p>

        </div>

        <UserEditableMap />

      </div>

    </div>

  )

}
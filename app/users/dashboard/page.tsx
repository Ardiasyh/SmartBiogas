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

    const unsubscribeAuth = onAuthStateChanged(auth, async (user) => {
      if (!user) return

      try {
        const userSnap = await getDoc(doc(db, "users", user.uid))
        const fetchedDeviceId = userSnap.data()?.deviceId

        if (!fetchedDeviceId) {
          console.log("DeviceId tidak ditemukan di Firestore")
          return
        }

        // simpan ke state supaya bisa dipakai chart
        setDeviceId(fetchedDeviceId)

        // ambil 1 log terakhir untuk card realtime
        dbRef = query(
          ref(rtdb, `biogasData/${fetchedDeviceId}/logs`),
          orderByChild("timestamp"),
          limitToLast(1)
        )

        onValue(dbRef, (snapshot) => {
          if (!snapshot.exists()) return

          snapshot.forEach((child) => {
            const latest = child.val()

            const rawFlow = Number(latest.flowrate ?? 0)
            const rawPressure = Number(latest.pressure ?? 0)
            const rawTemp = Number(latest.temperature ?? 0)
            const rawStatus = latest.status ?? "offline"

            setFlowRate(rawFlow)
            setPressure(rawPressure)
            setTemperature(rawTemp)

            // energy dihitung dari flowrate
            const calculatedEnergy = calculateEnergyKwh(rawFlow)
            setEnergy(calculatedEnergy)

            setStatus(rawStatus)
          })
        })

      } catch (error) {
        console.error("Gagal mengambil data user:", error)
      }
    })

    return () => {
      unsubscribeAuth()
      if (dbRef) off(dbRef)
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

      {/* 🔥 Chart hanya render kalau deviceId sudah ada */}
      {deviceId && (
        <div className="space-y-6">

        {/* ENERGY FULL WIDTH */}
        <ChartTotalEnergyUser deviceId={deviceId} />

        {/* FLOW + PRESSURE GRID */}
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

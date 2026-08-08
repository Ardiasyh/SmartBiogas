"use client"

import { useEffect, useState } from "react"
import { onAuthStateChanged } from "firebase/auth"
import { doc, getDoc } from "firebase/firestore"

import { auth, db } from "@/lib/firebase"
import { watchDeviceTelemetry } from "@/lib/device-telemetry"

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

    let stopTelemetry: (() => void) | null = null
    let intervalCheck: ReturnType<typeof setInterval> | null = null

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

        let lastTimestamp = 0

        stopTelemetry = watchDeviceTelemetry(fetchedDeviceId, (latest) => {
          if (!latest) {
            setStatus("offline")
            return
          }

          const rawFlow = latest.flowrate
          const rawPressure = latest.pressure
          const rawTemp = latest.temperature

          setFlowRate(rawFlow)
          setPressure(rawPressure)
          setTemperature(rawTemp)

          setEnergy(latest.energy || calculateEnergyKwh(rawFlow))

          lastTimestamp = latest.timestamp
          setStatus(Date.now() - lastTimestamp <= OFFLINE_TIMEOUT ? "online" : "offline")
        })

        intervalCheck = setInterval(() => {
          if (Date.now() - lastTimestamp > OFFLINE_TIMEOUT) setStatus("offline")
        }, 10000) // cek tiap 10 detik

      } catch (error) {

        console.error("gagal ambil data user:", error)
        setStatus("offline")

      }

    })

    return () => {

      unsubscribeAuth()

      stopTelemetry?.()

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

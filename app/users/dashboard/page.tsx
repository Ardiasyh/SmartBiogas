"use client"

import { useEffect, useState } from "react"
import { onAuthStateChanged } from "firebase/auth"
import { doc, getDoc } from "firebase/firestore"
import { BarChart3, MapPin } from "lucide-react"

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
  const [deviceId, setDeviceId] = useState<string>("")

  const [flowRate, setFlowRate] = useState<number>(0)
  const [pressure, setPressure] = useState<number>(0)
  const [temperature, setTemperature] = useState<number>(0)
  const [energy, setEnergy] = useState<number>(0)
  const [status, setStatus] = useState<string>("offline")

  const [flowUnit, setFlowUnit] = useState<FlowUnit>("m3h")
  const [pressureUnit, setPressureUnit] = useState<PressureUnit>("kpa")
  const [energyUnit, setEnergyUnit] = useState<EnergyUnit>("kwh")

  useEffect(() => {
    let stopTelemetry: (() => void) | null = null
    let intervalCheck: ReturnType<typeof setInterval> | null = null

    const OFFLINE_TIMEOUT = 60000

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
        }, 10000)
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
    <div className="space-y-8 pb-8">
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

      {deviceId && (
        <section className="space-y-5">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-primary/10 text-primary">
              <BarChart3 className="h-5 w-5" />
            </div>
            <div>
              <p className="text-xs font-bold uppercase tracking-[0.18em] text-primary">
                Analytics
              </p>
              <h2 className="text-xl font-bold tracking-tight">Riwayat performa perangkat</h2>
            </div>
          </div>

          <ChartTotalEnergyUser deviceId={deviceId} />

          <div className="grid grid-cols-1 gap-6 xl:grid-cols-2">
            <ChartFlowrateUser deviceId={deviceId} />
            <ChartPressureUser deviceId={deviceId} />
          </div>
        </section>
      )}

      <section className="overflow-hidden rounded-[2rem] border border-border/70 bg-card/75 shadow-[0_18px_60px_-38px_rgba(0,0,0,0.5)] backdrop-blur-xl">
        <div className="flex flex-col gap-3 border-b border-border/60 p-5 sm:flex-row sm:items-center sm:justify-between sm:p-6">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400">
              <MapPin className="h-5 w-5" />
            </div>
            <div>
              <p className="text-xs font-bold uppercase tracking-[0.18em] text-primary">Installation</p>
              <h2 className="text-lg font-bold tracking-tight">Lokasi instalasi biogas</h2>
            </div>
          </div>

          <p className="max-w-md text-xs leading-5 text-muted-foreground">
            Geser marker atau klik peta untuk memperbarui koordinat perangkat dengan lebih akurat.
          </p>
        </div>

        <div className="p-3 sm:p-4">
          <div className="overflow-hidden rounded-[1.5rem] border border-border/60">
            <UserEditableMap />
          </div>
        </div>
      </section>
    </div>
  )
}

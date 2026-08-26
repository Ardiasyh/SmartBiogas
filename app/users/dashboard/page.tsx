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
import EmissionComparisonCard from "@/components/impact/EmissionComparisonCard"
import ChartTotalEnergyUser from "@/components/charts/user/ChartTotalEnergyUser"
import ChartFlowrateUser from "@/components/charts/user/ChartFlowrateUse"
import ChartPressureUser from "@/components/charts/user/ChartPressureUser"
import { Badge } from "@/components/ui/badge"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"

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
    <div className="space-y-6 pb-8">
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

      <EmissionComparisonCard
        flowRateM3h={status === "online" ? flowRate : 0}
        title="Dampak substitusi LPG"
        description="Perbandingan realtime antara energi biogas perangkat Anda dengan LPG yang memiliki energi setara. Nilai CO₂ menunjukkan potensi emisi fosil dari pembakaran LPG yang dapat dihindari."
        scopeLabel={status === "online" ? "Perangkat online" : "Perangkat offline"}
      />

      {deviceId && (
        <section className="space-y-4">
          <Card>
            <CardHeader className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <div className="mb-2 flex items-center gap-2">
                  <CardTitle className="text-base">Riwayat performa perangkat</CardTitle>
                  <Badge variant="secondary" className="gap-1.5 font-normal">
                    <BarChart3 className="h-3 w-3" /> Analytics
                  </Badge>
                </div>
                <CardDescription>
                  Pantau tren energi, flowrate, dan tekanan dari histori perangkat yang tersimpan.
                </CardDescription>
              </div>

              <div className="rounded-md border bg-muted/30 px-3 py-2 text-xs text-muted-foreground">
                Device <span className="font-mono font-medium text-foreground">{deviceId}</span>
              </div>
            </CardHeader>
          </Card>

          <ChartTotalEnergyUser deviceId={deviceId} />

          <div className="grid grid-cols-1 gap-6 xl:grid-cols-2">
            <ChartFlowrateUser deviceId={deviceId} />
            <ChartPressureUser deviceId={deviceId} />
          </div>
        </section>
      )}

      <Card className="overflow-hidden">
        <CardHeader className="border-b bg-muted/20">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
            <div className="flex items-start gap-3">
              <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg border bg-background text-primary">
                <MapPin className="h-4 w-4" />
              </div>
              <div>
                <CardTitle className="text-base">Lokasi instalasi biogas</CardTitle>
                <CardDescription className="mt-1">
                  Perbarui koordinat perangkat langsung dari peta.
                </CardDescription>
              </div>
            </div>

            <Badge variant="outline" className="w-fit font-normal">
              Klik atau geser marker
            </Badge>
          </div>
        </CardHeader>

        <CardContent className="p-5">
          <UserEditableMap />
        </CardContent>
      </Card>
    </div>
  )
}

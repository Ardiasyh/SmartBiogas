"use client"

import { useState } from "react"
import { MapPinned, ShieldCheck, UsersRound } from "lucide-react"

import UserTable from "@/components/admin/user-table"
import UserDashboardOverview from "@/components/admin/UserDashboardOverview"
import DeviceMap from "@/components/admin/DeviceMap"
import { Badge } from "@/components/ui/badge"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"

export default function AdminDashboardPage() {
  const [selectedProvince, setSelectedProvince] = useState<string | null>(null)

  return (
    <div className="space-y-6 pb-8">
      <Card className="shadow-sm">
        <CardHeader>
          <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
            <div>
              <Badge variant="secondary" className="mb-3">
                <ShieldCheck className="h-3 w-3" />
                Administration center
              </Badge>
              <CardTitle className="text-2xl sm:text-3xl">Admin Dashboard</CardTitle>
              <CardDescription className="mt-2 max-w-2xl text-sm leading-6">
                Pantau performa sistem, konektivitas perangkat, lokasi instalasi, dan aktivitas pengguna dari satu panel.
              </CardDescription>
            </div>

            <Badge variant="outline" className="w-fit border-sky-500/30 text-sky-700 dark:text-sky-400">
              <span className="h-2 w-2 rounded-full bg-sky-500" />
              Firebase realtime aktif
            </Badge>
          </div>
        </CardHeader>
      </Card>

      <UserDashboardOverview />

      <Card className="shadow-sm">
        <CardHeader className="border-b">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
            <div className="flex items-start gap-3">
              <span className="flex h-9 w-9 items-center justify-center rounded-md border bg-muted">
                <MapPinned className="h-4 w-4 text-sky-600 dark:text-sky-400" />
              </span>
              <div>
                <CardTitle className="text-lg">Peta instalasi perangkat</CardTitle>
                <CardDescription>Lokasi user dan perangkat yang sudah terdaftar.</CardDescription>
              </div>
            </div>

            {selectedProvince && (
              <Badge variant="secondary">Filter: {selectedProvince}</Badge>
            )}
          </div>
        </CardHeader>
        <CardContent className="p-3 sm:p-5">
          <DeviceMap
            selectedProvince={selectedProvince}
            onSelectProvince={setSelectedProvince}
          />
        </CardContent>
      </Card>

      <Card className="shadow-sm">
        <CardHeader className="border-b">
          <div className="flex items-start gap-3">
            <span className="flex h-9 w-9 items-center justify-center rounded-md border bg-muted">
              <UsersRound className="h-4 w-4 text-violet-600 dark:text-violet-400" />
            </span>
            <div>
              <CardTitle className="text-lg">Daftar pengguna</CardTitle>
              <CardDescription>
                Review akun, device ID, lokasi, dan status konektivitas pengguna.
              </CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent className="p-3 sm:p-5">
          <UserTable filterProvince={selectedProvince} />
        </CardContent>
      </Card>
    </div>
  )
}

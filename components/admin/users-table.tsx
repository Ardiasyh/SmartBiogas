"use client"

import { useEffect, useState } from "react"
import {
  Table, TableBody, TableCell, TableFooter,
  TableHead, TableHeader, TableRow
} from "@/components/ui/table"
import { Button } from "@/components/ui/button"
import { Checkbox } from "@/components/ui/checkbox"
import { Badge } from "@/components/ui/badge"

import { db } from "@/lib/firebase"
import { collection, getDocs } from "firebase/firestore"
import Link from "next/link"

interface UserData {
  id: string
  fullname?: string
  email?: string
  locationName?: string;
  lat?: number;
  lng?: number;
  status?: string
  deviceId?: string
}

export default function UserTable() {
  const [users, setUsers] = useState<UserData[]>([])

  useEffect(() => {
    const fetchUsers = async () => {
      const snap = await getDocs(collection(db, "users"))
      const list = snap.docs.map(d => ({
        id: d.id,
        ...d.data()
      })) as UserData[]

      setUsers(list)
    }

    fetchUsers()
  }, [])

  return (
    <div className="rounded-xl border bg-card shadow-md">
      <div className="max-h-[450px] overflow-y-auto">
        <Table>
          <TableHeader className="sticky top-0 bg-card z-10 shadow-sm">
            <TableRow>
              <TableHead className="w-10"><Checkbox /></TableHead>
              <TableHead>Nama</TableHead>
              <TableHead>Email</TableHead>

              {/* Lokasi dibatesin */}
              <TableHead className="max-w-[150px] truncate">Lokasi</TableHead>

              <TableHead>Status</TableHead>
              <TableHead>Device ID</TableHead>
              <TableHead>Aksi</TableHead>
            </TableRow>
          </TableHeader>

          <TableBody>
            {users.length === 0 && (
              <TableRow>
                <TableCell colSpan={7} className="text-center py-6 text-muted-foreground">
                  Tidak ada data pengguna
                </TableCell>
              </TableRow>
            )}

            {users.map(user => (
              <TableRow key={user.id} className="hover:bg-muted/40">
                <TableCell><Checkbox /></TableCell>
                <TableCell className="font-medium">{user.fullname}</TableCell>
                <TableCell>{user.email}</TableCell>

                <TableCell className="max-w-[150px] truncate">
                  {user.locationName || "-"}
                </TableCell>

                <TableCell>
                  <Badge>
                    {user.status || "Pending"}
                  </Badge>
                </TableCell>

                <TableCell>{user.deviceId || "-"}</TableCell>

                <TableCell>
                  <Link href={`/admin/user/device/${user.deviceId}`}>
                    <Button size="sm" variant="outline">
                      Detail
                    </Button>
                  </Link>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>

          <TableFooter className="sticky bottom-0 bg-card">
            <TableRow>
              <TableCell colSpan={4}>
                Total: {users.length}
              </TableCell>
            </TableRow>
          </TableFooter>
        </Table>
      </div>
    </div>
  )
}

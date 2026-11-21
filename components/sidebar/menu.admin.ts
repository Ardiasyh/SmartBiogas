import {
  LayoutDashboard,
  History,
  Users,
  MapPin,
} from "lucide-react"

export const adminMenu = [
  {
    label: "Dashboard",
    href: "/admin/dashboard",
    icon: LayoutDashboard,
  },
  {
    label: "Users",
    href: "/admin/user",
    icon: Users,
  },
  {
    label: "History Data",
    href: "/admin/history",
    icon: History,
  },
  {
    label: "Peta Perangkat",
    href: "/admin/device-map",
    icon: MapPin,
  },
]

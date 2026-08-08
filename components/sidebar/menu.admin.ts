import {
  LayoutDashboard,
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
    label: "Peta Perangkat",
    href: "/admin/device-map",
    icon: MapPin,
  },
]

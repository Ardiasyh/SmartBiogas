import {
  LayoutDashboard,
  User,
  History,
} from "lucide-react"

export const userMenu = [
  {
    label: "Dashboard",
    href: "/users/dashboard",
    icon: LayoutDashboard,
  },
  {
    label: "Profil",
    href: "/users/user",
    icon: User,
  },
  {
    label: "Aktivitas",
    href: "/user/activity",
    icon: History,
  },
]

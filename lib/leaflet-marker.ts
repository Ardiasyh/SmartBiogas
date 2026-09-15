import type { Icon, IconOptions } from "leaflet"

export const LEAFLET_MARKER_ICON_OPTIONS: IconOptions = {
  iconUrl: "/leaflet/marker-icon.png",
  iconRetinaUrl: "/leaflet/marker-icon-2x.png",
  shadowUrl: "/leaflet/marker-shadow.png",
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41],
}

export async function loadLeafletMarkerIcon(): Promise<Icon> {
  const L = await import("leaflet")
  return L.icon(LEAFLET_MARKER_ICON_OPTIONS)
}

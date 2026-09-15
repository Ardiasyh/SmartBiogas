import type { Icon, IconOptions } from "leaflet"

const LEAFLET_ASSET_BASE = "https://unpkg.com/leaflet@1.9.4/dist/images"

export const LEAFLET_MARKER_ICON_OPTIONS: IconOptions = {
  iconUrl: `${LEAFLET_ASSET_BASE}/marker-icon.png`,
  iconRetinaUrl: `${LEAFLET_ASSET_BASE}/marker-icon-2x.png`,
  shadowUrl: `${LEAFLET_ASSET_BASE}/marker-shadow.png`,
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41],
}

export async function loadLeafletMarkerIcon(): Promise<Icon> {
  const L = await import("leaflet")
  return L.icon(LEAFLET_MARKER_ICON_OPTIONS)
}

import type { DivIcon, DivIconOptions, Icon, IconOptions } from "leaflet"

export type DeviceMarkerStatus = "online" | "offline"

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

function statusMarkerHtml(status: DeviceMarkerStatus) {
  const label = status === "online" ? "Perangkat online" : "Perangkat offline"

  return `
    <span class="device-status-marker__pulse" aria-hidden="true"></span>
    <span class="device-status-marker__pin">
      <span class="device-status-marker__dot" aria-hidden="true"></span>
    </span>
    <span class="sr-only">${label}</span>
  `
}

export function deviceStatusMarkerOptions(status: DeviceMarkerStatus): DivIconOptions {
  return {
    className: `device-status-marker device-status-marker--${status}`,
    html: statusMarkerHtml(status),
    iconSize: [36, 42],
    iconAnchor: [18, 38],
    popupAnchor: [0, -38],
  }
}

export async function loadDeviceStatusMarkerIcon(
  status: DeviceMarkerStatus,
): Promise<DivIcon> {
  const L = await import("leaflet")
  return L.divIcon(deviceStatusMarkerOptions(status))
}

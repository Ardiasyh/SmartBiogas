"use client";

import dynamic from "next/dynamic";

/* ================= TYPE ================= */

interface DeviceMapProps {
  selectedProvince: string | null;
  onSelectProvince: (p: string | null) => void;
}

/* ================= DYNAMIC IMPORT ================= */

const LeafletMapInner = dynamic<DeviceMapProps>(
  () => import("./LeafletMapInner"),
  { ssr: false }
);

/* ================= COMPONENT ================= */

export default function DeviceMap(props: DeviceMapProps) {
  return <LeafletMapInner {...props} />;
}

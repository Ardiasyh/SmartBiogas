"use client";

import dynamic from "next/dynamic";

const DeviceMapPageClient = dynamic(
  () => import("@/components/admin/DeviceMapPageClient"),
  { ssr: false },
);

export default function DeviceMapPage() {
  return <DeviceMapPageClient />;
}

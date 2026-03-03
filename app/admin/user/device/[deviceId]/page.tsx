"use client";

import { use } from "react";
import UserDetail from "@/components/admin/userpage/users-detail";

export default function UserDetailPage({
  params,
}: {
  params: Promise<{ deviceId: string }>;
}) {
  const { deviceId } = use(params);

  return (
    <div className="p-6 space-y-6">
      <UserDetail deviceId={deviceId} />
    </div>
  );
}

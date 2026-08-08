import { Activity, PauseCircle, Power, type LucideIcon } from "lucide-react";

export function DeviceStatus({
  active,
  idle,
  dead,
}: {
  active: number;
  idle: number;
  dead: number;
}) {
  return (
    <div className="flex flex-wrap gap-4 text-sm">
      <StatusItem
        icon={Activity}
        label="Aktif"
        value={active}
        color="text-green-600"
        dot="bg-green-500"
      />
      <StatusItem
        icon={PauseCircle}
        label="Idle"
        value={idle}
        color="text-yellow-600"
        dot="bg-yellow-500"
      />
      <StatusItem
        icon={Power}
        label="Mati"
        value={dead}
        color="text-red-600"
        dot="bg-red-500"
      />
    </div>
  );
}

function StatusItem({
  icon: Icon,
  label,
  value,
  color,
  dot,
}: { icon: LucideIcon; label: string; value: number; color: string; dot: string }) {
  return (
    <div className={`flex items-center gap-2 ${color}`}>
      <span className={`w-2 h-2 rounded-full ${dot} animate-pulse`} />
      <Icon className="w-4 h-4" />
      <span>{label}: {value}</span>
    </div>
  );
}

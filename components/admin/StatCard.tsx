import { Card, CardContent } from "@/components/ui/card";
import { LucideIcon, Info } from "lucide-react";
import { motion } from "framer-motion";

type Props = {
  title: string;
  value: number | string;
  icon: LucideIcon;
  color: "green" | "blue" | "yellow" | "red";
  unit?: string;
  tooltip?: string;
};

const colorMap = {
  green: "bg-green-100 text-green-600",
  blue: "bg-blue-100 text-blue-600",
  yellow: "bg-yellow-100 text-yellow-600",
  red: "bg-red-100 text-red-600",
};

export default function StatCard({
  title,
  value,
  icon: Icon,
  color,
  unit,
  tooltip,
}: Props) {
  return (
    <Card className="hover:shadow-lg transition relative">
      <CardContent className="flex items-center gap-4 py-5">
        <div className={`p-3 rounded-xl ${colorMap[color]}`}>
          <Icon className="w-6 h-6" />
        </div>

        <div className="flex-1">
          <div className="flex items-center gap-1">
            <p className="text-sm text-muted-foreground">{title}</p>
            {tooltip && (
              <div className="group relative">
                <Info className="w-4 h-4 text-muted-foreground cursor-pointer" />
                <div className="absolute z-10 hidden group-hover:block w-56 p-2 text-xs bg-black text-white rounded shadow -top-2 left-5">
                  {tooltip}
                </div>
              </div>
            )}
          </div>

          <motion.p
            key={String(value)}
            initial={{ opacity: 0, y: 5 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-2xl font-bold"
          >
            {value} {unit}
          </motion.p>
        </div>

        <span className="absolute top-2 right-3 text-[10px] px-2 py-0.5 rounded-full bg-green-500 text-white">
          realtime
        </span>
      </CardContent>
    </Card>
  );
}

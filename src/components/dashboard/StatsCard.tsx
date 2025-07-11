
import { LucideIcon } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";

interface StatsCardProps {
  title: string;
  value: string | number;
  icon: LucideIcon;
  trend?: {
    value: string;
    isPositive: boolean;
  };
  color: "blue" | "green" | "orange" | "purple";
}

const colorMap = {
  blue: "text-blue-600 bg-blue-100",
  green: "text-green-600 bg-green-100",
  orange: "text-orange-600 bg-orange-100",
  purple: "text-purple-600 bg-purple-100",
};

export function StatsCard({ title, value, icon: Icon, trend, color }: StatsCardProps) {
  return (
    <Card>
      <CardContent className="p-6">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm font-medium text-gray-600">{title}</p>
            <p className="text-3xl font-bold text-gray-900 mt-2">{value}</p>
            {trend && (
              <p className={`text-sm mt-2 ${trend.isPositive ? 'text-green-600' : 'text-red-600'}`}>
                {trend.isPositive ? '↗' : '↘'} {trend.value}
              </p>
            )}
          </div>
          <div className={`p-3 rounded-full ${colorMap[color]}`}>
            <Icon className="h-6 w-6" />
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

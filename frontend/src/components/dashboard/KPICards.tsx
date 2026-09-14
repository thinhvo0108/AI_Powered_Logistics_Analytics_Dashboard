"use client";

import { Package, CheckCircle2, AlertTriangle, Percent, Clock, type LucideIcon } from "lucide-react";
import { useKPIs } from "@/hooks/useKPIs";
import { useFilterStore } from "@/stores/useFilterStore";
import type { KPIData } from "@/types/logistics";

interface CardConfig {
  key: keyof KPIData;
  label: string;
  icon: LucideIcon;
  iconClass: string;
  format: (value: number) => string;
}

const CARDS: CardConfig[] = [
  {
    key: "totalOrders",
    label: "Total Orders",
    icon: Package,
    iconClass: "bg-blue-50 text-blue-600",
    format: (v) => v.toLocaleString(),
  },
  {
    key: "deliveredOrders",
    label: "Delivered",
    icon: CheckCircle2,
    iconClass: "bg-green-50 text-green-600",
    format: (v) => v.toLocaleString(),
  },
  {
    key: "delayedOrders",
    label: "Delayed",
    icon: AlertTriangle,
    iconClass: "bg-red-50 text-red-600",
    format: (v) => v.toLocaleString(),
  },
  {
    key: "onTimeDeliveryRate",
    label: "On-Time Rate",
    icon: Percent,
    iconClass: "bg-purple-50 text-purple-600",
    format: (v) => `${v.toFixed(1)}%`,
  },
  {
    key: "avgDeliveryDays",
    label: "Avg Delivery Days",
    icon: Clock,
    iconClass: "bg-orange-50 text-orange-600",
    format: (v) => `${v.toFixed(1)}d`,
  },
];

export function KPICards() {
  const filters = useFilterStore((s) => s.filters);
  const { data, isLoading } = useKPIs(filters);

  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-5">
      {CARDS.map(({ key, label, icon: Icon, iconClass, format }) => (
        <div key={key} className="rounded-lg border border-slate-200 bg-white p-4">
          <div className={`flex h-9 w-9 items-center justify-center rounded-md ${iconClass}`}>
            <Icon className="h-5 w-5" />
          </div>
          <p className="mt-3 text-sm text-slate-500">{label}</p>
          {isLoading || !data ? (
            <div className="mt-1.5 h-7 w-20 animate-pulse rounded bg-slate-200" />
          ) : (
            <p className="mt-1 text-2xl font-semibold text-slate-900">
              {format(data[key])}
            </p>
          )}
        </div>
      ))}
    </div>
  );
}

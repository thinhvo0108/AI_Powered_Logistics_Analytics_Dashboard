"use client";

import { useIsFetching, useQueryClient } from "@tanstack/react-query";
import { Header } from "@/components/layout/Header";
import { DashboardFilters } from "@/components/dashboard/DashboardFilters";
import { KPICards } from "@/components/dashboard/KPICards";
import { ChartSkeleton } from "@/components/dashboard/ChartSkeleton";
import { OrderVolumeChart } from "@/components/charts/OrderVolumeChart";
import { DeliveryPerformanceChart } from "@/components/charts/DeliveryPerformanceChart";
import { CarrierBreakdownChart } from "@/components/charts/CarrierBreakdownChart";
import { CategoryRevenueChart } from "@/components/charts/CategoryRevenueChart";
import { DynamicChart } from "@/components/charts/DynamicChart";
import {
  useOrderVolumeChart,
  useDeliveryPerformanceChart,
  useCarrierChart,
  useCategoryChart,
  useRegionChart,
} from "@/hooks/useChartData";
import { useFilterStore } from "@/stores/useFilterStore";
import type { Filters } from "@/types/logistics";

function OrderVolumeSection({ filters }: { filters: Filters }) {
  const { data, isLoading } = useOrderVolumeChart(filters);
  return data && !isLoading ? <OrderVolumeChart spec={data} /> : <ChartSkeleton />;
}

function DeliveryPerformanceSection({ filters }: { filters: Filters }) {
  const { data, isLoading } = useDeliveryPerformanceChart(filters);
  return data && !isLoading ? <DeliveryPerformanceChart spec={data} /> : <ChartSkeleton />;
}

function CarrierBreakdownSection({ filters }: { filters: Filters }) {
  const { data, isLoading } = useCarrierChart(filters);
  return data && !isLoading ? <CarrierBreakdownChart spec={data} /> : <ChartSkeleton />;
}

function CategoryRevenueSection({ filters }: { filters: Filters }) {
  const { data, isLoading } = useCategoryChart(filters);
  return data && !isLoading ? <CategoryRevenueChart spec={data} /> : <ChartSkeleton />;
}

function RegionSection({ filters }: { filters: Filters }) {
  const { data, isLoading } = useRegionChart(filters);
  return data && !isLoading ? <DynamicChart spec={data} /> : <ChartSkeleton />;
}

export default function DashboardPage() {
  const queryClient = useQueryClient();
  const filters = useFilterStore((s) => s.filters);
  const isFetching = useIsFetching() > 0;

  const handleRefresh = () => {
    queryClient.invalidateQueries({ queryKey: ["kpis"] });
    queryClient.invalidateQueries({ queryKey: ["chart"] });
    queryClient.invalidateQueries({ queryKey: ["filter-options"] });
  };

  return (
    <div className="flex flex-col">
      <Header title="Dashboard" onRefresh={handleRefresh} isRefreshing={isFetching} />

      <div className="flex flex-col gap-4 p-6">
        <DashboardFilters />
        <KPICards />

        <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
          <div className="lg:col-span-2">
            <OrderVolumeSection filters={filters} />
          </div>

          <DeliveryPerformanceSection filters={filters} />
          <CarrierBreakdownSection filters={filters} />

          <CategoryRevenueSection filters={filters} />
          <RegionSection filters={filters} />
        </div>
      </div>
    </div>
  );
}

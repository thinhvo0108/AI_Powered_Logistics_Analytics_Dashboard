"use client";

import { RotateCcw } from "lucide-react";
import { clsx } from "clsx";
import { useFilterOptions } from "@/hooks/useChartData";
import { useFilterStore } from "@/stores/useFilterStore";

interface SelectFieldProps {
  label: string;
  value: string | undefined;
  options: string[] | undefined;
  onChange: (value: string | undefined) => void;
  disabled?: boolean;
}

function SelectField({ label, value, options, onChange, disabled }: SelectFieldProps) {
  return (
    <div className="flex flex-col gap-1">
      <label className="text-xs font-medium text-slate-500">{label}</label>
      <select
        value={value ?? ""}
        disabled={disabled}
        onChange={(e) => onChange(e.target.value || undefined)}
        className="h-9 rounded-md border border-slate-200 bg-white px-2 text-sm text-slate-700 disabled:bg-slate-50 disabled:text-slate-400"
      >
        <option value="">All</option>
        {(options ?? []).map((option) => (
          <option key={option} value={option}>
            {option}
          </option>
        ))}
      </select>
    </div>
  );
}

export function DashboardFilters() {
  const { filters, setFilters, resetFilters } = useFilterStore();
  const { data: options, isLoading } = useFilterOptions();

  const toggleStatus = (status: string) => {
    const current = filters.status ?? [];
    const next = current.includes(status)
      ? current.filter((s) => s !== status)
      : [...current, status];
    setFilters({ ...filters, status: next.length > 0 ? next : undefined });
  };

  return (
    <div className="flex flex-wrap items-end gap-4 rounded-lg border border-slate-200 bg-white p-4">
      <div className="flex flex-col gap-1">
        <label className="text-xs font-medium text-slate-500">Start Date</label>
        <input
          type="date"
          value={filters.startDate ?? ""}
          min={options?.dateRange.min}
          max={options?.dateRange.max}
          onChange={(e) =>
            setFilters({ ...filters, startDate: e.target.value || undefined })
          }
          className="h-9 rounded-md border border-slate-200 bg-white px-2 text-sm text-slate-700"
        />
      </div>

      <div className="flex flex-col gap-1">
        <label className="text-xs font-medium text-slate-500">End Date</label>
        <input
          type="date"
          value={filters.endDate ?? ""}
          min={options?.dateRange.min}
          max={options?.dateRange.max}
          onChange={(e) =>
            setFilters({ ...filters, endDate: e.target.value || undefined })
          }
          className="h-9 rounded-md border border-slate-200 bg-white px-2 text-sm text-slate-700"
        />
      </div>

      <SelectField
        label="Carrier"
        value={filters.carrier}
        options={options?.carriers}
        disabled={isLoading}
        onChange={(value) => setFilters({ ...filters, carrier: value })}
      />

      <SelectField
        label="Region"
        value={filters.region}
        options={options?.regions}
        disabled={isLoading}
        onChange={(value) => setFilters({ ...filters, region: value })}
      />

      <SelectField
        label="Warehouse"
        value={filters.warehouse}
        options={options?.warehouses}
        disabled={isLoading}
        onChange={(value) => setFilters({ ...filters, warehouse: value })}
      />

      <div className="flex flex-col gap-1">
        <label className="text-xs font-medium text-slate-500">Status</label>
        <div className="flex flex-wrap gap-1.5">
          {(options?.statuses ?? []).map((status) => {
            const isActive = (filters.status ?? []).includes(status);
            return (
              <button
                key={status}
                type="button"
                onClick={() => toggleStatus(status)}
                className={clsx(
                  "rounded-full border px-2.5 py-1 text-xs font-medium capitalize transition-colors",
                  isActive
                    ? "border-blue-500 bg-blue-50 text-blue-700"
                    : "border-slate-200 bg-white text-slate-500 hover:bg-slate-50"
                )}
              >
                {status}
              </button>
            );
          })}
        </div>
      </div>

      <button
        type="button"
        onClick={resetFilters}
        className="ml-auto flex h-9 items-center gap-1.5 rounded-md border border-slate-200 px-3 text-sm font-medium text-slate-600 transition-colors hover:bg-slate-50"
      >
        <RotateCcw className="h-3.5 w-3.5" />
        Reset
      </button>
    </div>
  );
}

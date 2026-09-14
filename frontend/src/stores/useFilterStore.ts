import { create } from "zustand";
import type { Filters } from "@/types/logistics";

interface FilterState {
  filters: Filters;
  setFilters: (filters: Filters) => void;
  resetFilters: () => void;
}

const DEFAULT_FILTERS: Filters = {};

export const useFilterStore = create<FilterState>((set) => ({
  filters: DEFAULT_FILTERS,
  setFilters: (filters) => set({ filters }),
  resetFilters: () => set({ filters: DEFAULT_FILTERS }),
}));

import { create } from "zustand";

import type { Verdict } from "./types";

export type VerdictFilter = Verdict | "all";

interface CheckFilterState {
  verdict: VerdictFilter;
  setVerdict: (verdict: VerdictFilter) => void;
}

export const useCheckFilter = create<CheckFilterState>((set) => ({
  verdict: "all",
  setVerdict: (verdict) => set({ verdict }),
}));

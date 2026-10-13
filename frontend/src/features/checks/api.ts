import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import { api, toQuery, type Paginated } from "../../lib/api";
import { contractKeys } from "../contracts/api";
import type { VerdictFilter } from "./store";
import type { ScopeCheck, ScopeCheckInput } from "./types";

export const checkKeys = {
  all: ["checks"] as const,
  list: (contract: string, verdict: VerdictFilter) => ["checks", "list", contract, verdict] as const,
};

export function useScopeChecks(contract: string, verdict: VerdictFilter) {
  return useQuery({
    queryKey: checkKeys.list(contract, verdict),
    queryFn: () =>
      api<Paginated<ScopeCheck>>(
        `/scope-checks/${toQuery({ contract, verdict: verdict === "all" ? undefined : verdict })}`,
      ),
  });
}

function useInvalidateChecks() {
  const queryClient = useQueryClient();
  return (contract: string) =>
    Promise.all([
      queryClient.invalidateQueries({ queryKey: checkKeys.all }),
      queryClient.invalidateQueries({ queryKey: contractKeys.detail(contract) }),
      queryClient.invalidateQueries({ queryKey: contractKeys.all }),
    ]);
}

export function useRunScopeCheck() {
  const invalidate = useInvalidateChecks();
  return useMutation({
    mutationFn: (input: ScopeCheckInput) =>
      api<ScopeCheck>("/scope-checks/", { method: "POST", body: input }),
    onSuccess: (check) => invalidate(check.contract),
  });
}

export function useRerunScopeCheck() {
  const invalidate = useInvalidateChecks();
  return useMutation({
    mutationFn: (id: number) => api<ScopeCheck>(`/scope-checks/${id}/rerun/`, { method: "POST" }),
    onSuccess: (check) => invalidate(check.contract),
  });
}

export function useDeleteScopeCheck() {
  const invalidate = useInvalidateChecks();
  return useMutation({
    mutationFn: ({ id }: { id: number; contract: string }) =>
      api<void>(`/scope-checks/${id}/`, { method: "DELETE" }),
    onSuccess: (_data, { contract }) => invalidate(contract),
  });
}

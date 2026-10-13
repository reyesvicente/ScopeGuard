import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import { api, toQuery, type Paginated } from "../../lib/api";
import type { Contract, ContractInput } from "./types";

export const contractKeys = {
  all: ["contracts"] as const,
  list: (search: string) => ["contracts", "list", search] as const,
  detail: (slug: string) => ["contracts", "detail", slug] as const,
};

export function useContracts(search = "") {
  return useQuery({
    queryKey: contractKeys.list(search),
    queryFn: () => api<Paginated<Contract>>(`/contracts/${toQuery({ search, page_size: 100 })}`),
  });
}

export function useContract(slug: string) {
  return useQuery({
    queryKey: contractKeys.detail(slug),
    queryFn: () => api<Contract>(`/contracts/${slug}/`),
  });
}

export function useCreateContract() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: ContractInput) =>
      api<Contract>("/contracts/", { method: "POST", body: input }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: contractKeys.all }),
  });
}

export function useDeleteContract() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (slug: string) => api<void>(`/contracts/${slug}/`, { method: "DELETE" }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: contractKeys.all }),
  });
}

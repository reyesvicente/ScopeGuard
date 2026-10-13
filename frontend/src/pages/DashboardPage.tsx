import { Alert, Button, EmptyState, Input, SkeletonCard, Stat, StatGrid } from "ice-ds";
import { useState } from "react";
import { useNavigate } from "react-router";

import { useContracts } from "../features/contracts/api";
import { ContractCard } from "../features/contracts/components/ContractCard";
import type { Contract } from "../features/contracts/types";
import { formatMoney } from "../lib/format";

function flaggedByCurrency(contracts: Contract[]): string {
  const totals = new Map<string, number>();
  for (const contract of contracts) {
    if (contract.flagged_value === null) continue;
    totals.set(contract.currency, (totals.get(contract.currency) ?? 0) + Number(contract.flagged_value));
  }
  if (totals.size === 0) return formatMoney("0", "USD");
  return [...totals].map(([currency, value]) => formatMoney(String(value), currency)).join(" + ");
}

export default function DashboardPage() {
  const navigate = useNavigate();
  const [search, setSearch] = useState("");
  const { data, error, isPending } = useContracts(search);
  const contracts = data?.results ?? [];
  const checked = contracts.reduce((sum, contract) => sum + contract.check_count, 0);
  const outOfScope = contracts.reduce((sum, contract) => sum + contract.out_of_scope_count, 0);

  return (
    <div className="flex flex-col gap-8">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <h1 className="font-display text-4xl font-bold">Your contracts</h1>
        <Button onClick={() => navigate("/contracts/new")}>+ New contract</Button>
      </div>

      <StatGrid>
        <Stat label="Requests checked" value={checked} accent="blue" />
        <Stat label="Out of scope" value={outOfScope} accent="pink" />
        <Stat
          label="Scope creep caught"
          value={flaggedByCurrency(contracts)}
          accent="green"
          description="Billable work you'd otherwise have done for free"
        />
      </StatGrid>

      <Input
        type="search"
        placeholder="Search clients or projects…"
        value={search}
        onChange={(event) => setSearch(event.target.value)}
        aria-label="Search contracts"
      />

      {error && (
        <Alert intent="error" title="Couldn't load contracts">
          {error.message}
        </Alert>
      )}

      {isPending ? (
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          <SkeletonCard />
          <SkeletonCard />
          <SkeletonCard />
        </div>
      ) : contracts.length === 0 ? (
        <EmptyState
          title={search ? "No matching contracts" : "No contracts yet"}
          description="Add a client's statement of work, then paste their requests to see what's billable."
          action={<Button onClick={() => navigate("/contracts/new")}>Add your first contract</Button>}
        />
      ) : (
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {contracts.map((contract) => (
            <ContractCard key={contract.slug} contract={contract} />
          ))}
        </div>
      )}
    </div>
  );
}

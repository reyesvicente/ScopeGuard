import {
  Alert,
  Button,
  Card,
  CardEyebrow,
  CardTitle,
  EmptyState,
  SkeletonCard,
  Stat,
  StatGrid,
  Tabs,
  TabsList,
  TabsTrigger,
} from "ice-ds";
import { useNavigate, useParams } from "react-router";

import { useScopeChecks } from "../features/checks/api";
import { CheckCard } from "../features/checks/components/CheckCard";
import { CheckForm } from "../features/checks/components/CheckForm";
import { useCheckFilter, type VerdictFilter } from "../features/checks/store";
import { useContract, useDeleteContract } from "../features/contracts/api";
import { formatMoney } from "../lib/format";

const FILTERS: { value: VerdictFilter; label: string }[] = [
  { value: "all", label: "All" },
  { value: "out_of_scope", label: "Out of scope" },
  { value: "ambiguous", label: "Ambiguous" },
  { value: "in_scope", label: "In scope" },
  { value: "failed", label: "Failed" },
];

export default function ContractPage() {
  const { slug = "" } = useParams();
  const navigate = useNavigate();
  const { verdict, setVerdict } = useCheckFilter();
  const contract = useContract(slug);
  const checks = useScopeChecks(slug, verdict);
  const deleteContract = useDeleteContract();

  if (contract.isPending) return <SkeletonCard />;
  if (contract.error || !contract.data) {
    return (
      <Alert intent="error" title="Contract not found">
        {contract.error?.message}
      </Alert>
    );
  }

  const data = contract.data;
  const onDelete = () => {
    if (!window.confirm(`Delete "${data.title}" and all its checks?`)) return;
    deleteContract.mutate(data.slug, { onSuccess: () => navigate("/") });
  };

  return (
    <div className="flex flex-col gap-8">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="font-mono text-sm uppercase">{data.client_name}</p>
          <h1 className="font-display text-4xl font-bold">{data.title}</h1>
        </div>
        <Button variant="destructive" size="sm" loading={deleteContract.isPending} onClick={onDelete}>
          Delete contract
        </Button>
      </div>

      <StatGrid>
        <Stat label="Requests checked" value={data.check_count} accent="blue" />
        <Stat label="Out of scope" value={data.out_of_scope_count} accent="pink" />
        <Stat
          label="Scope creep caught"
          value={formatMoney(data.flagged_value ?? "0", data.currency)}
          accent="green"
          description={`${data.flagged_hours ?? 0} h at ${formatMoney(data.hourly_rate, data.currency)}/h`}
        />
      </StatGrid>

      <div className="grid gap-8 lg:grid-cols-[minmax(0,2fr)_minmax(0,3fr)]">
        <aside className="lg:sticky lg:top-24 lg:self-start">
          <Card className="flex max-h-[75vh] flex-col gap-3 p-5">
            <CardEyebrow>Statement of work</CardEyebrow>
            <CardTitle>What you agreed to</CardTitle>
            <pre className="overflow-auto font-mono text-sm whitespace-pre-wrap">{data.sow_text}</pre>
          </Card>
        </aside>

        <section className="flex flex-col gap-6">
          <CheckForm contract={data.slug} />

          <Tabs value={verdict} onValueChange={(value) => setVerdict(value as VerdictFilter)}>
            <TabsList variant="boxed">
              {FILTERS.map((filter) => (
                <TabsTrigger key={filter.value} value={filter.value} variant="boxed">
                  {filter.label}
                </TabsTrigger>
              ))}
            </TabsList>
          </Tabs>

          {checks.isPending ? (
            <SkeletonCard />
          ) : checks.error ? (
            <Alert intent="error" title="Couldn't load checks">
              {checks.error.message}
            </Alert>
          ) : checks.data.results.length === 0 ? (
            <EmptyState
              size="sm"
              title="Nothing here yet"
              description="Paste a client request above to check it against the SOW."
            />
          ) : (
            checks.data.results.map((check) => (
              <CheckCard key={check.id} check={check} currency={data.currency} />
            ))
          )}
        </section>
      </div>
    </div>
  );
}

import { Badge, type BadgeProps } from "ice-ds";

import type { Verdict } from "../types";

const VERDICT_STYLE: Record<Verdict, { label: string; variant: BadgeProps["variant"] }> = {
  in_scope: { label: "In scope", variant: "success" },
  out_of_scope: { label: "Out of scope", variant: "error" },
  ambiguous: { label: "Ambiguous", variant: "warning" },
  pending: { label: "Pending", variant: "default" },
  failed: { label: "Failed", variant: "error" },
};

export function verdictLabel(verdict: Verdict): string {
  return VERDICT_STYLE[verdict].label;
}

export function VerdictBadge({ verdict }: { verdict: Verdict }) {
  const { label, variant } = VERDICT_STYLE[verdict];
  return <Badge variant={variant}>{label}</Badge>;
}

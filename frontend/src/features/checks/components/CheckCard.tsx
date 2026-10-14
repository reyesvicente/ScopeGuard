import { Alert, Badge, Button, Card } from "ice-ds";

import { CopyButton } from "../../../components/CopyButton";
import { formatDate, formatMoney } from "../../../lib/format";
import { useDeleteScopeCheck, useRerunScopeCheck } from "../api";
import { SOURCE_LABELS, type ScopeCheck } from "../types";
import { VerdictBadge } from "./VerdictBadge";

interface CheckCardProps {
  check: ScopeCheck;
  currency: string;
}

export function CheckCard({ check, currency }: CheckCardProps) {
  const rerun = useRerunScopeCheck();
  const remove = useDeleteScopeCheck();
  const failed = check.verdict === "failed";

  return (
    <Card className="flex flex-col gap-4 p-5">
      <header className="flex flex-wrap items-center gap-2">
        <VerdictBadge verdict={check.verdict} />
        {check.confidence !== null && (
          <span className="font-mono text-xs">{Math.round(check.confidence * 100)}% confident</span>
        )}
        <span className="ml-auto font-mono text-xs">
          {SOURCE_LABELS[check.source]} · {formatDate(check.created)}
        </span>
      </header>

      <blockquote className="border-l-4 border-neo-black bg-white px-4 py-3 whitespace-pre-wrap">
        {check.request_text}
      </blockquote>

      {failed ? (
        <Alert intent="error" title="The model couldn't finish this check">
          {check.error}
        </Alert>
      ) : (
        <>
          {check.reasoning && <p>{check.reasoning}</p>}

          {check.cited_clause && (
            <div className="flex flex-col gap-2">
              <div className="flex items-center gap-2">
                <span className="font-display text-sm font-bold uppercase">SOW says</span>
                {check.clause_verified ? (
                  <Badge variant="success">Quote verified</Badge>
                ) : (
                  <Badge variant="warning">Not found in SOW — double-check</Badge>
                )}
              </div>
              <p className="bg-neo-yellow/40 px-3 py-2 font-mono text-sm">“{check.cited_clause}”</p>
            </div>
          )}

          {check.verdict === "out_of_scope" && (
            <div className="flex flex-wrap gap-6 border-2 border-neo-black bg-neo-pink/30 px-4 py-3">
              <div>
                <p className="font-display text-xs font-bold uppercase">Extra work</p>
                <p className="font-display text-2xl font-bold">{check.estimated_hours ?? "?"} h</p>
              </div>
              <div>
                <p className="font-display text-xs font-bold uppercase">Change order</p>
                <p className="font-display text-2xl font-bold">
                  {formatMoney(check.estimated_cost, currency)}
                </p>
              </div>
            </div>
          )}

          {check.draft_reply && (
            <div className="flex flex-col gap-2">
              <div className="flex items-center justify-between">
                <span className="font-display text-sm font-bold uppercase">Draft reply</span>
                <CopyButton text={check.draft_reply} />
              </div>
              <p className="border-2 border-dashed border-neo-black px-4 py-3 whitespace-pre-wrap">
                {check.draft_reply}
              </p>
            </div>
          )}
        </>
      )}

      <footer className="flex flex-wrap items-center gap-3 border-t-2 border-neo-black pt-3">
        {check.model_name && (
          <span className="font-mono text-xs">
            {check.model_name}
            {check.latency_ms !== null && ` · ${(check.latency_ms / 1000).toFixed(1)}s`}
            {check.prompt_tokens !== null &&
              ` · ${check.prompt_tokens}+${check.completion_tokens ?? 0} tokens`}
          </span>
        )}
        <div className="ml-auto flex gap-2">
          <Button
            size="sm"
            variant="ghost"
            loading={rerun.isPending}
            onClick={() => rerun.mutate(check.id)}
          >
            Re-run
          </Button>
          <Button
            size="sm"
            variant="destructive"
            loading={remove.isPending}
            onClick={() => remove.mutate({ id: check.id, contract: check.contract })}
          >
            Delete
          </Button>
        </div>
      </footer>
    </Card>
  );
}

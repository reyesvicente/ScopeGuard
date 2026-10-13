export const VERDICTS = ["in_scope", "out_of_scope", "ambiguous", "pending", "failed"] as const;
export type Verdict = (typeof VERDICTS)[number];

export const SOURCES = ["email", "slack", "ticket", "call_notes", "other"] as const;
export type Source = (typeof SOURCES)[number];

export const SOURCE_LABELS: Record<Source, string> = {
  email: "Email",
  slack: "Slack",
  ticket: "Ticket",
  call_notes: "Call notes",
  other: "Other",
};

export interface ScopeCheck {
  id: number;
  contract: string;
  source: Source;
  request_text: string;
  verdict: Verdict;
  confidence: number | null;
  reasoning: string;
  cited_clause: string;
  clause_verified: boolean;
  estimated_hours: string | null;
  estimated_cost: string | null;
  draft_reply: string;
  model_name: string;
  latency_ms: number | null;
  prompt_tokens: number | null;
  completion_tokens: number | null;
  error: string;
  created: string;
}

export interface ScopeCheckInput {
  contract: string;
  source: Source;
  request_text: string;
}

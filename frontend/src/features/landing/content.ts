export const STEPS = [
  {
    title: "Save the SOW",
    body: "Paste your statement of work or import it from PDF, Word, TXT or Markdown. Add your hourly rate.",
  },
  {
    title: "Paste the request",
    body: "Drop in what the client sent: an email, a Slack message, a ticket, or your call notes.",
  },
  {
    title: "Get a verdict",
    body: "In scope, out of scope, or ambiguous, with the exact SOW clause it's based on.",
  },
  {
    title: "Send the change order",
    body: "Out-of-scope work comes with an hours estimate, a price at your rate, and a reply ready to send.",
  },
] as const;

export const GUARDRAILS = [
  {
    title: "Quotes are checked",
    body: "Every cited clause is matched against your SOW. If the model quotes something that isn't there, you'll see a warning instead of a confident answer.",
  },
  {
    title: "Code does the math",
    body: "The model estimates hours. ScopeGuard multiplies by your rate, so the price on a change order is never a guess.",
  },
  {
    title: "Open-weight model",
    body: "Checks run on an open-weight model through a hosted API. Your contracts and client messages are never used for training.",
  },
  {
    title: "Fails loudly",
    body: "Timeouts and bad output are saved as failed checks with a readable error and a re-run button, never as a silent wrong verdict.",
  },
] as const;

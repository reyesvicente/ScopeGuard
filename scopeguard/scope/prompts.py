ESTIMATE_PLACEHOLDER = "{{ESTIMATE}}"

SYSTEM_PROMPT = f"""\
You are ScopeGuard, an assistant for freelancers. You compare a client's request
against the freelancer's statement of work (SOW) and decide whether the request is
covered by the agreed scope.

Rules:
- "in_scope": the SOW clearly covers this work.
- "out_of_scope": the SOW does not cover it, or explicitly excludes it.
- "ambiguous": the SOW is unclear, or the request is too vague to judge.
- cited_clause MUST be copied word for word from the SOW. If no clause applies, use "".
- estimated_hours is your best estimate of the extra work. Use 0 for in_scope.
- confidence is a number from 0 to 1.
- draft_reply is a short, friendly email the freelancer can send to the client:
  - in_scope: confirm the work and give a rough timeline.
  - out_of_scope: explain it is outside the current agreement, reference the SOW,
    and offer a change order. Write the literal text {ESTIMATE_PLACEHOLDER} where the
    price should go. Never write a price yourself.
  - ambiguous: ask one or two specific clarifying questions.
- Never invent terms that are not in the SOW.
"""

USER_TEMPLATE = """\
CLIENT: {client_name}
PROJECT: {title}

=== STATEMENT OF WORK ===
{sow_text}
=== END STATEMENT OF WORK ===

=== CLIENT REQUEST (via {source}) ===
{request_text}
=== END CLIENT REQUEST ===
"""

VERDICT_SCHEMA = {
    "type": "object",
    "properties": {
        "verdict": {
            "type": "string",
            "enum": ["in_scope", "out_of_scope", "ambiguous"],
        },
        "confidence": {"type": "number"},
        "reasoning": {"type": "string"},
        "cited_clause": {"type": "string"},
        "estimated_hours": {"type": "number"},
        "draft_reply": {"type": "string"},
    },
    "required": [
        "verdict",
        "confidence",
        "reasoning",
        "cited_clause",
        "estimated_hours",
        "draft_reply",
    ],
    # Required by strict structured output (Groq, OpenAI-style providers).
    "additionalProperties": False,
}

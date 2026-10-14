---
title: "ScopeGuard: an open-weight model that tells freelancers when \"quick one\" means \"paid one\""
published: false
tags: devchallenge, hf26challenge, opensource, ai
---

*This is a submission for the [Hacktoberfest Open-Source AI Challenge Week 2: Side Hustle](https://dev.to/challenges/hacktoberfest-week2-2026-10-12)*

## What I Built

Every freelancer knows this message:

> "Hey! Quick one: could you also add a shop page so we can sell merch? Shouldn't take long 🙏"

Is a shop page in the contract? You'd have to dig out the statement of work (SOW), find the clause, work out how many hours it is, and then write a reply that says no without souring a client you like. Most of us skip that, say "sure", and do the work for free. Do that a few times a month and it adds up to real money. That's **scope creep**.

**ScopeGuard** is a small web app that does the awkward part for you:

1. You save a client's SOW and your hourly rate.
2. You paste in a client request from email, Slack, a ticket, or your call notes.
3. An open-weight model (**gpt-oss-120b** by default, served through **Hugging Face Inference Providers**) gives you:
   - a verdict: **in scope**, **out of scope**, or **ambiguous**
   - the **exact SOW clause** it based that on
   - an **estimate of the extra hours**
   - a **draft reply** ready to send: a short confirmation if the work is covered, a polite change-order offer with a price if it isn't, or clarifying questions if the SOW is unclear

A dashboard adds up the **scope creep caught** across all your contracts. In other words, the billable work you would otherwise have done for free.

**Who pays for it?** Solo freelancers and small agencies on fixed-scope projects or retainers: developers, designers, copywriters, video editors. If ScopeGuard catches even one out-of-scope request a year, a $9/month subscription has paid for itself. And because an open-weight model on a shared inference provider costs a fraction of a cent per check, a $9 price leaves plenty of margin (more on that below).

## Demo

> **Live link:**  `https://scopeguard.icvn.tech`

The flow in the demo:

- **Contract page.** The SOW stays pinned on the left ("What you agreed to"). On the right are the request form and a feed of checked requests that you can filter by verdict.
- **Each result card** shows the verdict badge and the model's confidence. It also shows the quoted clause with a **"Quote verified"** or **"Not found in SOW, double-check"** badge, the hours and the change-order price, and the draft reply with a copy button. A footer lists the model, the latency, and the token counts.

> **TODO:** screenshots of the dashboard and of an out-of-scope result card.

## Code

{% embed https://github.com/reyesvicente/ScopeGuard %}

MIT-licensed. Django 6 + Django REST Framework on the backend, React 18 + Vite on the frontend, and an open-weight model behind an OpenAI-compatible API for inference.

## How I Built It

### The stack

| Layer | Choice |
| --- | --- |
| Model | **gpt-oss-120b** (open weights, Apache 2.0) by default; any open model is one setting away |
| Inference | **Hugging Face Inference Providers**, via the OpenAI-compatible `/chat/completions` API |
| Backend | Django + DRF, built from cookiecutter-django, PostgreSQL |
| Frontend | React 18 + Vite + TypeScript, TanStack Query, Zustand, React Hook Form + Zod, my own `ice-ds` neubrutalist component library |
| Hosting | Render: one web service, Postgres, and Key Value |

### Why it isn't self-hosted (anymore)

The first version ran Gemma through Ollama as a container next to Django. That works well on a laptop. Then I priced hosting it: CPU-only inference for a small model with a context window big enough for a real SOW needed Render's Pro Plus plan, about **$175 a month**, before a single user signed up. For a $9 side hustle, that's backwards.

So inference moved to a hosted provider that serves open weights. The model is still open, but now someone else's GPUs are shared across thousands of apps, and I pay per token. Hosting ScopeGuard now costs about what any small Django app costs.

The client didn't need an SDK either way. Django talks to the API over plain HTTP with only the Python standard library, and the whole provider choice is three env vars:

```bash
LLM_BASE_URL=https://router.huggingface.co/v1
LLM_MODEL=openai/gpt-oss-120b
LLM_API_KEY=hf_...
```

Point those at Groq, Together, or OpenRouter, or at vLLM or Ollama on your own hardware, and nothing else changes.

### Making a model reliable enough to send to a client

A model's reply ends up in an email to a paying client, so most of the engineering went into **not trusting it more than necessary**. Four decisions did most of the work.

**1. Constrained JSON, not "please respond in JSON".** The request sends a JSON Schema in `response_format`, and providers that support structured output constrain decoding to match it. The model *cannot* return a verdict outside the enum:

```python
VERDICT_SCHEMA = {
    "type": "object",
    "properties": {
        "verdict": {"type": "string", "enum": ["in_scope", "out_of_scope", "ambiguous"]},
        "confidence": {"type": "number"},
        "reasoning": {"type": "string"},
        "cited_clause": {"type": "string"},
        "estimated_hours": {"type": "number"},
        "draft_reply": {"type": "string"},
    },
    "required": ["verdict", "confidence", "reasoning",
                 "cited_clause", "estimated_hours", "draft_reply"],
}
```

The service still validates every field afterwards. Confidence is clamped to 0–1, hours are clamped and rounded, and any unknown verdict marks the check `failed` rather than storing garbage.

**2. Never let the model do the math.** Language models are bad at arithmetic, and a wrong number on a change order damages your credibility with the client. So the prompt tells the model to write the literal token `{{ESTIMATE}}` wherever the price belongs, and Python fills it in:

```python
def fill_estimate(reply: str, *, hours: Decimal | None, contract: Contract) -> str:
    """Prices are computed here, never by the model, so the math is always right."""
    if ESTIMATE_PLACEHOLDER not in reply:
        return reply
    cost = estimate_cost(hours=hours, contract=contract)
    if hours is None or cost is None or not cost:
        text = "a quote to follow"
    else:
        rate = f"{contract.hourly_rate:,.2f}/hr"
        text = f"{contract.currency} {cost:,.2f} ({hours.normalize():f} hours at {rate})"
    return reply.replace(ESTIMATE_PLACEHOLDER, text)
```

The model does the judgment ("about 12 hours of work"). Code does the arithmetic ("USD 960.00").

**3. Check the model's quotes.** The quoted clause is what makes a reply convincing ("per section 3, e-commerce isn't included"). It's also the part a model is most likely to make up. So every `cited_clause` is checked against the real SOW, ignoring whitespace and case:

```python
def clause_in_sow(clause: str, sow_text: str) -> bool:
    """Guard against hallucinated citations: the quote must exist in the SOW."""
    if not clause:
        return False
    return _normalize(clause.strip("\"'“”")) in _normalize(sow_text)
```

If the quote isn't found, the UI says so in a yellow badge instead of quietly showing an invented contract term.

**4. Fail loudly, not with a 500.** If the API is down, rejects the key, times out, or returns broken output, the check is saved with `verdict = failed` and a readable error, and the card offers a **Re-run** button:

```text
failed | Model API returned 401: {"error": "Invalid credentials in Authorization header"}
```

### The gotcha: "OpenAI-compatible" isn't one standard

Every provider says "OpenAI-compatible", and they all accept the same request. They don't all honor it the same way. Some enforce the JSON Schema strictly. Some treat it as a hint. A few wrap a perfectly valid JSON object in a markdown fence anyway:

````text
```json
{"verdict": "out_of_scope", ...}
```
````

That's valid output to a human and a `JSONDecodeError` to `json.loads`. So the client strips a surrounding fence before parsing, and checks that the result is actually an object. Anything else still fails loudly as point 4 describes:

```python
_CODE_FENCE = re.compile(r"^```(?:json)?\s*|\s*```$")

content = json.loads(_CODE_FENCE.sub("", raw.strip()))
if not isinstance(content, dict):
    raise LLMError("Model returned JSON that is not an object.")
```

If you build on "OpenAI-compatible" APIs so you can switch providers, test the parsing against each provider you plan to use, not just the first one.

### Tests

The scope app has 21 tests: the model client (request shape, auth header, fenced JSON, non-JSON output, missing key, HTTP errors), services (slug uniqueness, verdict storage, price filling, quote verification, unknown verdicts, API failures), and the API (auth, per-user privacy, pagination, filtering, re-runs). The network is mocked, so the tests run in seconds in CI with no API key. Ruff and mypy are clean.

## Why Does Open Innovation Matter?

Moving off self-hosting changed *where* the model runs. It didn't change why it's an open model.

**1. No lock-in on the most important part.** The model and the provider are three env vars. If a provider raises prices, rate-limits me, or shuts down, I move to another one that serves the same weights, and the verdicts don't change underneath my users. With a closed model, there is one vendor, and when it deprecates a model version, your product's behavior changes on their schedule.

**2. Privacy has an exit.** A freelancer's SOWs and client messages are often under NDA. Today the default is a shared provider, which is the right trade for a $9 product. But because the weights are open, a freelancer or agency that can't send contracts to a third party can run the same model on their own hardware with vLLM or Ollama, point `LLM_BASE_URL` at it, and get the same app. A closed API can only promise not to train on your data.

**3. Competition keeps the pricing honest.** Every check sends the *entire SOW* as context, so the heaviest users (long contracts, chatty clients) cost the most to serve. Open weights mean many providers serve the same model and compete on price per token. That keeps a check at a fraction of a cent, and the `30/hour` per-user throttle caps the worst case.

**4. Room to specialize.** "Is this billable?" is a niche judgment that general-purpose models handle with generic caution. Every check a user re-runs or overrides is a labeled example. Open weights mean those examples can eventually fine-tune a model that's *better at this one task* than a much bigger general model. You can't do that with a closed model.

The honest trade-off: hosted inference means contracts leave your server by default. ScopeGuard is upfront about that, and the open model is what makes "run it yourself" a real option instead of a promise.

## Prize Categories

- **Best Use of a .tech Domain**: It's live on `scopeguard.icvn.tech`.
- **Best Use of Render**: The demo is deployed on Render.

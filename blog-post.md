---
title: "ScopeGuard: a local Gemma that tells freelancers when \"quick one\" means \"paid one\""
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
3. An open-weight **Gemma 4** model, running on your own machine through **Ollama**, gives you:
   - a verdict: **in scope**, **out of scope**, or **ambiguous**
   - the **exact SOW clause** it based that on
   - an **estimate of the extra hours**
   - a **draft reply** ready to send: a short confirmation if the work is covered, a polite change-order offer with a price if it isn't, or clarifying questions if the SOW is unclear

A dashboard adds up the **scope creep caught** across all your contracts. In other words, the billable work you would otherwise have done for free.

**Who pays for it?** Solo freelancers and small agencies on fixed-scope projects or retainers: developers, designers, copywriters, video editors. If ScopeGuard catches even one out-of-scope request a year, a $9/month subscription has paid for itself. And because inference runs locally, each check costs me nothing. That's what makes a $9 price workable (more on that below).

## Demo

> **Live link:**  `https://scopeguard.icvn.tech`

The flow in the demo:

- **Contract page.** The SOW stays pinned on the left ("What you agreed to"). On the right are the request form and a feed of checked requests that you can filter by verdict.
- **Each result card** shows the verdict badge and the model's confidence. It also shows the quoted clause with a **"Quote verified"** or **"Not found in SOW, double-check"** badge, the hours and the change-order price, and the draft reply with a copy button. A footer lists the model, the latency, the token counts, and **$0.00**.

> **TODO:** screenshots of the dashboard and of an out-of-scope result card.

## Code

{% embed https://github.com/reyesvicente/ScopeGuard %}

MIT-licensed. Django 6 + Django REST Framework on the backend, React 18 + Vite on the frontend, and Ollama running Gemma 4 for inference. The whole stack, model server included, comes up with one `docker compose up`.

## How I Built It

### The stack

| Layer | Choice |
| --- | --- |
| Model | **Gemma 4** (`gemma4:e4b` by default, `gemma4:e2b` for low-RAM laptops) |
| Inference | **Ollama**, running as a service in the Docker Compose stack |
| Backend | Django + DRF, built from cookiecutter-django, PostgreSQL |
| Frontend | React 18 + Vite + TypeScript, TanStack Query, Zustand, React Hook Form + Zod, my own `ice-ds` neubrutalist component library |

The model is a container next to Postgres and Django:

```yaml
ollama:
  image: docker.io/ollama/ollama:latest
  volumes:
    - scopeguard_local_ollama_models:/root/.ollama
  ports:
    - "11434:11434"
```

Django talks to it over plain HTTP, and the client uses only the Python standard library. No SDK, and no API key, because nothing leaves the box.

### Making a small model reliable

A 4B-class model on a laptop isn't a frontier model. Most of the engineering went into **not trusting it more than necessary**. Four decisions did most of the work.

**1. Constrained JSON, not "please respond in JSON".** Ollama accepts a JSON Schema in the `format` field and constrains decoding to match it. The model *cannot* return a verdict outside the enum:

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

**2. Never let the model do the math.** Small models are bad at arithmetic, and a wrong number on a change order damages your credibility with the client. So the prompt tells Gemma to write the literal token `{{ESTIMATE}}` wherever the price belongs, and Python fills it in:

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

**4. Fail loudly, not with a 500.** If Ollama is down, slow, or returns broken output, the check is saved with `verdict = failed` and a readable error, and the card offers a **Re-run** button. I confirmed this against the real stack before the model was even pulled:

```text
failed | Could not reach model server at http://ollama:11434: <urlopen error ...>
```

### The gotcha that would have quietly ruined everything

Ollama's **default context window is small**, a few thousand tokens. A real SOW plus a long email thread is bigger than that, and Ollama doesn't raise an error when the input is too long. It **silently truncates**. The model then confidently judges scope against half a contract. One option fixes it:

```python
"options": {
    "temperature": 0,
    # Ollama's default context window is far too small for a full SOW.
    "num_ctx": settings.OLLAMA_NUM_CTX,  # 16384 by default
},
```

If you build anything document-shaped on Ollama, check `num_ctx` first.

### Tests

The scope app has 16 tests: services (slug uniqueness, verdict storage, price filling, quote verification, unknown verdicts, server-down handling) and the API (auth, per-user privacy, pagination, filtering, re-runs). The model call is mocked, so the tests run in seconds in CI with no GPU. Ruff and mypy are clean.

## Why Does Open Innovation Matter?

For this product, open weights are what make it workable, not just a nice extra.

**1. Privacy is the product.** A freelancer's SOWs and client messages are often under NDA. Pasting them into a third-party AI API means asking the client, explaining it, or quietly breaking the agreement. With Gemma running in a container on the freelancer's own machine or server, the honest answer to "where does my contract go?" is *nowhere*. A closed API can promise not to train on your data. An open model running locally means the data never leaves your machine in the first place.

**2. Each check costs nothing, so the pricing works.** Every check sends the *entire SOW* as context. With per-token pricing, the heaviest users (freelancers with long contracts and chatty clients) would cost the most to serve and eat a $9/month margin. With local inference, a check costs electricity. That's why every result card shows **$0.00**: it's the business model, not a gimmick.

**3. No lock-in on the most important part.** The model is one setting (`OLLAMA_MODEL`). I can switch between `gemma4:e2b` on an 8 GB laptop, `e4b` on a better machine, and a 12B model on a GPU server without changing a line of code, and no provider can reprice, deprecate, or rate-limit it out from under me.

**4. Room to specialize.** "Is this billable?" is a niche judgment that general-purpose APIs handle with generic caution. Every check a user re-runs or overrides is a labeled example. Open weights mean those examples can eventually fine-tune a small model that's *better at this one task* than a much bigger general model. You can't do that with a closed model.

The honest trade-off: a small local model is slower and less capable than a frontier API. ScopeGuard works because the design accounts for that with constrained output, code doing the math, and verified quotes. The open model doesn't have to be perfect, because the app catches its mistakes.

## Prize Categories

- **Best Use of Gemma.** Gemma 4 is the core of the product: every verdict, citation, estimate, and draft reply comes from a locally run Gemma model.
- **Best Use of a .tech Domain**: It's live on `scopeguard.icvn.tech`.
- **Best Use of Render**: The demo is deployed on Render


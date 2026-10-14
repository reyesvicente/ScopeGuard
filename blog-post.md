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

1. You save a client's SOW and your hourly rate. Paste it in, or import the PDF or Word file the client signed.
2. You paste in a client request from email, Slack, a ticket, or your call notes.
3. An open-weight model (**gpt-oss-120b** by default, served through **Groq**) gives you:
   - a verdict: **in scope**, **out of scope**, or **ambiguous**
   - the **exact SOW clause** it based that on
   - an **estimate of the extra hours**
   - a **draft reply** ready to send: a short confirmation if the work is covered, a polite change-order offer with a price if it isn't, or clarifying questions if the SOW is unclear

A dashboard adds up the **scope creep caught** across all your contracts. In other words, the billable work you would otherwise have done for free.

**Who pays for it?** Solo freelancers and small agencies on fixed-scope projects or retainers: developers, designers, copywriters, video editors. If ScopeGuard catches even one out-of-scope request a year, a $9/month subscription would pay for itself. And because a check on a shared open-weight model costs about a twentieth of a cent (numbers below), a $9 price leaves plenty of margin.

## Demo

> **Live link:**  `https://scopeguard.icvn.tech`

The flow in the demo:

- **New contract.** Fill in the client and your rate, then paste the SOW or click **Import from file** to pull the text out of a PDF or `.docx`. You review the text before saving.
- **Contract page.** The SOW stays pinned on the left ("What you agreed to"). On the right are the request form and a feed of checked requests that you can filter by verdict.
- **Each result card** shows the verdict badge and the model's confidence. It also shows the quoted clause with a **"Quote verified"** or **"Not found in SOW — double-check"** badge, the hours and the change-order price, and the draft reply with a copy button. A footer lists the model, the latency, and the token counts.

Screenshots:

![Scope Guard Dashboard](https://dev-to-uploads.s3.us-east-2.amazonaws.com/uploads/articles/lydbtzjorsxpl5yt3p9b.png)

![Image description](https://dev-to-uploads.s3.us-east-2.amazonaws.com/uploads/articles/tn4koxow31ipdlpbgeju.png)


![Image description](https://dev-to-uploads.s3.us-east-2.amazonaws.com/uploads/articles/3uwrjaem8tuqveq36kne.png)


![Image description](https://dev-to-uploads.s3.us-east-2.amazonaws.com/uploads/articles/4e6hzubpqfxozdmsj86s.png)

## Code

{% embed https://github.com/reyesvicente/ScopeGuard %}

MIT-licensed. Django 6 + Django REST Framework on the backend, React 18 + Vite on the frontend, and an open-weight model behind an OpenAI-compatible API for inference.

## How I Built It

### The stack

| Layer | Choice |
| --- | --- |
| Model | **gpt-oss-120b** (open weights, Apache 2.0) by default; any open model is one setting away |
| Inference | **Groq**, via the OpenAI-compatible `/chat/completions` API |
| Backend | Django + DRF, built from cookiecutter-django, PostgreSQL; `pypdf` and `python-docx` for contract import |
| Frontend | React 18 + Vite + TypeScript, TanStack Query, Zustand, React Hook Form + Zod, my own `ice-ds` neubrutalist component library |
| Hosting | **Vercel** for the frontend (`scopeguard.icvn.tech`), **Render** for the API, Postgres, and Key Value (`api.scopeguard.icvn.tech`) |

### Why it isn't self-hosted (anymore)

The first version ran Gemma through Ollama as a container next to Django. That works well on a laptop. Then I priced hosting it: CPU-only inference for a small model with a context window big enough for a real SOW needed Render's Pro Plus plan, about **$175 a month**, before a single user signed up. For a $9 side hustle, that's backwards.

So inference moved to a hosted provider that serves open weights. The model is still open, but now someone else's GPUs are shared across thousands of apps, and I pay per token. Hosting ScopeGuard now costs about what any small Django app costs.

The client didn't need an SDK either way. Django talks to the API over plain HTTP with only the Python standard library, and the whole provider choice is three env vars:

```bash
LLM_BASE_URL=https://api.groq.com/openai/v1
LLM_MODEL=openai/gpt-oss-120b
LLM_API_KEY=gsk_...
```

I've pointed it at Hugging Face Inference Providers and at Groq. Together, OpenRouter, and vLLM or Ollama on your own hardware speak the same API, so they should take the same three variables, but I haven't tested them.

The switch between providers happened sooner than I planned. ScopeGuard started on Hugging Face, and partway through testing a check came back with this:

```text
Model API returned 402: {"error":"You have no remaining credits. Purchase pre-paid credits to continue using Inference Providers. ..."}
```

The free monthly credit was gone. With a closed model, that's where the afternoon ends: pay up or rewrite the integration. Here, the same `gpt-oss-120b` weights are also served by Groq, so I changed the base URL and the key. It wasn't *quite* zero code: Groq rejected the first requests for two reasons (see the first gotcha below), and each was a one-line fix. Then the demo contract's requests came back right:

| Client request | Verdict | Confidence | Cited clause | Time |
| --- | --- | --- | --- | --- |
| "Could you also add a shop page so we can sell bags of our beans and some merch online?" | out of scope | 0.98 | 5.1, quote verified | 1.6 s |
| "Can we make sure cafés can book a tasting slot straight from the site? We already use Calendly for that." | in scope | 0.98 | 2.3, quote verified | 2.2 s |

Each check used about 1,050–1,070 prompt tokens and 430–490 completion tokens. At Groq's listed price for this model (around $0.15 per million input tokens and $0.60–0.75 per million output), that's roughly $0.0005 a check.

### Importing the contract instead of pasting it

Nobody keeps their SOW as plain text. It's the PDF the client signed or a Word doc with the scope in a table. So the contract form has an **Import from file** button that accepts PDF, `.docx`, TXT, and Markdown up to 10 MB.

The API reads the file, returns the text, and **throws the file away**. Only the text you review and save is kept. For documents that are often under NDA, not keeping a copy is the simplest privacy feature there is.

Two details mattered more than I expected:

- **Word tables.** SOWs love tables ("Deliverable | Included? | Notes"). Reading only paragraphs silently drops them, so the extractor walks paragraphs *and* tables in document order.
- **Scanned PDFs.** A scanned contract is just images, so there's no text to extract. Instead of saving an empty SOW, the import says so: *"No text found in this file. Scanned PDFs aren't supported yet, so paste the text instead."* Password-protected and damaged files get their own messages too.

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
    "additionalProperties": False,
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

If the quote isn't found, the UI says so with a warning badge instead of quietly showing an invented contract term. Ignoring whitespace also matters for imported contracts, because PDF text comes out with line breaks wherever the page wrapped.

**4. Fail loudly, not with a 500.** If the API is down, rejects the key, runs out of credits, times out, or returns broken output, the check is saved with `verdict = failed` and a readable error, and the card offers a **Re-run** button. That's exactly how the 402 above showed up: as a red card with the provider's message, not a crash.

### Gotcha 1: "OpenAI-compatible" isn't one standard

Every provider says "OpenAI-compatible". My first two requests to Groq still failed, and neither failure was about the model.

**First, a 403 with nothing but `error code: 1010`.** That isn't Groq; it's Cloudflare in front of Groq, and 1010 means "your client's signature is blocked". My stdlib client sent urllib's default `User-Agent: Python-urllib/3.14`, which Cloudflare treats as a bot. The fix is one header:

```python
USER_AGENT = "ScopeGuard/1.0 (+https://github.com/reyesvicente/ScopeGuard)"
```

**Second, a 400 about the schema:**

```text
invalid JSON schema for response_format: 'scope_verdict':
`additionalProperties:false` must be set on every object
```

Groq's strict mode requires every object to forbid extra keys, which is also what OpenAI's strict structured outputs require. One more line in the schema, shown above.

Neither of these showed up in the mocked tests, because the mock never sees a User-Agent or validates a schema. If you build on "OpenAI-compatible" APIs so you can switch providers, run one real request against each provider before you trust it. The client also strips a markdown fence around the JSON and rejects anything that isn't a JSON object, as a guard in case another provider is looser than these two.

### Gotcha 2: a "secure" default that broke every save

The first time I saved a contract through the React app, Django answered `403 Forbidden`, and the form showed nothing at all.

Two bugs were stacked. The settings had `CSRF_COOKIE_HTTPONLY = True`, which sounds like hardening. But a single-page app has to *read* the CSRF cookie in JavaScript to send it back as the `X-CSRFToken` header, so every write went out with an empty token. Django's own docs say HttpOnly on the CSRF cookie gives no practical benefit, so I turned it off.

The second bug was why the failure was invisible. The 403 body was `{"detail": "CSRF Failed: ..."}`, and the frontend treated every key in the error object as a form field. There's no field called `detail`, so the message was dropped, and because "field errors" existed, the general error banner stayed hidden too. Now `detail` and `non_field_errors` always surface as a banner, and a CSRF failure fetches a fresh token and retries once.

The tests hadn't caught it because DRF's `force_authenticate` skips CSRF entirely. There's now a test that does what the browser does: load `/api/users/me/`, read the cookie, and send it back with the write.

### One domain for the browser, two hosts behind it

The frontend is a static build on Vercel, and the API runs on Render. Making the browser talk to two origins means CORS with credentials, shared cookie domains, and more CSRF configuration. That's the same family of bugs as above, multiplied.

Instead, `vercel.json` rewrites `/api/*`, `/accounts/*`, and `/static/*` to `api.scopeguard.icvn.tech`, the same way the Vite dev server proxies them locally. The browser only ever sees `scopeguard.icvn.tech`, so cookies are first-party and nothing is cross-origin. The one leak is links Django builds itself: behind the proxy it thinks it's on the `api.` host, so the account adapter rewrites links in verification and password-reset emails to the public domain.

### Tests

The scope app has 37 tests:

- the model client: request shape, auth and User-Agent headers, fenced JSON, non-JSON output, missing key, HTTP errors
- contract import: PDF, Word tables, text encodings, scanned and damaged files, unsupported types, size limits
- services: unique slugs, verdict storage and pricing, hallucinated quotes, unknown verdicts, the model server being down
- the API: auth, the response envelope, per-user privacy, pagination, filtering, re-runs
- the browser's real CSRF flow

Five more cover the proxy setup: the email link rewriting, and a write arriving with the API host but the frontend's origin. The network is mocked, so the tests run in seconds in CI with no API key. Ruff and mypy are clean. The mocks are also why the two Groq bugs got through: only a real request found them.

## Why Does Open Innovation Matter?

Moving off self-hosting changed *where* the model runs. It didn't change why it's an open model.

**1. No lock-in on the most important part.** The model and the provider are three env vars. If a provider raises prices, rate-limits me, runs out of free credits, or shuts down, I move to another one that serves the same weights, and the verdicts don't change underneath my users. That isn't hypothetical: it happened during this build. It took two env vars and two one-line fixes, and the fixes now work for every provider. With a closed model, there is one vendor, and when it deprecates a model version, your product's behavior changes on their schedule.

**2. Privacy has an exit.** A freelancer's SOWs and client messages are often under NDA. Uploaded contract files are never stored. Today the default model host is a shared provider, which is the right trade for a $9 product. But because the weights are open, a freelancer or agency that can't send contracts to a third party can run the same model on their own hardware with vLLM or Ollama, point `LLM_BASE_URL` at it, and get the same app. A closed API can only promise not to train on your data.

**3. Competition keeps the pricing honest.** Every check sends the *entire SOW* as context, so the heaviest users (long contracts, chatty clients) cost the most to serve. Open weights mean many providers serve the same model and compete on price per token. That keeps a check around a twentieth of a cent today, and the `30/hour` per-user throttle caps the worst case.

**4. Room to specialize.** "Is this billable?" is a niche judgment that general-purpose models handle with generic caution. The next feature on my list is letting users correct a verdict, and every correction would be a labeled example. Open weights mean those examples could fine-tune a model that's *better at this one task* than a much bigger general model. You can't do that with a closed model.

The honest trade-off: hosted inference means contracts leave your server by default. ScopeGuard is upfront about that, and the open model is what makes "run it yourself" a real option instead of a promise.

## Prize Categories

- **Best Use of a .tech Domain**: It's live on `scopeguard.icvn.tech`, with the API on `api.scopeguard.icvn.tech`.
- **Best Use of Render**: The API, database, and cache run on Render.

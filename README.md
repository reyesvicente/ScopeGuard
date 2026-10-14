# ScopeGuard

Scope-creep detector for freelancers, powered by a hosted open-weight model.

[![Built with Cookiecutter Django](https://img.shields.io/badge/built%20with-Cookiecutter%20Django-ff69b4.svg?logo=cookiecutter)](https://github.com/cookiecutter/cookiecutter-django/)
[![Ruff](https://img.shields.io/endpoint?url=https://raw.githubusercontent.com/astral-sh/ruff/main/assets/badge/v2.json)](https://github.com/astral-sh/ruff)

License: MIT

## How it works

1. Save a client's statement of work (SOW) and your hourly rate.
2. Paste a client request (email, Slack, ticket, call notes).
3. An open-weight model (default: `openai/gpt-oss-120b` via [Groq](https://console.groq.com/docs/models)) returns a verdict (in scope / out of scope / ambiguous), quotes the SOW clause it relied on, estimates the extra hours, and drafts a reply.
4. ScopeGuard checks that the quoted clause really exists in the SOW, and fills in the change-order price itself (the model never does the arithmetic).

The dashboard totals the out-of-scope hours caught across all your contracts.

### Guardrails

- **Constrained output.** The request sends a JSON Schema as `response_format`, and every field is validated again in `scopeguard/scope/services.py`.
- **Code does the math.** The model writes `{{ESTIMATE}}` where a price belongs; Python computes hours × rate.
- **Verified quotes.** A cited clause that isn't in the SOW is flagged in the UI instead of shown as fact.
- **Loud failures.** API errors, timeouts and bad output save the check as `failed` with a readable error and a **Re-run** button.

## Stack

| Layer     | Choice                                                                          |
| --------- | ------------------------------------------------------------------------------- |
| Model     | Any open-weight model behind an OpenAI-compatible `/chat/completions` API       |
| Backend   | Django + Django REST Framework (cookiecutter-django), PostgreSQL                 |
| Frontend  | React 18 + Vite + TypeScript, TanStack Query, Zustand, React Hook Form + Zod     |
| Hosting   | Render (web service, PostgreSQL, Key Value)                                     |

## Quickstart (local)

Backend commands run through Docker Compose only; the frontend runs on the host.

1. Get a model API key. Step-by-step instructions are in [`todo.md`](todo.md); the short version is a Groq API key from https://console.groq.com/keys (the free tier is enough for development).
2. Add it to `.envs/.local/.django` (gitignored, never commit it):

   ```bash
   LLM_API_KEY=gsk_your_key_here
   ```

3. Start the stack:

   ```bash
   docker compose -f docker-compose.local.yml build
   docker compose -f docker-compose.local.yml up -d
   docker compose -f docker-compose.local.yml run --rm django python manage.py migrate

   cd frontend && npm install && npm run dev   # http://localhost:5173
   ```

4. Sign up at http://localhost:5173. The verification email lands in Mailpit at http://localhost:8025.

If you change `.envs/.local/.django` while the stack is running, recreate the container so Django sees it:

```bash
docker compose -f docker-compose.local.yml up -d --force-recreate django
```

### Model settings

| Variable       | Default                            | Notes                                         |
| -------------- | ---------------------------------- | --------------------------------------------- |
| `LLM_API_KEY`  | *(empty)*                          | Required; checks fail with a clear error without it |
| `LLM_BASE_URL` | `https://api.groq.com/openai/v1`   | Any OpenAI-compatible `/chat/completions` API |
| `LLM_MODEL`    | `openai/gpt-oss-120b`              | Must support JSON-schema `response_format`    |
| `LLM_TIMEOUT`  | `120`                              | Seconds                                       |
| `SCOPE_CHECK_THROTTLE_RATE` | `30/hour`             | Per user; caps model API spend                |

To switch providers, change `LLM_API_KEY`, `LLM_BASE_URL` and `LLM_MODEL` together, using the provider's exact model ID:

| Provider     | `LLM_BASE_URL`                     |
| ------------ | ---------------------------------- |
| Hugging Face | `https://router.huggingface.co/v1` |
| Together     | `https://api.together.xyz/v1`      |
| OpenRouter | `https://openrouter.ai/api/v1`   |

Self-hosting the same weights with vLLM or Ollama works too: point `LLM_BASE_URL` at their OpenAI-compatible endpoint.

## Development

```bash
# Tests
docker compose -f docker-compose.local.yml run --rm django pytest

# Lint and type check
docker compose -f docker-compose.local.yml run --rm django ruff check .
docker compose -f docker-compose.local.yml run --rm django mypy scopeguard

# Superuser and shell
docker compose -f docker-compose.local.yml run --rm django python manage.py createsuperuser
docker compose -f docker-compose.local.yml run --rm django python manage.py shell_plus

# Frontend
cd frontend && npm run typecheck && npm run build
```

The model call is mocked in tests, so the suite runs without an API key.

### Where things live

| Path                              | What                                                    |
| --------------------------------- | ------------------------------------------------------- |
| `scopeguard/scope/llm.py`         | OpenAI-compatible model client (stdlib only, no SDK)    |
| `scopeguard/scope/prompts.py`     | System prompt, user template, JSON Schema               |
| `scopeguard/scope/services.py`    | Business logic: running checks, pricing, quote checks   |
| `scopeguard/scope/api/`           | DRF serializers, viewsets, routes                       |
| `frontend/src/features/`          | Contracts and checks UI, API hooks, state               |
| `config/settings/`                | Django settings (`base`, `local`, `production`, `test`) |

## API

All endpoints live under `/api/` and return `{"data": ..., "message": "", "errors": null}`. List endpoints are paginated.

- `GET/POST /api/contracts/` · `GET/PATCH/DELETE /api/contracts/<slug>/` (`?search=`, `?ordering=`)
- `POST /api/contracts/extract-sow/` (multipart `file`: PDF, DOCX, TXT or MD, up to 10 MB) returns `{filename, text}`. The file isn't stored.
- `GET/POST /api/scope-checks/` (`?contract=<slug>&verdict=out_of_scope&search=`) · `POST /api/scope-checks/<id>/rerun/`

## Deploy

The frontend runs on **Vercel** at `scopeguard.icvn.tech`, and the Django API on **Render** at `api.scopeguard.icvn.tech`.

`frontend/vercel.json` rewrites `/api/*`, `/accounts/*` and `/static/*` to the API host, the same way the Vite dev server proxies them locally. The browser only ever talks to `scopeguard.icvn.tech`, so the session and CSRF cookies are first-party and no cross-origin requests are made. Django rewrites links in account emails (verification, password reset) to `FRONTEND_URL`.

### API on Render

`render.yaml` is a [Blueprint](https://render.com/docs/blueprint-spec):

| Service            | Type         | Purpose                         |
| ------------------ | ------------ | ------------------------------- |
| `scopeguard`       | Web (Docker) | Django API                      |
| `scopeguard-cache` | Key Value    | Django cache + API throttling   |
| `scopeguard-db`    | PostgreSQL   | Database                        |

1. In Render: **New → Blueprint**, pick this repo.
2. Fill in the prompted secrets: `LLM_API_KEY`, `DJANGO_ADMIN_URL`, and the S3, Mailgun and Sentry values.
3. Add a CNAME for `api.scopeguard.icvn.tech` pointing at the service's `onrender.com` hostname.

Migrations run automatically as a pre-deploy step. The Django admin is reached directly on `api.scopeguard.icvn.tech`.

| Variable                       | Value                                                          |
| ------------------------------ | -------------------------------------------------------------- |
| `DJANGO_ALLOWED_HOSTS`         | `api.scopeguard.icvn.tech,scopeguard.icvn.tech`                |
| `DJANGO_CSRF_TRUSTED_ORIGINS`  | `https://scopeguard.icvn.tech,https://api.scopeguard.icvn.tech` |
| `DJANGO_CORS_ALLOWED_ORIGINS`  | `https://scopeguard.icvn.tech` (only for direct API calls)     |
| `FRONTEND_URL`                 | `https://scopeguard.icvn.tech`                                 |

### Frontend on Vercel

1. In Vercel: **Add New → Project**, import this repo, and set **Root Directory** to `frontend`. The framework, build command and output come from `vercel.json`.
2. No environment variables are needed: the SPA only calls its own `/api/`.
3. Add the domain `scopeguard.icvn.tech` in the project settings and create the DNS record Vercel shows.

If the API moves, update the three destinations in `frontend/vercel.json`.

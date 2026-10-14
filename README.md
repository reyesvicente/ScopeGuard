# ScopeGuard

Scope-creep detector for freelancers, powered by a hosted open-weight model.

[![Built with Cookiecutter Django](https://img.shields.io/badge/built%20with-Cookiecutter%20Django-ff69b4.svg?logo=cookiecutter)](https://github.com/cookiecutter/cookiecutter-django/)
[![Ruff](https://img.shields.io/endpoint?url=https://raw.githubusercontent.com/astral-sh/ruff/main/assets/badge/v2.json)](https://github.com/astral-sh/ruff)

License: MIT

## How it works

1. Save a client's statement of work (SOW) and your hourly rate.
2. Paste a client request (email, Slack, ticket).
3. An open-weight model (default: `openai/gpt-oss-120b` via [Hugging Face Inference Providers](https://huggingface.co/docs/inference-providers)) returns a verdict (in scope / out of scope / ambiguous), quotes the SOW clause it relied on, estimates the extra hours, and drafts a reply.
4. ScopeGuard checks that the quoted clause really exists in the SOW, and fills in the change-order price itself (the model never does the arithmetic).

The model API is OpenAI-compatible, so any provider that serves open weights with JSON-schema output (Hugging Face, Groq, Together, OpenRouter) works by changing three env vars.

## Quickstart (local)

```bash
docker compose -f docker-compose.local.yml build
docker compose -f docker-compose.local.yml up -d
docker compose -f docker-compose.local.yml run --rm django python manage.py migrate

cd frontend && npm install && npm run dev   # http://localhost:5173
```

Sign up at http://localhost:5173 (verification emails land in Mailpit at http://localhost:8025).

### Model settings (`.envs/.local/.django`)

| Variable       | Default                            | Notes                                         |
| -------------- | ---------------------------------- | --------------------------------------------- |
| `LLM_API_KEY`  | *(empty)*                          | Required, e.g. a Hugging Face token           |
| `LLM_BASE_URL` | `https://router.huggingface.co/v1` | Any OpenAI-compatible `/chat/completions` API |
| `LLM_MODEL`    | `openai/gpt-oss-120b`              | Must support JSON-schema `response_format`    |
| `LLM_TIMEOUT`  | `120`                              | Seconds                                       |

### Deploy to Render

`render.yaml` is a [Blueprint](https://render.com/docs/blueprint-spec) for the whole stack:

| Service             | Type            | Purpose                                                   |
| ------------------- | --------------- | --------------------------------------------------------- |
| `scopeguard`        | Web (Docker)    | Django API + the React build (served from `/static/spa/`) |
| `scopeguard-cache`  | Key Value       | Django cache + API throttling                             |
| `scopeguard-db`     | PostgreSQL      | Database                                                  |

1. In Render: **New → Blueprint**, pick this repo.
2. Fill in the prompted secrets: `LLM_API_KEY`, `DJANGO_ADMIN_URL`, the S3, Mailgun and Sentry values.
3. Point a CNAME for `scopeguard.icvn.tech` at the `scopeguard` service's `onrender.com` hostname.

`SCOPE_CHECK_THROTTLE_RATE` (default `30/hour` per user) caps model API spend.

### API

All endpoints live under `/api/` and return `{"data": ..., "message": "", "errors": null}`.

- `GET/POST /api/contracts/` · `GET/PATCH/DELETE /api/contracts/<slug>/` (`?search=`, `?ordering=`)
- `GET/POST /api/scope-checks/` (`?contract=<slug>&verdict=out_of_scope&search=`) · `POST /api/scope-checks/<id>/rerun/`

## Settings

Moved to [settings](https://cookiecutter-django.readthedocs.io/en/latest/1-getting-started/settings.html).

## Basic Commands

### Setting Up Your Users

- To create a **normal user account**, just go to Sign Up and fill out the form. Once you submit it, you'll see a "Verify Your E-mail Address" page. Go to your console to see a simulated email verification message. Copy the link into your browser. Now the user's email should be verified and ready to go.

- To create a **superuser account**, use this command:

      uv run python manage.py createsuperuser

For convenience, you can keep your normal user logged in on Chrome and your superuser logged in on Firefox (or similar), so that you can see how the site behaves for both kinds of users.

### Type checks

Running type checks with mypy:

    uv run mypy scopeguard

### Test coverage

To run the tests, check your test coverage, and generate an HTML coverage report:

    uv run coverage run -m pytest
    uv run coverage html
    uv run open htmlcov/index.html

#### Running tests with pytest

    uv run pytest

### Live reloading and Sass CSS compilation

Moved to [Live reloading and SASS compilation](https://cookiecutter-django.readthedocs.io/en/latest/2-local-development/developing-locally.html#using-webpack-or-gulp).

### Email Server

In development, it is often nice to be able to see emails that are being sent from your application. For that reason local SMTP server [Mailpit](https://github.com/axllent/mailpit) with a web interface is available as docker container.

Container mailpit will start automatically when you will run all docker containers.
Please check [cookiecutter-django Docker documentation](https://cookiecutter-django.readthedocs.io/en/latest/2-local-development/developing-locally-docker.html) for more details how to start all containers.

With Mailpit running, to view messages that are sent by your application, open your browser and go to `http://127.0.0.1:8025`

### Sentry

Sentry is an error logging aggregator service. You can sign up for a free account at <https://sentry.io/signup/?code=cookiecutter> or download and host it yourself.
The system is set up with reasonable defaults, including 404 logging and integration with the WSGI application.

You must set the DSN url in production.

## Deployment

The following details how to deploy this application.

### Docker

See detailed [cookiecutter-django Docker documentation](https://cookiecutter-django.readthedocs.io/en/latest/3-deployment/deployment-with-docker.html).

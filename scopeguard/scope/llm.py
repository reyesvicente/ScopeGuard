"""Minimal client for a hosted open-weight model behind an OpenAI-compatible API.

Works with any provider that implements `/chat/completions` with JSON-schema
structured output: Hugging Face Inference Providers, Groq, Together, OpenRouter.
"""

import json
import re
import time
import urllib.error
import urllib.request
from dataclasses import dataclass
from typing import Any

from django.conf import settings


class LLMError(Exception):
    """Raised when the model API is unreachable or returns unusable output."""


@dataclass(frozen=True)
class LLMResult:
    content: dict[str, Any]
    model: str
    latency_ms: int
    prompt_tokens: int | None
    completion_tokens: int | None


_CODE_FENCE = re.compile(r"^```(?:json)?\s*|\s*```$")


def chat_json(*, system: str, user: str, schema: dict[str, Any]) -> LLMResult:
    """Send one chat turn and get back JSON constrained to `schema`."""
    if not settings.LLM_API_KEY:
        msg = "No model API key configured (set LLM_API_KEY)."
        raise LLMError(msg)

    payload = {
        "model": settings.LLM_MODEL,
        "messages": [
            {"role": "system", "content": system},
            {"role": "user", "content": user},
        ],
        "response_format": {
            "type": "json_schema",
            "json_schema": {"name": "scope_verdict", "schema": schema, "strict": True},
        },
        "temperature": 0,
        "stream": False,
    }
    # S310: the URL comes from settings, never from user input.
    request = urllib.request.Request(  # noqa: S310
        f"{settings.LLM_BASE_URL.rstrip('/')}/chat/completions",
        data=json.dumps(payload).encode(),
        headers={
            "Content-Type": "application/json",
            "Authorization": f"Bearer {settings.LLM_API_KEY}",
        },
        method="POST",
    )

    started = time.monotonic()
    try:
        with urllib.request.urlopen(  # noqa: S310
            request,
            timeout=settings.LLM_TIMEOUT,
        ) as response:
            body = json.loads(response.read())
    except urllib.error.HTTPError as exc:
        detail = exc.read().decode(errors="replace")
        msg = f"Model API returned {exc.code}: {detail}"
        raise LLMError(msg) from exc
    except (urllib.error.URLError, TimeoutError) as exc:
        msg = f"Could not reach model API at {settings.LLM_BASE_URL}: {exc}"
        raise LLMError(msg) from exc
    latency_ms = int((time.monotonic() - started) * 1000)

    try:
        raw = body["choices"][0]["message"]["content"]
        # Some providers wrap JSON output in a markdown fence despite the schema.
        content = json.loads(_CODE_FENCE.sub("", raw.strip()))
    except (
        KeyError,
        IndexError,
        TypeError,
        AttributeError,
        json.JSONDecodeError,
    ) as exc:
        msg = "Model returned output that is not valid JSON."
        raise LLMError(msg) from exc
    if not isinstance(content, dict):
        msg = "Model returned JSON that is not an object."
        raise LLMError(msg)

    usage = body.get("usage") or {}
    return LLMResult(
        content=content,
        model=body.get("model") or settings.LLM_MODEL,
        latency_ms=latency_ms,
        prompt_tokens=usage.get("prompt_tokens"),
        completion_tokens=usage.get("completion_tokens"),
    )

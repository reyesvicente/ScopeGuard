"""Minimal client for a local Ollama server running an open-weight model (Gemma)."""

import json
import time
import urllib.error
import urllib.request
from dataclasses import dataclass
from typing import Any

from django.conf import settings


class LLMError(Exception):
    """Raised when the model server is unreachable or returns unusable output."""


@dataclass(frozen=True)
class LLMResult:
    content: dict[str, Any]
    model: str
    latency_ms: int
    prompt_tokens: int | None
    completion_tokens: int | None


def chat_json(*, system: str, user: str, schema: dict[str, Any]) -> LLMResult:
    """Send one chat turn and get back JSON constrained to `schema`."""
    payload = {
        "model": settings.OLLAMA_MODEL,
        "messages": [
            {"role": "system", "content": system},
            {"role": "user", "content": user},
        ],
        "format": schema,
        "stream": False,
        "options": {
            "temperature": 0,
            # Ollama's default context window is far too small for a full SOW.
            "num_ctx": settings.OLLAMA_NUM_CTX,
        },
    }
    # S310: the URL comes from settings, never from user input.
    request = urllib.request.Request(  # noqa: S310
        f"{settings.OLLAMA_BASE_URL.rstrip('/')}/api/chat",
        data=json.dumps(payload).encode(),
        headers={"Content-Type": "application/json"},
        method="POST",
    )

    started = time.monotonic()
    try:
        with urllib.request.urlopen(  # noqa: S310
            request,
            timeout=settings.OLLAMA_TIMEOUT,
        ) as response:
            body = json.loads(response.read())
    except urllib.error.HTTPError as exc:
        detail = exc.read().decode(errors="replace")
        msg = f"Model server returned {exc.code}: {detail}"
        raise LLMError(msg) from exc
    except (urllib.error.URLError, TimeoutError) as exc:
        msg = f"Could not reach model server at {settings.OLLAMA_BASE_URL}: {exc}"
        raise LLMError(msg) from exc
    latency_ms = int((time.monotonic() - started) * 1000)

    try:
        content = json.loads(body["message"]["content"])
    except (KeyError, TypeError, json.JSONDecodeError) as exc:
        msg = "Model returned output that is not valid JSON."
        raise LLMError(msg) from exc

    return LLMResult(
        content=content,
        model=body.get("model", settings.OLLAMA_MODEL),
        latency_ms=latency_ms,
        prompt_tokens=body.get("prompt_eval_count"),
        completion_tokens=body.get("eval_count"),
    )

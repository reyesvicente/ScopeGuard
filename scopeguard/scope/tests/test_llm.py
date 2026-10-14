import io
import json
import urllib.error
from email.message import Message

import pytest

from scopeguard.scope import llm

SCHEMA = {"type": "object", "properties": {"verdict": {"type": "string"}}}


class FakeResponse(io.BytesIO):
    def __enter__(self):
        return self

    def __exit__(self, *args):
        self.close()


def completion(content: str) -> dict:
    return {
        "model": "openai/gpt-oss-120b",
        "choices": [{"message": {"role": "assistant", "content": content}}],
        "usage": {"prompt_tokens": 500, "completion_tokens": 120},
    }


@pytest.fixture(autouse=True)
def llm_settings(settings):
    settings.LLM_BASE_URL = "https://models.example/v1/"
    settings.LLM_API_KEY = "test-key"
    settings.LLM_MODEL = "openai/gpt-oss-120b"
    settings.LLM_TIMEOUT = 5


def fake_urlopen(monkeypatch, body: dict, captured: list):
    def urlopen(request, timeout):
        captured.append(request)
        return FakeResponse(json.dumps(body).encode())

    monkeypatch.setattr(llm.urllib.request, "urlopen", urlopen)


def test_chat_json_sends_schema_and_parses_reply(monkeypatch):
    captured: list = []
    fake_urlopen(monkeypatch, completion('{"verdict": "in_scope"}'), captured)

    result = llm.chat_json(system="sys", user="usr", schema=SCHEMA)

    request = captured[0]
    payload = json.loads(request.data)
    assert request.full_url == "https://models.example/v1/chat/completions"
    assert request.get_header("Authorization") == "Bearer test-key"
    assert payload["response_format"]["json_schema"]["schema"] == SCHEMA
    assert result.content == {"verdict": "in_scope"}
    assert result.prompt_tokens == 500  # noqa: PLR2004
    assert result.completion_tokens == 120  # noqa: PLR2004


def test_chat_json_strips_markdown_fence(monkeypatch):
    fake_urlopen(monkeypatch, completion('```json\n{"verdict": "ambiguous"}\n```'), [])

    result = llm.chat_json(system="sys", user="usr", schema=SCHEMA)

    assert result.content == {"verdict": "ambiguous"}


def test_chat_json_rejects_non_json(monkeypatch):
    fake_urlopen(monkeypatch, completion("Sure! It's in scope."), [])

    with pytest.raises(llm.LLMError, match="not valid JSON"):
        llm.chat_json(system="sys", user="usr", schema=SCHEMA)


def test_chat_json_requires_api_key(settings):
    settings.LLM_API_KEY = ""

    with pytest.raises(llm.LLMError, match="LLM_API_KEY"):
        llm.chat_json(system="sys", user="usr", schema=SCHEMA)


def test_chat_json_reports_http_errors(monkeypatch):
    def urlopen(request, timeout):
        raise urllib.error.HTTPError(
            request.full_url,
            401,
            "Unauthorized",
            Message(),
            io.BytesIO(b"bad key"),
        )

    monkeypatch.setattr(llm.urllib.request, "urlopen", urlopen)

    with pytest.raises(llm.LLMError, match="401: bad key"):
        llm.chat_json(system="sys", user="usr", schema=SCHEMA)

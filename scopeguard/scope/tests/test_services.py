from decimal import Decimal

import pytest

from scopeguard.scope import llm
from scopeguard.scope import services
from scopeguard.scope.models import ScopeCheck

from .factories import ContractFactory

FAKE_LATENCY_MS = 1234


def fake_result(**overrides) -> llm.LLMResult:
    content = {
        "verdict": "out_of_scope",
        "confidence": 0.9,
        "reasoning": "E-commerce is explicitly excluded.",
        "cited_clause": (
            "E-commerce, copywriting, and ongoing maintenance are not included."
        ),
        "estimated_hours": 12,
        "draft_reply": (
            "Happy to help! A shop is outside our agreement; it would be {{ESTIMATE}}."
        ),
    }
    content.update(overrides)
    return llm.LLMResult(
        content=content,
        model="gemma4:e4b",
        latency_ms=FAKE_LATENCY_MS,
        prompt_tokens=500,
        completion_tokens=120,
    )


@pytest.fixture
def contract(db):
    return ContractFactory.create()


def test_create_contract_makes_unique_slugs(user):
    first = services.create_contract(
        owner=user,
        client_name="Acme",
        title="Site",
        sow_text="x",
        hourly_rate=Decimal(50),
        currency="USD",
    )
    second = services.create_contract(
        owner=user,
        client_name="Acme",
        title="Site",
        sow_text="x",
        hourly_rate=Decimal(50),
        currency="USD",
    )
    assert first.slug == "acme-site"
    assert second.slug == "acme-site-2"


def test_run_scope_check_stores_verdict_and_prices_reply(contract, monkeypatch):
    monkeypatch.setattr(llm, "chat_json", lambda **_: fake_result())

    check = services.run_scope_check(
        contract=contract,
        request_text="Add a shop page?",
        source=ScopeCheck.Source.EMAIL,
    )

    assert check.verdict == ScopeCheck.Verdict.OUT_OF_SCOPE
    assert check.estimated_hours == Decimal("12.00")
    assert check.clause_verified is True
    assert "USD 960.00 (12 hours at 80.00/hr)" in check.draft_reply
    assert "{{ESTIMATE}}" not in check.draft_reply
    assert check.latency_ms == FAKE_LATENCY_MS


def test_hallucinated_clause_is_not_verified(contract, monkeypatch):
    monkeypatch.setattr(
        llm,
        "chat_json",
        lambda **_: fake_result(
            cited_clause="Client may request unlimited extra pages.",
        ),
    )
    check = services.run_scope_check(
        contract=contract,
        request_text="More pages?",
        source="email",
    )
    assert check.clause_verified is False


def test_unknown_verdict_marks_check_failed(contract, monkeypatch):
    monkeypatch.setattr(llm, "chat_json", lambda **_: fake_result(verdict="maybe"))
    check = services.run_scope_check(
        contract=contract,
        request_text="Hmm",
        source="email",
    )
    assert check.verdict == ScopeCheck.Verdict.FAILED
    assert "maybe" in check.error


def test_model_server_down_marks_check_failed(contract, monkeypatch):
    def boom(**_):
        msg = "Could not reach model server"
        raise llm.LLMError(msg)

    monkeypatch.setattr(llm, "chat_json", boom)
    check = services.run_scope_check(
        contract=contract,
        request_text="Hi",
        source="email",
    )
    assert check.verdict == ScopeCheck.Verdict.FAILED
    assert "Could not reach" in check.error


@pytest.mark.parametrize(
    ("clause", "expected"),
    [
        ("Includes two rounds of design revisions per page.", True),
        ('"includes   two rounds of design\nrevisions per page."', True),
        ("Includes unlimited revisions.", False),
        ("", False),
    ],
)
def test_clause_in_sow(clause, expected):
    sow = "2. Revisions. Includes two rounds of design revisions per page."
    assert services.clause_in_sow(clause, sow) is expected

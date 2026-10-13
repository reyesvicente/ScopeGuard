import re
from decimal import ROUND_HALF_UP
from decimal import Decimal
from decimal import InvalidOperation
from typing import Any

from django.db.models import Count
from django.db.models import Q
from django.db.models import QuerySet
from django.db.models import Sum
from django.utils.text import slugify

from . import llm
from .models import Contract
from .models import ScopeCheck
from .prompts import ESTIMATE_PLACEHOLDER
from .prompts import SYSTEM_PROMPT
from .prompts import USER_TEMPLATE
from .prompts import VERDICT_SCHEMA

MODEL_VERDICTS = {
    ScopeCheck.Verdict.IN_SCOPE,
    ScopeCheck.Verdict.OUT_OF_SCOPE,
    ScopeCheck.Verdict.AMBIGUOUS,
}
MAX_HOURS = Decimal("9999.99")


# ---- Contracts ---------------------------------------------------------------


def contracts_for(user) -> QuerySet[Contract]:
    """A user's contracts, annotated with the scope-creep totals the dashboard shows."""
    out_of_scope = Q(checks__verdict=ScopeCheck.Verdict.OUT_OF_SCOPE)
    return (
        Contract.objects.filter(owner=user)
        .annotate(
            check_count=Count("checks"),
            out_of_scope_count=Count("checks", filter=out_of_scope),
            flagged_hours=Sum("checks__estimated_hours", filter=out_of_scope),
        )
        .order_by("-created")
    )


def unique_contract_slug(*, owner, client_name: str, title: str) -> str:
    base = slugify(f"{client_name} {title}")[:200] or "contract"
    slug = base
    suffix = 2
    while Contract.objects.filter(owner=owner, slug=slug).exists():
        slug = f"{base}-{suffix}"
        suffix += 1
    return slug


def create_contract(*, owner, **fields: Any) -> Contract:
    slug = unique_contract_slug(
        owner=owner,
        client_name=fields["client_name"],
        title=fields["title"],
    )
    return Contract.objects.create(owner=owner, slug=slug, **fields)


# ---- Scope checks ------------------------------------------------------------


def checks_for(user) -> QuerySet[ScopeCheck]:
    return ScopeCheck.objects.filter(contract__owner=user).select_related("contract")


def run_scope_check(
    *,
    contract: Contract,
    request_text: str,
    source: str,
) -> ScopeCheck:
    check = ScopeCheck.objects.create(
        contract=contract,
        request_text=request_text,
        source=source,
    )
    return evaluate_scope_check(check)


def evaluate_scope_check(check: ScopeCheck) -> ScopeCheck:
    """Ask the local model for a verdict and store it on `check`."""
    contract = check.contract
    prompt = USER_TEMPLATE.format(
        client_name=contract.client_name,
        title=contract.title,
        sow_text=contract.sow_text,
        source=check.get_source_display(),
        request_text=check.request_text,
    )

    try:
        result = llm.chat_json(system=SYSTEM_PROMPT, user=prompt, schema=VERDICT_SCHEMA)
    except llm.LLMError as exc:
        _mark_failed(check, str(exc))
        return check

    check.model_name = result.model
    check.latency_ms = result.latency_ms
    check.prompt_tokens = result.prompt_tokens
    check.completion_tokens = result.completion_tokens

    verdict = result.content.get("verdict")
    if verdict not in MODEL_VERDICTS:
        _mark_failed(check, f"Model returned an unknown verdict: {verdict!r}")
        return check

    hours = _to_hours(result.content.get("estimated_hours"))
    cited = str(result.content.get("cited_clause", "")).strip()

    check.verdict = verdict
    check.confidence = _clamp_confidence(result.content.get("confidence"))
    check.reasoning = str(result.content.get("reasoning", "")).strip()
    check.cited_clause = cited
    check.clause_verified = clause_in_sow(cited, contract.sow_text)
    check.estimated_hours = hours
    check.draft_reply = fill_estimate(
        str(result.content.get("draft_reply", "")).strip(),
        hours=hours,
        contract=contract,
    )
    check.error = ""
    check.save()
    return check


def _mark_failed(check: ScopeCheck, error: str) -> None:
    check.verdict = ScopeCheck.Verdict.FAILED
    check.error = error
    check.save()


# ---- Helpers -----------------------------------------------------------------


def _normalize(text: str) -> str:
    return re.sub(r"\s+", " ", text).strip().lower()


def clause_in_sow(clause: str, sow_text: str) -> bool:
    """Guard against hallucinated citations: the quote must exist in the SOW."""
    if not clause:
        return False
    return _normalize(clause.strip("\"'“”")) in _normalize(sow_text)


def _to_hours(value: Any) -> Decimal | None:
    try:
        hours = Decimal(str(value)).quantize(Decimal("0.01"), rounding=ROUND_HALF_UP)
    except InvalidOperation, TypeError, ValueError:
        return None
    return min(max(hours, Decimal(0)), MAX_HOURS)


def _clamp_confidence(value: Any) -> float | None:
    try:
        return min(max(float(value), 0.0), 1.0)
    except TypeError, ValueError:
        return None


def estimate_cost(*, hours: Decimal | None, contract: Contract) -> Decimal | None:
    if hours is None:
        return None
    return (hours * contract.hourly_rate).quantize(Decimal("0.01"))


def fill_estimate(reply: str, *, hours: Decimal | None, contract: Contract) -> str:
    """Prices are computed here, never by the model, so the math is always right."""
    if ESTIMATE_PLACEHOLDER not in reply:
        return reply
    cost = estimate_cost(hours=hours, contract=contract)
    if hours is None or cost is None or not cost:
        text = "a quote to follow"
    else:
        rate = f"{contract.hourly_rate:,.2f}/hr"
        text = (
            f"{contract.currency} {cost:,.2f} ({hours.normalize():f} hours at {rate})"
        )
    return reply.replace(ESTIMATE_PLACEHOLDER, text)

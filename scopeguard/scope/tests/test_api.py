import pytest
from rest_framework.test import APIClient

from scopeguard.scope import llm
from scopeguard.scope.models import ScopeCheck
from scopeguard.users.tests.factories import UserFactory

from .factories import ContractFactory
from .factories import ScopeCheckFactory
from .test_services import fake_result

pytestmark = pytest.mark.django_db


@pytest.fixture
def api(user):
    client = APIClient()
    client.force_authenticate(user)
    return client


def test_requires_authentication():
    response = APIClient().get("/api/contracts/")
    body = response.json()
    assert response.status_code == 403  # noqa: PLR2004
    assert body["data"] is None
    assert body["errors"] is not None


def test_create_contract_returns_envelope(api):
    response = api.post(
        "/api/contracts/",
        {
            "client_name": "Acme",
            "title": "Website",
            "sow_text": "Build a site.",
            "hourly_rate": "75.00",
            "currency": "USD",
        },
        format="json",
    )
    body = response.json()
    assert response.status_code == 201  # noqa: PLR2004
    assert body["errors"] is None
    assert body["data"]["slug"] == "acme-website"
    assert body["data"]["check_count"] == 0


def test_contracts_are_private_and_paginated(api, user):
    ContractFactory.create(owner=user)
    ContractFactory.create(owner=UserFactory.create())
    body = api.get("/api/contracts/").json()
    assert body["data"]["count"] == 1
    assert len(body["data"]["results"]) == 1


def test_cannot_check_against_someone_elses_contract(api):
    other = ContractFactory.create(owner=UserFactory.create())
    response = api.post(
        "/api/scope-checks/",
        {"contract": other.slug, "request_text": "Add a shop"},
        format="json",
    )
    assert response.status_code == 400  # noqa: PLR2004
    assert "contract" in response.json()["errors"]


def test_create_scope_check(api, user, monkeypatch):
    monkeypatch.setattr(llm, "chat_json", lambda **_: fake_result())
    contract = ContractFactory.create(owner=user)

    response = api.post(
        "/api/scope-checks/",
        {"contract": contract.slug, "source": "slack", "request_text": "Add a shop"},
        format="json",
    )
    data = response.json()["data"]
    assert response.status_code == 201  # noqa: PLR2004
    assert data["verdict"] == "out_of_scope"
    assert data["estimated_cost"] == "960.00"
    assert data["contract"] == contract.slug

    totals = api.get(f"/api/contracts/{contract.slug}/").json()["data"]
    assert totals["out_of_scope_count"] == 1
    assert totals["flagged_value"] == "960.00"


def test_filter_checks_by_verdict(api, user):
    contract = ContractFactory.create(owner=user)
    ScopeCheckFactory.create(contract=contract, verdict=ScopeCheck.Verdict.IN_SCOPE)
    ScopeCheckFactory.create(contract=contract, verdict=ScopeCheck.Verdict.OUT_OF_SCOPE)
    body = api.get(
        f"/api/scope-checks/?contract={contract.slug}&verdict=out_of_scope",
    ).json()
    assert body["data"]["count"] == 1


def test_rerun_failed_check(api, user, monkeypatch):
    monkeypatch.setattr(
        llm,
        "chat_json",
        lambda **_: fake_result(verdict="in_scope", estimated_hours=0),
    )
    check = ScopeCheckFactory.create(
        contract=ContractFactory.create(owner=user),
        verdict=ScopeCheck.Verdict.FAILED,
    )
    data = api.post(f"/api/scope-checks/{check.pk}/rerun/").json()["data"]
    assert data["verdict"] == "in_scope"

"""The SPA's write path with real session auth and CSRF checks enforced.

APIClient.force_authenticate skips CSRF, so these use Django's test Client the
way the browser does: load /api/users/me/, read the csrftoken cookie, send it back.
"""

import pytest
from django.conf import settings
from django.core.files.uploadedfile import SimpleUploadedFile
from django.test import Client

pytestmark = pytest.mark.django_db

CONTRACT = {
    "client_name": "Bramblewood Coffee Roasters",
    "title": "Website redesign",
    "sow_text": "1. Scope. Six pages. 5. Exclusions. No online store of any kind.",
    "hourly_rate": "85.00",
    "currency": "USD",
}


@pytest.fixture
def browser(user):
    client = Client(enforce_csrf_checks=True)
    client.force_login(user)
    return client


def csrf_token(browser: Client) -> str:
    response = browser.get("/api/users/me/")
    cookie = response.cookies[settings.CSRF_COOKIE_NAME]
    # The SPA reads this cookie from JavaScript, so it must not be HttpOnly.
    assert not cookie["httponly"]
    return cookie.value


def test_me_issues_a_readable_csrf_cookie(browser):
    assert csrf_token(browser)


def test_writes_without_csrf_token_are_rejected(browser):
    response = browser.post(
        "/api/contracts/",
        CONTRACT,
        content_type="application/json",
    )

    assert response.status_code == 403  # noqa: PLR2004
    assert response.json()["message"].startswith("CSRF Failed")


def test_create_contract_with_csrf_token(browser):
    token = csrf_token(browser)

    response = browser.post(
        "/api/contracts/",
        CONTRACT,
        content_type="application/json",
        headers={"X-CSRFToken": token},
    )

    assert response.status_code == 201  # noqa: PLR2004


def test_upload_sow_with_csrf_token(browser):
    token = csrf_token(browser)
    upload = SimpleUploadedFile("sow.txt", b"1. Scope. Six pages.")

    response = browser.post(
        "/api/contracts/extract-sow/",
        {"file": upload},
        headers={"X-CSRFToken": token},
    )

    assert response.status_code == 200  # noqa: PLR2004
    assert response.json()["data"]["text"] == "1. Scope. Six pages."

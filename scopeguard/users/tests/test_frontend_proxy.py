"""Frontend on its own domain, proxying /api and /accounts to the API host."""

import pytest
from django.core import mail
from django.test import Client
from django.test import override_settings

from scopeguard.users.adapters import AccountAdapter
from scopeguard.users.adapters import public_url

FRONTEND = "https://scopeguard.icvn.tech"
API_HOST = "api.scopeguard.icvn.tech"

proxied = override_settings(
    FRONTEND_URL=FRONTEND,
    ALLOWED_HOSTS=[API_HOST, "scopeguard.icvn.tech"],
    CSRF_TRUSTED_ORIGINS=[FRONTEND, f"https://{API_HOST}"],
)


@proxied
def test_public_url_moves_api_links_to_frontend():
    link = f"https://{API_HOST}/accounts/confirm-email/abc/?next=/"

    assert public_url(link) == f"{FRONTEND}/accounts/confirm-email/abc/?next=/"


@proxied
def test_public_url_leaves_other_values_alone():
    assert public_url("https://example.com/docs/") == "https://example.com/docs/"
    assert public_url("Bramblewood") == "Bramblewood"
    assert public_url(42) == 42  # noqa: PLR2004


@override_settings(FRONTEND_URL="")
def test_public_url_is_a_no_op_without_frontend_url():
    link = f"https://{API_HOST}/accounts/login/"

    assert public_url(link) == link


@proxied
@pytest.mark.django_db
def test_account_emails_link_to_frontend(rf):
    request = rf.get("/accounts/signup/", HTTP_HOST=API_HOST, secure=True)
    adapter = AccountAdapter(request)

    adapter.send_mail(
        "account/email/email_confirmation_signup",
        "ice@example.com",
        {
            "activate_url": f"https://{API_HOST}/accounts/confirm-email/key/",
            "key": "key",
            "user": None,
            "current_site": None,
        },
    )

    body = mail.outbox[0].body
    assert f"{FRONTEND}/accounts/confirm-email/key/" in body
    assert API_HOST not in body


@proxied
@pytest.mark.django_db
def test_proxied_write_passes_csrf(user):
    """Host is the API (a frontend proxy rewrites to it); Origin is the frontend."""
    browser = Client(enforce_csrf_checks=True, headers={"host": API_HOST})
    browser.force_login(user)
    token = browser.get("/api/users/me/", secure=True).cookies["csrftoken"].value

    response = browser.post(
        "/api/contracts/",
        {
            "client_name": "Bramblewood",
            "title": "Website",
            "sow_text": "1. Scope. Six pages. 5. Exclusions. No online store.",
            "hourly_rate": "85.00",
            "currency": "USD",
        },
        content_type="application/json",
        secure=True,
        headers={
            "X-CSRFToken": token,
            "Origin": FRONTEND,
            "Referer": f"{FRONTEND}/contracts/new",
        },
    )

    assert response.status_code == 201  # noqa: PLR2004

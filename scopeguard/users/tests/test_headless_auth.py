"""allauth headless endpoints the React SPA uses for login and signup."""

import re

import pytest
from allauth.account.models import EmailAddress
from django.core import mail
from django.test import Client
from django.test import override_settings

from scopeguard.users.models import User
from scopeguard.users.tests.factories import UserFactory

FRONTEND = "https://scopeguard.icvn.tech"
API_HOST = "api.scopeguard.icvn.tech"
AUTH = "/_allauth/browser/v1/auth"
PASSWORD = "correct-horse-battery-staple"  # noqa: S105

proxied = override_settings(
    FRONTEND_URL=FRONTEND,
    ALLOWED_HOSTS=[API_HOST, "scopeguard.icvn.tech"],
    CSRF_TRUSTED_ORIGINS=[FRONTEND, f"https://{API_HOST}"],
)


def browser_with_csrf() -> tuple[Client, dict[str, str]]:
    """A CSRF-enforcing browser behind the frontend proxy, plus write headers."""
    browser = Client(enforce_csrf_checks=True, HTTP_HOST=API_HOST)
    token = browser.get(f"{AUTH}/session", secure=True).cookies["csrftoken"].value
    headers = {"X-CSRFToken": token, "Origin": FRONTEND, "Referer": f"{FRONTEND}/login"}
    return browser, headers


@pytest.mark.django_db
def test_session_is_anonymous_and_issues_csrf_cookie():
    response = Client().get(f"{AUTH}/session")

    assert response.status_code == 401  # noqa: PLR2004
    assert response.json()["meta"]["is_authenticated"] is False
    assert "csrftoken" in response.cookies


@proxied
@pytest.mark.django_db
def test_signup_sends_verification_link_to_spa(settings):
    settings.ACCOUNT_EMAIL_VERIFICATION = "mandatory"
    browser, headers = browser_with_csrf()

    response = browser.post(
        f"{AUTH}/signup",
        {"email": "new@example.com", "password": PASSWORD},
        content_type="application/json",
        secure=True,
        headers=headers,
    )

    assert response.status_code == 401  # noqa: PLR2004
    flows = response.json()["data"]["flows"]
    assert {"id": "verify_email", "is_pending": True} in flows
    assert User.objects.filter(email="new@example.com").exists()
    body = str(mail.outbox[0].body)
    assert re.search(rf"{FRONTEND}/verify-email/\S+", body)
    assert API_HOST not in body


@proxied
@pytest.mark.django_db
def test_signup_without_verification_logs_in(settings):
    settings.ACCOUNT_EMAIL_VERIFICATION = "none"
    browser, headers = browser_with_csrf()

    response = browser.post(
        f"{AUTH}/signup",
        {"email": "new@example.com", "password": PASSWORD},
        content_type="application/json",
        secure=True,
        headers=headers,
    )

    assert response.status_code == 200  # noqa: PLR2004
    assert browser.get("/api/users/me/", secure=True).status_code == 200  # noqa: PLR2004


@proxied
@pytest.mark.django_db
def test_signup_rejects_weak_password():
    browser, headers = browser_with_csrf()

    response = browser.post(
        f"{AUTH}/signup",
        {"email": "new@example.com", "password": "12345678"},
        content_type="application/json",
        secure=True,
        headers=headers,
    )

    assert response.status_code == 400  # noqa: PLR2004
    params = {error.get("param") for error in response.json()["errors"]}
    assert "password" in params


@proxied
@pytest.mark.django_db
def test_login_and_logout():
    user = UserFactory.create(password=PASSWORD)
    EmailAddress.objects.create(
        user=user,
        email=user.email,
        primary=True,
        verified=True,
    )
    browser, headers = browser_with_csrf()

    response = browser.post(
        f"{AUTH}/login",
        {"email": user.email, "password": PASSWORD},
        content_type="application/json",
        secure=True,
        headers=headers,
    )

    assert response.status_code == 200  # noqa: PLR2004
    assert response.json()["data"]["user"]["email"] == user.email

    # Login rotates the CSRF token; the SPA re-reads the cookie before writing.
    headers["X-CSRFToken"] = browser.cookies["csrftoken"].value
    response = browser.delete(f"{AUTH}/session", secure=True, headers=headers)

    assert response.status_code == 401  # noqa: PLR2004
    assert browser.get("/api/users/me/", secure=True).status_code == 403  # noqa: PLR2004


@proxied
@pytest.mark.django_db
def test_login_with_wrong_password_returns_errors():
    user = UserFactory.create(password=PASSWORD)
    browser, headers = browser_with_csrf()

    response = browser.post(
        f"{AUTH}/login",
        {"email": user.email, "password": "wrong-password"},
        content_type="application/json",
        secure=True,
        headers=headers,
    )

    assert response.status_code == 400  # noqa: PLR2004
    assert response.json()["errors"]


@proxied
@pytest.mark.django_db
def test_password_reset_link_opens_spa_and_sets_password():
    user = UserFactory.create(password=PASSWORD)
    EmailAddress.objects.create(
        user=user,
        email=user.email,
        primary=True,
        verified=True,
    )
    browser, headers = browser_with_csrf()

    response = browser.post(
        f"{AUTH}/password/request",
        {"email": user.email},
        content_type="application/json",
        secure=True,
        headers=headers,
    )

    assert response.status_code == 200  # noqa: PLR2004
    link = re.search(rf"{FRONTEND}/password/reset/(\S+)", str(mail.outbox[0].body))
    assert link

    response = browser.post(
        f"{AUTH}/password/reset",
        {"key": link.group(1), "password": "a-brand-new-passphrase-99"},
        content_type="application/json",
        secure=True,
        headers=headers,
    )

    # 401: the password changed, but allauth doesn't sign in on reset by default.
    assert response.status_code == 401  # noqa: PLR2004
    user.refresh_from_db()
    assert user.check_password("a-brand-new-passphrase-99")

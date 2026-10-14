from __future__ import annotations

import typing
from urllib.parse import urlsplit

from allauth.account.adapter import DefaultAccountAdapter
from allauth.socialaccount.adapter import DefaultSocialAccountAdapter
from django.conf import settings

if typing.TYPE_CHECKING:
    from allauth.socialaccount.models import SocialLogin
    from django.http import HttpRequest

    from scopeguard.users.models import User


def public_url(value: typing.Any) -> typing.Any:
    """Point an absolute URL on this server at FRONTEND_URL instead.

    Behind the frontend's proxy Django sees the API host, so links it builds for
    emails (verification, password reset) would otherwise send people there.
    """
    if not settings.FRONTEND_URL or not isinstance(value, str):
        return value
    url = urlsplit(value)
    on_this_server = url.hostname in settings.ALLOWED_HOSTS
    if url.scheme not in {"http", "https"} or not on_this_server:
        return value
    frontend = urlsplit(settings.FRONTEND_URL)
    return url._replace(scheme=frontend.scheme, netloc=frontend.netloc).geturl()


class AccountAdapter(DefaultAccountAdapter):
    def is_open_for_signup(self, request: HttpRequest) -> bool:
        return getattr(settings, "ACCOUNT_ALLOW_REGISTRATION", True)

    def send_mail(
        self,
        template_prefix: str,
        email: str,
        context: dict[str, typing.Any],
    ) -> None:
        context = {key: public_url(value) for key, value in context.items()}
        super().send_mail(template_prefix, email, context)


class SocialAccountAdapter(DefaultSocialAccountAdapter):
    def is_open_for_signup(
        self,
        request: HttpRequest,
        sociallogin: SocialLogin,
    ) -> bool:
        return getattr(settings, "ACCOUNT_ALLOW_REGISTRATION", True)

    def populate_user(
        self,
        request: HttpRequest,
        sociallogin: SocialLogin,
        data: dict[str, typing.Any],
    ) -> User:
        """
        Populates user information from social provider info.

        See: https://docs.allauth.org/en/latest/socialaccount/advanced.html#creating-and-populating-user-instances
        """
        user = super().populate_user(request, sociallogin, data)
        if not user.name:
            if name := data.get("name"):
                user.name = name
            elif first_name := data.get("first_name"):
                user.name = first_name
                if last_name := data.get("last_name"):
                    user.name += f" {last_name}"
        return user

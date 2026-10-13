from django.apps import AppConfig
from django.utils.translation import gettext_lazy as _


class ScopeConfig(AppConfig):
    name = "scopeguard.scope"
    verbose_name = _("Scope")

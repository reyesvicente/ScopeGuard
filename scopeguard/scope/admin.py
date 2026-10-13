from django.contrib import admin

from .models import Contract
from .models import ScopeCheck


@admin.register(Contract)
class ContractAdmin(admin.ModelAdmin):
    list_display = ["client_name", "title", "owner", "hourly_rate", "created"]
    search_fields = ["client_name", "title", "owner__email"]
    prepopulated_fields = {"slug": ["client_name", "title"]}


@admin.register(ScopeCheck)
class ScopeCheckAdmin(admin.ModelAdmin):
    list_display = [
        "contract",
        "source",
        "verdict",
        "estimated_hours",
        "latency_ms",
        "created",
    ]
    list_filter = ["verdict", "source", "model_name"]
    search_fields = ["request_text", "contract__client_name"]

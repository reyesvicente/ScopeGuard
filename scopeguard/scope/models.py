from django.conf import settings
from django.db import models
from model_utils.models import TimeStampedModel


class Contract(TimeStampedModel):
    """A client engagement and the statement of work that defines its scope."""

    owner = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name="contracts",
    )
    client_name = models.CharField(max_length=200)
    title = models.CharField(max_length=200)
    slug = models.SlugField(max_length=220)
    sow_text = models.TextField(help_text="Full text of the statement of work.")
    hourly_rate = models.DecimalField(max_digits=8, decimal_places=2, default=0)
    currency = models.CharField(max_length=3, default="USD")

    class Meta:
        ordering = ["-created"]
        constraints = [
            models.UniqueConstraint(
                fields=["owner", "slug"],
                name="unique_contract_slug_per_owner",
            ),
        ]

    def __str__(self) -> str:
        return f"{self.client_name} — {self.title}"


class ScopeCheck(TimeStampedModel):
    """One client request evaluated against a contract's statement of work."""

    class Verdict(models.TextChoices):
        PENDING = "pending", "Pending"
        IN_SCOPE = "in_scope", "In scope"
        OUT_OF_SCOPE = "out_of_scope", "Out of scope"
        AMBIGUOUS = "ambiguous", "Ambiguous"
        FAILED = "failed", "Failed"

    class Source(models.TextChoices):
        EMAIL = "email", "Email"
        SLACK = "slack", "Slack"
        TICKET = "ticket", "Ticket"
        CALL_NOTES = "call_notes", "Call notes"
        OTHER = "other", "Other"

    contract = models.ForeignKey(
        Contract,
        on_delete=models.CASCADE,
        related_name="checks",
    )
    source = models.CharField(
        max_length=20,
        choices=Source.choices,
        default=Source.EMAIL,
    )
    request_text = models.TextField()

    verdict = models.CharField(
        max_length=20,
        choices=Verdict.choices,
        default=Verdict.PENDING,
    )
    confidence = models.FloatField(null=True, blank=True)
    reasoning = models.TextField(blank=True)
    cited_clause = models.TextField(blank=True)
    clause_verified = models.BooleanField(
        default=False,
        help_text="True when the cited clause was found verbatim in the SOW.",
    )
    estimated_hours = models.DecimalField(
        max_digits=6,
        decimal_places=2,
        null=True,
        blank=True,
    )
    draft_reply = models.TextField(blank=True)

    model_name = models.CharField(max_length=100, blank=True)
    latency_ms = models.PositiveIntegerField(null=True, blank=True)
    prompt_tokens = models.PositiveIntegerField(null=True, blank=True)
    completion_tokens = models.PositiveIntegerField(null=True, blank=True)
    error = models.TextField(blank=True)

    class Meta:
        ordering = ["-created"]

    def __str__(self) -> str:
        return f"{self.contract.client_name}: {self.get_verdict_display()}"

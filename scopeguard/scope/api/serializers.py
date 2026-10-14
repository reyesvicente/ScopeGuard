from pathlib import Path

from rest_framework import serializers

from scopeguard.scope import documents
from scopeguard.scope import services
from scopeguard.scope.models import Contract
from scopeguard.scope.models import ScopeCheck


class ContractSerializer(serializers.ModelSerializer):
    check_count = serializers.IntegerField(read_only=True)
    out_of_scope_count = serializers.IntegerField(read_only=True)
    flagged_hours = serializers.DecimalField(
        max_digits=10,
        decimal_places=2,
        read_only=True,
        allow_null=True,
    )
    flagged_value = serializers.SerializerMethodField()

    class Meta:
        model = Contract
        fields = [
            "slug",
            "client_name",
            "title",
            "sow_text",
            "hourly_rate",
            "currency",
            "check_count",
            "out_of_scope_count",
            "flagged_hours",
            "flagged_value",
            "created",
            "modified",
        ]
        read_only_fields = ["slug", "created", "modified"]

    def get_flagged_value(self, obj: Contract) -> str | None:
        cost = services.estimate_cost(
            hours=getattr(obj, "flagged_hours", None),
            contract=obj,
        )
        return None if cost is None else str(cost)


class SowUploadSerializer(serializers.Serializer):
    file = serializers.FileField()

    def validate_file(self, file):
        if Path(file.name).suffix.lower() not in documents.SUPPORTED_EXTENSIONS:
            msg = "Upload a PDF, Word (.docx), text or Markdown file."
            raise serializers.ValidationError(msg)
        if file.size > documents.MAX_UPLOAD_BYTES:
            limit_mb = documents.MAX_UPLOAD_BYTES // (1024 * 1024)
            msg = f"Files are limited to {limit_mb} MB."
            raise serializers.ValidationError(msg)
        return file


class SowTextSerializer(serializers.Serializer):
    filename = serializers.CharField()
    text = serializers.CharField()


class ScopeCheckSerializer(serializers.ModelSerializer):
    contract = serializers.CharField(source="contract.slug", read_only=True)
    estimated_cost = serializers.SerializerMethodField()

    class Meta:
        model = ScopeCheck
        fields = [
            "id",
            "contract",
            "source",
            "request_text",
            "verdict",
            "confidence",
            "reasoning",
            "cited_clause",
            "clause_verified",
            "estimated_hours",
            "estimated_cost",
            "draft_reply",
            "model_name",
            "latency_ms",
            "prompt_tokens",
            "completion_tokens",
            "error",
            "created",
        ]
        read_only_fields = fields

    def get_estimated_cost(self, obj: ScopeCheck) -> str | None:
        cost = services.estimate_cost(hours=obj.estimated_hours, contract=obj.contract)
        return None if cost is None else str(cost)


class OwnedContractField(serializers.SlugRelatedField):
    """Only lets users run checks against their own contracts."""

    def get_queryset(self):
        return Contract.objects.filter(owner=self.context["request"].user)


class ScopeCheckCreateSerializer(serializers.Serializer):
    contract = OwnedContractField(slug_field="slug")
    source = serializers.ChoiceField(  # type: ignore[assignment]
        choices=ScopeCheck.Source.choices,
        default=ScopeCheck.Source.EMAIL,
    )
    request_text = serializers.CharField(max_length=20000, trim_whitespace=True)

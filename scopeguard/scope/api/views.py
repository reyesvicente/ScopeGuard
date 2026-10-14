from drf_spectacular.utils import extend_schema
from rest_framework import filters
from rest_framework import mixins
from rest_framework import status
from rest_framework.decorators import action
from rest_framework.exceptions import ValidationError
from rest_framework.parsers import MultiPartParser
from rest_framework.response import Response
from rest_framework.throttling import ScopedRateThrottle
from rest_framework.viewsets import GenericViewSet
from rest_framework.viewsets import ModelViewSet

from scopeguard.scope import documents
from scopeguard.scope import services
from scopeguard.scope.models import ScopeCheck

from .serializers import ContractSerializer
from .serializers import ScopeCheckCreateSerializer
from .serializers import ScopeCheckSerializer
from .serializers import SowTextSerializer
from .serializers import SowUploadSerializer


class ContractViewSet(ModelViewSet):
    serializer_class = ContractSerializer
    lookup_field = "slug"
    filter_backends = [filters.SearchFilter, filters.OrderingFilter]
    search_fields = ["client_name", "title"]
    ordering_fields = ["created", "client_name", "flagged_hours"]

    def get_queryset(self):
        return services.contracts_for(self.request.user)

    def create(self, request, *args, **kwargs):
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        created = services.create_contract(
            owner=request.user,
            **serializer.validated_data,
        )
        contract = self.get_queryset().get(pk=created.pk)
        return Response(
            self.get_serializer(contract).data,
            status=status.HTTP_201_CREATED,
        )

    @extend_schema(request=SowUploadSerializer, responses=SowTextSerializer)
    @action(
        detail=False,
        methods=["post"],
        url_path="extract-sow",
        parser_classes=[MultiPartParser],
    )
    def extract_sow(self, request):
        """Read a PDF/DOCX/TXT/MD and return its text. The file is not stored."""
        serializer = SowUploadSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        upload = serializer.validated_data["file"]
        try:
            text = documents.extract_text(upload, upload.name)
        except documents.DocumentError as exc:
            raise ValidationError({"file": [str(exc)]}) from exc
        return Response(SowTextSerializer({"filename": upload.name, "text": text}).data)


class ScopeCheckViewSet(
    mixins.ListModelMixin,
    mixins.RetrieveModelMixin,
    mixins.DestroyModelMixin,
    GenericViewSet,
):
    """List with ?contract=<slug>&verdict=<verdict>&search=<text>."""

    serializer_class = ScopeCheckSerializer
    filter_backends = [filters.SearchFilter]
    search_fields = ["request_text", "reasoning"]
    throttle_scope = "scope_checks"

    def get_throttles(self):
        # Only the actions that call the model are rate limited.
        if self.action in {"create", "rerun"}:
            return [ScopedRateThrottle()]
        return []

    def get_queryset(self):
        queryset = services.checks_for(self.request.user)
        contract = self.request.query_params.get("contract")
        verdict = self.request.query_params.get("verdict")
        if contract:
            queryset = queryset.filter(contract__slug=contract)
        if verdict in ScopeCheck.Verdict.values:
            queryset = queryset.filter(verdict=verdict)
        return queryset

    @extend_schema(request=ScopeCheckCreateSerializer, responses=ScopeCheckSerializer)
    def create(self, request):
        serializer = ScopeCheckCreateSerializer(
            data=request.data,
            context={"request": request},
        )
        serializer.is_valid(raise_exception=True)
        check = services.run_scope_check(**serializer.validated_data)
        return Response(
            ScopeCheckSerializer(check).data,
            status=status.HTTP_201_CREATED,
        )

    @extend_schema(request=None, responses=ScopeCheckSerializer)
    @action(detail=True, methods=["post"])
    def rerun(self, request, pk=None):
        check = services.evaluate_scope_check(self.get_object())
        return Response(ScopeCheckSerializer(check).data)

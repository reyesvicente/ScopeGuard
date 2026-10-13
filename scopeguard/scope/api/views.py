from drf_spectacular.utils import extend_schema
from rest_framework import filters
from rest_framework import mixins
from rest_framework import status
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.viewsets import GenericViewSet
from rest_framework.viewsets import ModelViewSet

from scopeguard.scope import services
from scopeguard.scope.models import ScopeCheck

from .serializers import ContractSerializer
from .serializers import ScopeCheckCreateSerializer
from .serializers import ScopeCheckSerializer


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

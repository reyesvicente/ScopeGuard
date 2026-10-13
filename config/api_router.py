from django.conf import settings
from rest_framework.routers import DefaultRouter
from rest_framework.routers import SimpleRouter

from scopeguard.scope.api.views import ContractViewSet
from scopeguard.scope.api.views import ScopeCheckViewSet
from scopeguard.users.api.views import UserViewSet

router = DefaultRouter() if settings.DEBUG else SimpleRouter()

router.register("users", UserViewSet)
router.register("contracts", ContractViewSet, basename="contract")
router.register("scope-checks", ScopeCheckViewSet, basename="scope-check")


app_name = "api"
urlpatterns = router.urls

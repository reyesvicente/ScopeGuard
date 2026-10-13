from decimal import Decimal

from factory import Faker
from factory import Sequence
from factory import SubFactory
from factory.django import DjangoModelFactory

from scopeguard.scope.models import Contract
from scopeguard.scope.models import ScopeCheck
from scopeguard.users.tests.factories import UserFactory

SAMPLE_SOW = """\
1. Scope. Developer will build a five-page marketing website (Home, About, Services,
Blog, Contact) using the client's existing brand guidelines.
2. Revisions. Includes two rounds of design revisions per page.
3. Exclusions. E-commerce, copywriting, and ongoing maintenance are not included.
"""


class ContractFactory(DjangoModelFactory[Contract]):
    owner = SubFactory(UserFactory)
    client_name = Faker("company")
    title = "Marketing website"
    slug = Sequence(lambda n: f"contract-{n}")
    sow_text = SAMPLE_SOW
    hourly_rate = Decimal("80.00")

    class Meta:
        model = Contract


class ScopeCheckFactory(DjangoModelFactory[ScopeCheck]):
    contract = SubFactory(ContractFactory)
    request_text = "Can you also add a shop page so we can sell T-shirts?"

    class Meta:
        model = ScopeCheck

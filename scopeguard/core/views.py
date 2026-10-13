from django.conf import settings
from django.http import HttpResponse
from django.http import HttpResponseNotFound

SPA_INDEX = settings.APPS_DIR / "static" / "spa" / "index.html"


def spa_index(request, *args, **kwargs):
    """Serve the built React app; React Router handles the path client-side."""
    if not SPA_INDEX.exists():
        return HttpResponseNotFound(
            "Frontend not built. In development run `npm run dev` in frontend/ "
            "and open http://localhost:5173.",
            content_type="text/plain",
        )
    return HttpResponse(SPA_INDEX.read_text(), content_type="text/html")

from rest_framework.renderers import JSONRenderer

ENVELOPE_KEYS = {"data", "message", "errors"}


class EnvelopeJSONRenderer(JSONRenderer):
    """Wrap every API payload in the project-wide {data, message, errors} envelope."""

    def render(self, data, accepted_media_type=None, renderer_context=None):
        response = (renderer_context or {}).get("response")
        already_wrapped = isinstance(data, dict) and set(data) == ENVELOPE_KEYS
        no_content = response is not None and response.status_code == 204  # noqa: PLR2004

        if response is not None and not already_wrapped and not no_content:
            if response.status_code >= 400:  # noqa: PLR2004
                data = {"data": None, "message": "Request failed.", "errors": data}
            else:
                data = {"data": data, "message": "", "errors": None}

        return super().render(data, accepted_media_type, renderer_context)

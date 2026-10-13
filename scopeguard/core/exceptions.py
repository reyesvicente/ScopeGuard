from rest_framework.views import exception_handler


def envelope_exception_handler(exc, context):
    """Return DRF errors as {data: null, message, errors} with a readable message."""
    response = exception_handler(exc, context)
    if response is None:
        return None

    errors = response.data
    if isinstance(errors, dict) and "detail" in errors:
        message = str(errors["detail"])
    else:
        message = "Validation failed."

    response.data = {"data": None, "message": message, "errors": errors}
    return response

from .utils import get_geolocation_info
from django.http import JsonResponse
from django.utils.translation import activate, gettext_lazy as _
from django.views.decorators.http import require_http_methods

import logging
import requests

# Get a logger instance
logger = logging.getLogger(__name__)


@require_http_methods(["GET"])
def get_geolocation(request):
    """
    Fetch geolocation data for a client's IP address.

    Args:
        request (HttpRequest): The HTTP request object.
            - Query Params:
                - requested_info (str, optional): Comma-separated fields (e.g., "country,countryCode").
                - selected_language (str, optional): Language code (e.g., "fr" for French).

    Returns:
        JsonResponse: Geolocation data or error message.
            - Success: 200 + { "country": "France", "countryCode": "FR", ... }
            - Error: 400 + { "error": "message" }
    """
    client_ip = "Could not determine client IP"
    try:
        # Extract client IP (supports proxies like Nginx)
        client_ip = (
            request.META.get("HTTP_X_FORWARDED_FOR", "").split(",")[0].strip() or
            request.META.get("REMOTE_ADDR")
        )
        if not client_ip:
            raise ValueError("Could not determine client IP")

        # Parse query parameters
        requested_info = request.GET.get("requested_info", "country,countryCode")
        current_language = request.GET.get("selected_language") or 'fr'
        activate(current_language)

        # Fetch and validate geolocation data
        data = get_geolocation_info(client_ip, requested_info)
        if data.get("status") == "fail":
            raise requests.RequestException(data.get("message", "API error"))

        return JsonResponse(data)

    except Exception as e:
        logger.error("Geolocation error (IP: %s): %s", client_ip, str(e), exc_info=True)
        return JsonResponse({"error": _("Geolocation service unavailable. Try again later.")}, status=400, )


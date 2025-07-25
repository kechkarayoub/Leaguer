"""
Core views for the leaguer project.
"""

from django.http import JsonResponse
from django.utils.translation import activate, gettext_lazy as _
from django.views.decorators.cache import cache_page
from django.views.decorators.http import require_http_methods
from django.views.decorators.vary import vary_on_headers
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import AllowAny
from rest_framework.response import Response
from rest_framework import status
from .exceptions import GeolocationException
from .services import GeolocationService
import logging


logger = logging.getLogger(__name__)


@require_http_methods(["GET"])
@cache_page(60 * 15)  # Cache for 15 minutes
@vary_on_headers('User-Agent', 'Accept-Language')
def get_geolocation(request):
    """
    Fetch geolocation data for a client's IP address.

    Query Parameters:
        - requested_info (str, optional): Comma-separated fields (e.g., "country,countryCode")
        - selected_language (str, optional): Language code (e.g., "fr" for French)

    Returns:
        JsonResponse: Geolocation data or error message
        - Success: 200 + { "country": "France", "countryCode": "FR", ... }
        - Error: 400 + { "error": "message" }
    """
    client_ip = None
    try:
        # Get client IP address
        client_ip = GeolocationService.get_client_ip(request)
        
        # Parse query parameters
        requested_info = request.GET.get("requested_info", "country,countryCode")
        current_language = request.GET.get("selected_language", "fr")
        
        # Activate language
        activate(current_language)
        
        # Get geolocation data
        data = GeolocationService.get_geolocation_data(client_ip, requested_info)
        
        return JsonResponse(data, status=200)
        
    except GeolocationException as e:
        logger.warning(f"Geolocation error for IP {client_ip}: {str(e)}")
        return JsonResponse({
            "error": str(e)
        }, status=400)
        
    except Exception as e:
        logger.error(f"Unexpected error in geolocation view: {str(e)}", exc_info=True)
        return JsonResponse({
            "error": _("An unexpected error occurred")
        }, status=500)


@api_view(['GET'])
@permission_classes([AllowAny])
def health_check(request):
    """
    Health check endpoint for monitoring.
    
    Returns:
        Response: Health status
    """
    return Response({
        "status": "healthy",
        "message": "Service is running"
    }, status=status.HTTP_200_OK)


@api_view(['GET'])
@permission_classes([AllowAny])
def api_info(request):
    """
    API information endpoint.
    
    Returns:
        Response: API information
    """
    from django.conf import settings
    
    return Response({
        "application": settings.APPLICATION_NAME,
        "version": "1.0.0",
        "environment": settings.ENVIRONMENT,
        "languages": [lang[0] for lang in settings.LANGUAGES],
        "timezone": settings.TIME_ZONE,
    }, status=status.HTTP_200_OK)


@api_view(['POST'])
@permission_classes([AllowAny])
def contact_message_create(request):
    """
    Create a new contact message.
    
    POST /api/contact/
    
    Request Body:
        - name (str): Full name of the person
        - email (str): Email address for response
        - subject (str): Subject category (support, billing, feature, partnership, other)
        - message (str): The message content (min 10 characters)
    
    Returns:
        201: Message created successfully
        400: Validation errors
    """
    from .serializers import ContactMessageSerializer
    
    try:
        serializer = ContactMessageSerializer(data=request.data, context={'request': request})
        
        if serializer.is_valid():
            contact_message = serializer.save()
            
            # Log the contact message creation
            logger.info(f"Contact message created: ID {contact_message.id} from {contact_message.email}")
            
            return Response({
                'success': True,
                'message': _('Your message has been sent successfully. We will get back to you within 24 hours.'),
                'id': contact_message.id
            }, status=status.HTTP_201_CREATED)
        else:
            return Response({
                'success': False,
                'message': _('Please correct the errors below.'),
                'errors': serializer.errors
            }, status=status.HTTP_400_BAD_REQUEST)
            
    except Exception as e:
        logger.error(f"Error creating contact message: {str(e)}")
        return Response({
            'success': False,
            'message': _('An error occurred while sending your message. Please try again later.')
        }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


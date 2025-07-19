"""
Middleware for i18n_switcher app.
"""

from django.conf import settings
from django.utils import translation
from django.utils.deprecation import MiddlewareMixin
from .services import LanguageSwitchService, LanguagePreferenceService
import logging

logger = logging.getLogger(__name__)


class LanguageFromPathMiddleware(MiddlewareMixin):
    """
    Middleware to set language based on URL path prefix.
    
    This middleware checks if the URL starts with a language code
    and activates that language for the request.
    """
    
    def process_request(self, request):
        """
        Process the request to detect and activate language from path.
        """
        try:
            # Get current language from path
            current_language = LanguageSwitchService.get_current_language_from_path(request.path)
            
            if current_language:
                # Activate the language from the path
                translation.activate(current_language)
                request.LANGUAGE_CODE = current_language
                logger.debug(f"Language activated from path: {current_language}")
            else:
                # Try to get language from cookie preference
                cookie_language = LanguagePreferenceService.get_language_preference(request)
                
                if cookie_language and LanguageSwitchService.is_language_supported(cookie_language):
                    translation.activate(cookie_language)
                    request.LANGUAGE_CODE = cookie_language
                    logger.debug(f"Language activated from cookie: {cookie_language}")
                else:
                    # Fallback to detecting from request headers
                    detected_language = LanguageSwitchService.detect_language_from_request(request)
                    translation.activate(detected_language)
                    request.LANGUAGE_CODE = detected_language
                    logger.debug(f"Language activated from detection: {detected_language}")
                    
        except Exception as e:
            logger.error(f"Error in LanguageFromPathMiddleware: {str(e)}")
            # Fallback to default language
            translation.activate(settings.LANGUAGE_CODE)
            request.LANGUAGE_CODE = settings.LANGUAGE_CODE


class LanguageRedirectMiddleware(MiddlewareMixin):
    """
    Middleware to redirect to URLs with language prefix.
    
    This middleware redirects requests without language prefix
    to the same URL with the appropriate language prefix.
    """
    
    def __init__(self, get_response):
        self.get_response = get_response
        # Paths that should be excluded from language redirection
        self.exclude_paths = getattr(settings, 'LANGUAGE_REDIRECT_EXCLUDE_PATHS', [
            '/admin/',
            '/api/',
            '/static/',
            '/media/',
            '/i18n/',
        ])
    
    def process_request(self, request):
        """
        Process the request to redirect to language-prefixed URL if needed.
        """
        try:
            path = request.path
            
            # Skip excluded paths
            if any(path.startswith(exclude) for exclude in self.exclude_paths):
                return None
            
            # Check if path already has language prefix
            current_language = LanguageSwitchService.get_current_language_from_path(path)
            
            if not current_language:
                # Determine the language to use
                preferred_language = None
                
                # Try cookie preference first
                cookie_language = LanguagePreferenceService.get_language_preference(request)
                if cookie_language and LanguageSwitchService.is_language_supported(cookie_language):
                    preferred_language = cookie_language
                else:
                    # Detect from request
                    preferred_language = LanguageSwitchService.detect_language_from_request(request)
                
                # Build the new URL with language prefix
                if preferred_language:
                    new_url = LanguageSwitchService.switch_language_in_path(path, preferred_language)
                    
                    # Add query string if present
                    if request.GET:
                        query_string = request.GET.urlencode()
                        new_url = f"{new_url}?{query_string}"
                    
                    logger.info(f"Redirecting to language-prefixed URL: {path} -> {new_url}")
                    
                    from django.http import HttpResponseRedirect
                    return HttpResponseRedirect(new_url)
                    
        except Exception as e:
            logger.error(f"Error in LanguageRedirectMiddleware: {str(e)}")
            
        return None

"""
Enhanced views for i18n_switcher app.
"""

from django.conf import settings
from django.http import JsonResponse, HttpResponseRedirect, HttpResponseBadRequest
from django.shortcuts import redirect
from django.urls import reverse
from django.utils import translation
from django.utils.decorators import method_decorator
from django.views.decorators.cache import cache_page
from django.views.decorators.csrf import csrf_exempt
from django.views.decorators.http import require_http_methods
from django.views.generic import View
from django.contrib import messages
from django.utils.translation import gettext as _
from .services import LanguageSwitchService, LanguagePreferenceService
from .exceptions import InvalidPathException, UnsupportedLanguageException, LanguageDetectionException
import logging
import json


logger = logging.getLogger(__name__)


def switch_lang_code(path, language):
    """
    Legacy function for backward compatibility.
    
    :param path: the current path
    :param language: the new language
    :return: the full path with the new language if available
    """
    try:
        return LanguageSwitchService.switch_language_in_path(path, language)
    except (InvalidPathException, UnsupportedLanguageException) as e:
        raise Exception(str(e))


@require_http_methods(["GET", "POST"])
def switch_language(request):
    """
    Switch language and redirect to the new URL.
    Enhanced version with better error handling and services.
    """
    language = request.POST.get('language') or request.GET.get('language')
    next_url = request.POST.get('next') or request.GET.get('next') or request.META.get('HTTP_REFERER', '/')
    
    # Log the language switch attempt
    logger.info(f"Language switch requested: {language} from {request.META.get('HTTP_REFERER', 'unknown')}")
    
    try:
        # Validate the language
        LanguageSwitchService.validate_language(language)
        
        # Switch the language in the URL
        new_url = LanguageSwitchService.switch_language_in_path(next_url, language)
        
        # Activate the language
        translation.activate(language)
        
        # Create response
        response = HttpResponseRedirect(new_url)
        
        # Set language preference in cookie
        LanguagePreferenceService.set_language_preference(request, response, language)
        
        # Add success message
        messages.success(request, _('Language switched successfully'))
        
        logger.info(f"Language switched to {language}, redirecting to {new_url}")
        return response
        
    except UnsupportedLanguageException as e:
        logger.warning(f"Unsupported language requested: {language}")
        messages.error(request, _('Unsupported language selected'))
        return HttpResponseRedirect(next_url)
        
    except InvalidPathException as e:
        logger.error(f"Invalid path in language switch: {next_url}")
        messages.error(request, _('Invalid URL for language switch'))
        return HttpResponseRedirect('/')
        
    except Exception as e:
        logger.error(f"Unexpected error in language switch: {str(e)}")
        messages.error(request, _('Language switch failed'))
        return HttpResponseRedirect(next_url)


class LanguageApiView(View):
    """
    REST API view for language operations.
    """
    
    @method_decorator(cache_page(300))  # Cache for 5 minutes
    def get(self, request):
        """
        Get available languages and current language info.
        """
        try:
            current_path = request.GET.get('path', '/')
            current_language = LanguageSwitchService.get_current_language_from_path(current_path)
            
            if not current_language:
                current_language = LanguageSwitchService.detect_language_from_request(request)
            
            # Build language switch URLs
            language_urls = LanguageSwitchService.build_language_switch_urls(current_path)
            
            return JsonResponse({
                'status': 'success',
                'data': {
                    'current_language': current_language,
                    'supported_languages': LanguageSwitchService.get_supported_languages(),
                    'language_names': LanguageSwitchService.get_language_names(),
                    'language_urls': language_urls,
                    'language_preference': LanguagePreferenceService.get_language_preference(request)
                }
            })
            
        except LanguageDetectionException as e:
            logger.error(f"Language detection failed in API: {str(e)}")
            return JsonResponse({
                'status': 'error',
                'message': 'Language detection failed'
            }, status=500)
            
        except Exception as e:
            logger.error(f"Unexpected error in language API: {str(e)}")
            return JsonResponse({
                'status': 'error',
                'message': 'Internal server error'
            }, status=500)
    
    @method_decorator(csrf_exempt)
    def post(self, request):
        """
        Switch language via API.
        """
        try:
            # Parse JSON body
            try:
                data = json.loads(request.body.decode('utf-8'))
            except json.JSONDecodeError:
                return JsonResponse({
                    'status': 'error',
                    'message': 'Invalid JSON data'
                }, status=400)
            
            language = data.get('language')
            current_path = data.get('path', '/')
            
            if not language:
                return JsonResponse({
                    'status': 'error',
                    'message': 'Language code is required'
                }, status=400)
            
            # Validate and switch language
            LanguageSwitchService.validate_language(language)
            new_url = LanguageSwitchService.switch_language_in_path(current_path, language)
            
            # Activate language
            translation.activate(language)
            
            logger.info(f"Language switched to {language} via API")
            
            return JsonResponse({
                'status': 'success',
                'data': {
                    'language': language,
                    'new_url': new_url,
                    'message': 'Language switched successfully'
                }
            })
            
        except UnsupportedLanguageException as e:
            logger.warning(f"Unsupported language in API: {language}")
            return JsonResponse({
                'status': 'error',
                'message': f'Unsupported language: {language}'
            }, status=400)
            
        except InvalidPathException as e:
            logger.error(f"Invalid path in API: {current_path}")
            return JsonResponse({
                'status': 'error',
                'message': 'Invalid URL path'
            }, status=400)
            
        except Exception as e:
            logger.error(f"Unexpected error in language API: {str(e)}")
            return JsonResponse({
                'status': 'error',
                'message': 'Internal server error'
            }, status=500)


class LanguageDetectionView(View):
    """
    View for detecting user's preferred language.
    """
    
    def get(self, request):
        """
        Detect and return user's preferred language.
        """
        try:
            detected_language = LanguageSwitchService.detect_language_from_request(request)
            cookie_language = LanguagePreferenceService.get_language_preference(request)
            
            return JsonResponse({
                'status': 'success',
                'data': {
                    'detected_language': detected_language,
                    'cookie_language': cookie_language,
                    'current_language': translation.get_language(),
                    'supported_languages': LanguageSwitchService.get_supported_languages()
                }
            })
            
        except LanguageDetectionException as e:
            logger.error(f"Language detection failed: {str(e)}")
            return JsonResponse({
                'status': 'error',
                'message': 'Language detection failed'
            }, status=500)
            
        except Exception as e:
            logger.error(f"Unexpected error in language detection: {str(e)}")
            return JsonResponse({
                'status': 'error',
                'message': 'Internal server error'
            }, status=500)


@cache_page(300)  # Cache for 5 minutes
def language_info(request):
    """
    Get language information for the current request.
    """
    try:
        current_path = request.GET.get('path', request.path)
        
        return JsonResponse({
            'status': 'success',
            'data': {
                'current_language': translation.get_language(),
                'current_path': current_path,
                'path_language': LanguageSwitchService.get_current_language_from_path(current_path),
                'supported_languages': LanguageSwitchService.get_supported_languages(),
                'language_names': LanguageSwitchService.get_language_names(),
                'is_rtl': translation.get_language_bidi(),
                'language_urls': LanguageSwitchService.build_language_switch_urls(current_path)
            }
        })
        
    except Exception as e:
        logger.error(f"Error getting language info: {str(e)}")
        return JsonResponse({
            'status': 'error',
            'message': 'Failed to get language information'
        }, status=500)

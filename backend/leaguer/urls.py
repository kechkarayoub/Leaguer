"""
URL configuration for leaguer project.
"""

from django.conf import settings
from django.conf.urls.i18n import i18n_patterns
from django.conf.urls.static import static
from django.contrib import admin
from django.urls import include, path, re_path
from .views import get_geolocation, health_check, api_info


# API endpoints (no i18n)
api_patterns = [
    path('api/health/', health_check, name='health_check'),
    path('api/info/', api_info, name='api_info'),
    path('api/geolocation/', get_geolocation, name="geolocation_info"),
    path('accounts/', include('accounts.urls')),
]

# Main URL patterns
urlpatterns = [
    path('', include(api_patterns)),
    path('i18n/', include('django.conf.urls.i18n')),
] + static(settings.MEDIA_URL, document_root=settings.MEDIA_ROOT)

# Internationalized patterns
urlpatterns += i18n_patterns(
    re_path(r'^admin/', admin.site.urls),
    prefix_default_language=True
)

# Add debug toolbar URLs in development
if settings.DEBUG and hasattr(settings, 'INTERNAL_IPS') and 'debug_toolbar' in settings.INSTALLED_APPS:
    try:
        import debug_toolbar
        urlpatterns = [
            path('__debug__/', include(debug_toolbar.urls)),
        ] + urlpatterns
    except ImportError:
        pass

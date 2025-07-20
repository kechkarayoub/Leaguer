"""
ASGI config for leaguer project.

It exposes the ASGI callable as a module-level variable named ``application``.

For more information on this file, see
https://docs.djangoproject.com/en/5.1/howto/deployment/asgi/
"""

from channels.auth import AuthMiddlewareStack
from channels.routing import ProtocolTypeRouter, URLRouter
from django.core.asgi import get_asgi_application
import os


# Set the default Django settings module for the 'asgi' application
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'leaguer.settings')


# ✅ Initialize Django before importing any routing/consumers
django_asgi_app = get_asgi_application()


import leaguer.ws_routing

# Define the ASGI application with support for both HTTP and WebSocket protocols
application = ProtocolTypeRouter({
    # Route traditional HTTP requests to Django's ASGI application
    "http": django_asgi_app,
    # Route WebSocket requests to the Channels AuthMiddleware and URLRouter
    "websocket": AuthMiddlewareStack(
        URLRouter(
            leaguer.ws_routing.websocket_urlpatterns # WebSocket URL patterns
        )
    ),
})

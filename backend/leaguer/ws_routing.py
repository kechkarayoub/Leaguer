from . import ws_consumers
from django.urls import re_path


# WebSocket URL routing for the profile feature
# This will route WebSocket connections to the appropriate consumer based on the user ID
websocket_urlpatterns = [
    re_path(r'ws/profile/(?P<user_id>\w+)/$', ws_consumers.ProfileConsumer.as_asgi()),
]

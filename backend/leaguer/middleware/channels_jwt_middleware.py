

# Import necessary Django and Channels modules
from django.conf import settings
from django.contrib.auth import get_user_model
from django.contrib.auth.models import AnonymousUser
from urllib.parse import parse_qs
from channels.db import database_sync_to_async
from channels.middleware import BaseMiddleware
from rest_framework_simplejwt.backends import TokenBackend


# Get the custom user model
User = get_user_model()


# Async function to get user from JWT token
@database_sync_to_async
def get_user_from_token(token):
    try:
        # Decode the JWT token using SimpleJWT's TokenBackend
        token_backend = TokenBackend(algorithm="HS256", signing_key=settings.SECRET_KEY)
        payload = token_backend.decode(token, verify=True)
        user_id = payload.get("user_id")
        if user_id is None:
            # If no user_id in token, return AnonymousUser
            return AnonymousUser()
        try:
            # Try to fetch the user from the database
            return User.objects.get(id=user_id)
        except User.DoesNotExist:
            # If user does not exist, return AnonymousUser
            return AnonymousUser()
    except Exception:
        # If token is invalid or any error occurs, return AnonymousUser
        return AnonymousUser()


# Custom Channels middleware to authenticate user from JWT in query string
class QueryAuthMiddleware(BaseMiddleware):
    async def __call__(self, scope, receive, send):
        # Parse the query string from the WebSocket connection
        query_string = scope.get("query_string", b"").decode()
        query_params = parse_qs(query_string)
        # Extract the token from query params (e.g., ws://.../?token=...)
        token_list = query_params.get("token")
        token = token_list[0] if token_list else None
        # Set the user in scope based on the token (or AnonymousUser if not present/invalid)
        scope["user"] = await get_user_from_token(token) if token else AnonymousUser()
        # Continue processing the connection
        return await super().__call__(scope, receive, send)


# Helper to use the custom middleware in ASGI application
def QueryAuthMiddlewareStack(inner):
    return QueryAuthMiddleware(inner)

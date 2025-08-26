

# Import necessary Django and Channels modules
from django.conf import settings
from django.contrib.auth import get_user_model
from django.contrib.auth.models import AnonymousUser
from urllib.parse import parse_qs
from channels.db import database_sync_to_async
from channels.middleware import BaseMiddleware
from rest_framework_simplejwt.backends import TokenBackend
from rest_framework_simplejwt.token_blacklist.models import BlacklistedToken, OutstandingToken
import time


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
        parent_jti = payload.get("parent_jti")  # JWT ID for blacklist checking
        current_time = int(time.time())  # current Unix timestamp
        
        if payload['exp'] < current_time:
            return AnonymousUser(), "token_expired"
        elif user_id is None:
            # If no user_id in token, return AnonymousUser
            return AnonymousUser(), "invalid_token"
        elif parent_jti is None:
            # If no parent_jti in token, return AnonymousUser
            return AnonymousUser(), "invalid_token"
        
        # Check if token is blacklisted
        try:
            outstanding_token = OutstandingToken.objects.get(jti=parent_jti)
            if BlacklistedToken.objects.filter(token=outstanding_token).exists():
                return AnonymousUser(), "token_blacklisted"
        except OutstandingToken.DoesNotExist:
            # Token not found in outstanding tokens, might be invalid
            return AnonymousUser(), "invalid_token"
        
        try:
            # Try to fetch the user from the database
            user = User.objects.get(id=user_id)
            return user, "valid"
        except User.DoesNotExist:
            # If user does not exist, return AnonymousUser
            return AnonymousUser(), "user_not_found"
    except Exception as e:
        # Check if it's a token expiration error
        if "signature has expired" in str(e).lower():
            return AnonymousUser(), "token_expired"
        # If token is invalid or any error occurs, return AnonymousUser
        return AnonymousUser(), "invalid_token"


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
        if token:
            user, error_reason = await get_user_from_token(token)
            scope["user"] = scope.get("user") or user
            scope["auth_error"] = error_reason if error_reason != "valid" else None
        else:
            scope["user"] = scope.get("user") or AnonymousUser()
            scope["auth_error"] = "no_token"
        # Continue processing the connection
        return await super().__call__(scope, receive, send)


# Helper to use the custom middleware in ASGI application
def QueryAuthMiddlewareStack(inner):
    return QueryAuthMiddleware(inner)

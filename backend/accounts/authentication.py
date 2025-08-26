"""
Custom JWT Authentication with Parent Token Tracking

This module provides enhanced JWT authentication that links access tokens
to their parent refresh tokens for device-specific logout behavior.
"""

from rest_framework_simplejwt.authentication import JWTAuthentication as BaseJWTAuthentication
from rest_framework_simplejwt.exceptions import InvalidToken, TokenError
from rest_framework_simplejwt.token_blacklist.models import BlacklistedToken, OutstandingToken
from rest_framework_simplejwt.tokens import UntypedToken
from rest_framework import exceptions
from django.contrib.auth import get_user_model
import logging

logger = logging.getLogger(__name__)
User = get_user_model()


class JWTAuthentication(BaseJWTAuthentication):
    """
    Custom JWT Authentication that tracks parent refresh tokens.
    
    BEST PRACTICE SOLUTION:
    - Add 'parent_jti' claim to access tokens during generation
    - This links access tokens to their parent refresh token
    - Check if parent refresh token is blacklisted
    - Simple, reliable, no external dependencies
    """
    
    def authenticate(self, request):
        """
        Authenticate the request and check if parent refresh token is blacklisted.
        """
        result = super().authenticate(request)
        
        if result is None:
            return result
            
        user, validated_token = result
        # Check if the parent refresh token is blacklisted
        if self.is_parent_token_blacklisted(validated_token):
            logger.warning(f"User {user.username} attempted to use access token from blacklisted parent session")
            raise exceptions.AuthenticationFailed(
                'Device session has been terminated. Please log in again.',
                code='device_session_terminated'
            )
        
        return user, validated_token
    
    def is_parent_token_blacklisted(self, validated_token):
        """
        Check if the parent refresh token that generated this access token is blacklisted.
        
        This uses the 'parent_jti' claim that we add to access tokens during generation.
        This claim contains the JTI of the refresh token that created the access token.
        
        Args:
            validated_token: The decoded JWT access token
            
        Returns:
            bool: True if parent refresh token is blacklisted, False otherwise
        """
        try:
            # Get the parent JTI from the access token
            parent_jti = validated_token.get('parent_jti')
            
            if not parent_jti:
                # If no parent_jti, this access token wasn't generated with our custom logic
                # Fall back to standard behavior (allow the request)
                logger.debug("No parent_jti found in access token, allowing request")
                return False
            
            # Check if the parent refresh token is blacklisted
            try:
                outstanding_token = OutstandingToken.objects.get(jti=parent_jti)
                is_blacklisted = BlacklistedToken.objects.filter(token=outstanding_token).exists()
                
                if is_blacklisted:
                    logger.info(f"Parent refresh token {parent_jti} is blacklisted")
                    return True
                    
                return False
                
            except OutstandingToken.DoesNotExist:
                # Parent token not found - might be expired or cleaned up
                logger.debug(f"Parent token with JTI {parent_jti} not found, allowing request")
                return False
                
        except Exception as e:
            logger.error(f"Error checking parent token blacklist status: {str(e)}")
            # In case of error, allow the request (fail open for availability)
            return False
    def is_user_logged_out(self, validated_token):
        """
        Check if the parent refresh token that generated this access token is blacklisted.
        
        This uses the 'parent_jti' claim that we add to access tokens during generation.
        This claim contains the JTI of the refresh token that created the access token.
        
        Args:
            validated_token: The decoded JWT access token
            
        Returns:
            bool: True if parent refresh token is blacklisted, False otherwise
        """
        return self.is_parent_token_blacklisted(validated_token)

"""
Test Custom JWT Authentication

Tests that the custom JWT authentication properly handles user logout detection.
"""

import unittest
from datetime import datetime, timezone, timedelta
from django.test import TestCase
from django.contrib.auth import get_user_model
from django.contrib.auth.models import AnonymousUser
from rest_framework_simplejwt.tokens import AccessToken
from accounts.tokens import RefreshToken
from rest_framework_simplejwt.token_blacklist.models import BlacklistedToken, OutstandingToken
from rest_framework.test import APIRequestFactory
from rest_framework import exceptions
from accounts.authentication import JWTAuthentication

User = get_user_model()


class CustomJWTAuthenticationTests(TestCase):
    """Test cases for custom JWT authentication with user logout detection."""
    
    def setUp(self):
        """Set up test data."""
        self.user = User.objects.create_user(
            email='testuser@example.com',
            password='testpass123',
            username='testuser'
        )
        self.auth = JWTAuthentication()
        self.factory = APIRequestFactory()
    
    def test_authenticate_valid_token(self):
        """Test authentication with valid token."""
        refresh_token = RefreshToken.for_user(self.user)
        access_token = refresh_token.access_token
        
        request = self.factory.get('/test/', HTTP_AUTHORIZATION=f'Bearer {access_token}')
        result = self.auth.authenticate(request)
        
        self.assertIsNotNone(result)
        authenticated_user, validated_token = result
        self.assertEqual(authenticated_user.id, self.user.id)
    
    def test_authenticate_blacklisted_token(self):
        """Test authentication with user who has been logged out."""
        refresh_token = RefreshToken.for_user(self.user)
        access_token = refresh_token.access_token
        
        # Blacklist the refresh token to simulate logout
        outstanding_token = OutstandingToken.objects.get(jti=refresh_token['jti'])
        BlacklistedToken.objects.create(token=outstanding_token)
        
        request = self.factory.get('/test/', HTTP_AUTHORIZATION=f'Bearer {access_token}')
        
        with self.assertRaises(exceptions.AuthenticationFailed) as context:
            self.auth.authenticate(request)
        
        self.assertIn('Device session has been terminated. Please log in again.', str(context.exception))
    
    def test_authenticate_no_token(self):
        """Test authentication with no token."""
        request = self.factory.get('/test/')
        result = self.auth.authenticate(request)
        
        self.assertIsNone(result)
    
    def test_is_user_logged_out_false(self):
        """Test logout checking for active user."""
        refresh_token = RefreshToken.for_user(self.user)
        access_token = refresh_token.access_token
        
        # Decode token for testing
        from rest_framework_simplejwt.backends import TokenBackend
        from django.conf import settings
        
        token_backend = TokenBackend(algorithm="HS256", signing_key=settings.SECRET_KEY)
        payload = token_backend.decode(str(access_token), verify=True)
        
        is_logged_out = self.auth.is_user_logged_out(payload)
        self.assertFalse(is_logged_out)
    
    def test_is_user_logged_out_true(self):
        """Test logout checking for user who has been logged out."""
        refresh_token = RefreshToken.for_user(self.user)
        access_token = refresh_token.access_token
        
        # Blacklist the refresh token to simulate logout
        outstanding_token = OutstandingToken.objects.get(jti=refresh_token['jti'])
        BlacklistedToken.objects.create(token=outstanding_token)
        
        # Decode token for testing
        from rest_framework_simplejwt.backends import TokenBackend
        from django.conf import settings
        
        token_backend = TokenBackend(algorithm="HS256", signing_key=settings.SECRET_KEY)
        payload = token_backend.decode(str(access_token), verify=True)
        
        is_logged_out = self.auth.is_user_logged_out(payload)
        self.assertTrue(is_logged_out)
    
    # def test_is_user_logged_out_old_token_before_logout(self):
    #     """Test that tokens issued before logout are detected as invalid."""
    #     # Create a token
    #     refresh_token = RefreshToken.for_user(self.user)
    #     access_token = refresh_token.access_token
        
    #     # Simulate time passing and then logout
    #     import time
    #     time.sleep(1)  # Ensure different timestamps
        
    #     # Create and blacklist a new token to simulate logout
    #     new_refresh_token = RefreshToken.for_user(self.user)
    #     outstanding_token = OutstandingToken.objects.get(jti=new_refresh_token['jti'])
    #     BlacklistedToken.objects.create(token=outstanding_token)
        
    #     # Decode original token for testing
    #     from rest_framework_simplejwt.backends import TokenBackend
    #     from django.conf import settings
        
    #     token_backend = TokenBackend(algorithm="HS256", signing_key=settings.SECRET_KEY)
    #     payload = token_backend.decode(str(access_token), verify=True)
        
    #     is_logged_out = self.auth.is_user_logged_out(payload)
    #     self.assertTrue(is_logged_out)  # Should be invalid because user logged out after token creation
    
    # def test_is_user_logged_out_no_user_id(self):
    #     """Test logout checking for token without user ID."""
    #     # Create a token-like payload without user_id
    #     payload = {'iat': datetime.now(timezone.utc).timestamp()}
        
    #     is_logged_out = self.auth.is_user_logged_out(payload)
    #     self.assertTrue(is_logged_out)  # Should return True for invalid payload
    
    def tearDown(self):
        """Clean up test data."""
        self.user.delete()


if __name__ == '__main__':
    unittest.main()

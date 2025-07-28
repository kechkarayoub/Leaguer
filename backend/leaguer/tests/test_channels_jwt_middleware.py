import unittest
from django.test import TestCase
from django.contrib.auth import get_user_model
from django.contrib.auth.models import AnonymousUser
from rest_framework_simplejwt.tokens import AccessToken
from leaguer.middleware.channels_jwt_middleware import get_user_from_token
from channels.db import database_sync_to_async
import asyncio

User = get_user_model()

class GetUserFromTokenTests(TestCase):
    def test_get_user_from_token_valid(self):
        async def run():
            user = await database_sync_to_async(User.objects.create_user)(email='testuser@example.com', password='testpass123', username='testuser')
            token = str(AccessToken.for_user(user))
            result = await get_user_from_token(token)
            self.assertEqual(result.id, user.id)
        asyncio.get_event_loop().run_until_complete(run())

    def test_get_user_from_token_invalid(self):
        async def run():
            invalid_token = 'invalid.token.value'
            result = await get_user_from_token(invalid_token)
            self.assertIsInstance(result, AnonymousUser)
        asyncio.get_event_loop().run_until_complete(run())

    def test_get_user_from_token_no_user(self):
        async def run():
            token = AccessToken()
            token['user_id'] = 999999  # unlikely to exist
            result = await get_user_from_token(str(token))
            self.assertIsInstance(result, AnonymousUser)
        asyncio.get_event_loop().run_until_complete(run())

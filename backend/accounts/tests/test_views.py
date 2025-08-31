"""Test accounts views"""
import json
from unittest.mock import patch

from django.contrib.auth import authenticate
from django.contrib.auth.tokens import default_token_generator
from django.core.files.uploadedfile import SimpleUploadedFile
from django.test import TestCase
from django.urls import reverse
from django.utils.encoding import force_bytes
from django.utils.http import urlsafe_base64_encode
from django.utils.timezone import now
from rest_framework import status
from rest_framework.request import Request
from rest_framework.test import APIClient, APIRequestFactory

from accounts.models import User
from accounts.utils import send_password_reset_email
from leaguer.utils import generate_random_code


class UpdateProfileViewTest(TestCase):
    """Test cases for the UpdateProfileView."""
    def setUp(self):
        # Create a test user
        self.user = User.objects.create_user(
            username='testuser', email='testuser@example.com',
            password='testpassword', user_phone_number='+212672937219')
        self.user2 = User.objects.create_user(
            username='testuser2', email='testuser2@example.com',
            password='testpassword', user_phone_number='+212612505257')
        self.user3 = User.objects.create_user(
            username='testuser3', email='testuser3@example.com',
            password='testpassword', user_phone_number='+21312345678')
        # The URL for the update profile view (you should change this to match your URL pattern)
        self.url = reverse('update-profile')
        # Create an APIClient instance for testing
        self.client = APIClient()
    def authenticate_user(self):
        """Authenticate user"""
        # Log in the test user for authentication
        self.client.force_authenticate(user=self.user)
    def authenticate_user2(self):
        """Authenticate user2"""
        # Log in the test user for authentication
        self.client.force_authenticate(user=self.user2)
    def authenticate_user3(self):
        """Authenticate user3"""
        # Log in the test user for authentication
        self.client.force_authenticate(user=self.user3)
    def test_update_password(self):
        """Test updating password"""
        # Log in first
        self.authenticate_user()
        # Prepare the data for the request
        data = {
            'action': 'update_password',
            'current_password': 'testpassword',
            'new_password': 'newpassword',
            'current_language': 'en'
        }
        # Make a POST request to update the profile
        response = self.client.put(self.url, data)
        # Assert that the response status code is HTTP 200 OK
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        data = json.loads(response.content.decode('utf-8'))
        message = data.get("message")
        self.assertEqual(message, "Your password has been updated successfully.")
        self.assertTrue(data.get("success"))
        self.assertFalse(data.get("wrong_password"))
        # Assert that the user's profile was updated in the database
        self.user.refresh_from_db()
        # inside your test method
        factory = APIRequestFactory()
        # fake request just to satisfy the `authenticate` function
        fake_request = factory.post(self.url)
        request = Request(fake_request)
        not_authenticated_user = authenticate(
            request, username=self.user.username, password="testpassword")
        self.assertIsNone(not_authenticated_user)
        authenticated_user = authenticate(
            request, username=self.user.username, password="newpassword")
        self.assertIsNotNone(authenticated_user)
    def test_update_profile_with_password(self):
        """Test updating profile with password change"""
        # Log in first
        self.authenticate_user()
        # Prepare the data for the request
        data = {
            'action': 'update_profile',
            'first_name': 'John',
            'last_name': 'Doe',
            'user_birthday': '1990-01-01',
            'user_gender': 'male',
            'email': 'testuser@example.com',
            'username': 'testuser',
            'user_cin': 'CN123456',
            'user_initials_bg_color': '#00FFFF',
            'current_password': 'testpassword',
            'new_password': 'newpassword',
            'update_password': "true",
            'image_updated': "false",
            'current_language': 'en'
        }
        # Make a POST request to update the profile
        response = self.client.put(self.url, data)
        # Assert that the response status code is HTTP 200 OK
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        # Assert that the user's profile was updated in the database
        self.user.refresh_from_db()
        self.assertEqual(self.user.first_name, 'John')
        self.assertEqual(self.user.last_name, 'Doe')
        self.assertEqual(self.user.user_initials_bg_color, '#00FFFF')
        self.assertEqual(self.user.user_cin, data.get('user_cin'))
        # inside your test method
        factory = APIRequestFactory()
        # fake request just to satisfy the `authenticate` function
        fake_request = factory.post(self.url)
        request = Request(fake_request)
        not_authenticated_user = authenticate(
            request, username=self.user.username, password="testpassword")
        self.assertIsNone(not_authenticated_user)
        authenticated_user = authenticate(
            request, username=self.user.username, password="newpassword")
        self.assertIsNotNone(authenticated_user)
    def test_update_profile_with_invalid_data(self):
        """Test updating profile with invalid data"""
        # Log in first
        self.authenticate_user()
        # Prepare the data for the request
        data = {
            'action': 'update_profile',
            'first_name': '',
            'last_name': '',
            'user_birthday': 'wrong date',
            'user_gender': '',
            'email': 'testuser@example.com',
            'username': 'testuser',
            'user_initials_bg_color': '#00FFFF',
            'current_password': 'testpassword',
            'current_language': 'en'
        }
        # Make a POST request to update the profile
        response = self.client.put(self.url, data)
        # Assert that the response status code is HTTP 409 OK
        self.assertEqual(response.status_code, status.HTTP_409_CONFLICT)
        data = json.loads(response.content.decode('utf-8'))
        message = data.get("message")
        self.assertEqual(message, "Your profile could not be updated due to the "
                         "errors listed above. Please correct them and try again.")
        self.assertIsNotNone(data.get('errors', {}).get('first_name'))
        self.assertIsNotNone(data.get('errors', {}).get('last_name'))
        self.assertIsNotNone(data.get('errors', {}).get('user_birthday'))
        self.assertFalse(data.get("success"))
    def test_update_profile_without_password(self):
        """Test updating profile without changing password"""
        # Log in first
        self.authenticate_user2()
        # Prepare the data for the request
        data = {
            'action': 'update_profile',
            'first_name': 'John2',
            'last_name': 'Doe2',
            'user_birthday': '1990-01-01',
            'user_gender': 'male',
            'email': 'testuser2@example.com',
            'username': 'testuser2',
            'user_cin': 'CN123457',
            'user_initials_bg_color': '#00FFFF',
            'current_password': 'testpassword',
            'new_password': 'newpassword',
            'update_password': "false",
            'image_updated': "false",
            'current_language': 'en'
        }
        self.assertIsNotNone(self.user2.user_phone_number)
        # Make a POST request to update the profile
        response = self.client.put(self.url, data)
        # Assert that the response status code is HTTP 200 OK
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        # Assert that the user's profile was updated in the database
        self.user2.refresh_from_db()
        self.assertEqual(self.user2.first_name, 'John2')
        self.assertEqual(self.user2.last_name, 'Doe2')
        self.assertEqual(self.user2.user_cin, data.get('user_cin'))
        self.assertIsNone(self.user2.user_phone_number)
        # inside your test method
        factory = APIRequestFactory()
        # fake request just to satisfy the `authenticate` function
        fake_request = factory.post(self.url)
        request = Request(fake_request)
        not_authenticated_user = authenticate(
            request, username=self.user2.username, password="testpassword")
        self.assertIsNotNone(not_authenticated_user)
        authenticated_user = authenticate(
            request, username=self.user2.username, password="newpassword")
        self.assertIsNone(authenticated_user)
    def test_update_profile_with_same_phone_number(self):
        """Test updating profile with the same phone number"""
        # Log in first
        self.authenticate_user()
        # Prepare the data for the request
        data = {
            'action': 'update_profile',
            'first_name': 'John2',
            'last_name': 'Doe2',
            'user_birthday': '1990-01-01',
            'user_gender': 'male',
            'email': 'testuser@example.com',
            'username': 'testuser',
            'user_initials_bg_color': '#00FFFF',
            'current_password': 'testpassword',
            'new_password': 'newpassword',
            'update_password': "false",
            'image_updated': "false",
            'current_language': 'en',
            'user_phone_number': '+212672937219',
        }
        self.assertEqual(self.user.user_phone_number, '+212672937219')
        # Make a POST request to update the profile
        response = self.client.put(self.url, data)
        # Assert that the response status code is HTTP 200 OK
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        # Assert that the user's profile was updated in the database
        self.user.refresh_from_db()
        self.assertEqual(self.user.first_name, 'John2')
        self.assertEqual(self.user.last_name, 'Doe2')
        self.assertEqual(self.user.user_phone_number, '+212672937219')
    def test_update_profile_with_different_phone_number(self):
        """Test updating profile with a different phone number"""
        # Log in first
        self.authenticate_user3()
        # Prepare the data for the request
        data = {
            'action': 'update_profile',
            'first_name': 'John2',
            'last_name': 'Doe2',
            'user_birthday': '1990-01-01',
            'user_gender': 'male',
            'email': 'testuser3@example.com',
            'username': 'testuser3',
            'user_initials_bg_color': '#00FFFF',
            'current_password': 'testpassword',
            'new_password': 'newpassword',
            'update_password': "false",
            'image_updated': "false",
            'current_language': 'en',
            'user_phone_number': '+21312345699',
        }
        self.assertEqual(self.user3.user_phone_number, '+21312345678')
        # Make a POST request to update the profile
        response = self.client.put(self.url, data)
        # Assert that the response status code is HTTP 200 OK
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        # Assert that the user's profile was updated in the database
        self.user3.refresh_from_db()
        self.assertEqual(self.user3.first_name, 'John2')
        self.assertEqual(self.user3.last_name, 'Doe2')
        self.assertEqual(self.user3.user_phone_number, '+21312345699')
    def test_update_profile_with_existing_cin(self):
        """Test updating profile with existing CIN"""
        # Log in user first
        self.authenticate_user()
        # Prepare the data for the request
        data1 = {
            'action': 'update_profile',
            'first_name': 'John2',
            'last_name': 'Doe2',
            'user_birthday': '1990-01-01',
            'user_gender': 'male',
            'email': 'testuser@example.com',
            'username': 'testuser',
            'user_cin': 'CN123455',
            'user_initials_bg_color': '#00FFFF',
            'current_password': 'testpassword',
            'new_password': 'newpassword',
            'update_password': "false",
            'image_updated': "false",
            'current_language': 'en',
            'user_phone_number': '+212672937219',
        }
        data3 = {
            'action': 'update_profile',
            'first_name': 'John2',
            'last_name': 'Doe2',
            'user_birthday': '1990-01-01',
            'user_gender': 'male',
            'email': 'testuser3@example.com',
            'username': 'testuser3',
            'user_cin': 'CN123455',
            'user_initials_bg_color': '#00FFFF',
            'current_password': 'testpassword',
            'new_password': 'newpassword',
            'update_password': "false",
            'image_updated': "false",
            'current_language': 'en',
            'user_phone_number': '+21312345699',
        }
        # Make a POST request to update the profile
        response = self.client.put(self.url, data1)
        # Assert that the response status code is HTTP 200 OK
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        # Assert that the user's profile was updated in the database
        self.user.refresh_from_db()
        self.assertEqual(self.user.user_cin, data1.get('user_cin'))
        # Log in user3 first
        self.authenticate_user3()
        # Make a POST request to update the profile
        response = self.client.put(self.url, data3)
        self.assertEqual(response.status_code, status.HTTP_409_CONFLICT)
        self.assertFalse(response.json()['success'])
        self.assertIn('errors', response.json())
        # Assert that the user's profile was updated in the database
        self.user3.refresh_from_db()
        self.assertNotEqual(self.user3.user_cin, data3.get('user_cin'))
    def test_update_password_invalid_password(self):
        """Test updating password with invalid current password"""
        # Log in first
        self.authenticate_user3()
        # Prepare the data for the request
        data = {
            'action': 'update_password',
            'current_password': 'wrongpassword',
            'new_password': 'newpassword',
            'current_language': 'en'
        }
        # Make a POST request to update the profile
        response = self.client.put(self.url, data)
        # Assert that the response status code is HTTP 200 OK
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        data = json.loads(response.content.decode('utf-8'))
        message = data.get("message")
        self.assertEqual(message, "Your password update failed. Please check your "
                         "current password and try again.")
        self.assertTrue(data.get("success"))
        self.assertTrue(data.get("wrong_password"))
        # inside your test method
        factory = APIRequestFactory()
        # fake request just to satisfy the `authenticate` function
        fake_request = factory.post(self.url)
        request = Request(fake_request)
        not_authenticated_user = authenticate(
            request, username=self.user3.username, password="testpassword")
        self.assertIsNotNone(not_authenticated_user)
        authenticated_user = authenticate(
            request, username=self.user3.username, password="newpassword")
        self.assertIsNone(authenticated_user)
    def test_update_profile_with_invalid_password(self):
        """Test updating profile with invalid current password"""
        # Log in first
        self.authenticate_user3()
        # Prepare the data for the request
        data = {
            'action': 'update_profile',
            'first_name': 'John',
            'last_name': 'Doe',
            'user_birthday': '1990-01-01',
            'user_gender': 'male',
            'email': 'testuser@example.com',
            'username': 'testuser',
            'user_initials_bg_color': '#00FFFF',
            'current_password': 'wrongpassword',
            'new_password': 'newpassword',
            'update_password': "true",
            'image_updated': "false",
            'current_language': 'en'
        }
        # Make a POST request to update the profile
        response = self.client.put(self.url, data)
        # Assert that the response status code is HTTP 200 OK
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        data = json.loads(response.content.decode('utf-8'))
        message = data.get("message")
        self.assertEqual(message, "Your profile has been updated successfully.")
        self.assertTrue(data.get("success"))
        self.assertTrue(data.get("wrong_password"))
        # inside your test method
        factory = APIRequestFactory()
        # fake request just to satisfy the `authenticate` function
        fake_request = factory.post(self.url)
        request = Request(fake_request)
        not_authenticated_user = authenticate(
            request, username=self.user3.username, password="testpassword")
        self.assertIsNotNone(not_authenticated_user)
        authenticated_user = authenticate(
            request, username=self.user3.username, password="newpassword")
        self.assertIsNone(authenticated_user)
    @patch('leaguer.utils.upload_file')  # Mock upload_file function
    def test_update_profile_with_image(self, _mock_upload_file):
        """Test updating profile with image"""
        # Log in first
        self.authenticate_user()
        # Prepare the data with profile image update
        random_name = generate_random_code()
        data = {
            'action': 'update_profile',
            'first_name': 'John',
            'last_name': 'Doe',
            'user_birthday': '1990-01-01',
            'user_gender': 'male',
            'user_initials_bg_color': '#FFFFFF',
            'email': 'testuser@example.com',
            'username': 'testuser',
            'current_password': 'testpassword',
            'new_password': 'newpassword',
            'update_password': "false",
            'image_updated': "true",
            'profile_image': SimpleUploadedFile(
                name=f'test_image{random_name}.jpg', content=b'fake_image_content',
                content_type='image/jpeg'),  # This should be a file in actual test
            'current_language': 'en'
        }
        # Make a POST request to update the profile
        response = self.client.put(self.url, data)
        # Assert that the response status code is HTTP 200 OK
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        # Assert that the user's profile image URL was updated
        self.user.refresh_from_db()
        self.assertEqual(self.user.user_image_url,
            f'http://testserver/media/profile_images/profile_test_image{random_name}.jpg')
        # Prepare the data with profile image update
        data = {
            'action': 'update_profile',
            'first_name': 'John',
            'last_name': 'Doe',
            'user_birthday': '1990-01-01',
            'user_gender': 'male',
            'user_initials_bg_color': '#FFFFFF',
            'email': 'testuser@example.com',
            'username': 'testuser',
            'current_password': 'testpassword',
            'new_password': 'newpassword',
            'update_password': "false",
            'image_updated': "true",
            'current_language': 'en'
        }
        # Make a POST request to update the profile
        response = self.client.put(self.url, data)
        # Assert that the response status code is HTTP 200 OK
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        # Assert that the user's profile image URL was updated
        self.user.refresh_from_db()
        self.assertIsNone(self.user.user_image_url)


class PasswordResetViewsTestCase(TestCase):
    """Test cases for password reset API views."""
    def setUp(self):
        """Set up test data."""
        self.client = APIClient()
        self.user = User.objects.create_user(
            username='testuser',
            email='test@example.com',
            password='oldpassword123',
            is_active=True,
            current_language='en'
        )
        self.inactive_user = User.objects.create_user(
            username='inactiveuser',
            email='inactive@example.com',
            password='password123',
            is_active=False,
            current_language='en'
        )
        self.deleted_user = User.objects.create_user(
            username='deleteduser',
            email='deleted@example.com',
            password='password123',
            is_active=True,
            is_user_deleted=True,
            current_language='en'
        )
    def test_forgot_password_with_email_success(self):
        """Test forgot password request with valid email."""
        url = '/accounts/forgot-password/'
        data = {
            'email_or_username': 'test@example.com',
            'selected_language': 'en'
        }
        response = self.client.post(url, data)
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertTrue(response.data['success'])
        self.assertIn('If an account with this email', response.data['message'])
    def test_forgot_password_with_username_success(self):
        """Test forgot password request with valid username."""
        url = '/accounts/forgot-password/'
        data = {
            'email_or_username': 'testuser',
            'selected_language': 'en'
        }
        response = self.client.post(url, data)
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertTrue(response.data['success'])
        self.assertIn('If an account with this email', response.data['message'])
    def test_forgot_password_nonexistent_user(self):
        """Test forgot password request with non-existent user 
        (should still return success)."""
        url = '/accounts/forgot-password/'
        data = {
            'email_or_username': 'nonexistent@example.com',
            'selected_language': 'en'
        }
        response = self.client.post(url, data)
        # Should still return success for security reasons
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertTrue(response.data['success'])
        self.assertIn('If an account with this email', response.data['message'])
    def test_forgot_password_inactive_user(self):
        """Test forgot password request with inactive user (should still return success)."""
        url = '/accounts/forgot-password/'
        data = {
            'email_or_username': 'inactive@example.com',
            'selected_language': 'en'
        }
        response = self.client.post(url, data)
        # Should still return success for security reasons
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertTrue(response.data['success'])
    def test_forgot_password_deleted_user(self):
        """Test forgot password request with deleted user 
        (should still return success)."""
        url = '/accounts/forgot-password/'
        data = {
            'email_or_username': 'deleted@example.com',
            'selected_language': 'en'
        }
        response = self.client.post(url, data)
        # Should still return success for security reasons
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertTrue(response.data['success'])
    def test_forgot_password_missing_email_or_username(self):
        """Test forgot password request without email or username."""
        url = '/accounts/forgot-password/'
        data = {
            'selected_language': 'en'
        }
        response = self.client.post(url, data)
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertFalse(response.data['success'])
        self.assertIn('required', response.data['message'].lower())
    def test_forgot_password_language_handling(self):
        """Test that user's language is updated during forgot password."""
        # User has different language than request
        self.user.current_language = 'fr'
        self.user.save()
        url = '/accounts/forgot-password/'
        data = {
            'email_or_username': 'test@example.com',
            'selected_language': 'en'
        }
        response = self.client.post(url, data)
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        # Check that user's language was updated
        self.user.refresh_from_db()
        self.assertEqual(self.user.current_language, 'en')
    def test_reset_password_success(self):
        """Test successful password reset with valid token."""
        # Generate a valid token first
        _status_code, (uid, token) = send_password_reset_email(
            self.user, do_not_mock_api=False)
        url = '/accounts/reset-password/'
        data = {
            'uid': uid,
            'token': token,
            'new_password': 'newpassword123',
            'selected_language': 'en'
        }
        response = self.client.post(url, data)
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertTrue(response.data['success'])
        self.assertIn('successfully', response.data['message'].lower())
        # Verify password was actually changed
        self.user.refresh_from_db()
        self.assertTrue(self.user.check_password('newpassword123'))
    def test_reset_password_invalid_uid(self):
        """Test password reset with invalid UID."""
        url = '/accounts/reset-password/'
        data = {
            'uid': 'invalid_uid',
            'token': 'some_token_*_1234567890',
            'new_password': 'newpassword123',
            'selected_language': 'en'
        }
        response = self.client.post(url, data)
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertFalse(response.data['success'])
        self.assertIn('Invalid', response.data['message'])
    def test_reset_password_expired_token(self):
        """Test password reset with expired token."""
        # Create an expired token (25 hours old)
        old_timestamp = now().timestamp() - (25 * 3600)  # 25 hours ago
        token_ = default_token_generator.make_token(self.user)
        token = token_ + "_*_" + str(old_timestamp)
        uid = urlsafe_base64_encode(force_bytes(self.user.pk))
        url = '/accounts/reset-password/'
        data = {
            'uid': uid,  # Remove .decode() since it's already a string
            'token': token,
            'new_password': 'newpassword123',
            'selected_language': 'en'
        }
        response = self.client.post(url, data)
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertFalse(response.data['success'])
        self.assertIn('expired', response.data['message'].lower())
    def test_reset_password_inactive_user(self):
        """Test password reset with inactive user."""
        # Create a token for inactive user
        token_ = default_token_generator.make_token(self.inactive_user)
        timestamp_str = str(now().timestamp())
        token = token_ + "_*_" + timestamp_str
        uid = urlsafe_base64_encode(force_bytes(self.inactive_user.pk))
        url = '/accounts/reset-password/'
        data = {
            'uid': uid,  # Remove .decode() since it's already a string
            'token': token,
            'new_password': 'newpassword123',
            'selected_language': 'en'
        }
        response = self.client.post(url, data)
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertFalse(response.data['success'])
        self.assertIn('disabled', response.data['message'].lower())
    def test_reset_password_missing_fields(self):
        """Test password reset with missing required fields."""
        url = '/accounts/reset-password/'
        # Test missing uid
        data = {
            'token': 'some_token',
            'new_password': 'newpassword123',
            'selected_language': 'en'
        }
        response = self.client.post(url, data)
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertIn('required', response.data['message'].lower())
        # Test missing token
        data = {
            'uid': 'some_uid',
            'new_password': 'newpassword123',
            'selected_language': 'en'
        }
        response = self.client.post(url, data)
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertIn('required', response.data['message'].lower())
        # Test missing new_password
        data = {
            'uid': 'some_uid',
            'token': 'some_token',
            'selected_language': 'en'
        }
        response = self.client.post(url, data)
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertIn('required', response.data['message'].lower())
    def test_reset_password_invalid_token_format(self):
        """Test password reset with invalid token format."""
        uid = urlsafe_base64_encode(force_bytes(self.user.pk))
        url = '/accounts/reset-password/'
        data = {
            'uid': uid,  # Remove .decode() since it's already a string
            'token': 'invalid_token_format',  # Missing timestamp separator
            'new_password': 'newpassword123',
            'selected_language': 'en'
        }
        response = self.client.post(url, data)
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertFalse(response.data['success'])
        self.assertIn('Invalid', response.data['message'])
    def test_reset_password_integration_flow(self):
        """Test complete password reset flow from forgot to reset."""
        # Step 1: Request password reset
        forgot_url = '/accounts/forgot-password/'
        forgot_data = {
            'email_or_username': 'test@example.com',
            'selected_language': 'en'
        }
        forgot_response = self.client.post(forgot_url, forgot_data)
        self.assertEqual(forgot_response.status_code, status.HTTP_200_OK)
        # Step 2: Generate token (simulating email link)
        status_code, (uid, token) = send_password_reset_email(
            self.user, do_not_mock_api=False)
        self.assertEqual(status_code, 200)
        # Step 3: Reset password using token
        reset_url = '/accounts/reset-password/'
        reset_data = {
            'uid': uid,
            'token': token,
            'new_password': 'completelynewpassword123',
            'selected_language': 'en'
        }
        reset_response = self.client.post(reset_url, reset_data)
        self.assertEqual(reset_response.status_code, status.HTTP_200_OK)
        self.assertTrue(reset_response.data['success'])
        # Step 4: Verify password was changed
        self.user.refresh_from_db()
        self.assertTrue(self.user.check_password('completelynewpassword123'))
        self.assertFalse(self.user.check_password('oldpassword123'))
    @patch('accounts.utils.send_password_reset_email')
    def test_forgot_password_error_handling(self, mock_send_email):
        """Test forgot password view handles email sending errors gracefully."""
        # Mock an exception during email sending
        mock_send_email.side_effect = Exception("Email service error")
        url = '/accounts/forgot-password/'
        data = {
            'email_or_username': 'test@example.com',
            'selected_language': 'en'
        }
        response = self.client.post(url, data)
        # Should still return success for security reasons
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertTrue(response.data['success'])
    def test_reset_password_user_language_activation(self):
        """Test that user's language is activated during password reset."""
        # Set user language different from request
        self.user.current_language = 'fr'
        self.user.save()
        # Generate token
        _status_code, (uid, token) = send_password_reset_email(
            self.user, do_not_mock_api=False)
        url = '/accounts/reset-password/'
        data = {
            'uid': uid,
            'token': token,
            'new_password': 'newpassword123',
            'selected_language': 'en'  # Different from user's language
        }
        response = self.client.post(url, data)
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertTrue(response.data['success'])

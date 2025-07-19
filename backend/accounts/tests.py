from .middleware import TimezoneMiddleware
from .models import User
from .serializers import UserSerializer
from .utils import format_phone_number, GENDERS_CHOICES, send_phone_number_verification_code
from .views import send_verification_email, verify_user_email, verify_user_phone_number
from datetime import date
from django.conf import settings
from django.contrib.auth import authenticate
from django.contrib.auth.models import AnonymousUser
from django.core.files.uploadedfile import SimpleUploadedFile
from django.core.management import call_command
from django.test import RequestFactory, TestCase
from django.urls import reverse
from django.utils.timezone import get_current_timezone, now
from io import StringIO
from leaguer.utils import generate_random_code
from rest_framework import status
from rest_framework.request import Request
from rest_framework.test import APITestCase, APIClient, APIRequestFactory
from unittest.mock import patch
from zoneinfo import ZoneInfo
import datetime
import json


class SendVerificationEmailLinkViewTest(TestCase):
    def setUp(self):
        self.user = User.objects.create_user(username='testuser', email='kechkarayoub@gmail.com', password='password123')
        self.user2 = User.objects.create_user(username='testuser2', email='kechkarayoub2@gmail.com', password='password123')

    def test_missing_params(self):
        response = self.client.post('/accounts/send-verification-email-link/', {'selected_language': 'en'})
        self.assertEqual(response.status_code, 400)
        data = json.loads(response.content.decode('utf-8'))
        message = data.get("message")
        self.assertEqual(message, "User id is required")
        self.assertFalse(data.get("success"))

    def test_send_verification_email_link_failed_invalid_credentials(self):
        response = self.client.post('/accounts/send-verification-email-link/', {'selected_language': 'en', 'user_id': 100})
        self.assertEqual(response.status_code, 404)
        data = json.loads(response.content.decode('utf-8'))
        self.assertEqual(data.get("message"), None)
        self.assertFalse(data.get("success"))

    def test_send_verification_email_link_failed_activated_email(self):
        self.user.is_user_email_validated = True
        self.user.save()
        response = self.client.post('/accounts/send-verification-email-link/', {'selected_language': 'en', 'user_id': self.user.id})
        self.assertEqual(response.status_code, 401)
        data = json.loads(response.content.decode('utf-8'))
        self.assertEqual(data.get("message"), "Your email is already verified. Try to sign in.")
        self.assertFalse(data.get("success"))

    def test_send_verification_email_link_success(self):
        if settings.ENABLE_EMAIL_VERIFICATION is False:
            self.assertTrue(True)
            return
        self.user2.is_user_email_validated = False
        self.user2.save()
        response = self.client.post('/accounts/send-verification-email-link/', {'selected_language': 'en', 'user_id': self.user2.id})
        self.assertEqual(response.status_code, 200)
        data = json.loads(response.content.decode('utf-8'))
        self.assertEqual(data.get("message"), "A new verification link has been sent to your email address. Please verify your email before logging in.")
        self.assertTrue(data.get("success"))


class SignInThirdPartyViewTest(TestCase):
    def setUp(self):
        self.user = User.objects.create_user(username='testuser', email='kechkarayoub@gmail.com', password='password123')

    def test_missing_params(self):
        response = self.client.post('/accounts/sign-in-third-party/', {'selected_language': 'en'})
        self.assertEqual(response.status_code, 400)
        data = json.loads(response.content.decode('utf-8'))
        message = data.get("message")
        self.assertEqual(message, "Email, Id token and Third party type are required")
        self.assertFalse(data.get("success"))
        response = self.client.post('/accounts/sign-in-third-party/', {'selected_language': 'en', 'id_token': ""})
        self.assertEqual(response.status_code, 400)
        data = json.loads(response.content.decode('utf-8'))
        message = data.get("message")
        self.assertEqual(message, "Email, Id token and Third party type are required")
        self.assertFalse(data.get("success"))
        response = self.client.post('/accounts/sign-in-third-party/', {'selected_language': 'en', 'email': ""})
        self.assertEqual(response.status_code, 400)
        data = json.loads(response.content.decode('utf-8'))
        message = data.get("message")
        self.assertEqual(message, "Email, Id token and Third party type are required")
        self.assertFalse(data.get("success"))

    @patch("firebase_admin.auth.verify_id_token")
    def test_sign_in_failed_invalid_credentials(self, mock_verify_id_token):
        mock_verify_id_token.return_value = None  # Simulate invalid token
        response = self.client.post('/accounts/sign-in-third-party/', {'selected_language': 'en', 'email': "invalid username", 'id_token': "id_token", "type_third_party": "google"})
        self.assertEqual(response.status_code, 400)
        data = json.loads(response.content.decode('utf-8'))
        self.assertEqual(data.get("message"), "Invalid credentials")
        self.assertFalse(data.get("success"))
        response = self.client.post('/accounts/sign-in-third-party/', {'selected_language': 'en', 'email': "invalid username", 'id_token': "id_token", "type_third_party": "xxxx"})
        self.assertEqual(response.status_code, 400)
        data = json.loads(response.content.decode('utf-8'))
        self.assertEqual(data.get("message"), "Invalid credentials")
        self.assertFalse(data.get("success"))

    @patch("firebase_admin.auth.verify_id_token")
    def test_sign_in_failed_deleted_account(self, mock_verify_id_token):
        mock_verify_id_token.return_value = {"email": self.user.email}
        self.user.is_user_deleted = True
        self.user.save()
        response = self.client.post('/accounts/sign-in-third-party/', {'selected_language': 'en', 'email': "kechkarayoub@gmail.com", 'id_token': "id_token", "type_third_party": "google"})
        self.assertEqual(response.status_code, 401)
        data = json.loads(response.content.decode('utf-8'))
        self.assertEqual(data.get("message"), "Your account is deleted. Please contact the technical team to resolve your issue.")
        self.assertFalse(data.get("success"))

    @patch("firebase_admin.auth.verify_id_token")
    def test_sign_in_failed_inactive_account(self, mock_verify_id_token):
        mock_verify_id_token.return_value = {"email": self.user.email}
        self.user.is_active = False
        self.user.save()
        response = self.client.post('/accounts/sign-in-third-party/', {'selected_language': 'en', 'email': "kechkarayoub@gmail.com", 'id_token': "id_token", "type_third_party": "google"})
        self.assertEqual(response.status_code, 401)
        data = json.loads(response.content.decode('utf-8'))
        self.assertEqual(data.get("message"), "Your account is inactive. Please contact the technical team to resolve your issue.")
        self.assertFalse(data.get("success"))


    @patch("firebase_admin.auth.verify_id_token")
    def test_sign_in_success(self, mock_verify_id_token):
        mock_verify_id_token.return_value = {"email": self.user.email}
        response = self.client.post('/accounts/sign-in-third-party/', {'selected_language': 'en', 'email': "kechkarayoub@gmail.com", 'id_token': "id_token", "type_third_party": "google"})
        self.assertEqual(response.status_code, 200)
        data = json.loads(response.content.decode('utf-8'))
        self.assertEqual(data.get("user"), self.user.to_login_dict())
        self.assertIsNone(data.get("message"))
        self.assertTrue(data.get("success"))
        self.assertTrue("access_token" in data)
        self.assertTrue("refresh_token" in data)


class SignInViewTest(TestCase):
    def setUp(self):
        self.user = User.objects.create_user(username='testuser', email='kechkarayoub@gmail.com', password='password123')

    def test_missing_params(self):
        response = self.client.post('/accounts/sign-in/', {'selected_language': 'en'})
        self.assertEqual(response.status_code, 400)
        data = json.loads(response.content.decode('utf-8'))
        message = data.get("message")
        self.assertEqual(message, "Email/Username and password are required")
        self.assertFalse(data.get("success"))
        response = self.client.post('/accounts/sign-in/', {'selected_language': 'en', 'email_or_username': ""})
        self.assertEqual(response.status_code, 400)
        data = json.loads(response.content.decode('utf-8'))
        message = data.get("message")
        self.assertEqual(message, "Email/Username and password are required")
        self.assertFalse(data.get("success"))
        response = self.client.post('/accounts/sign-in/', {'selected_language': 'en', 'password': ""})
        self.assertEqual(response.status_code, 400)
        data = json.loads(response.content.decode('utf-8'))
        message = data.get("message")
        self.assertEqual(message, "Email/Username and password are required")
        self.assertFalse(data.get("success"))

    def test_sign_in_failed_invalid_credentials(self):
        response = self.client.post('/accounts/sign-in/', {'selected_language': 'en', 'email_or_username': "invalid username", 'password': "password123"})
        self.assertEqual(response.status_code, 400)
        data = json.loads(response.content.decode('utf-8'))
        self.assertEqual(data.get("message"), "Invalid credentials")
        self.assertFalse(data.get("success"))
        response = self.client.post('/accounts/sign-in/', {'selected_language': 'en', 'email_or_username': "testuser", 'password': "invalid password"})
        self.assertEqual(response.status_code, 400)
        data = json.loads(response.content.decode('utf-8'))
        self.assertEqual(data.get("message"), "Invalid credentials")
        self.assertFalse(data.get("success"))

    def test_sign_in_failed_deleted_account(self):
        self.user.is_user_deleted = True
        self.user.save()
        response = self.client.post('/accounts/sign-in/', {'selected_language': 'en', 'email_or_username': "testuser", 'password': "password123"})
        self.assertEqual(response.status_code, 401)
        data = json.loads(response.content.decode('utf-8'))
        self.assertEqual(data.get("message"), "Your account is deleted. Please contact the technical team to resolve your issue.")
        self.assertFalse(data.get("success"))

    def test_sign_in_failed_inactive_account(self):
        self.user.is_active = False
        self.user.save()
        response = self.client.post('/accounts/sign-in/', {'selected_language': 'en', 'email_or_username': "testuser", 'password': "password123"})
        self.assertEqual(response.status_code, 401)
        data = json.loads(response.content.decode('utf-8'))
        self.assertEqual(data.get("message"), "Your account is inactive. Please contact the technical team to resolve your issue.")
        self.assertFalse(data.get("success"))

    def test_sign_in_failed_invalidate_email(self):
        if settings.ENABLE_EMAIL_VERIFICATION is False:
            self.assertTrue(True)
            return
        self.user.is_user_email_validated = False
        self.user.save()
        response = self.client.post('/accounts/sign-in/', {'selected_language': 'en', 'email_or_username': "testuser", 'password': "password123"})
        self.assertEqual(response.status_code, 401)
        data = json.loads(response.content.decode('utf-8'))
        self.assertEqual(data.get("message"), "Your email is not yet verified. Please verify your email address before sign in.")
        self.assertEqual(data.get("user_id"), 1)
        self.assertFalse(data.get("success"))

    def test_sign_in_success(self):
        response = self.client.post('/accounts/sign-in/', {'selected_language': 'en', 'email_or_username': "testuser", 'password': "password123"})
        self.assertEqual(response.status_code, 200)
        data = json.loads(response.content.decode('utf-8'))
        self.assertEqual(data.get("user"), self.user.to_login_dict())
        self.assertIsNone(data.get("message"))
        self.assertTrue(data.get("success"))
        self.assertTrue("access_token" in data)
        self.assertTrue("refresh_token" in data)


class TimezoneMiddlewareTestCase(TestCase):
    def setUp(self):
        """
            Set up the test environment with a RequestFactory and sample users.
        """
        self.factory = RequestFactory()
        self.middleware = TimezoneMiddleware(get_response=lambda x: x)
        self.default_timezone_user = User.objects.create_user(
            email="default_timezone_user@example.com",
            first_name="First name2",
            last_name="Last name2",
            password="testpassword123",
            username="default_timezone_user",
        )
        # setattr(self.default_timezone_user, "is_authenticated", True)
        self.timezone_user = User.objects.create_user(
            email="timezone_user@example.com",
            first_name="First name2",
            last_name="Last name2",
            password="testpassword123",
            user_timezone="America/New_York",
            username="timezone_user",
        )
        # setattr(self.timezone_user, "is_authenticated", True)
        self.invalid_timezone_user = User.objects.create_user(
            email="invalid_timezone_user@example.com",
            first_name="First name3",
            last_name="Last name3",
            password="testpassword123",
            user_timezone="Invalid/Timezone",
            username="invalid_timezone_user",
        )
        # setattr(self.invalid_timezone_user, "is_authenticated", True)

    def test_authenticated_user_with_default_timezone(self):
        """
            Test if the middleware correctly sets the timezone for an authenticated user with a default timezone.
        """
        self.client.login(username='default_timezone_user', password='testpassword123')
        request = self.factory.get('/')
        request.user = self.default_timezone_user
        self.middleware(request)
        self.assertEqual(get_current_timezone(), ZoneInfo(settings.TIME_ZONE))

    def test_authenticated_user_with_valid_timezone(self):
        """
            Test if the middleware correctly sets the timezone for an authenticated user with a valid timezone.
        """
        self.client.login(username='timezone_user', password='testpassword123')
        request = self.factory.get('/')
        request.user = self.timezone_user
        self.middleware(request)
        self.assertEqual(get_current_timezone(), ZoneInfo("America/New_York"))

    def test_authenticated_user_with_invalid_timezone(self):
        """
            Test if the middleware falls back to settings.TIME_ZONE for an authenticated user with an invalid timezone.
        """
        self.client.login(username='invalid_timezone_user', password='testpassword123')
        request = self.factory.get('/')
        request.user = self.invalid_timezone_user
        self.middleware(request)
        self.assertEqual(get_current_timezone(), ZoneInfo(settings.TIME_ZONE))

    def test_unauthenticated_user(self):
        """
        Test if the middleware sets settings.TIME_ZONE as the timezone for an unauthenticated user.
        """
        request = self.factory.get('/')
        request.user = AnonymousUser()
        self.middleware(request)
        self.assertEqual(get_current_timezone(), ZoneInfo(settings.TIME_ZONE))


class UserModelTest(TestCase):
    def setUp(self):
        self.user = User.objects.create_user(
            user_address="123 Test Street",
            user_birthday=date(2000, 1, 1),
            user_cin="Cin test",
            user_country="Testland",
            email="testuser@example.com",
            first_name="First name",
            user_gender=GENDERS_CHOICES[1][0],
            user_image_url="https://www.s3.com/image_url",
            user_initials_bg_color="#dd5588",
            last_name="Last name",
            password="testpassword123",
            user_phone_number="12 34-567890",
            user_phone_number_to_verify="1234567890",
            user_phone_number_verified_by="sms",
            username="testuser",
        )
        self.user_verified_phone_number = User.objects.create_user(
            user_address="123 Test Street",
            user_birthday=date(2000, 1, 1),
            user_cin="Cin test vnp",
            user_country="Testland",
            email="testuservpn@example.com",
            first_name="First name",
            user_gender=GENDERS_CHOICES[1][0],
            user_image_url="https://www.s3.com/image_url",
            user_initials_bg_color="#dd5588",
            is_user_email_validated=True,
            is_user_phone_number_validated=True,
            last_name="Last name",
            password="testpassword123",
            user_timezone="America/New_York",
            user_phone_number="12 34-567899",
            user_phone_number_to_verify="1234567899",
            user_phone_number_verified_by="google",
            username="testuservpn",
        )

    def test_send_emails_verifications_links(self):
        user2 = User.objects.create_user(
            email="testuser2@example.com",
            first_name="First name2",
            last_name="Last name2",
            password="testpassword123",
            username="testuser2",
        )
        user3 = User.objects.create_user(
            email="testuser3@example.com",
            first_name="First name3",
            last_name="Last name3",
            password="testpassword123",
            username="testuser3",
        )
        result = User.send_emails_verifications_links(email="noemailuser@example.com")
        if settings.ENABLE_EMAIL_VERIFICATION is False:
            self.assertEqual(result, "ENABLE_EMAIL_VERIFICATION is False!!.")
            return
        self.assertEqual(result, "There is any user with this email: noemailuser@example.com, or it is already verified!")
        result = User.send_emails_verifications_links(email="testuser3@example.com")
        self.assertEqual(result, "1 verification email are sent, 0 are not.")
        result = User.send_emails_verifications_links()
        self.assertEqual(result, "3 verification email are sent, 0 are not.")
        user3.is_user_email_validated = True
        user3.save()
        result = User.send_emails_verifications_links(email="testuser3@example.com")
        self.assertEqual(result, "There is any user with this email: testuser3@example.com, or it is already verified!")
        result = User.send_emails_verifications_links()
        self.assertEqual(result, "2 verification email are sent, 0 are not.")
        user2.is_user_email_validated = True
        user2.save()
        self.user.is_user_email_validated = True
        self.user.save()
        result = User.send_emails_verifications_links()
        self.assertEqual(result, "There is no user with not email verified yet!")

    def test_get_user_timezone(self):
        self.assertEqual(self.user.user_timezone, settings.TIME_ZONE)
        self.assertEqual(self.user_verified_phone_number.user_timezone, "America/New_York")

    def test_to_login_dict(self):
        user_login_dict = self.user.to_login_dict()
        self.assertEqual(len(user_login_dict.keys()), 17)
        self.assertEqual(user_login_dict.get("current_language"), self.user.current_language)
        self.assertEqual(user_login_dict.get("email"), self.user.email)
        self.assertEqual(user_login_dict.get("first_name"), self.user.first_name)
        self.assertEqual(user_login_dict.get("id"), self.user.id)
        self.assertEqual(user_login_dict.get("is_user_phone_number_validated"), self.user.is_user_phone_number_validated)
        self.assertEqual(user_login_dict.get("last_name"), self.user.last_name)
        self.assertEqual(user_login_dict.get("user_address"), self.user.user_address)
        self.assertEqual(user_login_dict.get("user_birthday"), self.user.user_birthday)
        self.assertEqual(user_login_dict.get("user_cin"), self.user.user_cin)
        self.assertEqual(user_login_dict.get("user_country"), self.user.user_country)
        self.assertEqual(user_login_dict.get("user_gender"), self.user.user_gender)
        self.assertEqual(user_login_dict.get("user_image_url"), self.user.user_image_url)
        self.assertEqual(user_login_dict.get("user_initials_bg_color"), self.user.user_initials_bg_color)
        self.assertEqual(user_login_dict.get("user_phone_number"), self.user.user_phone_number)
        self.assertEqual(user_login_dict.get("user_phone_number_to_verify"), self.user.user_phone_number_to_verify)
        self.assertEqual(user_login_dict.get("user_timezone"), self.user.user_timezone)

    def test_user_creation(self):
        self.assertEqual(self.user.user_address, "123 Test Street")
        self.assertEqual(self.user.user_birthday, date(2000, 1, 1))
        self.assertEqual(self.user.user_cin, "Cin test")
        self.assertEqual(self.user.user_country, "Testland")
        self.assertEqual(self.user.current_language, settings.LANGUAGE_CODE)
        self.assertEqual(self.user.email, "testuser@example.com")
        self.assertEqual(self.user.first_name, "First name")
        self.assertEqual(self.user.user_gender, GENDERS_CHOICES[1][0])
        self.assertEqual(self.user.user_image_url, "https://www.s3.com/image_url")
        self.assertEqual(self.user.user_initials_bg_color, "#dd5588")
        self.assertEqual(self.user.last_name, "Last name")
        self.assertEqual(self.user.user_phone_number_to_verify, "+2121234567890")
        if settings.ENABLE_PHONE_NUMBER_VERIFICATION:
            self.assertEqual(self.user.user_phone_number_verified_by, "sms")
        else:
            self.assertEqual(self.user.user_phone_number_verified_by, "sms")
        self.assertEqual(self.user.user_timezone, settings.TIME_ZONE)
        self.assertEqual(self.user.username, "testuser")
        if settings.ENABLE_EMAIL_VERIFICATION:
            self.assertFalse(self.user.is_user_email_validated)
        else:
            self.assertTrue(self.user.is_user_email_validated)
        self.assertFalse(self.user.is_user_deleted)
        if settings.ENABLE_PHONE_NUMBER_VERIFICATION:
            self.assertFalse(self.user.is_user_phone_number_validated)
            self.assertIsNone(self.user.user_phone_number)
        else:
            self.assertTrue(self.user.is_user_phone_number_validated)
            self.assertEqual(self.user.user_phone_number, "+2121234567890")
        self.assertNotEqual(self.user.password, "testpassword123")
        self.assertTrue(self.user.is_active)
        self.assertEqual(self.user_verified_phone_number.user_phone_number, "+2121234567899")
        self.assertTrue(self.user_verified_phone_number.is_user_phone_number_validated)

    def test_str_representation(self):
        self.assertEqual(str(self.user), "testuser")

    def test_unique_user_cin_constraint(self):
        """Test that user_cin must be unique."""
        user_data = {
            'user_cin': "cin2",
            'email': "testuser2@example.com",
            'password': "testpassword123",
            'user_phone_number': "12345678902",
            'username': "testuser2",
        }
        User.objects.create(**user_data)
        with self.assertRaises(Exception):  # IntegrityError for SQLite, ValidationError otherwise
            User.objects.create(
                user_cin="cin2",
                email="testuser3@example.com",
                password="testpassword123",
                username="testuser3",
            )

    def test_unique_email_constraint(self):
        """Test that email must be unique."""
        user_data = {
            'user_cin': "cin2",
            'email': "testuser2@example.com",
            'password': "testpassword123",
            'user_phone_number': "12345678902",
            'username': "testuser2",
        }
        User.objects.create(**user_data)
        with self.assertRaises(Exception):  # IntegrityError for SQLite, ValidationError otherwise
            User.objects.create(
                email="testuser2@example.com",
                password="testpassword123",
                username="testuser3",
            )

    def test_unique_phone_number_constraint(self):
        """Test that phone number must be unique."""
        user_data = {
            'user_cin': "cin2",
            'email': "testuser2@example.com",
            'is_user_phone_number_validated': True,
            'password': "testpassword123",
            'user_phone_number': "12345678902",
            'username': "testuser2",
        }
        User.objects.create(**user_data)
        with self.assertRaises(Exception):  # IntegrityError for SQLite, ValidationError otherwise
            User.objects.create(
                email="testuser3@example.com",
                is_user_phone_number_validated=True,
                password="testpassword123",
                user_phone_number="12345678902",
                username="testuser3",
            )


class UserUtilsTest(TestCase):
    def setUp(self):
        self.user = User.objects.create_user(
            user_address="123 Test Street",
            user_birthday=date(2000, 1, 1),
            user_cin="Cin test",
            user_country="Testland",
            email="testuser@example.com",
            first_name="First name",
            user_gender=GENDERS_CHOICES[1][0],
            user_image_url="https://www.s3.com/image_url",
            user_initials_bg_color="#dd5588",
            last_name="Last name",
            password="testpassword123",
            user_phone_number_to_verify="+212612505257",
            user_phone_number_verified_by="sms",
            username="testuser",
        )

    def test_format_phone_number(self):
        formatted_phone_number = format_phone_number("0612505252")
        self.assertEqual(formatted_phone_number, "+212612505252")
        formatted_phone_number = format_phone_number("06 12-505 252")
        self.assertEqual(formatted_phone_number, "+212612505252")
        formatted_phone_number = format_phone_number("+212612505252")
        self.assertEqual(formatted_phone_number, "+212612505252")
        formatted_phone_number = format_phone_number("+212 6 12 5052.52")
        self.assertEqual(formatted_phone_number, "+212612505252")
        formatted_phone_number = format_phone_number("+kjmnj")
        self.assertEqual(formatted_phone_number, "+kjmnj")
        formatted_phone_number = format_phone_number("+123")
        self.assertEqual(formatted_phone_number, "+123")

    def test_send_phone_number_verification_code(self):
        if settings.ENABLE_PHONE_NUMBER_VERIFICATION:
            self.assertIsNone(self.user.user_phone_number_verification_code)
            status_code, _ = send_phone_number_verification_code(self.user, handle_send_phone_number_verification_sms_error=True, do_not_mock_api=False)
            self.user = User.objects.get(pk=self.user.id)
            self.assertEqual(status_code, 500)
            self.assertIsNone(self.user.user_phone_number_verification_code)
            status_code, (uid, verification_code) = send_phone_number_verification_code(self.user)
            self.user = User.objects.get(pk=self.user.id)
            self.assertEqual(status_code, 200)
            self.assertEqual(self.user.user_phone_number_verification_code, verification_code)
        else:
            self.assertTrue(True)


class UserSerializerTest(APITestCase):
    def setUp(self):
        self.valid_data = {
            'user_address': "123 Test Street",
            'user_birthday': date(2000, 1, 1),
            'user_cin': "Cin test",
            'user_country': "Testland",
            'current_language': "en",
            'email': "testuser@example.com",
            'first_name': "First name",
            'user_gender': GENDERS_CHOICES[1][0],
            'user_image_url': "https://www.s3.com/image_url",
            'user_initials_bg_color': "#dd5588",
            'last_name': "Last name",
            'password': "testpassword123",
            'user_phone_number': "+2126-234 56789",
            'user_phone_number_to_verify': "+212623456789",
            'user_phone_number_verified_by': "",
            'username': "testuser",
        }
        self.valid_data2 = {
            'user_address': "123 Test Street",
            'user_birthday': date(2000, 1, 1),
            'user_cin': "Cin test2",
            'user_country': "Testland",
            'current_language': "en",
            'email': "testuser2@example.com",
            'first_name': "First name",
            'user_gender': GENDERS_CHOICES[1][0],
            'user_image_url': "https://www.s3.com/image_url",
            'user_initials_bg_color': "#dd5588",
            'is_user_phone_number_validated': True,
            'last_name': "Last name",
            'password': "testpassword123",
            'user_phone_number': "+2126-234 56709",
            'user_phone_number_to_verify': "+212623456709",
            'user_phone_number_verified_by': "google",
            'user_timezone': "",
            'username': "testuser2",
        }

    def test_serializer_fields(self):

        user = User.objects.create_user(
            **self.valid_data
        )
        serializer = UserSerializer(instance=user)
        data = serializer.data
        self.assertEqual(data['user_address'], "123 Test Street")
        self.assertEqual(data['user_birthday'], "2000-01-01")
        self.assertEqual(data['user_cin'], "Cin test")
        self.assertEqual(data['user_country'], "Testland")
        self.assertEqual(data['current_language'], "en")
        self.assertEqual(data['email'], "testuser@example.com")
        self.assertEqual(data['first_name'], "First name")
        self.assertEqual(data['user_gender'], GENDERS_CHOICES[1][0])
        self.assertEqual(data['user_image_url'], "https://www.s3.com/image_url")
        self.assertEqual(data['user_initials_bg_color'], "#dd5588")
        self.assertEqual(data['last_name'], "Last name")
        self.assertEqual(data['user_phone_number_to_verify'], "+212623456789")
        if settings.ENABLE_PHONE_NUMBER_VERIFICATION:
            self.assertEqual(data['user_phone_number_verified_by'], "")
            self.assertIsNone(data['user_phone_number'])
        else:
            self.assertEqual(data['user_phone_number_verified_by'], "default")
            self.assertEqual(data['user_phone_number'], "+212623456789")
        self.assertEqual(data['user_timezone'], settings.TIME_ZONE)
        self.assertEqual(data['username'], "testuser")
        self.assertEqual(len(data.keys()), 25)
        self.assertIn('date_joined', data)
        user2 = User.objects.create_user(
            **self.valid_data2
        )
        serializer = UserSerializer(instance=user2)
        data2 = serializer.data
        self.assertEqual(data2['user_address'], "123 Test Street")
        self.assertEqual(data2['user_birthday'], "2000-01-01")
        self.assertEqual(data2['user_cin'], "Cin test2")
        self.assertEqual(data2['user_country'], "Testland")
        self.assertEqual(data2['current_language'], "en")
        self.assertEqual(data2['email'], "testuser2@example.com")
        self.assertEqual(data2['first_name'], "First name")
        self.assertEqual(data2['user_gender'], GENDERS_CHOICES[1][0])
        self.assertEqual(data2['user_image_url'], "https://www.s3.com/image_url")
        self.assertEqual(data2['user_initials_bg_color'], "#dd5588")
        self.assertEqual(data2['last_name'], "Last name")
        self.assertEqual(data2['user_phone_number'], "+212623456709")
        self.assertEqual(data2['user_phone_number_to_verify'], "+212623456709")
        self.assertEqual(data2['user_phone_number_verified_by'], "google")
        self.assertEqual(data2['user_timezone'], "")
        self.assertEqual(data2['username'], "testuser2")
        self.assertEqual(len(data2.keys()), 25)
        self.assertIn('date_joined', data2)

    def test_valid_serializer(self):
        """Test serializer with valid data."""
        serializer = UserSerializer(data=self.valid_data)
        serializer.is_valid()
        self.assertTrue(serializer.is_valid())
        self.assertEqual(serializer.validated_data["username"], self.valid_data["username"])

    def test_invalid_user_birthday(self):
        """Test serializer with an invalid user_birthday."""
        serializer = UserSerializer(data={**self.valid_data, 'user_birthday': "invalid phone number"})
        self.assertFalse(serializer.is_valid())
        self.assertIn("user_birthday", serializer.errors)
        serializer = UserSerializer(data={**self.valid_data, 'user_birthday': ""})
        self.assertFalse(serializer.is_valid())
        self.assertIn("user_birthday", serializer.errors)
        serializer = UserSerializer(data={**self.valid_data, 'user_birthday': date.today()})
        self.assertFalse(serializer.is_valid())
        self.assertIn("user_birthday", serializer.errors)

    def test_invalid_user_image_url(self):
        """Test serializer with an invalid user_image_url."""
        serializer = UserSerializer(data={**self.valid_data, 'user_image_url': "invalid image url"})
        self.assertFalse(serializer.is_valid())
        self.assertIn("user_image_url", serializer.errors)

    def test_invalid_user_phone_number(self):
        """Test serializer with an invalid phone number."""
        serializer = UserSerializer(data={**self.valid_data, 'user_phone_number': "invalid phone number"})
        self.assertFalse(serializer.is_valid())
        self.assertIn("user_phone_number", serializer.errors)
        serializer = UserSerializer(data={**self.valid_data, 'user_phone_number': "123"})
        self.assertFalse(serializer.is_valid())
        self.assertIn("user_phone_number", serializer.errors)

    def test_invalid_user_phone_number_to_verify(self):
        """Test serializer with an invalid phone number."""
        serializer = UserSerializer(data={**self.valid_data, 'user_phone_number_to_verify': "invalid phone number"})
        self.assertFalse(serializer.is_valid())
        self.assertIn("user_phone_number_to_verify", serializer.errors)
        serializer = UserSerializer(data={**self.valid_data, 'user_phone_number_to_verify': "123"})
        self.assertFalse(serializer.is_valid())
        self.assertIn("user_phone_number_to_verify", serializer.errors)


class EmailVerificationTests(TestCase):
    def setUp(self):
        self.user = User.objects.create_user(username='testuser', email='kechkarayoub@gmail.com', password='password123')
        self.user_ar = User.objects.create_user(username='testuser_ar', email='test_ar@example.com', password='password123', current_language='ar')
        self.user_en = User.objects.create_user(username='testuser_en', email='test_en@example.com', password='password123', current_language='en')

    def test_send_verification_email(self):
        if settings.ENABLE_EMAIL_VERIFICATION is False:
            self.assertTrue(True)
            return
        self.assertFalse(self.user.is_user_email_validated)
        status_code, _ = send_verification_email(self.user)
        self.assertEqual(status_code, 200)
        status_code, _ = send_verification_email(self.user, handle_send_email_error=True)
        self.assertEqual(status_code, 500)

    def test_verify_user_email_valid(self):
        if settings.ENABLE_EMAIL_VERIFICATION is False:
            self.assertTrue(True)
            return
        _, (uid, token) = send_verification_email(self.user)
        verified, already_verified, expired_token = verify_user_email(uid, token)
        self.assertTrue(verified)
        self.assertFalse(already_verified)
        self.assertFalse(expired_token)
        self.user = User.objects.get(pk=self.user.id)
        self.assertTrue(self.user.is_user_email_validated)
        verified, already_verified, expired_token = verify_user_email(uid, token)
        self.assertTrue(verified)
        self.assertTrue(already_verified)
        self.assertFalse(expired_token)

    def test_verify_user_email_invalid(self):
        if settings.ENABLE_EMAIL_VERIFICATION is False:
            self.assertTrue(True)
            return
        _, (uid, token) = send_verification_email(self.user)
        verified, already_verified, expired_token = verify_user_email(uid, 'invalid-token')
        self.assertFalse(verified)
        self.assertFalse(already_verified)
        self.assertFalse(expired_token)

    def test_verify_user_email_expired(self):
        if settings.ENABLE_EMAIL_VERIFICATION is False:
            self.assertTrue(True)
            return
        _, (uid, token) = send_verification_email(self.user)
        token_date = token.split("_*_")
        yesterday_timestamp = (now() - datetime.timedelta(days=1)).timestamp()
        token_date[1] = str(yesterday_timestamp)
        token = "_*_".join(token_date)
        verified, already_verified, expired_token = verify_user_email(uid, token)
        self.assertFalse(verified)
        self.assertFalse(already_verified)
        self.assertTrue(expired_token)

    def test_verify_email_view(self):
        if settings.ENABLE_EMAIL_VERIFICATION is False:
            self.assertTrue(True)
            return
        _, (uid, token) = send_verification_email(self.user)
        response = self.client.get('/accounts/verify-email/', {'uid': uid, 'token': token})
        self.assertEqual(response.status_code, 200)
        self.user = User.objects.get(pk=self.user.id)
        self.assertTrue(self.user.is_user_email_validated)
        data = json.loads(response.content.decode('utf-8'))
        message = data.get("message")
        self.assertEqual(message, "L'email a été vérifié avec succès.")
        response = self.client.get('/accounts/verify-email/', {'uid': uid, 'token': token})
        self.assertEqual(response.status_code, 200)
        self.user = User.objects.get(pk=self.user.id)
        self.assertTrue(self.user.is_user_email_validated)
        data = json.loads(response.content.decode('utf-8'))
        message = data.get("message")
        self.assertEqual(message, "L'email a déjà été vérifié.")
        User.objects.filter(pk=self.user.id).update(is_user_email_validated=False)
        response = self.client.get('/accounts/verify-email/', {'uid': uid, 'token': token, 'resend_verification_email': "true"})
        self.assertEqual(response.status_code, 400)
        self.user = User.objects.get(pk=self.user.id)
        self.assertFalse(self.user.is_user_email_validated)
        data = json.loads(response.content.decode('utf-8'))
        message = data.get("message")
        self.assertEqual(message, "Jeton expiré. Un nouvel e-mail de vérification sera envoyé à votre adresse e-mail.")

    def test_verify_email_view_en(self):
        if settings.ENABLE_EMAIL_VERIFICATION is False:
            self.assertTrue(True)
            return
        _, (uid, token) = send_verification_email(self.user_en)
        response = self.client.get('/accounts/verify-email/', {'uid': uid, 'token': token})
        self.assertEqual(response.status_code, 200)
        data = json.loads(response.content.decode('utf-8'))
        message = data.get("message")
        self.assertEqual(message, "Email verified successfully.")
        response = self.client.get('/accounts/verify-email/', {'uid': uid, 'token': token})
        data = json.loads(response.content.decode('utf-8'))
        message = data.get("message")
        self.assertEqual(message, "Email already verified.")
        User.objects.filter(pk=self.user_en.id).update(is_user_email_validated=False)
        response = self.client.get('/accounts/verify-email/', {'uid': uid, 'token': token, 'resend_verification_email': "true"})
        data = json.loads(response.content.decode('utf-8'))
        message = data.get("message")
        self.assertEqual(message, "Expired token. A new verification email will be sent to your email address.")

    def test_verify_email_view_ar(self):
        if settings.ENABLE_EMAIL_VERIFICATION is False:
            self.assertTrue(True)
            return
        _, (uid, token) = send_verification_email(self.user_ar)
        response = self.client.get('/accounts/verify-email/', {'uid': uid, 'token': token})
        self.assertEqual(response.status_code, 200)
        data = json.loads(response.content.decode('utf-8'))
        message = data.get("message")
        self.assertEqual(message, "تم التحقق من البريد الإلكتروني بنجاح.")
        response = self.client.get('/accounts/verify-email/', {'uid': uid, 'token': token})
        data = json.loads(response.content.decode('utf-8'))
        message = data.get("message")
        self.assertEqual(message, "تم بالفعل التحقق من البريد الإلكتروني.")
        User.objects.filter(pk=self.user_ar.id).update(is_user_email_validated=False)
        response = self.client.get('/accounts/verify-email/', {'uid': uid, 'token': token, 'resend_verification_email': "true"})
        data = json.loads(response.content.decode('utf-8'))
        message = data.get("message")
        self.assertEqual(message, "انتهت صلاحية الرمز. سيتم إرسال رسالة تحقق جديدة إلى عنوان بريدك الإلكتروني.")

    def test_verify_email_view_missing_params(self):
        if settings.ENABLE_EMAIL_VERIFICATION is False:
            self.assertTrue(True)
            return
        response = self.client.get('/accounts/verify-email/', {})
        self.assertEqual(response.status_code, 400)
        data = json.loads(response.content.decode('utf-8'))
        message = data.get("message")
        self.assertEqual(message, "Paramètres requis manquants.")

        response = self.client.get('/accounts/verify-email/', {'uid': "uid"})
        self.assertEqual(response.status_code, 400)
        data = json.loads(response.content.decode('utf-8'))
        message = data.get("message")
        self.assertEqual(message, "Paramètres requis manquants.")

        response = self.client.get('/accounts/verify-email/', {'token': "token"})
        self.assertEqual(response.status_code, 400)
        data = json.loads(response.content.decode('utf-8'))
        message = data.get("message")
        self.assertEqual(message, "Paramètres requis manquants.")


class PhoneNumberVerificationTests(TestCase):
    def setUp(self):
        self.user = User.objects.create_user(username='testuser', email='test@example.com', password='password123', user_phone_number_to_verify='+212612505257')
        if settings.ENABLE_PHONE_NUMBER_VERIFICATION is False:
            return
        self.user_ar = User.objects.create_user(username='testuser_ar', email='test_ar@example.com', password='password123', current_language='ar', user_phone_number_to_verify='+212612505257')
        self.user_en = User.objects.create_user(username='testuser_en', email='test_en@example.com', password='password123', current_language='en', user_phone_number_to_verify='+212612505257')
        self.user_fr = User.objects.create_user(username='testuser_fr', email='test_fr@example.com', password='password123', current_language='fr', user_phone_number_to_verify='+212612505257')

    def test_verify_user_phone_number_valid(self):
        if settings.ENABLE_PHONE_NUMBER_VERIFICATION is False:
            self.assertTrue(True)
            return
        _, (uid, verification_code) = send_phone_number_verification_code(self.user)
        verified, already_verified, expired_verification_code, quota_exceeded = verify_user_phone_number(uid, verification_code)
        self.assertTrue(verified)
        self.assertFalse(already_verified)
        self.assertFalse(expired_verification_code)
        self.assertFalse(quota_exceeded)
        self.user = User.objects.get(pk=self.user.id)
        self.assertTrue(self.user.is_user_phone_number_validated)
        self.assertEqual(self.user.user_phone_number, self.user.user_phone_number_to_verify)
        self.assertEqual(self.user.nbr_phone_number_verification_code_used, 1)
        verified, already_verified, expired_verification_code, quota_exceeded = verify_user_phone_number(uid, verification_code)
        self.assertTrue(verified)
        self.assertTrue(already_verified)
        self.assertFalse(expired_verification_code)
        self.assertFalse(quota_exceeded)

    def test_verify_user_phone_number_invalid(self):
        if settings.ENABLE_PHONE_NUMBER_VERIFICATION is False:
            self.assertTrue(True)
            return
        _, (uid, verification_code) = send_phone_number_verification_code(self.user)
        self.user.user_phone_number = None
        self.user.is_user_phone_number_validated = False
        self.user.save()
        self.user = User.objects.get(pk=self.user.id)
        verified, already_verified, expired_verification_code, quota_exceeded = verify_user_phone_number(uid, "verification_code")
        self.assertFalse(verified)
        self.assertFalse(already_verified)
        self.assertFalse(expired_verification_code)
        self.assertFalse(quota_exceeded)

    def test_verify_user_phone_number_expired(self):
        if settings.ENABLE_PHONE_NUMBER_VERIFICATION is False:
            self.assertTrue(True)
            return
        _, (uid, verification_code) = send_phone_number_verification_code(self.user)
        self.user = User.objects.get(pk=self.user.id)
        self.user.user_phone_number = None
        self.user.is_user_phone_number_validated = False
        self.user.user_phone_number_verification_code_generated_at = (self.user.user_phone_number_verification_code_generated_at - datetime.timedelta(minutes=settings.NUMBER_MINUTES_BEFORE_PHONE_NUMBER_VERIFICATION_CODE_EXPIRATION + 2))
        self.user.save()
        verified, already_verified, expired_verification_code, quota_exceeded = verify_user_phone_number(uid, verification_code)
        self.assertFalse(verified)
        self.assertFalse(already_verified)
        self.assertTrue(expired_verification_code)
        self.assertFalse(quota_exceeded)

    def test_verify_user_phone_number_quota_exceeded(self):
        if settings.ENABLE_PHONE_NUMBER_VERIFICATION is False:
            self.assertTrue(True)
            return
        _, (uid, verification_code) = send_phone_number_verification_code(self.user)
        self.user = User.objects.get(pk=self.user.id)
        self.user.user_phone_number = None
        self.user.is_user_phone_number_validated = False
        self.user.save()
        _, (uid, verification_code) = send_phone_number_verification_code(self.user)
        verified, already_verified, expired_verification_code, quota_exceeded = verify_user_phone_number(uid, 'verification_code', resend_verification_phone_number_code=True)
        self.assertFalse(verified)
        self.assertFalse(already_verified)
        self.assertFalse(expired_verification_code)
        self.assertFalse(quota_exceeded)
        _, (uid, verification_code) = send_phone_number_verification_code(self.user)
        verified, already_verified, expired_verification_code, quota_exceeded = verify_user_phone_number(uid, 'verification_code', resend_verification_phone_number_code=True)
        self.assertFalse(verified)
        self.assertFalse(already_verified)
        self.assertFalse(expired_verification_code)
        self.assertTrue(quota_exceeded)

    def test_verify_phone_number_view(self):
        if settings.ENABLE_PHONE_NUMBER_VERIFICATION is False:
            self.assertTrue(True)
            return
        _, (uid, verification_code) = send_phone_number_verification_code(self.user_fr)
        response = self.client.get('/accounts/verify-phone-number/', {'uid': uid, 'verification_code': verification_code})
        self.assertEqual(response.status_code, 200)
        data = json.loads(response.content.decode('utf-8'))
        message = data.get("message")
        self.assertEqual(message, "Numéro de téléphone vérifié avec succès.")
        response = self.client.get('/accounts/verify-phone-number/', {'uid': uid, 'verification_code': verification_code})
        data = json.loads(response.content.decode('utf-8'))
        message = data.get("message")
        self.assertEqual(message, "Numéro de téléphone déjà vérifié.")
        _, (uid, verification_code) = send_phone_number_verification_code(self.user_fr)
        User.objects.filter(pk=self.user_fr.id).update(
            user_phone_number=None, is_user_phone_number_validated=False,
            user_phone_number_verification_code_generated_at=(self.user_fr.user_phone_number_verification_code_generated_at - datetime.timedelta(minutes=settings.NUMBER_MINUTES_BEFORE_PHONE_NUMBER_VERIFICATION_CODE_EXPIRATION + 2))
        )
        response = self.client.get('/accounts/verify-phone-number/', {'uid': uid, 'verification_code': verification_code})
        data = json.loads(response.content.decode('utf-8'))
        message = data.get("message")
        self.assertEqual(message, "Code de vérification expiré.")
        response = self.client.get('/accounts/verify-phone-number/', {'uid': uid, 'verification_code': verification_code, 'resend_verification_phone_number_code': "true"})
        data = json.loads(response.content.decode('utf-8'))
        message = data.get("message")
        self.assertEqual(message, "Un nouveau code de vérification sera envoyé à votre numéro de téléphone.")
        _, (uid, verification_code) = send_phone_number_verification_code(self.user_fr)
        response = self.client.get('/accounts/verify-phone-number/', {'uid': uid, 'verification_code': 'verification_code'})
        data = json.loads(response.content.decode('utf-8'))
        message = data.get("message")
        self.assertEqual(message, "Code invalide.")

    def test_verify_phone_number_view_en(self):
        if settings.ENABLE_PHONE_NUMBER_VERIFICATION is False:
            self.assertTrue(True)
            return
        _, (uid, verification_code) = send_phone_number_verification_code(self.user_en)
        response = self.client.get('/accounts/verify-phone-number/', {'uid': uid, 'verification_code': verification_code})
        self.assertEqual(response.status_code, 200)
        data = json.loads(response.content.decode('utf-8'))
        message = data.get("message")
        self.assertEqual(message, "Phone number verified successfully.")
        response = self.client.get('/accounts/verify-phone-number/', {'uid': uid, 'verification_code': verification_code})
        data = json.loads(response.content.decode('utf-8'))
        message = data.get("message")
        self.assertEqual(message, "Phone number already verified.")
        _, (uid, verification_code) = send_phone_number_verification_code(self.user_en)
        User.objects.filter(pk=self.user_en.id).update(
            user_phone_number=None, is_user_phone_number_validated=False,
            user_phone_number_verification_code_generated_at=(self.user_en.user_phone_number_verification_code_generated_at - datetime.timedelta(minutes=settings.NUMBER_MINUTES_BEFORE_PHONE_NUMBER_VERIFICATION_CODE_EXPIRATION + 2))
        )
        response = self.client.get('/accounts/verify-phone-number/', {'uid': uid, 'verification_code': verification_code})
        data = json.loads(response.content.decode('utf-8'))
        message = data.get("message")
        self.assertEqual(message, "Expired verification code.")
        response = self.client.get('/accounts/verify-phone-number/', {'uid': uid, 'verification_code': verification_code, 'resend_verification_phone_number_code': "true"})
        data = json.loads(response.content.decode('utf-8'))
        message = data.get("message")
        self.assertEqual(message, "A new verification code will be sent to your phone number.")
        _, (uid, verification_code) = send_phone_number_verification_code(self.user_en)
        response = self.client.get('/accounts/verify-phone-number/', {'uid': uid, 'verification_code': 'verification_code'})
        data = json.loads(response.content.decode('utf-8'))
        message = data.get("message")
        self.assertEqual(message, "Invalid code.")

    def test_verify_phone_number_view_ar(self):
        if settings.ENABLE_PHONE_NUMBER_VERIFICATION is False:
            self.assertTrue(True)
            return
        _, (uid, verification_code) = send_phone_number_verification_code(self.user_ar)
        response = self.client.get('/accounts/verify-phone-number/', {'uid': uid, 'verification_code': verification_code})
        self.assertEqual(response.status_code, 200)
        data = json.loads(response.content.decode('utf-8'))
        message = data.get("message")
        self.assertEqual(message, "تم التحقق من رقم الهاتف بنجاح.")
        response = self.client.get('/accounts/verify-phone-number/', {'uid': uid, 'verification_code': verification_code})
        data = json.loads(response.content.decode('utf-8'))
        message = data.get("message")
        self.assertEqual(message, "رقم الهاتف تم التحقق منه بالفعل.")
        _, (uid, verification_code) = send_phone_number_verification_code(self.user_ar)
        User.objects.filter(pk=self.user_ar.id).update(
            user_phone_number=None, is_user_phone_number_validated=False,
            user_phone_number_verification_code_generated_at=(self.user_ar.user_phone_number_verification_code_generated_at - datetime.timedelta(minutes=settings.NUMBER_MINUTES_BEFORE_PHONE_NUMBER_VERIFICATION_CODE_EXPIRATION + 2))
        )
        response = self.client.get('/accounts/verify-phone-number/', {'uid': uid, 'verification_code': verification_code})
        data = json.loads(response.content.decode('utf-8'))
        message = data.get("message")
        self.assertEqual(message, "رمز التحقق منتهي الصلاحية.")
        response = self.client.get('/accounts/verify-phone-number/', {'uid': uid, 'verification_code': verification_code, 'resend_verification_phone_number_code': "true"})
        data = json.loads(response.content.decode('utf-8'))
        message = data.get("message")
        self.assertEqual(message, "سيتم إرسال رمز تحقق جديد إلى رقم هاتفك.")
        _, (uid, verification_code) = send_phone_number_verification_code(self.user_ar)
        response = self.client.get('/accounts/verify-phone-number/', {'uid': uid, 'verification_code': 'verification_code'})
        data = json.loads(response.content.decode('utf-8'))
        message = data.get("message")
        self.assertEqual(message, "رمز غير صالح.")

    def test_verify_phone_number_view_missing_params(self):
        if settings.ENABLE_PHONE_NUMBER_VERIFICATION is False:
            self.assertTrue(True)
            return
        response = self.client.get('/accounts/verify-phone-number/', {})
        self.assertEqual(response.status_code, 400)
        data = json.loads(response.content.decode('utf-8'))
        message = data.get("message")
        self.assertEqual(message, "Paramètres requis manquants.")

        response = self.client.get('/accounts/verify-phone-number/', {'uid': "uid"})
        self.assertEqual(response.status_code, 400)
        data = json.loads(response.content.decode('utf-8'))
        message = data.get("message")
        self.assertEqual(message, "Paramètres requis manquants.")

        response = self.client.get('/accounts/verify-phone-number/', {'verification_code': "verification_code"})
        self.assertEqual(response.status_code, 400)
        data = json.loads(response.content.decode('utf-8'))
        message = data.get("message")
        self.assertEqual(message, "Paramètres requis manquants.")


class SendEmailVerificationsLinksCommandTests(TestCase):
    def setUp(self):
        self.user = User.objects.create_user(username='testuser', email='test@example.com', password='password123')
        self.user2 = User.objects.create_user(username='testuser2', email='test2@example.com', password='password123', current_language='ar')

    def test_command_without_arguments(self):
        out = StringIO()
        call_command('send_emails_verifications_links', stdout=out)
        if settings.ENABLE_EMAIL_VERIFICATION is False:
            self.assertIn('ENABLE_EMAIL_VERIFICATION is False!!.', out.getvalue())
            return
        self.assertIn('2 verification email are sent, 0 are not.', out.getvalue())

    def test_command_without_arguments_with_all_email_verified(self):
        out = StringIO()
        self.user.is_user_email_validated = True
        self.user.save()
        self.user2.is_user_email_validated = True
        self.user2.save()
        call_command('send_emails_verifications_links', stdout=out)
        if settings.ENABLE_EMAIL_VERIFICATION is False:
            self.assertIn('ENABLE_EMAIL_VERIFICATION is False!!.', out.getvalue())
            return
        self.assertIn('There is no user with not email verified yet!', out.getvalue())

    def test_command_without_no_valid_email_argument(self):
        out = StringIO()
        call_command('send_emails_verifications_links', '--email', 'novalidemail', stdout=out)
        self.assertIn('Command not executed due to invalid email parameter: novalidemail.', out.getvalue())

    def test_command_without_no_exists_email_argument(self):
        out = StringIO()
        call_command('send_emails_verifications_links', '--email', 'noexistsmail@yopmail.com', stdout=out)
        if settings.ENABLE_EMAIL_VERIFICATION is False:
            self.assertIn('ENABLE_EMAIL_VERIFICATION is False!!.', out.getvalue())
            return
        self.assertIn('There is any user with this email: noexistsmail@yopmail.com, or it is already verified!', out.getvalue())

    def test_command_with_exists_email_argument(self):
        out = StringIO()
        call_command('send_emails_verifications_links', '--email', 'test2@example.com', stdout=out)
        if settings.ENABLE_EMAIL_VERIFICATION is False:
            self.assertIn('ENABLE_EMAIL_VERIFICATION is False!!.', out.getvalue())
            return
        self.assertIn('1 verification email are sent, 0 are not.', out.getvalue())

    def test_command_with_exists_email_but_already_verified_argument(self):
        out = StringIO()
        self.user2.is_user_email_validated = True
        self.user2.save()
        call_command('send_emails_verifications_links', '--email', 'test2@example.com', stdout=out)
        if settings.ENABLE_EMAIL_VERIFICATION is False:
            self.assertIn('ENABLE_EMAIL_VERIFICATION is False!!.', out.getvalue())
            return
        self.assertIn('There is any user with this email: test2@example.com, or it is already verified!', out.getvalue())


class UpdateProfileViewTest(TestCase):
    def setUp(self):
        # Create a test user
        self.user = User.objects.create_user(username='testuser', email='testuser@example.com', password='testpassword', user_phone_number='+212672937219')
        self.user2 = User.objects.create_user(username='testuser2', email='testuser2@example.com', password='testpassword', user_phone_number='+212612505257')
        self.user3 = User.objects.create_user(username='testuser3', email='testuser3@example.com', password='testpassword', user_phone_number='+21312345678')

        # The URL for the update profile view (you should change this to match your URL pattern)
        self.url = reverse('update-profile')

        # Create an APIClient instance for testing
        self.client = APIClient()

    def authenticate_user(self):
        # Log in the test user for authentication
        self.client.force_authenticate(user=self.user)

    def authenticate_user2(self):
        # Log in the test user for authentication
        self.client.force_authenticate(user=self.user2)

    def authenticate_user3(self):
        # Log in the test user for authentication
        self.client.force_authenticate(user=self.user3)

    def test_update_profile_with_password(self):
        # Log in first
        self.authenticate_user()

        # Prepare the data for the request
        data = {
            'first_name': 'John',
            'last_name': 'Doe',
            'user_birthday': '1990-01-01',
            'user_gender': 'male',
            'email': 'testuser@example.com',
            'username': 'testuser',
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
        # inside your test method
        factory = APIRequestFactory()
        fake_request = factory.post(self.url)  # fake request just to satisfy the `authenticate` function
        request = Request(fake_request)
        not_authenticated_user = authenticate(request, username=self.user.username, password="testpassword")
        self.assertIsNone(not_authenticated_user)
        authenticated_user = authenticate(request, username=self.user.username, password="newpassword")
        self.assertIsNotNone(authenticated_user)

    def test_update_profile_with_invalid_data(self):
        # Log in first
        self.authenticate_user()

        # Prepare the data for the request
        data = {
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
        self.assertEqual(message, "Your profile could not be updated due to the errors listed above. Please correct them and try again.")
        self.assertIsNotNone(data.get('errors', {}).get('first_name'))
        self.assertIsNotNone(data.get('errors', {}).get('last_name'))
        self.assertIsNotNone(data.get('errors', {}).get('user_birthday'))
        self.assertFalse(data.get("success"))

    def test_update_profile_without_password(self):
        # Log in first
        self.authenticate_user2()

        # Prepare the data for the request
        data = {
            'first_name': 'John2',
            'last_name': 'Doe2',
            'user_birthday': '1990-01-01',
            'user_gender': 'male',
            'email': 'testuser2@example.com',
            'username': 'testuser2',
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
        self.assertIsNone(self.user2.user_phone_number)
        # inside your test method
        factory = APIRequestFactory()
        fake_request = factory.post(self.url)  # fake request just to satisfy the `authenticate` function
        request = Request(fake_request)
        not_authenticated_user = authenticate(request, username=self.user2.username, password="testpassword")
        self.assertIsNotNone(not_authenticated_user)
        authenticated_user = authenticate(request, username=self.user2.username, password="newpassword")
        self.assertIsNone(authenticated_user)

    def test_update_profile_with_same_phone_number(self):
        # Log in first
        self.authenticate_user()

        # Prepare the data for the request
        data = {
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
        # Log in first
        self.authenticate_user3()

        # Prepare the data for the request
        data = {
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

    def test_update_profile_with_invalid_password(self):
        # Log in first
        self.authenticate_user3()

        # Prepare the data for the request
        data = {
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
        fake_request = factory.post(self.url)  # fake request just to satisfy the `authenticate` function
        request = Request(fake_request)
        not_authenticated_user = authenticate(request, username=self.user3.username, password="testpassword")
        self.assertIsNotNone(not_authenticated_user)
        authenticated_user = authenticate(request, username=self.user3.username, password="newpassword")
        self.assertIsNone(authenticated_user)

    @patch('leaguer.utils.upload_file')  # Mock upload_file function
    def test_update_profile_with_image(self, mock_upload_file):
        # Log in first
        self.authenticate_user()

        # Prepare the data with profile image update
        random_name = generate_random_code()
        data = {
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
            'profile_image': SimpleUploadedFile(name=f'test_image{random_name}.jpg', content=b'fake_image_content', content_type='image/jpeg'),  # This should be a file in actual test
            'current_language': 'en'
        }

        # Make a POST request to update the profile
        response = self.client.put(self.url, data)

        # Assert that the response status code is HTTP 200 OK
        self.assertEqual(response.status_code, status.HTTP_200_OK)

        # Assert that the user's profile image URL was updated
        self.user.refresh_from_db()
        self.assertEqual(self.user.user_image_url, f'http://testserver/media/profile_images/profile_test_image{random_name}.jpg')

        # Prepare the data with profile image update
        data = {
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


# ================================
# ENHANCED TESTS FOR NEW SERVICES
# ================================

class UserServiceTest(TestCase):
    """Test cases for UserService."""
    
    def setUp(self):
        from accounts.services import UserService
        self.user_service = UserService
        self.user_data = {
            'username': 'servicetest',
            'email': 'servicetest@example.com',
            'password': 'testpassword123',
            'first_name': 'Service',
            'last_name': 'Test',
            'current_language': 'en',
            'user_country': 'US',
            'user_gender': 'male'
        }
    
    def test_create_user_service_success(self):
        """Test successful user creation through service."""
        user = self.user_service.create_user(self.user_data)
        
        self.assertEqual(user.username, 'servicetest')
        self.assertEqual(user.email, 'servicetest@example.com')
        self.assertEqual(user.first_name, 'Service')
        self.assertEqual(user.last_name, 'Test')
        self.assertTrue(user.check_password('testpassword123'))
        # Email validation status depends on ENABLE_EMAIL_VERIFICATION setting
        if hasattr(settings, 'ENABLE_EMAIL_VERIFICATION') and settings.ENABLE_EMAIL_VERIFICATION:
            self.assertFalse(user.is_user_email_validated)
        else:
            self.assertTrue(user.is_user_email_validated)
        # Phone validation status depends on ENABLE_PHONE_NUMBER_VERIFICATION setting
        if hasattr(settings, 'ENABLE_PHONE_NUMBER_VERIFICATION') and settings.ENABLE_PHONE_NUMBER_VERIFICATION:
            self.assertFalse(user.is_user_phone_number_validated)
        else:
            self.assertTrue(user.is_user_phone_number_validated)
    
    def test_create_user_service_missing_fields(self):
        """Test user creation with missing required fields."""
        from accounts.exceptions import UserRegistrationException
        incomplete_data = {'username': 'servicetest'}
        
        with self.assertRaises(UserRegistrationException):
            self.user_service.create_user(incomplete_data)
    
    def test_create_user_service_duplicate_username(self):
        """Test user creation with existing username."""
        from accounts.exceptions import UserRegistrationException
        self.user_service.create_user(self.user_data)
        
        with self.assertRaises(UserRegistrationException):
            self.user_service.create_user(self.user_data)
    
    def test_update_user_service_success(self):
        """Test successful user update through service."""
        user = self.user_service.create_user(self.user_data)
        
        update_data = {
            'first_name': 'UpdatedService',
            'user_country': 'CA'
        }
        
        updated_user = self.user_service.update_user(user, update_data)
        
        self.assertEqual(updated_user.first_name, 'UpdatedService')
        self.assertEqual(updated_user.user_country, 'CA')
    
    def test_authenticate_user_service_success(self):
        """Test successful user authentication through service."""
        user = self.user_service.create_user(self.user_data)
        
        authenticated_user = self.user_service.authenticate_user('servicetest', 'testpassword123')
        self.assertEqual(authenticated_user.id, user.id)
    
    def test_authenticate_user_service_with_email(self):
        """Test user authentication with email through service."""
        user = self.user_service.create_user(self.user_data)
        
        authenticated_user = self.user_service.authenticate_user('servicetest@example.com', 'testpassword123')
        self.assertEqual(authenticated_user.id, user.id)
    
    def test_authenticate_user_service_invalid_credentials(self):
        """Test authentication with invalid credentials through service."""
        from accounts.exceptions import AuthenticationException
        self.user_service.create_user(self.user_data)
        
        with self.assertRaises(AuthenticationException):
            self.user_service.authenticate_user('servicetest', 'wrongpassword')
    
    def test_delete_user_service_soft_delete(self):
        """Test soft user deletion through service."""
        user = self.user_service.create_user(self.user_data)
        
        result = self.user_service.delete_user(user, soft_delete=True)
        
        self.assertTrue(result)
        user.refresh_from_db()
        self.assertFalse(user.is_active)
        self.assertTrue(user.is_user_deleted)


class EmailVerificationServiceTest(TestCase):
    """Test cases for EmailVerificationService."""
    
    def setUp(self):
        from accounts.services import EmailVerificationService
        self.email_service = EmailVerificationService
        self.user = User.objects.create_user(
            username='emailtest',
            email='emailtest@example.com',
            password='testpassword123',
            first_name='Email',
            last_name='Test'
        )
    
    @patch('accounts.services.EmailMultiAlternatives.send')
    def test_send_verification_email_service_success(self, mock_send):
        """Test successful email verification sending through service."""
        mock_send.return_value = True
        
        result = self.email_service.send_verification_email(self.user)
        
        self.assertTrue(result)
        mock_send.assert_called_once()
    
    @patch('accounts.services.EmailMultiAlternatives.send')
    def test_send_verification_email_service_failure(self, mock_send):
        """Test email verification sending failure through service."""
        from accounts.exceptions import EmailSendingException
        mock_send.side_effect = Exception("SMTP Error")
        
        with self.assertRaises(EmailSendingException):
            self.email_service.send_verification_email(self.user)
    
    def test_verify_email_token_service_success(self):
        """Test successful email token verification through service."""
        from django.contrib.auth.tokens import default_token_generator
        from django.utils.http import urlsafe_base64_encode
        from django.utils.encoding import force_bytes
        
        token = default_token_generator.make_token(self.user)
        uid = urlsafe_base64_encode(force_bytes(self.user.pk))
        
        verified_user = self.email_service.verify_email_token(uid, token)
        
        self.assertEqual(verified_user.id, self.user.id)
        self.assertTrue(verified_user.is_user_email_validated)
    
    def test_verify_email_token_service_invalid(self):
        """Test email token verification with invalid token through service."""
        from accounts.exceptions import TokenValidationException
        from django.utils.http import urlsafe_base64_encode
        from django.utils.encoding import force_bytes
        
        uid = urlsafe_base64_encode(force_bytes(self.user.pk))
        invalid_token = "invalid-token"
        
        with self.assertRaises(TokenValidationException):
            self.email_service.verify_email_token(uid, invalid_token)


class PhoneVerificationServiceTest(TestCase):
    """Test cases for PhoneVerificationService."""
    
    def setUp(self):
        from accounts.services import PhoneVerificationService
        self.phone_service = PhoneVerificationService
        self.user = User.objects.create_user(
            username='phonetest',
            email='phonetest@example.com',
            password='testpassword123',
            first_name='Phone',
            last_name='Test',
            user_phone_number='+1234567890'
        )
    
    @patch('accounts.services.send_phone_message')
    def test_send_verification_code_service_success(self, mock_send_sms):
        """Test successful verification code sending through service."""
        mock_send_sms.return_value = True
        
        code = self.phone_service.send_verification_code(self.user)
        
        self.assertIsInstance(code, str)
        self.assertEqual(len(code), 6)  # Assuming 6-digit codes
        mock_send_sms.assert_called_once()
    
    def test_send_verification_code_service_no_phone(self):
        """Test verification code sending without phone number through service."""
        from accounts.exceptions import SMSException
        self.user.user_phone_number = ''
        self.user.save()
        
        with self.assertRaises(SMSException):
            self.phone_service.send_verification_code(self.user)
    
    def test_verify_phone_code_service_success(self):
        """Test successful phone code verification through service."""
        from django.utils import timezone
        
        # Set up verification code
        self.user.user_phone_number_verification_code = '123456'
        self.user.user_phone_number_verification_code_timestamp = timezone.now()
        self.user.save()
        
        result = self.phone_service.verify_phone_code(self.user, '123456')
        
        self.assertTrue(result)
        self.user.refresh_from_db()
        self.assertTrue(self.user.is_user_phone_number_validated)
    
    def test_verify_phone_code_service_invalid(self):
        """Test phone code verification with invalid code through service."""
        from accounts.exceptions import VerificationCodeException
        self.user.user_phone_number_verification_code = '123456'
        self.user.save()
        
        with self.assertRaises(VerificationCodeException):
            self.phone_service.verify_phone_code(self.user, '654321')


class ProfileImageServiceTest(TestCase):
    """Test cases for ProfileImageService."""
    
    def setUp(self):
        from accounts.services import ProfileImageService
        self.image_service = ProfileImageService
        self.user = User.objects.create_user(
            username='imagetest',
            email='imagetest@example.com',
            password='testpassword123'
        )
    
    def test_upload_profile_image_service_success(self):
        """Test successful profile image upload through service."""
        # Create a test image file
        image_content = b"fake image content"
        image_file = SimpleUploadedFile("test.jpg", image_content, content_type="image/jpeg")
        
        with patch('accounts.services.default_storage.save') as mock_save, \
             patch('accounts.services.default_storage.url') as mock_url:
            
            mock_save.return_value = 'profile_images/test.jpg'
            mock_url.return_value = '/media/profile_images/test.jpg'
            
            image_url = self.image_service.upload_profile_image(self.user, image_file)
            
            self.assertEqual(image_url, '/media/profile_images/test.jpg')
            mock_save.assert_called_once()
    
    def test_upload_profile_image_service_invalid_type(self):
        """Test profile image upload with invalid file type through service."""
        from accounts.exceptions import ProfileImageException
        text_file = SimpleUploadedFile("test.txt", b"text content", content_type="text/plain")
        
        with self.assertRaises(ProfileImageException):
            self.image_service.upload_profile_image(self.user, text_file)
    
    def test_delete_profile_image_service_success(self):
        """Test successful profile image deletion through service."""
        self.user.user_image_url = '/media/profile_images/test.jpg'
        self.user.save()
        
        with patch('accounts.services.default_storage.exists') as mock_exists, \
             patch('accounts.services.default_storage.delete') as mock_delete:
            
            mock_exists.return_value = True
            
            result = self.image_service.delete_profile_image(self.user)
            
            self.assertTrue(result)
            self.user.refresh_from_db()
            self.assertIsNone(self.user.user_image_url)
            mock_delete.assert_called_once()


class UserValidationServiceTest(TestCase):
    """Test cases for UserValidationService."""
    
    def setUp(self):
        from accounts.services import UserValidationService
        self.validation_service = UserValidationService
    
    def test_validate_user_data_service_success(self):
        """Test successful user data validation through service."""
        valid_data = {
            'email': 'validation@example.com',
            'password': 'testpassword123',
            'user_gender': 'male'
        }
        
        result = self.validation_service.validate_user_data(valid_data)
        self.assertTrue(result)
    
    def test_validate_user_data_service_invalid_email(self):
        """Test user data validation with invalid email through service."""
        from accounts.exceptions import UserValidationException
        invalid_data = {
            'email': 'invalid-email',
            'password': 'testpassword123'
        }
        
        with self.assertRaises(UserValidationException):
            self.validation_service.validate_user_data(invalid_data)
    
    def test_validate_user_data_service_short_password(self):
        """Test user data validation with short password through service."""
        from accounts.exceptions import UserValidationException
        invalid_data = {
            'email': 'validation@example.com',
            'password': '123'
        }
        
        with self.assertRaises(UserValidationException):
            self.validation_service.validate_user_data(invalid_data)
    
    def test_validate_user_data_service_invalid_gender(self):
        """Test user data validation with invalid gender through service."""
        from accounts.exceptions import UserValidationException
        invalid_data = {
            'email': 'validation@example.com',
            'password': 'testpassword123',
            'user_gender': 'invalid'
        }
        
        with self.assertRaises(UserValidationException):
            self.validation_service.validate_user_data(invalid_data)


class AccountsServiceIntegrationTest(TestCase):
    """Integration tests for accounts services."""
    
    def setUp(self):
        from accounts.services import UserService, EmailVerificationService, PhoneVerificationService
        self.user_service = UserService
        self.email_service = EmailVerificationService
        self.phone_service = PhoneVerificationService
        
        self.user_data = {
            'username': 'integrationtest',
            'email': 'integration@example.com',
            'password': 'testpassword123',
            'first_name': 'Integration',
            'last_name': 'Test',
            'user_phone_number': '+1234567890'
        }
    
    def test_complete_user_service_lifecycle(self):
        """Test complete user lifecycle through services: create, verify email, verify phone, update, delete."""
        
        # 1. Create user through service
        user = self.user_service.create_user(self.user_data)
        
        # Email and phone validation status depends on settings
        if hasattr(settings, 'ENABLE_EMAIL_VERIFICATION') and settings.ENABLE_EMAIL_VERIFICATION:
            self.assertFalse(user.is_user_email_validated)
        else:
            self.assertTrue(user.is_user_email_validated)
            
        if hasattr(settings, 'ENABLE_PHONE_NUMBER_VERIFICATION') and settings.ENABLE_PHONE_NUMBER_VERIFICATION:
            self.assertFalse(user.is_user_phone_number_validated)
        else:
            self.assertTrue(user.is_user_phone_number_validated)
        
        # 2. Simulate email verification
        user.is_user_email_validated = True
        user.save()
        
        # 3. Simulate phone verification
        user.is_user_phone_number_validated = True
        user.save()
        
        # 4. Update user through service
        update_data = {'first_name': 'UpdatedIntegration'}
        updated_user = self.user_service.update_user(user, update_data)
        self.assertEqual(updated_user.first_name, 'UpdatedIntegration')
        
        # 5. Authenticate user through service
        authenticated_user = self.user_service.authenticate_user('integrationtest', 'testpassword123')
        self.assertEqual(authenticated_user.id, user.id)
        
        # 6. Soft delete user through service
        result = self.user_service.delete_user(user, soft_delete=True)
        self.assertTrue(result)
        user.refresh_from_db()
        self.assertFalse(user.is_active)
    
    @patch('accounts.services.send_phone_message')
    def test_phone_verification_service_flow(self, mock_send_sms):
        """Test complete phone verification flow through services."""
        mock_send_sms.return_value = True
        
        user = self.user_service.create_user(self.user_data)
        
        # Send verification code through service
        code = self.phone_service.send_verification_code(user)
        self.assertIsNotNone(code)
        
        # Verify the code through service
        result = self.phone_service.verify_phone_code(user, code)
        self.assertTrue(result)
        
        user.refresh_from_db()
        self.assertTrue(user.is_user_phone_number_validated)


class AccountsExceptionTest(TestCase):
    """Test cases for accounts exceptions."""
    
    def test_user_registration_exception(self):
        """Test UserRegistrationException handling."""
        from accounts.exceptions import UserRegistrationException
        
        with self.assertRaises(UserRegistrationException) as context:
            raise UserRegistrationException("User already exists")
        
        self.assertIn("User already exists", str(context.exception))
    
    def test_email_sending_exception(self):
        """Test EmailSendingException handling."""
        from accounts.exceptions import EmailSendingException
        
        with self.assertRaises(EmailSendingException) as context:
            raise EmailSendingException("SMTP server error")
        
        self.assertIn("SMTP server error", str(context.exception))
    
    def test_phone_verification_exception(self):
        """Test PhoneVerificationException handling."""
        from accounts.exceptions import PhoneVerificationException
        
        with self.assertRaises(PhoneVerificationException) as context:
            raise PhoneVerificationException("Invalid phone number")
        
        self.assertIn("Invalid phone number", str(context.exception))
    
    def test_authentication_exception(self):
        """Test AuthenticationException handling."""
        from accounts.exceptions import AuthenticationException
        
        with self.assertRaises(AuthenticationException) as context:
            raise AuthenticationException("Invalid credentials")
        
        self.assertIn("Invalid credentials", str(context.exception))


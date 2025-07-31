from ..utils import (execute_native_query, generate_random_code, get_all_timezones, get_email_base_context,
                    get_geolocation_info, get_local_datetime, remove_file, send_whatsapp, send_phone_message,
                    upload_file, generate_random_string)
from ..views import get_geolocation
from accounts.models import User
from datetime import datetime, timezone
from django.conf import settings
from django.core.files.uploadedfile import SimpleUploadedFile
from django.test import RequestFactory, TestCase
from django.utils.timezone import now
from django.utils.translation import activate, gettext_lazy as _
# from dotenv import load_dotenv
from decouple import config
from rest_framework import status
from unittest.mock import Mock, patch
from zoneinfo import ZoneInfo
import json, os


class EnvFileTest(TestCase):
    """Test if .env file exists and contains required environment variables."""

    @classmethod
    def setUpClass(cls):
        """Load environment variables before running tests."""
        super().setUpClass()
        # load_dotenv()

    def test_env_file_exists(self):
        """Test that the .env file exists in the project root."""
        env_path = os.path.join(os.path.dirname(os.path.dirname(os.path.dirname(__file__))), '.env')
        self.assertTrue(os.path.exists(env_path), "⚠️ .env file is missing!")

    def test_required_env_variables(self):
        """Test that all required environment variables are set."""
        required_vars = [
            "ALLOWED_HOSTS",
            "API_BURST_LIMIT",
            "API_RATE_LIMIT",
            "BACKEND_ENDPOINT",
            "CORS_ALLOW_ALL_ORIGINS",
            "CORS_ALLOWED_ORIGINS",
            "DB_CONTAINER_EXTERNAL_PORT",
            "DB_CONTAINER_INTERNAL_PORT",
            "DB_IP",
            "DB_NAME",
            "DB_ROOT_PASSWORD",
            "DB_USER_NM",
            "DB_USER_PW",
            "DEFAULT_FROM_EMAIL",
            "DJANGO_CONTAINER_EXTERNAL_PORT",
            "DJANGO_CONTAINER_INTERNAL_PORT",
            "DJANGO_SECRET_KEY",
            "EMAIL_HOST",
            "EMAIL_PORT",
            "EMAIL_HOST_PASSWORD",
            "EMAIL_HOST_USER",
            "EMAIL_USE_TLS",
            "ENABLE_EMAIL_VERIFICATION",
            "ENABLE_PHONE_NUMBER_VERIFICATION",
            "FIREBASE_PROJECT_ID",
            "FIREBASE_VAPID_KEY",
            "FRONTEND_ENDPOINT",
            "PERFORMANCE_MONITORING",
            "PIPLINE",
            "REDIS_CONTAINER_EXTERNAL_PORT",
            "REDIS_CONTAINER_INTERNAL_PORT",
            "REDIS_URL",
            "TECHNICAL_SERVICE_EMAIL",
            "USE_DEBUG_TOOLBAR",
            "WHATSAPP_INSTANCE_ID",
            "WHATSAPP_INSTANCE_TOKEN",
            "WHATSAPP_INSTANCE_URL",
            "WS_EXTERNAL_PORT",
            "WS_INTERNAL_PORT",
        ]

        missing_vars = [var for var in required_vars if not config(var, None)]
        self.assertEqual(missing_vars, [], f"⚠️ Missing environment variables: {', '.join(missing_vars)}")


class LeaguerConfigTest(TestCase):
    def setUp(self):
        pass

    def test_firebase_credentials_path(self):
        self.assertEqual(str(settings.FIREBASE_CREDENTIALS_PATH), os.path.join(settings.PARENT_DIR, "firebase-service-account.json"))
        self.assertTrue(os.path.exists(settings.FIREBASE_CREDENTIALS_PATH), True)


class LeaguerUtilsTest(TestCase):
    def test_generate_random_string_default_length(self):
        s = generate_random_string()
        self.assertEqual(len(s), 10)
        self.assertTrue(s.isalnum())

    def test_generate_random_string_custom_length(self):
        for length in [1, 5, 20, 50]:
            s = generate_random_string(length)
            self.assertEqual(len(s), length)
            self.assertTrue(s.isalnum())

    def test_generate_random_string_zero_length(self):
        s = generate_random_string(0)
        self.assertEqual(s, "")

    def test_generate_random_string_negative_length(self):
        s = generate_random_string(-5)
        self.assertEqual(s, "")

    def setUp(self):
        self.factory = RequestFactory()
        self.user = User.objects.create_user(
            email="testuser@example.com",
            first_name="First name",
            last_name="Last name",
            password="testpassword123",
            user_phone_number_to_verify="+212612505257",
            username="testuser",
        )

    def test_execute_native_query(self):
        query_get_users = """
            SELECT * FROM leaguer_user WHERE is_active=True;
        """
        users = execute_native_query(query_get_users)
        self.assertEqual(len(users), 1)
        query_set_user = """
            INSERT INTO leaguer_user (email, first_name, is_active, last_name, username, password, is_superuser, 
                is_staff, date_joined, nbr_phone_number_verification_code_used,
                user_gender, is_user_deleted, current_language, is_user_email_validated, is_user_phone_number_validated,
                user_phone_number_verified_by, user_timezone)
            VALUES ('email2@yopmail.com', 'first_name', True, 'last_name', 'username2', 'password', False, False, NOW(),
                0, '', False, 'fr', False, False, '', 'UTC'),
                ('email3@yopmail.com', 'first_name', True, 'last_name', 'username3', 'password', False, False, NOW(), 
                0, '', False, 'ar', False, False, '', 'Africa/Casablanca');
        """
        result = execute_native_query(query_set_user, is_get=False)
        self.assertIsNone(result)
        query_get_users = """
            SELECT * FROM leaguer_user WHERE email LIKE '%@yopmail.com';
        """
        users = execute_native_query(query_get_users)
        self.assertEqual(len(users), 2)
        query_update_user = """
            UPDATE leaguer_user SET email='email2@example.com' WHERE email='email2@yopmail.com';
        """
        result = execute_native_query(query_update_user, is_get=False)
        self.assertIsNone(result)
        query_get_users = """
            SELECT * FROM leaguer_user WHERE email LIKE '%@yopmail.com';
        """
        users = execute_native_query(query_get_users)
        self.assertEqual(len(users), 1)
        query_delete_user = """
            DELETE FROM leaguer_user WHERE email LIKE '%@yopmail.com';
        """
        result = execute_native_query(query_delete_user, is_get=False)
        self.assertIsNone(result)
        query_get_users = """
            SELECT * FROM leaguer_user WHERE email LIKE '%@yopmail.com';
        """
        users = execute_native_query(query_get_users, is_get=True)
        self.assertEqual(len(users), 0)

    def test_generate_random_code(self):
        empty_random_code = generate_random_code(nbr_digit=0)
        self.assertEqual(len(empty_random_code), 0)
        empty_random_code = generate_random_code(nbr_digit=-1)
        self.assertEqual(len(empty_random_code), 0)
        self.assertEqual(empty_random_code, "")
        normal_random_code = generate_random_code()
        self.assertEqual(len(normal_random_code), 6)
        self.assertTrue(0 <= int(normal_random_code) <= 999999)
        custom_random_code = generate_random_code(nbr_digit=8)
        self.assertEqual(len(custom_random_code), 8)
        self.assertTrue(0 <= int(custom_random_code) <= 99999999)

    def test_get_all_timezones(self):
        """
        Test the `get_all_timezones` function when `as_list=True`.
        """
        timezones = get_all_timezones(as_list=True)
        # Check that the default option is included
        activate(self.user.current_language)
        self.assertEqual(timezones[0], ["", _("Select")])
        # Ensure the timezones are sorted and that they match the expected format
        self.assertTrue(all(isinstance(item, list) and len(item) == 2 for item in timezones[1:]))
        self.assertTrue(all(isinstance(item[0], str) for item in timezones[1:]))
        self.assertTrue(all(isinstance(item[1], str) for item in timezones[1:]))
        """
        Test the `get_all_timezones` function when `as_list=False`.
        """
        timezones = get_all_timezones(as_list=False)
        # Check that the default option is included
        self.assertEqual(timezones[0], ("", _("Select")))
        # Ensure the timezones are sorted and that they match the expected format
        self.assertTrue(all(isinstance(item, tuple) and len(item) == 2 for item in timezones[1:]))
        self.assertTrue(all(isinstance(item[0], str) for item in timezones[1:]))
        self.assertTrue(all(isinstance(item[1], str) for item in timezones[1:]))

    @patch("requests.get")
    def test_get_geolocation_info(self, mock_get):
        """
        Test the `get_geolocation_info`.
        """
        valid_ip = "8.8.8.8"
        fields = "country,countryCode,city"
        mock_success_response = {
            "country": "United States",
            "countryCode": "US",
            "city": "Mountain View"
        }
        mock_response = Mock()
        mock_response.json.return_value = mock_success_response
        mock_response.raise_for_status.return_value = None
        mock_get.return_value = mock_response

        # Call the function
        result = get_geolocation_info(valid_ip, fields=fields)

        # Assertions
        self.assertEqual(result, mock_success_response)
        mock_get.assert_called_once_with(
            f"http://ip-api.com/json/{valid_ip}",
            params={"fields": fields},
            timeout=5
        )

    def test_get_local_datetime(self):
        """
        Test the `get_local_datetime` function with a valid timezone.
        """
        utc_time = datetime.now(timezone.utc)
        custom_timezone = "America/New_York"
        localized_time = get_local_datetime(utc_time, custom_timezone)
        # Check that the time is localized correctly
        self.assertEqual(localized_time.tzinfo, ZoneInfo("America/New_York"))
        self.assertTrue(localized_time.strftime("%Y-%m-%d %H:%M") < utc_time.strftime("%Y-%m-%d %H:%M"))  # Since New York is UTC-5, localized time should be later.
        """
        Test the `get_local_datetime` function with an invalid timezone.
        """
        utc_time = datetime.now(timezone.utc)
        custom_timezone = "Invalid/Timezone"  # Invalid timezone
        with self.assertRaises(KeyError):
            get_local_datetime(utc_time, custom_timezone)
        """
        Test the `get_local_datetime` function with UTC as the timezone.
        """
        utc_time = datetime.now(timezone.utc)
        custom_timezone = "UTC"
        localized_time = get_local_datetime(utc_time, custom_timezone)
        # Check that the time is still UTC
        self.assertEqual(localized_time.tzinfo, ZoneInfo("UTC"))
        self.assertEqual(localized_time.strftime("%Y-%m-%d %H:%M"), utc_time.strftime("%Y-%m-%d %H:%M"))  # Time should be the same

    def test_get_email_base_context(self):
        email_base_context = get_email_base_context()
        self.assertEqual(len(email_base_context.keys()), 6)
        self.assertEqual(email_base_context['company_address'], settings.COMPANY_ADDRESS)
        self.assertEqual(email_base_context['app_name'], settings.APPLICATION_NAME)
        self.assertEqual(email_base_context['current_year'], now().year)
        self.assertEqual(email_base_context['direction'], "ltr")
        self.assertEqual(email_base_context['from_email'], settings.DEFAULT_FROM_EMAIL)
        self.assertEqual(email_base_context['frontend_endpoint'], settings.FRONTEND_ENDPOINT)
        email_base_context_rtl = get_email_base_context(selected_language="ar")
        self.assertEqual(email_base_context_rtl['direction'], "rtl")
        email_base_context_ltr = get_email_base_context(selected_language="en")
        self.assertEqual(email_base_context_ltr['direction'], "ltr")

    @patch('django.core.files.storage.default_storage.exists')
    @patch('os.remove')
    def test_remove_file(self, mock_remove, mock_exists):
        """Test file removal"""

        # Set up the mock to simulate the file's existence
        mock_exists.return_value = True

        # Define the file URL to be removed
        file_url = 'http://testserver/media/profile_images/test_image.jpg'

        # Simulate the file removal
        request = self.factory.post('/fake-url/', {})
        remove_file(request, file_url)

        # Assert that the file removal was called
        mock_exists.assert_called_once_with('profile_images/test_image.jpg')
        mock_remove.assert_called_once_with(os.path.join(settings.MEDIA_ROOT, 'profile_images/test_image.jpg'))

    @patch('django.core.files.storage.default_storage.exists')
    def test_remove_file_not_found(self, mock_exists):
        """Test file removal when file doesn't exist"""

        # Set up the mock to simulate the file not existing
        mock_exists.return_value = False

        # Define the file URL to be removed
        file_url = 'http://testserver/media/profile_images/test_image.jpg'

        # Simulate the file removal
        request = self.factory.post('/update-profile/', {})
        remove_file(request, file_url)

        # Assert that the remove_file function did not attempt to remove a file
        mock_exists.assert_called_once_with('profile_images/test_image.jpg')

    def test_send_phone_message(self):
        self.assertEqual(self.user.nbr_phone_number_verification_code_used, 0)
        response = send_phone_message("test", ["+212612505257"])
        self.assertEqual(response.get('nbr_verification_codes_sent'), 1)
        self.assertTrue(response.get('all_verification_codes_sent'))
        self.user = User.objects.get(pk=self.user.id)
        self.assertEqual(self.user.nbr_phone_number_verification_code_used, 0)
        response = send_phone_message("test", ["+212612505257", "+212612505257"])
        self.assertEqual(response.get('nbr_verification_codes_sent'), 2)
        self.assertTrue(response.get('all_verification_codes_sent'))
        self.user = User.objects.get(pk=self.user.id)
        self.assertEqual(self.user.nbr_phone_number_verification_code_used, 0)
        response = send_phone_message("test", ["+212612505257"], handle_error=True)
        self.assertEqual(response.get('nbr_verification_codes_sent'), 0)
        self.assertFalse(response.get('all_verification_codes_sent'))
        self.user = User.objects.get(pk=self.user.id)
        self.assertEqual(self.user.nbr_phone_number_verification_code_used, 0)

    def test_send_whatsapp(self):
        self.assertEqual(self.user.nbr_phone_number_verification_code_used, 0)
        response = send_whatsapp("test", ["+212612505257"])
        self.assertEqual(response.get('nbr_verification_codes_sent'), 1)
        self.assertTrue(response.get('all_verification_codes_sent'))
        self.user = User.objects.get(pk=self.user.id)
        self.assertEqual(self.user.nbr_phone_number_verification_code_used, 0)
        response = send_whatsapp("test", ["+212612505257", "+212612505257"])
        self.assertEqual(response.get('nbr_verification_codes_sent'), 2)
        self.assertTrue(response.get('all_verification_codes_sent'))
        self.user = User.objects.get(pk=self.user.id)
        self.assertEqual(self.user.nbr_phone_number_verification_code_used, 0)
        response = send_whatsapp("test", ["+212612505257"], handle_error=True)
        self.assertEqual(response.get('nbr_verification_codes_sent'), 0)
        self.assertFalse(response.get('all_verification_codes_sent'))
        self.user = User.objects.get(pk=self.user.id)
        self.assertEqual(self.user.nbr_phone_number_verification_code_used, 0)

    @patch('django.core.files.storage.default_storage.save')
    def test_upload_file(self, mock_save):
        # Create a fake image file (for the test)
        test_file = SimpleUploadedFile(name='test_image.jpg', content=b'fake_image_content', content_type='image/jpeg')

        # Mock the `save` method to simulate file saving
        mock_save.return_value = 'profile_images/profile_test_image.jpg'

        # Simulate request with the file
        request = self.factory.post('/fake-url/', {})
        file_url, file_path = upload_file(request, test_file, 'profile_images', prefix="profile_")

        # Assert that the file URL and path are correct
        self.assertEqual(file_url, f'{request.build_absolute_uri(settings.MEDIA_URL)}profile_images/profile_test_image.jpg')
        self.assertEqual(file_path, 'profile_images/profile_test_image.jpg')

        file_url, file_path = upload_file(request, None, 'profile_images', prefix="profile_")
        self.assertIsNone(file_url)
        self.assertIsNone(file_path)


class GeolocationViewTests(TestCase):
    def setUp(self):
        self.factory = RequestFactory()

    @patch("requests.get")
    def test_success(self, mock_get):
        # Mock API response
        mock_get.return_value.json.return_value = {
            "country": "France",
            "countryCode": "FR",
        }

        # Simulate request
        request = self.factory.get("/geolocation/")
        response = get_geolocation(request)

        data = json.loads(response.content.decode('utf-8'))

        # Assertions
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(data.get("countryCode"), "FR")
        self.assertEqual(data.get("country"), "France")

    @patch("requests.get")
    def test_invalid_ip(self, mock_get):
        # Simulate missing IP
        request = self.factory.get("/geolocation/?selected_language=fr", REMOTE_ADDR=None)
        response = get_geolocation(request)
        data = json.loads(response.content.decode('utf-8'))

        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertEqual(data.get("error"), _('Geolocation service unavailable. Try again later.'))



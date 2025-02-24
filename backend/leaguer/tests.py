from .utils import execute_native_query, generate_random_code, get_all_timezones, get_email_base_context, get_local_datetime, send_whatsapp, send_phone_message
from accounts.models import User
from datetime import datetime, timezone
from django.conf import settings
from django.test import TestCase
from django.utils.timezone import now
from zoneinfo import ZoneInfo
import os
from pathlib import Path


class LeaguerConfigTest(TestCase):
    def setUp(self):
        pass

    def test_firebase_credentials_path(self):
        self.assertEqual(settings.FIREBASE_CREDENTIALS_PATH, os.path.join(settings.PARENT_DIR, "firebase-service-account.json"))
        self.assertTrue(Path(settings.FIREBASE_CREDENTIALS_PATH).exists(), True)


class LeaguerUtilsTest(TestCase):
    def setUp(self):
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
        self.assertEqual(timezones[0], ["", "Sélectionner"])
        # Ensure the timezones are sorted and that they match the expected format
        self.assertTrue(all(isinstance(item, list) and len(item) == 2 for item in timezones[1:]))
        self.assertTrue(all(isinstance(item[0], str) for item in timezones[1:]))
        self.assertTrue(all(isinstance(item[1], str) for item in timezones[1:]))
        """
        Test the `get_all_timezones` function when `as_list=False`.
        """
        timezones = get_all_timezones(as_list=False)
        # Check that the default option is included
        self.assertEqual(timezones[0], ("", "Sélectionner"))
        # Ensure the timezones are sorted and that they match the expected format
        self.assertTrue(all(isinstance(item, tuple) and len(item) == 2 for item in timezones[1:]))
        self.assertTrue(all(isinstance(item[0], str) for item in timezones[1:]))
        self.assertTrue(all(isinstance(item[1], str) for item in timezones[1:]))

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



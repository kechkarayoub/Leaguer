from .utils import execute_native_query, generate_random_code, send_whatsapp
from accounts.models import User
from django.test import TestCase


class LeaguerUtilsTest(TestCase):
    def setUp(self):
        self.user = User.objects.create_user(
            email="testuser@example.com",
            first_name="First name",
            last_name="Last name",
            password="testpassword123",
            phone_number_to_verify="+212612505257",
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
                gender, is_deleted, current_language, is_email_validated, is_phone_number_validated,
                phone_number_verified_by)
            VALUES ('email2@yopmail.com', 'first_name', True, 'last_name', 'username2', 'password', False, False, NOW(),
                0, '', False, 'fr', False, False, ''),
                ('email3@yopmail.com', 'first_name', True, 'last_name', 'username3', 'password', False, False, NOW(), 
                0, '', False, 'ar', False, False, '');
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



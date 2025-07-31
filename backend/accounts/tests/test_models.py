from ..models import User
from ..serializers import UserSerializer
from ..utils import GENDERS_CHOICES
from datetime import date
from django.conf import settings
from django.test import TestCase
from rest_framework.test import APITestCase
from unittest.mock import patch



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


class PasswordResetTestCase(TestCase):
    """Test cases for password reset functionality."""
    
    def setUp(self):
        """Set up test data."""
        self.user = User.objects.create_user(
            username='testuser',
            email='test@example.com',
            password='oldpassword123',
            is_active=True
        )
        self.inactive_user = User.objects.create_user(
            username='inactiveuser',
            email='inactive@example.com',
            password='password123',
            is_active=False
        )

    def test_send_password_reset_email_success(self):
        """Test successful password reset email sending."""
        from accounts.utils import send_password_reset_email
        
        # Test with mocked API (testing mode)
        status_code, (uid, token) = send_password_reset_email(
            self.user, 
            handle_send_email_error=False, 
            do_not_mock_api=False
        )
        
        self.assertEqual(status_code, 200)
        self.assertIsNotNone(uid)
        self.assertIsNotNone(token)
        self.assertIn("_*_", token)  # Check token format
        
        # Verify token components
        token_parts = token.split("_*_")
        self.assertEqual(len(token_parts), 2)
        actual_token, timestamp_str = token_parts
        
        # Verify timestamp is a valid float
        try:
            timestamp = float(timestamp_str)
            self.assertGreater(timestamp, 0)
        except ValueError:
            self.fail("Token timestamp should be a valid float")

    def test_send_password_reset_email_error_handling(self):
        """Test password reset email error handling."""
        from accounts.utils import send_password_reset_email
        
        # Test with simulated email error
        status_code, (uid, token) = send_password_reset_email(
            self.user, 
            handle_send_email_error=True, 
            do_not_mock_api=False
        )
        
        self.assertEqual(status_code, 500)
        self.assertIsNotNone(uid)
        self.assertIsNotNone(token)

    def test_validate_password_reset_token_success(self):
        """Test successful password reset token validation."""
        from accounts.utils import send_password_reset_email, validate_password_reset_token
        
        # Generate a valid token
        status_code, (uid, token) = send_password_reset_email(
            self.user, 
            do_not_mock_api=False
        )
        
        # Validate the token
        is_valid, user, error_message = validate_password_reset_token(uid, token)
        
        self.assertTrue(is_valid)
        self.assertEqual(user.id, self.user.id)
        self.assertIsNone(error_message)

    def test_validate_password_reset_token_invalid_uid(self):
        """Test password reset token validation with invalid UID."""
        from accounts.utils import validate_password_reset_token
        
        invalid_uid = "invalid_uid"
        token = "dummy_token_*_1234567890"
        
        is_valid, user, error_message = validate_password_reset_token(invalid_uid, token)
        
        self.assertFalse(is_valid)
        self.assertIsNone(user)
        self.assertEqual(error_message, "Invalid user")

    def test_validate_password_reset_token_inactive_user(self):
        """Test password reset token validation with inactive user."""
        from accounts.utils import send_password_reset_email, validate_password_reset_token
        from django.utils.encoding import force_bytes
        from django.utils.http import urlsafe_base64_encode
        from django.contrib.auth.tokens import default_token_generator
        from django.utils.timezone import now
        
        # Create a token for inactive user
        token_ = default_token_generator.make_token(self.inactive_user)
        timestamp_str = str(now().timestamp())
        token = token_ + "_*_" + timestamp_str
        uid = urlsafe_base64_encode(force_bytes(self.inactive_user.pk))
        
        is_valid, user, error_message = validate_password_reset_token(uid, token)
        
        self.assertFalse(is_valid)
        self.assertIsNone(user)
        self.assertEqual(error_message, "User account is disabled")

    def test_validate_password_reset_token_invalid_format(self):
        """Test password reset token validation with invalid token format."""
        from accounts.utils import validate_password_reset_token
        from django.utils.encoding import force_bytes
        from django.utils.http import urlsafe_base64_encode
        
        uid = urlsafe_base64_encode(force_bytes(self.user.pk))
        
        # Test invalid token format (missing separator)
        invalid_token = "invalid_token_format"
        is_valid, user, error_message = validate_password_reset_token(uid, invalid_token)
        
        self.assertFalse(is_valid)
        self.assertIsNone(user)
        self.assertEqual(error_message, "Invalid token format")
        
        # Test invalid timestamp
        invalid_token_with_bad_timestamp = "token_*_invalid_timestamp"
        is_valid, user, error_message = validate_password_reset_token(uid, invalid_token_with_bad_timestamp)
        
        self.assertFalse(is_valid)
        self.assertIsNone(user)
        self.assertEqual(error_message, "Invalid token format")

    def test_validate_password_reset_token_expired(self):
        """Test password reset token validation with expired token."""
        from accounts.utils import validate_password_reset_token
        from django.utils.encoding import force_bytes
        from django.utils.http import urlsafe_base64_encode
        from django.contrib.auth.tokens import default_token_generator
        from django.utils.timezone import now
        import time
        
        # Create an expired token (25 hours old)
        old_timestamp = now().timestamp() - (25 * 3600)  # 25 hours ago
        token_ = default_token_generator.make_token(self.user)
        token = token_ + "_*_" + str(old_timestamp)
        uid = urlsafe_base64_encode(force_bytes(self.user.pk))
        
        is_valid, user, error_message = validate_password_reset_token(uid, token)
        
        self.assertFalse(is_valid)
        self.assertIsNone(user)
        self.assertEqual(error_message, "Token has expired")

    def test_validate_password_reset_token_invalid_token(self):
        """Test password reset token validation with invalid token."""
        from accounts.utils import validate_password_reset_token
        from django.utils.encoding import force_bytes
        from django.utils.http import urlsafe_base64_encode
        from django.utils.timezone import now
        
        # Create token with invalid signature
        invalid_token = "invalid_token_signature"
        timestamp_str = str(now().timestamp())
        token = invalid_token + "_*_" + timestamp_str
        uid = urlsafe_base64_encode(force_bytes(self.user.pk))
        
        is_valid, user, error_message = validate_password_reset_token(uid, token)
        
        self.assertFalse(is_valid)
        self.assertIsNone(user)
        self.assertEqual(error_message, "Invalid token")

    def test_password_reset_integration(self):
        """Test complete password reset flow integration."""
        from accounts.utils import send_password_reset_email, validate_password_reset_token
        
        # Step 1: Send password reset email
        status_code, (uid, token) = send_password_reset_email(
            self.user, 
            do_not_mock_api=False
        )
        self.assertEqual(status_code, 200)
        
        # Step 2: Validate the token
        is_valid, user, error_message = validate_password_reset_token(uid, token)
        self.assertTrue(is_valid)
        self.assertEqual(user.id, self.user.id)
        self.assertIsNone(error_message)
        
        # Step 3: Verify user can change password (simulated)
        old_password = user.password
        user.set_password('newpassword123')
        user.save()
        
        # Verify password was changed
        user.refresh_from_db()
        self.assertNotEqual(old_password, user.password)

    @patch('accounts.utils.EmailMultiAlternatives.send')
    def test_send_password_reset_email_real_email_sending(self, mock_send):
        """Test password reset email sending with real email backend."""
        from accounts.utils import send_password_reset_email
        
        # Mock successful email sending
        mock_send.return_value = True
        
        status_code, (uid, token) = send_password_reset_email(
            self.user, 
            handle_send_email_error=False, 
            do_not_mock_api=True
        )
        
        self.assertEqual(status_code, 200)
        mock_send.assert_called_once()

    @patch('accounts.utils.EmailMultiAlternatives.send')
    def test_send_password_reset_email_smtp_error(self, mock_send):
        """Test password reset email handling SMTP errors."""
        from accounts.utils import send_password_reset_email
        from smtplib import SMTPException
        
        # Mock SMTP error
        mock_send.side_effect = SMTPException("SMTP server error")
        
        status_code, (uid, token) = send_password_reset_email(
            self.user, 
            handle_send_email_error=False, 
            do_not_mock_api=True
        )
        
        self.assertEqual(status_code, 500)
        mock_send.assert_called_once()

    def test_token_format_consistency(self):
        """Test that tokens maintain consistent format."""
        from accounts.utils import send_password_reset_email
        
        # Generate multiple tokens and verify format
        for _ in range(5):
            status_code, (uid, token) = send_password_reset_email(
                self.user, 
                do_not_mock_api=False
            )
            
            self.assertEqual(status_code, 200)
            self.assertIn("_*_", token)
            
            token_parts = token.split("_*_")
            self.assertEqual(len(token_parts), 2)
            
            # Verify timestamp is valid
            try:
                timestamp = float(token_parts[1])
                self.assertGreater(timestamp, 0)
            except ValueError:
                self.fail("Token timestamp should be a valid float")


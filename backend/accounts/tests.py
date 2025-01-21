from .models import User
from .serializers import UserSerializer
from .utils import format_phone_number, GENDERS_CHOICES, send_phone_number_verification_code
from .views import send_verification_email, verify_user_email, verify_user_phone_number
from datetime import date
from django.conf import settings
from django.core.management import call_command
from django.test import TestCase
from django.utils.timezone import now
from io import StringIO
from rest_framework.test import APITestCase
import datetime
import json


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
            is_user_email_validated=True,
            is_user_phone_number_validated=True,
            last_name="Last name",
            password="testpassword123",
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
        self.assertEqual(self.user.last_name, "Last name")
        self.assertEqual(self.user.user_phone_number_to_verify, "+2121234567890")
        self.assertEqual(self.user.user_phone_number_verified_by, "sms")
        self.assertEqual(self.user.username, "testuser")
        self.assertFalse(self.user.is_user_email_validated)
        self.assertFalse(self.user.is_user_deleted)
        self.assertFalse(self.user.is_user_phone_number_validated)
        self.assertIsNone(self.user.user_phone_number)
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
        self.assertIsNone(self.user.user_phone_number_verification_code)
        status_code, _ = send_phone_number_verification_code(self.user, handle_send_phone_number_verification_sms_error=True, mock_api=True)
        self.user = User.objects.get(pk=self.user.id)
        self.assertEqual(status_code, 500)
        self.assertIsNone(self.user.user_phone_number_verification_code)
        status_code, (uid, verification_code) = send_phone_number_verification_code(self.user, mock_api=True)
        self.user = User.objects.get(pk=self.user.id)
        self.assertEqual(status_code, 200)
        self.assertEqual(self.user.user_phone_number_verification_code, verification_code)


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
            'is_user_phone_number_validated': True,
            'last_name': "Last name",
            'password': "testpassword123",
            'user_phone_number': "+2126-234 56709",
            'user_phone_number_to_verify': "+212623456709",
            'user_phone_number_verified_by': "google",
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
        self.assertEqual(data['last_name'], "Last name")
        self.assertEqual(data['user_phone_number_to_verify'], "+212623456789")
        self.assertEqual(data['user_phone_number_verified_by'], "")
        self.assertEqual(data['username'], "testuser")
        self.assertEqual(len(data.keys()), 23)
        self.assertIn('date_joined', data)
        self.assertIsNone(data['user_phone_number'])
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
        self.assertEqual(data2['last_name'], "Last name")
        self.assertEqual(data2['user_phone_number'], "+212623456709")
        self.assertEqual(data2['user_phone_number_to_verify'], "+212623456709")
        self.assertEqual(data2['user_phone_number_verified_by'], "google")
        self.assertEqual(data2['username'], "testuser2")
        self.assertEqual(len(data2.keys()), 23)
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
        self.user = User.objects.create_user(username='testuser', email='test@example.com', password='password123')
        self.user_ar = User.objects.create_user(username='testuser_ar', email='test_ar@example.com', password='password123', current_language='ar')
        self.user_en = User.objects.create_user(username='testuser_en', email='test_en@example.com', password='password123', current_language='en')

    def test_send_verification_email(self):
        self.assertFalse(self.user.is_user_email_validated)
        status_code, _ = send_verification_email(self.user)
        self.assertEqual(status_code, 200)
        status_code, _ = send_verification_email(self.user, handle_send_email_error=True)
        self.assertEqual(status_code, 500)

    def test_verify_user_email_valid(self):
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
        _, (uid, token) = send_verification_email(self.user)
        verified, already_verified, expired_token = verify_user_email(uid, 'invalid-token')
        self.assertFalse(verified)
        self.assertFalse(already_verified)
        self.assertFalse(expired_token)

    def test_verify_user_email_expired(self):
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
        self.user_ar = User.objects.create_user(username='testuser_ar', email='test_ar@example.com', password='password123', current_language='ar', user_phone_number_to_verify='+212612505257')
        self.user_en = User.objects.create_user(username='testuser_en', email='test_en@example.com', password='password123', current_language='en', user_phone_number_to_verify='+212612505257')
        self.user_fr = User.objects.create_user(username='testuser_fr', email='test_fr@example.com', password='password123', current_language='fr', user_phone_number_to_verify='+212612505257')

    def test_verify_user_phone_number_valid(self):
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
        _, (uid, verification_code) = send_phone_number_verification_code(self.user, mock_api=True)
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
        _, (uid, verification_code) = send_phone_number_verification_code(self.user, mock_api=True)
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
        _, (uid, verification_code) = send_phone_number_verification_code(self.user, mock_api=True)
        self.user = User.objects.get(pk=self.user.id)
        self.user.user_phone_number = None
        self.user.is_user_phone_number_validated = False
        self.user.save()
        _, (uid, verification_code) = send_phone_number_verification_code(self.user, mock_api=True)
        verified, already_verified, expired_verification_code, quota_exceeded = verify_user_phone_number(uid, 'verification_code', resend_verification_phone_number_code=True)
        self.assertFalse(verified)
        self.assertFalse(already_verified)
        self.assertFalse(expired_verification_code)
        self.assertFalse(quota_exceeded)
        _, (uid, verification_code) = send_phone_number_verification_code(self.user, mock_api=True)
        verified, already_verified, expired_verification_code, quota_exceeded = verify_user_phone_number(uid, 'verification_code', resend_verification_phone_number_code=True)
        self.assertFalse(verified)
        self.assertFalse(already_verified)
        self.assertFalse(expired_verification_code)
        self.assertTrue(quota_exceeded)

    def test_verify_phone_number_view(self):
        _, (uid, verification_code) = send_phone_number_verification_code(self.user_fr, mock_api=True)
        response = self.client.get('/accounts/verify-phone-number/', {'uid': uid, 'verification_code': verification_code})
        self.assertEqual(response.status_code, 200)
        data = json.loads(response.content.decode('utf-8'))
        message = data.get("message")
        self.assertEqual(message, "Numéro de téléphone vérifié avec succès.")
        response = self.client.get('/accounts/verify-phone-number/', {'uid': uid, 'verification_code': verification_code})
        data = json.loads(response.content.decode('utf-8'))
        message = data.get("message")
        self.assertEqual(message, "Numéro de téléphone déjà vérifié.")
        _, (uid, verification_code) = send_phone_number_verification_code(self.user_fr, mock_api=True)
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
        _, (uid, verification_code) = send_phone_number_verification_code(self.user_fr, mock_api=True)
        response = self.client.get('/accounts/verify-phone-number/', {'uid': uid, 'verification_code': 'verification_code'})
        data = json.loads(response.content.decode('utf-8'))
        message = data.get("message")
        self.assertEqual(message, "Code invalide.")

    def test_verify_phone_number_view_en(self):
        _, (uid, verification_code) = send_phone_number_verification_code(self.user_en, mock_api=True)
        response = self.client.get('/accounts/verify-phone-number/', {'uid': uid, 'verification_code': verification_code})
        self.assertEqual(response.status_code, 200)
        data = json.loads(response.content.decode('utf-8'))
        message = data.get("message")
        self.assertEqual(message, "Phone number verified successfully.")
        response = self.client.get('/accounts/verify-phone-number/', {'uid': uid, 'verification_code': verification_code})
        data = json.loads(response.content.decode('utf-8'))
        message = data.get("message")
        self.assertEqual(message, "Phone number already verified.")
        _, (uid, verification_code) = send_phone_number_verification_code(self.user_en, mock_api=True)
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
        _, (uid, verification_code) = send_phone_number_verification_code(self.user_en, mock_api=True)
        response = self.client.get('/accounts/verify-phone-number/', {'uid': uid, 'verification_code': 'verification_code'})
        data = json.loads(response.content.decode('utf-8'))
        message = data.get("message")
        self.assertEqual(message, "Invalid code.")

    def test_verify_phone_number_view_ar(self):
        _, (uid, verification_code) = send_phone_number_verification_code(self.user_ar, mock_api=True)
        response = self.client.get('/accounts/verify-phone-number/', {'uid': uid, 'verification_code': verification_code})
        self.assertEqual(response.status_code, 200)
        data = json.loads(response.content.decode('utf-8'))
        message = data.get("message")
        self.assertEqual(message, "تم التحقق من رقم الهاتف بنجاح.")
        response = self.client.get('/accounts/verify-phone-number/', {'uid': uid, 'verification_code': verification_code})
        data = json.loads(response.content.decode('utf-8'))
        message = data.get("message")
        self.assertEqual(message, "رقم الهاتف تم التحقق منه بالفعل.")
        _, (uid, verification_code) = send_phone_number_verification_code(self.user_ar, mock_api=True)
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
        _, (uid, verification_code) = send_phone_number_verification_code(self.user_ar, mock_api=True)
        response = self.client.get('/accounts/verify-phone-number/', {'uid': uid, 'verification_code': 'verification_code'})
        data = json.loads(response.content.decode('utf-8'))
        message = data.get("message")
        self.assertEqual(message, "رمز غير صالح.")

    def test_verify_phone_number_view_missing_params(self):
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
        self.assertIn('2 verification email are sent, 0 are not.', out.getvalue())

    def test_command_without_arguments_with_all_email_verified(self):
        out = StringIO()
        self.user.is_user_email_validated = True
        self.user.save()
        self.user2.is_user_email_validated = True
        self.user2.save()
        call_command('send_emails_verifications_links', stdout=out)
        self.assertIn('There is no user with not email verified yet!', out.getvalue())

    def test_command_without_no_valid_email_argument(self):
        out = StringIO()
        call_command('send_emails_verifications_links', '--email', 'novalidemail', stdout=out)
        self.assertIn('Command not executed due to invalid email parameter: novalidemail.', out.getvalue())

    def test_command_without_no_exists_email_argument(self):
        out = StringIO()
        call_command('send_emails_verifications_links', '--email', 'noexistsmail@yopmail.com', stdout=out)
        self.assertIn('There is any user with this email: noexistsmail@yopmail.com, or it is already verified!', out.getvalue())

    def test_command_without_exists_email_argument(self):
        out = StringIO()
        call_command('send_emails_verifications_links', '--email', 'test2@example.com', stdout=out)
        self.assertIn('1 verification email are sent, 0 are not.', out.getvalue())

    def test_command_without_exists_email_but_already_verified_argument(self):
        out = StringIO()
        self.user2.is_user_email_validated = True
        self.user2.save()
        call_command('send_emails_verifications_links', '--email', 'test2@example.com', stdout=out)
        self.assertIn('There is any user with this email: test2@example.com, or it is already verified!', out.getvalue())


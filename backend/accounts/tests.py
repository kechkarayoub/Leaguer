from .models import User
from .serializers import UserSerializer
from .utils import GENDERS_CHOICES
from .views import send_verification_email, verify_user_email
from datetime import date
from django.conf import settings
from django.core.management import call_command
from django.test import TestCase
from io import StringIO
from rest_framework.test import APITestCase
import datetime
import json


class UserModelTest(TestCase):
    def setUp(self):
        self.user = User.objects.create_user(
            address="123 Test Street",
            birthday=date(2000, 1, 1),
            cin="Cin test",
            country="Testland",
            email="testuser@example.com",
            first_name="First name",
            gender=GENDERS_CHOICES[1][0],
            image_url="https://www.s3.com/image_url",
            last_name="Last name",
            password="testpassword123",
            phone_number="1234567890",
            username="testuser",
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
        user3.is_email_validated = True
        user3.save()
        result = User.send_emails_verifications_links(email="testuser3@example.com")
        self.assertEqual(result, "There is any user with this email: testuser3@example.com, or it is already verified!")
        result = User.send_emails_verifications_links()
        self.assertEqual(result, "2 verification email are sent, 0 are not.")
        user2.is_email_validated = True
        user2.save()
        self.user.is_email_validated = True
        self.user.save()
        result = User.send_emails_verifications_links()
        self.assertEqual(result, "There is no user with not email verified yet!")

    def test_user_creation(self):
        self.assertEqual(self.user.address, "123 Test Street")
        self.assertEqual(self.user.birthday, date(2000, 1, 1))
        self.assertEqual(self.user.cin, "Cin test")
        self.assertEqual(self.user.country, "Testland")
        self.assertEqual(self.user.current_language, settings.LANGUAGE_CODE)
        self.assertEqual(self.user.email, "testuser@example.com")
        self.assertEqual(self.user.first_name, "First name")
        self.assertEqual(self.user.gender, GENDERS_CHOICES[1][0])
        self.assertEqual(self.user.image_url, "https://www.s3.com/image_url")
        self.assertEqual(self.user.last_name, "Last name")
        self.assertEqual(self.user.phone_number, "1234567890")
        self.assertEqual(self.user.username, "testuser")
        self.assertFalse(self.user.is_email_validated)
        self.assertFalse(self.user.is_deleted)
        self.assertFalse(self.user.is_phone_number_validated)
        self.assertNotEqual(self.user.password, "testpassword123")
        self.assertTrue(self.user.is_active)

    def test_str_representation(self):
        self.assertEqual(str(self.user), "testuser")

    def test_unique_cin_constraint(self):
        """Test that cin must be unique."""
        user_data = {
            'cin': "cin2",
            'email': "testuser2@example.com",
            'password': "testpassword123",
            'phone_number': "12345678902",
            'username': "testuser2",
        }
        User.objects.create(**user_data)
        with self.assertRaises(Exception):  # IntegrityError for SQLite, ValidationError otherwise
            User.objects.create(
                cin="cin2",
                email="testuser3@example.com",
                password="testpassword123",
                username="testuser3",
            )

    def test_unique_email_constraint(self):
        """Test that email must be unique."""
        user_data = {
            'cin': "cin2",
            'email': "testuser2@example.com",
            'password': "testpassword123",
            'phone_number': "12345678902",
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
            'cin': "cin2",
            'email': "testuser2@example.com",
            'password': "testpassword123",
            'phone_number': "12345678902",
            'username': "testuser2",
        }
        User.objects.create(**user_data)
        with self.assertRaises(Exception):  # IntegrityError for SQLite, ValidationError otherwise
            User.objects.create(
                email="testuser3@example.com",
                password="testpassword123",
                phone_number="12345678902",
                username="testuser3",
            )


class UserSerializerTest(APITestCase):
    def setUp(self):
        self.valid_data = {
            'address': "123 Test Street",
            'birthday': date(2000, 1, 1),
            'cin': "Cin test",
            'country': "Testland",
            'current_language': "en",
            'email': "testuser@example.com",
            'first_name': "First name",
            'gender': GENDERS_CHOICES[1][0],
            'image_url': "https://www.s3.com/image_url",
            'last_name': "Last name",
            'password': "testpassword123",
            'phone_number': "+1234567890",
            'username': "testuser",
        }

    def test_serializer_fields(self):

        user = User.objects.create_user(
            **self.valid_data
        )
        serializer = UserSerializer(instance=user)
        data = serializer.data
        self.assertEqual(data['address'], "123 Test Street")
        self.assertEqual(data['birthday'], "2000-01-01")
        self.assertEqual(data['cin'], "Cin test")
        self.assertEqual(data['country'], "Testland")
        self.assertEqual(data['current_language'], "en")
        self.assertEqual(data['email'], "testuser@example.com")
        self.assertEqual(data['first_name'], "First name")
        self.assertEqual(data['gender'], GENDERS_CHOICES[1][0])
        self.assertEqual(data['image_url'], "https://www.s3.com/image_url")
        self.assertEqual(data['last_name'], "Last name")
        self.assertEqual(data['phone_number'], "+1234567890")
        self.assertEqual(data['username'], "testuser")
        self.assertEqual(len(data.keys()), 18)
        self.assertIn('date_joined', data)

    def test_valid_serializer(self):
        """Test serializer with valid data."""
        serializer = UserSerializer(data=self.valid_data)
        serializer.is_valid()
        self.assertTrue(serializer.is_valid())
        self.assertEqual(serializer.validated_data["username"], self.valid_data["username"])

    def test_invalid_birthday(self):
        """Test serializer with an invalid birthday."""
        serializer = UserSerializer(data={**self.valid_data, 'birthday': "invalid phone number"})
        self.assertFalse(serializer.is_valid())
        self.assertIn("birthday", serializer.errors)
        serializer = UserSerializer(data={**self.valid_data, 'birthday': ""})
        self.assertFalse(serializer.is_valid())
        self.assertIn("birthday", serializer.errors)
        serializer = UserSerializer(data={**self.valid_data, 'birthday': date.today()})
        self.assertFalse(serializer.is_valid())
        self.assertIn("birthday", serializer.errors)

    def test_invalid_image_url(self):
        """Test serializer with an invalid image_url."""
        serializer = UserSerializer(data={**self.valid_data, 'image_url': "invalid image url"})
        self.assertFalse(serializer.is_valid())
        self.assertIn("image_url", serializer.errors)

    def test_invalid_phone_number(self):
        """Test serializer with an invalid phone number."""
        serializer = UserSerializer(data={**self.valid_data, 'phone_number': "invalid phone number"})
        self.assertFalse(serializer.is_valid())
        self.assertIn("phone_number", serializer.errors)
        serializer = UserSerializer(data={**self.valid_data, 'phone_number': "123"})
        self.assertFalse(serializer.is_valid())
        self.assertIn("phone_number", serializer.errors)


class EmailVerificationTests(TestCase):
    def setUp(self):
        self.user = User.objects.create_user(username='testuser', email='test@example.com', password='password123')
        self.user_ar = User.objects.create_user(username='testuser_ar', email='test_ar@example.com', password='password123', current_language='ar')
        self.user_en = User.objects.create_user(username='testuser_en', email='test_en@example.com', password='password123', current_language='en')

    def test_send_verification_email(self):
        self.assertFalse(self.user.is_email_validated)
        status_code, _ = send_verification_email(self.user)
        self.assertEqual(status_code, 200)
        status_code, _ = send_verification_email(self.user, handle_end_email_error=True)
        self.assertEqual(status_code, 500)

    def test_verify_user_email_valid(self):
        _, (uid, token) = send_verification_email(self.user)
        verified, already_verified, expired_token = verify_user_email(uid, token)
        self.assertTrue(verified)
        self.assertFalse(already_verified)
        self.assertFalse(expired_token)
        self.user = User.objects.get(pk=self.user.id)
        self.assertTrue(self.user.is_email_validated)
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
        yesterday_timestamp = (datetime.datetime.now() - datetime.timedelta(days=1)).timestamp()
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
        self.assertTrue(self.user.is_email_validated)
        data = json.loads(response.content.decode('utf-8'))
        message = data.get("message")
        self.assertEqual(message, "L'email a été vérifié avec succès.")
        response = self.client.get('/accounts/verify-email/', {'uid': uid, 'token': token})
        self.assertEqual(response.status_code, 200)
        self.user = User.objects.get(pk=self.user.id)
        self.assertTrue(self.user.is_email_validated)
        data = json.loads(response.content.decode('utf-8'))
        message = data.get("message")
        self.assertEqual(message, "L'email a déjà été vérifié.")
        User.objects.filter(pk=self.user.id).update(is_email_validated=False)
        response = self.client.get('/accounts/verify-email/', {'uid': uid, 'token': token, 'resend_verification_email': "true"})
        self.assertEqual(response.status_code, 400)
        self.user = User.objects.get(pk=self.user.id)
        self.assertFalse(self.user.is_email_validated)
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
        User.objects.filter(pk=self.user_en.id).update(is_email_validated=False)
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
        User.objects.filter(pk=self.user_ar.id).update(is_email_validated=False)
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
        self.user.is_email_validated = True
        self.user.save()
        self.user2.is_email_validated = True
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
        self.user2.is_email_validated = True
        self.user2.save()
        call_command('send_emails_verifications_links', '--email', 'test2@example.com', stdout=out)
        self.assertIn('There is any user with this email: test2@example.com, or it is already verified!', out.getvalue())


from .models import User
from .serializers import UserSerializer
from .utils import GENDERS_CHOICES
from .views import send_verification_email, verify_user_email
from datetime import date
from django.conf import settings
from django.test import TestCase
from django.utils.translation import gettext_lazy as _
from rest_framework.test import APITestCase
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
    #
    # def test_send_verification_email(self):
    #     self.assertFalse(self.user.is_email_validated)
    #     status_code, _ = send_verification_email(self.user)
    #     self.assertEqual(status_code, 200)
    #     status_code, _ = send_verification_email(self.user, handle_end_email_error=True)
    #     self.assertEqual(status_code, 500)
    #
    # def test_verify_user_email_valid(self):
    #     _, (uid, token) = send_verification_email(self.user)
    #     verified, already_verified = verify_user_email(uid, token)
    #     self.assertTrue(verified)
    #     self.assertFalse(already_verified)
    #     self.user = User.objects.get(pk=self.user.id)
    #     self.assertTrue(self.user.is_email_validated)
    #     verified, already_verified = verify_user_email(uid, token)
    #     self.assertTrue(verified)
    #     self.assertTrue(already_verified)
    #
    # def test_verify_user_email_invalid(self):
    #     _, (uid, token) = send_verification_email(self.user)
    #     verified, already_verified = verify_user_email(uid, 'invalid-token')
    #     self.assertFalse(verified)
    #     self.assertFalse(already_verified)

    def test_verify_email_view(self):
        _, (uid, token) = send_verification_email(self.user)
        response = self.client.get('/accounts/verify-email/', {'uid': uid, 'token': token})
        self.assertEqual(response.status_code, 200)
        self.user = User.objects.get(pk=self.user.id)
        self.assertTrue(self.user.is_email_validated)
        data = json.loads(response.content.decode('utf-8'))
        message = data.get("message")
        self.assertEqual(message, "Email verified successfully.")
        response = self.client.get('/accounts/verify-email/', {'uid': uid, 'token': token})
        self.assertEqual(response.status_code, 200)
        self.user = User.objects.get(pk=self.user.id)
        self.assertTrue(self.user.is_email_validated)
        data = json.loads(response.content.decode('utf-8'))
        message = data.get("message")
        self.assertEqual(message, "Email already verified.")

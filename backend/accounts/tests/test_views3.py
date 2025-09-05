"""Test accounts views 3"""
import datetime
import json
from unittest.mock import patch

from django.conf import settings
from django.test import TestCase
from rest_framework.test import APIRequestFactory

from accounts.models import User
from accounts.utils import send_phone_number_verification_code
from accounts.views import (SignInThirdPartyView, send_verification_email,
                     verify_user_email, verify_user_phone_number)


class SendVerificationEmailLinkViewTest(TestCase):
    """Test sending verification email link"""
    def setUp(self):
        self.user = User.objects.create_user(
            username='testuser',
            email='kechkarayoub@gmail.com',
            password='password123'
        )
        self.user2 = User.objects.create_user(
            username='testuser2',
            email='kechkarayoub2@gmail.com',
            password='password123'
        )
    def test_missing_params(self):
        """Test missing params"""
        response = self.client.post(
            '/accounts/send-verification-email-link/',
            {'selected_language': 'en'}
        )
        self.assertEqual(response.status_code, 400)
        data = json.loads(response.content.decode('utf-8'))
        message = data.get("message")
        self.assertEqual(message, "User id is required")
        self.assertFalse(data.get("success"))
    def test_send_verification_email_link_failed_invalid_credentials(self):
        """Test sending verification email link failed due to invalid credentials"""
        response = self.client.post(
            '/accounts/send-verification-email-link/',
            {'selected_language': 'en', 'user_id': 100}
        )
        self.assertEqual(response.status_code, 404)
        data = json.loads(response.content.decode('utf-8'))
        self.assertEqual(data.get("message"), None)
        self.assertFalse(data.get("success"))
    def test_send_verification_email_link_failed_activated_email(self):
        """Test sending verification email link failed due to already activated email"""
        self.user.is_user_email_validated = True
        self.user.save()
        response = self.client.post(
            '/accounts/send-verification-email-link/',
            {'selected_language': 'en', 'user_id': self.user.id}
        )
        self.assertEqual(response.status_code, 401)
        data = json.loads(response.content.decode('utf-8'))
        self.assertEqual(
            data.get("message"),
            "Your email is already verified. Try to sign in."
        )
        self.assertFalse(data.get("success"))
    def test_send_verification_email_link_success(self):
        """Test sending verification email link success"""
        if settings.ENABLE_EMAIL_VERIFICATION is False:
            self.assertEqual(2, 1 + 1)
            return
        self.user2.is_user_email_validated = False
        self.user2.save()
        response = self.client.post(
            '/accounts/send-verification-email-link/',
            {'selected_language': 'en', 'user_id': self.user2.id}
        )
        self.assertEqual(response.status_code, 200)
        data = json.loads(response.content.decode('utf-8'))
        expected_message = (
            "A new verification link has been sent to your email address. "
            "Please verify your email before logging in."
        )
        self.assertEqual(data.get("message"), expected_message)
        self.assertTrue(data.get("success"))


class SignInThirdPartyViewTest(TestCase):
    """Test SignInThirdPartyView"""
    def setUp(self):
        self.factory = APIRequestFactory()
        self.user = User.objects.create_user(
            username='testuser',
            email='kechkarayoub@gmail.com',
            password='password123'
        )
    def test_missing_params(self):
        """Test missing parameters"""
        response = self.client.post(
            '/accounts/sign-in-third-party/',
            {'selected_language': 'en'}
        )
        self.assertEqual(response.status_code, 400)
        data = json.loads(response.content.decode('utf-8'))
        message = data.get("message")
        expected_message = "Email, Id token and Third party type are required"
        self.assertEqual(message, expected_message)
        self.assertFalse(data.get("success"))
        response = self.client.post(
            '/accounts/sign-in-third-party/',
            {'selected_language': 'en', 'id_token': ""}
        )
        self.assertEqual(response.status_code, 400)
        data = json.loads(response.content.decode('utf-8'))
        message = data.get("message")
        self.assertEqual(message, expected_message)
        self.assertFalse(data.get("success"))
        response = self.client.post(
            '/accounts/sign-in-third-party/',
            {'selected_language': 'en', 'email': ""}
        )
        self.assertEqual(response.status_code, 400)
        data = json.loads(response.content.decode('utf-8'))
        message = data.get("message")
        self.assertEqual(message, expected_message)
        self.assertFalse(data.get("success"))
    @patch("google.oauth2.id_token.verify_oauth2_token")
    def test_sign_in_failed_invalid_credentials(self, mock_verify_id_token):
        """Test sign in failed due to invalid credentials"""
        mock_verify_id_token.return_value = None  # Simulate invalid token
        response = self.client.post(
            '/accounts/sign-in-third-party/',
            {
                'selected_language': 'en',
                'email': "invalid username",
                'id_token': "id_token",
                "type_third_party": "google"
            }
        )
        self.assertEqual(response.status_code, 400)
        data = json.loads(response.content.decode('utf-8'))
        self.assertEqual(data.get("message"), "Invalid credentials")
        self.assertFalse(data.get("success"))
        response = self.client.post(
            '/accounts/sign-in-third-party/',
            {
                'selected_language': 'en',
                'email': "invalid username",
                'id_token': "id_token",
                "type_third_party": "xxxx"
            }
        )
        self.assertEqual(response.status_code, 400)
        data = json.loads(response.content.decode('utf-8'))
        self.assertEqual(data.get("message"), "Invalid credentials")
        self.assertFalse(data.get("success"))
    @patch("google.oauth2.id_token.verify_oauth2_token")
    def test_sign_in_failed_deleted_account(self, mock_verify_id_token):
        """Test sign in failed due to deleted account"""
        mock_verify_id_token.return_value = {
            "email": self.user.email,
            "email_verified": True
        }
        self.user.is_user_deleted = True
        self.user.save()
        response = self.client.post(
            '/accounts/sign-in-third-party/',
            {
                'selected_language': 'en',
                'email': "kechkarayoub@gmail.com",
                'id_token': "id_token",
                "type_third_party": "google"
            }
        )
        self.assertEqual(response.status_code, 401)
        data = json.loads(response.content.decode('utf-8'))
        expected_message = (
            "Your account is deleted. "
            "Please contact the technical team to resolve your issue."
        )
        self.assertEqual(data.get("message"), expected_message)
        self.assertFalse(data.get("success"))
    @patch("google.oauth2.id_token.verify_oauth2_token")
    def test_sign_in_failed_inactive_account(self, mock_verify_id_token):
        """Test sign in failed due to inactive account"""
        mock_verify_id_token.return_value = {
            "email": self.user.email,
            "email_verified": True
        }
        self.user.is_active = False
        self.user.save()
        response = self.client.post(
            '/accounts/sign-in-third-party/',
            {
                'selected_language': 'en',
                'email': "kechkarayoub@gmail.com",
                'id_token': "id_token",
                "type_third_party": "google"
            }
        )
        self.assertEqual(response.status_code, 401)
        data = json.loads(response.content.decode('utf-8'))
        expected_message = (
            "Your account is inactive. "
            "Please contact the technical team to resolve your issue."
        )
        self.assertEqual(data.get("message"), expected_message)
        self.assertFalse(data.get("success"))
    @patch("google.oauth2.id_token.verify_oauth2_token")
    def test_sign_in_success(self, mock_verify_id_token):
        """Test sign in success"""
        mock_verify_id_token.return_value = {
            "email": self.user.email,
            "email_verified": True
        }
        response = self.client.post(
            '/accounts/sign-in-third-party/',
            {
                'selected_language': 'en',
                'email': "kechkarayoub@gmail.com",
                'id_token': "id_token",
                "type_third_party": "google"
            }
        )
        self.assertEqual(response.status_code, 200)
        data = json.loads(response.content.decode('utf-8'))
        self.assertEqual(data.get("user"), self.user.to_login_dict())
        self.assertIsNone(data.get("message"))
        self.assertTrue(data.get("success"))
        self.assertTrue("access_token" in data)
        self.assertTrue("refresh_token" in data)
    @patch("google.oauth2.id_token.verify_oauth2_token")
    def test_sign_in_success_with_user_param(self, mock_verify_id_token):
        """Test sign in success with user param"""
        mock_verify_id_token.return_value = None
        request = self.factory.post(
            '/accounts/sign-in-third-party/',
            {
                'selected_language': 'en',
                'email': "kechkarayoub@gmail.com",
                'id_token': "id_token",
                "type_third_party": "google"
            }
        )
        response = SignInThirdPartyView.as_view()(request, user=self.user)
        response.render()  # This will render the content
        self.assertEqual(response.status_code, 200)
        data = json.loads(response.content.decode('utf-8'))
        self.assertEqual(data.get("user"), self.user.to_login_dict())
        self.assertIsNone(data.get("message"))
        self.assertTrue(data.get("success"))
        self.assertTrue("access_token" in data)
        self.assertTrue("refresh_token" in data)


class SignInViewTest(TestCase):
    """ Test sign in view """
    def setUp(self):
        self.user = User.objects.create_user(username='testuser',
                            email='kechkarayoub@gmail.com', password='password123')
    def test_missing_params(self):
        """ Test missing parameters """
        response = self.client.post('/accounts/sign-in/', {'selected_language': 'en'})
        self.assertEqual(response.status_code, 400)
        data = json.loads(response.content.decode('utf-8'))
        message = data.get("message")
        self.assertEqual(message, "Email/Username and password are required")
        self.assertFalse(data.get("success"))
        response = self.client.post('/accounts/sign-in/', {'selected_language': 'en',
                                                           'email_or_username': ""})
        self.assertEqual(response.status_code, 400)
        data = json.loads(response.content.decode('utf-8'))
        message = data.get("message")
        self.assertEqual(message, "Email/Username and password are required")
        self.assertFalse(data.get("success"))
        response = self.client.post('/accounts/sign-in/', {'selected_language': 'en',
                                                           'password': ""})
        self.assertEqual(response.status_code, 400)
        data = json.loads(response.content.decode('utf-8'))
        message = data.get("message")
        self.assertEqual(message, "Email/Username and password are required")
        self.assertFalse(data.get("success"))
    def test_sign_in_failed_invalid_credentials(self):
        """ Test sign in failed invalid credentials """
        response = self.client.post('/accounts/sign-in/', {'selected_language': 'en',
            'email_or_username': "invalid username", 'password': "password123"})
        self.assertEqual(response.status_code, 400)
        data = json.loads(response.content.decode('utf-8'))
        self.assertEqual(data.get("message"), "Invalid credentials")
        self.assertFalse(data.get("success"))
        response = self.client.post('/accounts/sign-in/', {'selected_language': 'en',
            'email_or_username': "testuser", 'password': "invalid password"})
        self.assertEqual(response.status_code, 400)
        data = json.loads(response.content.decode('utf-8'))
        self.assertEqual(data.get("message"), "Invalid credentials")
        self.assertFalse(data.get("success"))
    def test_sign_in_failed_deleted_account(self):
        """ Test sign in failed deleted account """
        self.user.is_user_deleted = True
        self.user.save()
        response = self.client.post('/accounts/sign-in/', {'selected_language': 'en',
            'email_or_username': "testuser", 'password': "password123"})
        self.assertEqual(response.status_code, 401)
        data = json.loads(response.content.decode('utf-8'))
        self.assertEqual(data.get("message"), "Your account is deleted. "
                         "Please contact the technical team to resolve your issue.")
        self.assertFalse(data.get("success"))
    def test_sign_in_failed_inactive_account(self):
        """ Test sign in failed inactive account """
        self.user.is_active = False
        self.user.save()
        response = self.client.post('/accounts/sign-in/', {'selected_language': 'en',
                        'email_or_username': "testuser", 'password': "password123"})
        self.assertEqual(response.status_code, 401)
        data = json.loads(response.content.decode('utf-8'))
        self.assertEqual(data.get("message"), "Your account is inactive. "
                         "Please contact the technical team to resolve your issue.")
        self.assertFalse(data.get("success"))
    def test_sign_in_failed_invalidate_email(self):
        """ Test sign in failed invalid email """
        if settings.ENABLE_EMAIL_VERIFICATION is False:
            self.assertEqual(2, 1 + 1)
            return
        self.user.is_user_email_validated = False
        self.user.save()
        response = self.client.post('/accounts/sign-in/',{'selected_language': 'en',
                        'email_or_username': "testuser", 'password': "password123"})
        self.assertEqual(response.status_code, 401)
        data = json.loads(response.content.decode('utf-8'))
        self.assertEqual(data.get("message"), "Your email is not yet verified. "
                         "Please verify your email address before sign in.")
        self.assertEqual(data.get("user_id"), 1)
        self.assertFalse(data.get("success"))
    def test_sign_in_success(self):
        """ Test sign in success """
        response = self.client.post('/accounts/sign-in/', {'selected_language': 'en',
                        'email_or_username': "testuser", 'password': "password123"})
        self.assertEqual(response.status_code, 200)
        data = json.loads(response.content.decode('utf-8'))
        self.assertEqual(data.get("user"), self.user.to_login_dict())
        self.assertIsNone(data.get("message"))
        self.assertTrue(data.get("success"))
        self.assertTrue("access_token" in data)
        self.assertTrue("refresh_token" in data)


class EmailVerificationTests(TestCase):
    """ Test email verification """
    def setUp(self):
        self.user = User.objects.create_user(
            username='testuser', email='kechkarayoub@gmail.com', password='password123')
        self.user_ar = User.objects.create_user(
            username='testuser_ar', email='test_ar@example.com',
            password='password123', current_language='ar')
        self.user_en = User.objects.create_user(
            username='testuser_en', email='test_en@example.com',
            password='password123', current_language='en')
    def test_send_verification_email(self):
        """ Test sending verification email """
        if settings.ENABLE_EMAIL_VERIFICATION is False:
            self.assertEqual(2, 1 + 1)
            return
        self.assertFalse(self.user.is_user_email_validated)
        status_code, _ = send_verification_email(self.user)
        self.assertEqual(status_code, 200)
        status_code, _ = send_verification_email(self.user, handle_send_email_error=True)
        self.assertEqual(status_code, 500)
    def test_verify_user_email_valid(self):
        """ Test verifying user email with valid token """
        if settings.ENABLE_EMAIL_VERIFICATION is False:
            self.assertEqual(2, 1 + 1)
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
        """Test verifying user email with invalid token."""
        if settings.ENABLE_EMAIL_VERIFICATION is False:
            self.assertEqual(2, 1 + 1)
            return
        _, (uid, _token) = send_verification_email(self.user)
        verified, already_verified, expired_token = verify_user_email(uid, 'invalid-token')
        self.assertFalse(verified)
        self.assertFalse(already_verified)
        self.assertFalse(expired_token)
    def test_verify_user_email_expired(self):
        """Test verifying user email with expired token."""
        if settings.ENABLE_EMAIL_VERIFICATION is False:
            self.assertEqual(2, 1 + 1)
            return
        _, (uid, token) = send_verification_email(self.user)
        now = datetime.datetime.now()
        token_date = token.split("_*_")
        yesterday_timestamp = (now() - datetime.timedelta(days=1)).timestamp()
        token_date[1] = str(yesterday_timestamp)
        token = "_*_".join(token_date)
        verified, already_verified, expired_token = verify_user_email(uid, token)
        self.assertFalse(verified)
        self.assertFalse(already_verified)
        self.assertTrue(expired_token)
    def test_verify_email_view(self):
        """Test the email verification view."""
        if settings.ENABLE_EMAIL_VERIFICATION is False:
            self.assertEqual(2, 1 + 1)
            return
        _, (uid, token) = send_verification_email(self.user)
        response = self.client.get('/accounts/verify-email/',
                                   {'uid': uid, 'token': token})
        self.assertEqual(response.status_code, 200)
        self.user = User.objects.get(pk=self.user.id)
        self.assertTrue(self.user.is_user_email_validated)
        data = json.loads(response.content.decode('utf-8'))
        message = data.get("message")
        self.assertEqual(message, "L'email a été vérifié avec succès.")
        response = self.client.get('/accounts/verify-email/',
                                   {'uid': uid, 'token': token})
        self.assertEqual(response.status_code, 200)
        self.user = User.objects.get(pk=self.user.id)
        self.assertTrue(self.user.is_user_email_validated)
        data = json.loads(response.content.decode('utf-8'))
        message = data.get("message")
        self.assertEqual(message, "L'email a déjà été vérifié.")
        User.objects.filter(pk=self.user.id).update(is_user_email_validated=False)
        response = self.client.get('/accounts/verify-email/',
            {'uid': uid, 'token': token, 'resend_verification_email': "true"})
        self.assertEqual(response.status_code, 400)
        self.user = User.objects.get(pk=self.user.id)
        self.assertFalse(self.user.is_user_email_validated)
        data = json.loads(response.content.decode('utf-8'))
        message = data.get("message")
        self.assertEqual(message, "Jeton expiré. Un nouvel e-mail de "
                         "vérification sera envoyé à votre adresse e-mail.")
    def test_verify_email_view_en(self):
        """Test the email verification view for English."""
        if settings.ENABLE_EMAIL_VERIFICATION is False:
            self.assertEqual(2, 1 + 1)
            return
        _, (uid, token) = send_verification_email(self.user_en)
        response = self.client.get('/accounts/verify-email/',
                                   {'uid': uid, 'token': token})
        self.assertEqual(response.status_code, 200)
        data = json.loads(response.content.decode('utf-8'))
        message = data.get("message")
        self.assertEqual(message, "Email verified successfully.")
        response = self.client.get('/accounts/verify-email/',
                                   {'uid': uid, 'token': token})
        data = json.loads(response.content.decode('utf-8'))
        message = data.get("message")
        self.assertEqual(message, "Email already verified.")
        User.objects.filter(pk=self.user_en.id).update(is_user_email_validated=False)
        response = self.client.get('/accounts/verify-email/',
            {'uid': uid, 'token': token, 'resend_verification_email': "true"})
        data = json.loads(response.content.decode('utf-8'))
        message = data.get("message")
        self.assertEqual(message, "Expired token. A new verification "
                         "email will be sent to your email address.")
    def test_verify_email_view_ar(self):
        """Test the email verification view for Arabic."""
        if settings.ENABLE_EMAIL_VERIFICATION is False:
            self.assertEqual(2, 1 + 1)
            return
        _, (uid, token) = send_verification_email(self.user_ar)
        response = self.client.get('/accounts/verify-email/',
                                   {'uid': uid, 'token': token})
        self.assertEqual(response.status_code, 200)
        data = json.loads(response.content.decode('utf-8'))
        message = data.get("message")
        self.assertEqual(message, "تم التحقق من البريد الإلكتروني بنجاح.")
        response = self.client.get('/accounts/verify-email/',
                                   {'uid': uid, 'token': token})
        data = json.loads(response.content.decode('utf-8'))
        message = data.get("message")
        self.assertEqual(message, "تم بالفعل التحقق من البريد الإلكتروني.")
        User.objects.filter(pk=self.user_ar.id).update(is_user_email_validated=False)
        response = self.client.get('/accounts/verify-email/',
            {'uid': uid, 'token': token, 'resend_verification_email': "true"})
        data = json.loads(response.content.decode('utf-8'))
        message = data.get("message")
        self.assertEqual(message, "انتهت صلاحية الرمز. سيتم إرسال رسالة تحقق جديدة"
                         " إلى عنوان بريدك الإلكتروني.")
    def test_verify_email_view_missing_params(self):
        """Test missing parameters"""
        if settings.ENABLE_EMAIL_VERIFICATION is False:
            self.assertEqual(2, 1 + 1)
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
    """Test phone number verification views."""
    def setUp(self):
        self.user = User.objects.create_user(
            username='testuser', email='test@example.com', password='password123',
            user_phone_number_to_verify='+212612505257')
        if settings.ENABLE_PHONE_NUMBER_VERIFICATION is False:
            return
        self.user_ar = User.objects.create_user(username='testuser_ar',
            email='test_ar@example.com', password='password123',
            current_language='ar', user_phone_number_to_verify='+212612505257')
        self.user_en = User.objects.create_user(username='testuser_en',
            email='test_en@example.com', password='password123',
            current_language='en', user_phone_number_to_verify='+212612505257')
        self.user_fr = User.objects.create_user(username='testuser_fr',
            email='test_fr@example.com', password='password123',
            current_language='fr', user_phone_number_to_verify='+212612505257')
    def test_verify_user_phone_number_valid(self):
        """Test verifying user phone number with valid code."""
        if settings.ENABLE_PHONE_NUMBER_VERIFICATION is False:
            self.assertEqual(2, 1 + 1)
            return
        _, (uid, verification_code) = send_phone_number_verification_code(self.user)
        (
            verified, already_verified, expired_verification_code, quota_exceeded
        ) = verify_user_phone_number(uid, verification_code)
        self.assertTrue(verified)
        self.assertFalse(already_verified)
        self.assertFalse(expired_verification_code)
        self.assertFalse(quota_exceeded)
        self.user = User.objects.get(pk=self.user.id)
        self.assertTrue(self.user.is_user_phone_number_validated)
        self.assertEqual(self.user.user_phone_number,
                         self.user.user_phone_number_to_verify)
        self.assertEqual(self.user.nbr_phone_number_verification_code_used, 1)
        (
            verified, already_verified, expired_verification_code, quota_exceeded
        ) = verify_user_phone_number(uid, verification_code)
        self.assertTrue(verified)
        self.assertTrue(already_verified)
        self.assertFalse(expired_verification_code)
        self.assertFalse(quota_exceeded)
    def test_verify_user_phone_number_invalid(self):
        """Test verifying user phone number with invalid code."""
        if settings.ENABLE_PHONE_NUMBER_VERIFICATION is False:
            self.assertEqual(2, 1 + 1)
            return
        _, (uid, _verification_code) = send_phone_number_verification_code(self.user)
        self.user.user_phone_number = None
        self.user.is_user_phone_number_validated = False
        self.user.save()
        self.user = User.objects.get(pk=self.user.id)
        (
            verified, already_verified, expired_verification_code, quota_exceeded
        ) = verify_user_phone_number(uid, "verification_code")
        self.assertFalse(verified)
        self.assertFalse(already_verified)
        self.assertFalse(expired_verification_code)
        self.assertFalse(quota_exceeded)
    def test_verify_user_phone_number_expired(self):
        """Test verifying user phone number with expired code."""
        if settings.ENABLE_PHONE_NUMBER_VERIFICATION is False:
            self.assertEqual(2, 1 + 1)
            return
        _, (uid, verification_code) = send_phone_number_verification_code(self.user)
        self.user = User.objects.get(pk=self.user.id)
        self.user.user_phone_number = None
        self.user.is_user_phone_number_validated = False
        self.user.user_phone_number_verification_code_generated_at = self.user.user_phone_number_verification_code_generated_at - datetime.timedelta(minutes=settings.NUMBER_MINUTES_BEFORE_PHONE_NUMBER_VERIFICATION_CODE_EXPIRATION + 2) # pylint: disable=line-too-long
        self.user.save()
        (
            verified, already_verified, expired_verification_code, quota_exceeded
        ) = verify_user_phone_number(uid, verification_code)
        self.assertFalse(verified)
        self.assertFalse(already_verified)
        self.assertTrue(expired_verification_code)
        self.assertFalse(quota_exceeded)
    def test_verify_user_phone_number_quota_exceeded(self):
        """Test verifying user phone number with quota exceeded."""
        if settings.ENABLE_PHONE_NUMBER_VERIFICATION is False:
            self.assertEqual(2, 1 + 1)
            return
        _, (uid, _verification_code) = send_phone_number_verification_code(self.user)
        self.user = User.objects.get(pk=self.user.id)
        self.user.user_phone_number = None
        self.user.is_user_phone_number_validated = False
        self.user.save()
        _, (uid, _verification_code) = send_phone_number_verification_code(self.user)
        (
            verified, already_verified, expired_verification_code, quota_exceeded
        ) = verify_user_phone_number(
            uid, 'verification_code', resend_verification_phone_number_code=True)
        self.assertFalse(verified)
        self.assertFalse(already_verified)
        self.assertFalse(expired_verification_code)
        self.assertFalse(quota_exceeded)
        _, (uid, _verification_code) = send_phone_number_verification_code(self.user)
        (
            verified, already_verified, expired_verification_code, quota_exceeded
        ) = verify_user_phone_number(uid, 'verification_code',
                                     resend_verification_phone_number_code=True)
        self.assertFalse(verified)
        self.assertFalse(already_verified)
        self.assertFalse(expired_verification_code)
        self.assertTrue(quota_exceeded)
    def test_verify_phone_number_view(self):
        """Test verifying user phone number view."""
        if settings.ENABLE_PHONE_NUMBER_VERIFICATION is False:
            self.assertEqual(2, 1 + 1)
            return
        _, (uid, verification_code) = send_phone_number_verification_code(self.user_fr)
        response = self.client.get('/accounts/verify-phone-number/',
                                   {'uid': uid, 'verification_code': verification_code})
        self.assertEqual(response.status_code, 200)
        data = json.loads(response.content.decode('utf-8'))
        message = data.get("message")
        self.assertEqual(message, "Numéro de téléphone vérifié avec succès.")
        response = self.client.get('/accounts/verify-phone-number/',
                                   {'uid': uid, 'verification_code': verification_code})
        data = json.loads(response.content.decode('utf-8'))
        message = data.get("message")
        self.assertEqual(message, "Numéro de téléphone déjà vérifié.")
        _, (uid, verification_code) = send_phone_number_verification_code(self.user_fr)
        User.objects.filter(pk=self.user_fr.id).update(
            user_phone_number=None, is_user_phone_number_validated=False,
            user_phone_number_verification_code_generated_at=self.user_fr.user_phone_number_verification_code_generated_at - datetime.timedelta(minutes=settings.NUMBER_MINUTES_BEFORE_PHONE_NUMBER_VERIFICATION_CODE_EXPIRATION + 2) # pylint: disable=line-too-long
        )
        response = self.client.get('/accounts/verify-phone-number/',
                                   {'uid': uid, 'verification_code': verification_code})
        data = json.loads(response.content.decode('utf-8'))
        message = data.get("message")
        self.assertEqual(message, "Code de vérification expiré.")
        response = self.client.get('/accounts/verify-phone-number/',
            {'uid': uid, 'verification_code': verification_code,
             'resend_verification_phone_number_code': "true"})
        data = json.loads(response.content.decode('utf-8'))
        message = data.get("message")
        self.assertEqual(message, "Un nouveau code de vérification sera envoyé à "
                         "votre numéro de téléphone.")
        _, (uid, verification_code) = send_phone_number_verification_code(self.user_fr)
        response = self.client.get('/accounts/verify-phone-number/',
                                   {'uid': uid, 'verification_code': 'verification_code'})
        data = json.loads(response.content.decode('utf-8'))
        message = data.get("message")
        self.assertEqual(message, "Code invalide.")
    def test_verify_phone_number_view_en(self):
        """Test the phone number verification view for English."""
        if settings.ENABLE_PHONE_NUMBER_VERIFICATION is False:
            self.assertEqual(2, 1 + 1)
            return
        _, (uid, verification_code) = send_phone_number_verification_code(self.user_en)
        response = self.client.get('/accounts/verify-phone-number/',
                                   {'uid': uid, 'verification_code': verification_code})
        self.assertEqual(response.status_code, 200)
        data = json.loads(response.content.decode('utf-8'))
        message = data.get("message")
        self.assertEqual(message, "Phone number verified successfully.")
        response = self.client.get('/accounts/verify-phone-number/',
                                   {'uid': uid, 'verification_code': verification_code})
        data = json.loads(response.content.decode('utf-8'))
        message = data.get("message")
        self.assertEqual(message, "Phone number already verified.")
        _, (uid, verification_code) = send_phone_number_verification_code(self.user_en)
        User.objects.filter(pk=self.user_en.id).update(
            user_phone_number=None, is_user_phone_number_validated=False,
            user_phone_number_verification_code_generated_at=self.user_en.user_phone_number_verification_code_generated_at - datetime.timedelta(minutes=settings.NUMBER_MINUTES_BEFORE_PHONE_NUMBER_VERIFICATION_CODE_EXPIRATION + 2) # pylint: disable=line-too-long
        )
        response = self.client.get('/accounts/verify-phone-number/',
                                   {'uid': uid, 'verification_code': verification_code})
        data = json.loads(response.content.decode('utf-8'))
        message = data.get("message")
        self.assertEqual(message, "Expired verification code.")
        response = self.client.get('/accounts/verify-phone-number/',
            {'uid': uid, 'verification_code': verification_code,
             'resend_verification_phone_number_code': "true"})
        data = json.loads(response.content.decode('utf-8'))
        message = data.get("message")
        self.assertEqual(message, "A new verification code will be sent to "
                         "your phone number.")
        _, (uid, verification_code) = send_phone_number_verification_code(self.user_en)
        response = self.client.get('/accounts/verify-phone-number/',
                                   {'uid': uid, 'verification_code': 'verification_code'})
        data = json.loads(response.content.decode('utf-8'))
        message = data.get("message")
        self.assertEqual(message, "Invalid code.")
    def test_verify_phone_number_view_ar(self):
        """Test the phone number verification view for Arabic."""
        if settings.ENABLE_PHONE_NUMBER_VERIFICATION is False:
            self.assertEqual(2, 1 + 1)
            return
        _, (uid, verification_code) = send_phone_number_verification_code(self.user_ar)
        response = self.client.get('/accounts/verify-phone-number/',
                                   {'uid': uid, 'verification_code': verification_code})
        self.assertEqual(response.status_code, 200)
        data = json.loads(response.content.decode('utf-8'))
        message = data.get("message")
        self.assertEqual(message, "تم التحقق من رقم الهاتف بنجاح.")
        response = self.client.get('/accounts/verify-phone-number/',
        {'uid': uid, 'verification_code': verification_code})
        data = json.loads(response.content.decode('utf-8'))
        message = data.get("message")
        self.assertEqual(message, "رقم الهاتف تم التحقق منه بالفعل.")
        _, (uid, verification_code) = send_phone_number_verification_code(self.user_ar)
        User.objects.filter(pk=self.user_ar.id).update(
            user_phone_number=None, is_user_phone_number_validated=False,
            user_phone_number_verification_code_generated_at=self.user_ar.user_phone_number_verification_code_generated_at - datetime.timedelta(minutes=settings.NUMBER_MINUTES_BEFORE_PHONE_NUMBER_VERIFICATION_CODE_EXPIRATION + 2) # pylint: disable=line-too-long
        )
        response = self.client.get('/accounts/verify-phone-number/',
                                   {'uid': uid, 'verification_code': verification_code})
        data = json.loads(response.content.decode('utf-8'))
        message = data.get("message")
        self.assertEqual(message, "رمز التحقق منتهي الصلاحية.")
        response = self.client.get('/accounts/verify-phone-number/',
            {'uid': uid, 'verification_code': verification_code,
             'resend_verification_phone_number_code': "true"})
        data = json.loads(response.content.decode('utf-8'))
        message = data.get("message")
        self.assertEqual(message, "سيتم إرسال رمز تحقق جديد إلى رقم هاتفك.")
        _, (uid, verification_code) = send_phone_number_verification_code(self.user_ar)
        response = self.client.get('/accounts/verify-phone-number/',
                                   {'uid': uid, 'verification_code': 'verification_code'})
        data = json.loads(response.content.decode('utf-8'))
        message = data.get("message")
        self.assertEqual(message, "رمز غير صالح.")
    def test_verify_phone_number_view_missing_params(self):
        """Test missing parameters"""
        if settings.ENABLE_PHONE_NUMBER_VERIFICATION is False:
            self.assertEqual(2, 1 + 1)
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
        response = self.client.get('/accounts/verify-phone-number/',
                                   {'verification_code': "verification_code"})
        self.assertEqual(response.status_code, 400)
        data = json.loads(response.content.decode('utf-8'))
        message = data.get("message")
        self.assertEqual(message, "Paramètres requis manquants.")

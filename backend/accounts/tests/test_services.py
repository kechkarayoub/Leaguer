from ..services import UserService
from ..models import User
from django.conf import settings
from django.core.files.uploadedfile import SimpleUploadedFile
from django.core.management import call_command
from django.test import TestCase
from unittest.mock import patch



class UserServiceTest(TestCase):
    """Test cases for UserService."""
    
    def setUp(self):
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

    def test_generate_unique_username_basic(self):
        User.objects.create_user(username="SmithJohn", email="sj@example.com", password="pw", first_name="John", last_name="Smith")
        username = UserService.generate_unique_username(email="sj@example.com", first_name="John", last_name="Smith")
        self.assertNotEqual(username, "SmithJohn")
        self.assertTrue(isinstance(username, str))
        self.assertFalse(User.objects.filter(username=username).exists())

    def test_generate_unique_username_email_only(self):
        username = UserService.generate_unique_username(email="uniqueuser@example.com")
        self.assertEqual(username, "uniqueuser")

    def test_generate_unique_username_fallback(self):
        taken = [f"username_{i}" for i in range(1, 21)]
        for uname in taken:
            User.objects.create_user(username=uname, email=f"{uname}@example.com", password="pw")
        User.objects.create_user(username="fallback", email=f"xxx@example.com", password="pw")
        username = UserService.generate_unique_username(email="fallback@example.com")
        self.assertTrue(username)
        self.assertNotIn(username, taken)


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



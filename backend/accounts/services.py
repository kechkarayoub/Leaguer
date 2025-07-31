"""
Service layer for accounts app.
"""

from django.conf import settings
from django.contrib.auth import authenticate
from django.contrib.auth.tokens import default_token_generator
from django.core.files.base import ContentFile
from django.core.files.storage import default_storage
from django.core.mail import EmailMultiAlternatives
from django.db.models.functions import Lower
from django.template.loader import render_to_string
from django.utils.encoding import force_bytes
from django.utils.http import urlsafe_base64_encode, urlsafe_base64_decode
from django.utils.timezone import now
from django.utils.translation import activate, gettext_lazy as _
from .models import User
from .exceptions import (
    UserValidationException, EmailVerificationException, PhoneVerificationException,
    AuthenticationException, PasswordValidationException, ProfileImageException,
    UserRegistrationException, UserUpdateException, TokenValidationException,
    FirebaseException, SMSException, EmailSendingException, UserNotActiveException,
    VerificationCodeException, UserDeleteException, ProfileException
)
from .utils import format_phone_number, GENDERS_CHOICES
from leaguer.utils import generate_random_code, generate_random_string, get_email_base_context, send_phone_message
import logging
import os
import datetime
import firebase_config
from firebase_admin import auth as firebase_auth
import phonenumbers

logger = logging.getLogger(__name__)


class UserService:
    """Service for user-related operations."""
    
    @staticmethod
    def create_user(user_data):
        """
        Create a new user account.
        
        Args:
            user_data (dict): User data for registration
            
        Returns:
            User: Created user instance
            
        Raises:
            UserRegistrationException: If user creation fails
        """
        try:
            # Validate required fields
            required_fields = ['username', 'email', 'first_name', 'last_name', 'password']
            missing_fields = [field for field in required_fields if not user_data.get(field)]
            
            if missing_fields:
                raise UserValidationException(f"Missing required fields: {', '.join(missing_fields)}")
            
            # Check if user already exists
            if User.objects.filter(username=user_data['username']).exists():
                raise UserRegistrationException("Username already exists")
            
            if User.objects.filter(email=user_data['email']).exists():
                raise UserRegistrationException("Email already exists")
            
            # Create user
            user = User.objects.create_user(
                username=user_data['username'],
                email=user_data['email'],
                password=user_data['password'],
                first_name=user_data['first_name'],
                last_name=user_data['last_name'],
                current_language=user_data.get('current_language', settings.LANGUAGE_CODE),
                user_country=user_data.get('user_country', ''),
                user_gender=user_data.get('user_gender', ''),
                user_birthday=user_data.get('user_birthday'),
                user_address=user_data.get('user_address', ''),
                user_phone_number=user_data.get('user_phone_number', ''),
                user_timezone=user_data.get('user_timezone', 'UTC'),
            )
            
            logger.info(f"User created successfully: {user.username}")
            return user
            
        except Exception as e:
            logger.error(f"User creation failed: {str(e)}")
            raise UserRegistrationException(f"User creation failed: {str(e)}")
    
    @staticmethod
    def generate_unique_username(email="", first_name="", last_name=""):
        """
        Generate a unique username based on user information.

        Args:
            email (str): User email address
            first_name (str): User first name
            last_name (str): User last name

        Returns:
            str: Generated unique username

        This method tries to generate a username using combinations of first name, last name, and email prefix.
        It checks for uniqueness in the database and appends numbers or random strings if needed.
        """
        email = email.strip().lower()
        first_name = first_name.strip().lower()
        last_name = last_name.strip().lower()

        # Build possible username candidates from user info
        possible_usernames_base = []
        if last_name and first_name:
            possible_usernames_base.extend([
                f"{last_name}{first_name}",
                f"{first_name}{last_name}",
                f"{last_name}.{first_name}",
                f"{first_name}.{last_name}",
                f"{last_name[0]}{first_name}",
                f"{first_name[0]}{last_name}",
                f"{last_name[0]}.{first_name}",
                f"{first_name[0]}.{last_name}",
                f"{last_name}",
                f"{first_name}",
            ])
        elif last_name:
            possible_usernames_base.append(f"{last_name}")
        elif first_name:
            possible_usernames_base.append(f"{first_name}")
        if email:
            possible_usernames_base.append(email.split('@')[0])

        # Try base candidates
        candidates = list(possible_usernames_base)
        if candidates:
            exists = set(User.objects.annotate(username_lower=Lower('username')).filter(username_lower__in=candidates).values_list('username', flat=True))
            # If all taken, try with '1' and '2' suffixes
            if len(exists) == len(candidates):
                candidates = [pu + "1" for pu in possible_usernames_base]
                exists = set(User.objects.annotate(username_lower=Lower('username')).filter(username_lower__in=candidates).values_list('username', flat=True))
                if len(exists) == len(candidates):
                    candidates = [pu + "2" for pu in possible_usernames_base]
                    exists = set(User.objects.annotate(username_lower=Lower('username')).filter(username_lower__in=candidates).values_list('username', flat=True))
            for candidate in candidates:
                if candidate not in exists:
                    return candidate

        # Fallback: username_1 to username_20
        for i in range(1, 21):
            candidate = f"username_{i}"
            if not User.objects.filter(username__iexact=candidate).exists():
                return candidate

        # Last resort: random string usernames
        for _ in range(20):
            candidate = generate_random_string()
            if not User.objects.filter(username__iexact=candidate).exists():
                return candidate

        return email
    
    @staticmethod
    def update_user(user, update_data):
        """
        Update user profile information.
        
        Args:
            user (User): User instance to update
            update_data (dict): Data to update
            
        Returns:
            User: Updated user instance
            
        Raises:
            UserUpdateException: If update fails
        """
        try:
            # Fields that can be updated
            updatable_fields = [
                'first_name', 'last_name', 'current_language',
                'user_country', 'user_gender', 'user_birthday', 'user_address',
                'user_phone_number', 'user_timezone', 'user_cin', 'user_image_url', 'user_phone_number_to_verify'
            ]
            
            for field in updatable_fields:
                if field in update_data:
                    setattr(user, field, update_data[field])
            
            user.save()
            logger.info(f"User updated successfully: {user.username}")
            return user
            
        except Exception as e:
            logger.error(f"User update failed: {str(e)}")
            raise UserUpdateException(f"User update failed: {str(e)}")
    
    @staticmethod
    def authenticate_user(username, password):
        """
        Authenticate user credentials.
        
        Args:
            username (str): Username or email
            password (str): User password
            
        Returns:
            User: Authenticated user instance
            
        Raises:
            AuthenticationException: If authentication fails
        """
        try:
            # Try authentication with username first
            user = authenticate(username=username, password=password)
            
            # If failed, try with email
            if not user:
                try:
                    user_obj = User.objects.get(email=username)
                    user = authenticate(username=user_obj.username, password=password)
                except User.DoesNotExist:
                    pass
            
            if not user:
                raise AuthenticationException("Invalid credentials")
            
            if not user.is_active:
                raise UserNotActiveException("User account is inactive")
            
            logger.info(f"User authenticated successfully: {user.username}")
            return user
            
        except Exception as e:
            logger.warning(f"Authentication failed for {username}: {str(e)}")
            raise AuthenticationException(str(e))
    
    @staticmethod
    def delete_user(user, soft_delete=True):
        """
        Delete or deactivate user account.
        
        Args:
            user (User): User instance to delete
            soft_delete (bool): Whether to soft delete (deactivate) or hard delete
            
        Returns:
            bool: True if successful
            
        Raises:
            UserDeleteException: If deletion fails
        """
        try:
            if soft_delete:
                user.is_active = False
                user.is_user_deleted = True
                user.save()
                logger.info(f"User soft deleted: {user.username}")
            else:
                username = user.username
                user.delete()
                logger.info(f"User hard deleted: {username}")
            
            return True
            
        except Exception as e:
            logger.error(f"User deletion failed: {str(e)}")
            raise UserDeleteException(f"User deletion failed: {str(e)}")


class EmailVerificationService:
    """Service for email verification operations."""
    
    @staticmethod
    def send_verification_email(user, language=None):
        """
        Send email verification link to user.
        
        Args:
            user (User): User instance
            language (str): Language for email template
            
        Returns:
            bool: True if email sent successfully
            
        Raises:
            EmailSendingException: If email sending fails
        """
        try:
            if not language:
                language = user.current_language or settings.LANGUAGE_CODE
            
            # Activate language for email template
            activate(language)
            
            # Generate verification token
            token = default_token_generator.make_token(user)
            uid = urlsafe_base64_encode(force_bytes(user.pk))
            
            # Build verification URL
            verification_url = f"{settings.FRONTEND_ENDPOINT}/verify-email/{uid}/{token}/"
            
            # Prepare email context
            context = get_email_base_context()
            context.update({
                'user': user,
                'verification_url': verification_url,
                'site_name': settings.APPLICATION_NAME,
            })
            
            # Render email templates
            subject = _('Verify your email address')
            html_content = render_to_string('email_verification.html', context)
            text_content = render_to_string('email_verification.txt', context)
            
            # Send email
            email = EmailMultiAlternatives(
                subject=subject,
                body=text_content,
                from_email=settings.DEFAULT_FROM_EMAIL,
                to=[user.email]
            )
            email.attach_alternative(html_content, "text/html")
            email.send()
            
            logger.info(f"Verification email sent to: {user.email}")
            return True
            
        except Exception as e:
            logger.error(f"Failed to send verification email: {str(e)}")
            raise EmailSendingException(f"Failed to send verification email: {str(e)}")
    
    @staticmethod
    def verify_email_token(uid, token):
        """
        Verify email verification token.
        
        Args:
            uid (str): Base64 encoded user ID
            token (str): Verification token
            
        Returns:
            User: Verified user instance
            
        Raises:
            TokenValidationException: If token is invalid
        """
        try:
            # Decode user ID
            user_id = urlsafe_base64_decode(uid).decode()
            user = User.objects.get(pk=user_id)
            
            # Verify token
            if not default_token_generator.check_token(user, token):
                raise TokenValidationException("Invalid or expired token")
            
            # Mark email as verified
            user.is_user_email_validated = True
            user.save()
            
            logger.info(f"Email verified for user: {user.username}")
            return user
            
        except User.DoesNotExist:
            raise TokenValidationException("Invalid user")
        except Exception as e:
            logger.error(f"Email verification failed: {str(e)}")
            raise TokenValidationException(f"Email verification failed: {str(e)}")


class PhoneVerificationService:
    """Service for phone number verification operations."""
    
    @staticmethod
    def send_verification_code(user):
        """
        Send phone verification code to user.
        
        Args:
            user (User): User instance
            
        Returns:
            str: Verification code sent
            
        Raises:
            SMSException: If SMS sending fails
        """
        try:
            if not user.user_phone_number:
                raise PhoneVerificationException("No phone number provided")
            
            # Check quota
            if user.nbr_phone_number_verification_code_used >= settings.PHONE_NUMBER_VERIFICATION_CODE_QUOTA:
                raise PhoneVerificationException("Verification code quota exceeded")
            
            # Generate code
            verification_code = generate_random_code()
            
            # Store code and timestamp
            user.user_phone_number_verification_code = verification_code
            user.user_phone_number_verification_code_timestamp = now()
            user.nbr_phone_number_verification_code_used += 1
            user.save()
            
            # Send SMS
            formatted_phone = format_phone_number(user.user_phone_number)
            message = f"Your verification code is: {verification_code}"
            
            success = send_phone_message(formatted_phone, message)
            if not success:
                raise SMSException("Failed to send SMS")
            
            logger.info(f"Verification code sent to: {formatted_phone}")
            return verification_code
            
        except Exception as e:
            logger.error(f"Failed to send verification code: {str(e)}")
            raise SMSException(f"Failed to send verification code: {str(e)}")
    
    @staticmethod
    def verify_phone_code(user, code):
        """
        Verify phone verification code.
        
        Args:
            user (User): User instance
            code (str): Verification code
            
        Returns:
            bool: True if verification successful
            
        Raises:
            VerificationCodeException: If code verification fails
        """
        try:
            # Check if code exists
            if not user.user_phone_number_verification_code:
                raise VerificationCodeException("No verification code found")
            
            # Check if code matches
            if user.user_phone_number_verification_code != code:
                raise VerificationCodeException("Invalid verification code")
            
            # Check if code is expired
            if user.user_phone_number_verification_code_timestamp:
                expiry_time = user.user_phone_number_verification_code_timestamp + \
                             datetime.timedelta(minutes=settings.NUMBER_MINUTES_BEFORE_PHONE_NUMBER_VERIFICATION_CODE_EXPIRATION)
                
                if now() > expiry_time:
                    raise VerificationCodeException("Verification code expired")
            
            # Mark phone as verified
            user.is_user_phone_number_validated = True
            user.user_phone_number_verification_code = None
            user.user_phone_number_verification_code_timestamp = None
            user.save()
            
            logger.info(f"Phone verified for user: {user.username}")
            return True
            
        except Exception as e:
            logger.error(f"Phone verification failed: {str(e)}")
            raise VerificationCodeException(f"Phone verification failed: {str(e)}")


class ProfileImageService:
    """Service for profile image operations."""
    
    @staticmethod
    def upload_profile_image(user, image_file):
        """
        Upload and set user profile image.
        
        Args:
            user (User): User instance
            image_file: Image file to upload
            
        Returns:
            str: URL of uploaded image
            
        Raises:
            ProfileImageException: If upload fails
        """
        try:
            # Validate file type
            allowed_types = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif']
            if hasattr(image_file, 'content_type') and image_file.content_type not in allowed_types:
                raise ProfileImageException("Invalid image format")
            
            # Validate file size (max 5MB)
            max_size = 5 * 1024 * 1024  # 5MB
            if hasattr(image_file, 'size') and image_file.size > max_size:
                raise ProfileImageException("Image file too large (max 5MB)")
            
            # Generate filename
            file_extension = os.path.splitext(image_file.name)[1]
            filename = f"profile_images/{user.username}_{now().timestamp()}{file_extension}"
            
            # Delete old image if exists
            if user.user_image_url and default_storage.exists(user.user_image_url):
                default_storage.delete(user.user_image_url)
            
            # Save new image
            saved_path = default_storage.save(filename, image_file)
            image_url = default_storage.url(saved_path)
            
            # Update user
            user.user_image_url = image_url
            user.save()
            
            logger.info(f"Profile image uploaded for user: {user.username}")
            return image_url
            
        except Exception as e:
            logger.error(f"Profile image upload failed: {str(e)}")
            raise ProfileImageException(f"Profile image upload failed: {str(e)}")
    
    @staticmethod
    def delete_profile_image(user):
        """
        Delete user profile image.
        
        Args:
            user (User): User instance
            
        Returns:
            bool: True if successful
            
        Raises:
            ProfileImageException: If deletion fails
        """
        try:
            if user.user_image_url:
                # Delete from storage
                if default_storage.exists(user.user_image_url):
                    default_storage.delete(user.user_image_url)
                
                # Clear URL from user
                user.user_image_url = None
                user.save()
                
                logger.info(f"Profile image deleted for user: {user.username}")
            
            return True
            
        except Exception as e:
            logger.error(f"Profile image deletion failed: {str(e)}")
            raise ProfileImageException(f"Profile image deletion failed: {str(e)}")


class FirebaseService:
    """Service for Firebase operations."""
    
    @staticmethod
    def create_firebase_user(user, password):
        """
        Create Firebase user account.
        
        Args:
            user (User): Django user instance
            password (str): User password
            
        Returns:
            dict: Firebase user record
            
        Raises:
            FirebaseException: If Firebase operation fails
        """
        try:
            firebase_user = firebase_auth.create_user(
                uid=str(user.id),
                email=user.email,
                password=password,
                display_name=f"{user.first_name} {user.last_name}",
                email_verified=user.is_user_email_validated
            )
            
            logger.info(f"Firebase user created: {user.username}")
            return firebase_user
            
        except Exception as e:
            logger.error(f"Firebase user creation failed: {str(e)}")
            raise FirebaseException(f"Firebase user creation failed: {str(e)}")
    
    @staticmethod
    def delete_firebase_user(user_id):
        """
        Delete Firebase user account.
        
        Args:
            user_id (str): Firebase user ID
            
        Returns:
            bool: True if successful
            
        Raises:
            FirebaseException: If Firebase operation fails
        """
        try:
            firebase_auth.delete_user(user_id)
            logger.info(f"Firebase user deleted: {user_id}")
            return True
            
        except Exception as e:
            logger.error(f"Firebase user deletion failed: {str(e)}")
            raise FirebaseException(f"Firebase user deletion failed: {str(e)}")


class UserValidationService:
    """Service for user data validation."""
    
    @staticmethod
    def validate_phone_number(phone_number, country_code=None):
        """
        Validate phone number format.
        
        Args:
            phone_number (str): Phone number to validate
            country_code (str): Country code for validation
            
        Returns:
            bool: True if valid
            
        Raises:
            PhoneVerificationException: If validation fails
        """
        try:
            if not country_code:
                country_code = settings.DEFAULT_PHONE_NUMBER_COUNTRY_CODE
            
            parsed_number = phonenumbers.parse(phone_number, country_code)
            
            if not phonenumbers.is_valid_number(parsed_number):
                raise PhoneVerificationException("Invalid phone number format")
            
            return True
            
        except Exception as e:
            logger.warning(f"Phone number validation failed: {str(e)}")
            raise PhoneVerificationException(f"Phone number validation failed: {str(e)}")
    
    @staticmethod
    def validate_user_data(user_data):
        """
        Validate user registration/update data.
        
        Args:
            user_data (dict): User data to validate
            
        Returns:
            bool: True if valid
            
        Raises:
            UserValidationException: If validation fails
        """
        try:
            errors = []
            
            # Validate email format
            if 'email' in user_data:
                email = user_data['email']
                if not email or '@' not in email:
                    errors.append("Invalid email format")
            
            # Validate password strength
            if 'password' in user_data:
                password = user_data['password']
                if len(password) < 8:
                    errors.append("Password must be at least 8 characters long")
            
            # Validate gender choice
            if 'user_gender' in user_data:
                gender = user_data['user_gender']
                valid_genders = [choice[0] for choice in GENDERS_CHOICES]
                if gender and gender not in valid_genders:
                    errors.append("Invalid gender choice")
            
            # Validate phone number if provided
            if 'user_phone_number' in user_data and user_data['user_phone_number']:
                UserValidationService.validate_phone_number(user_data['user_phone_number'])
            
            if errors:
                raise UserValidationException("; ".join(errors))
            
            return True
            
        except Exception as e:
            logger.warning(f"User data validation failed: {str(e)}")
            raise UserValidationException(str(e))

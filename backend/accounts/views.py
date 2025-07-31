from .models import User
from .serializers import UserSerializer
from .utils import format_phone_number, send_verification_email, send_phone_number_verification_code, send_password_reset_email, validate_password_reset_token
from django.contrib.auth import authenticate
from django.contrib.auth.tokens import default_token_generator
from django.conf import settings
from django.core.files.base import ContentFile
from django.core.files.storage import default_storage
from django.http import JsonResponse, QueryDict
from django.shortcuts import get_object_or_404
from django.utils.http import urlsafe_base64_encode, urlsafe_base64_decode
from django.utils.timezone import now
from django.utils.translation import activate, gettext_lazy as _
from firebase_admin import auth
from accounts.services import UserService
from leaguer.utils import generate_random_code, upload_file, remove_file
from leaguer.ws_utils import notify_profile_update
from rest_framework import status
from rest_framework.parsers import MultiPartParser, FormParser
from rest_framework.permissions import AllowAny, IsAuthenticated
from rest_framework.response import Response
from rest_framework.views import APIView
from rest_framework_simplejwt.tokens import RefreshToken
import datetime
import logging
import os
from google.auth.transport import requests
from google.oauth2 import id_token
import firebase_config

# Get a logger instance
logger = logging.getLogger(__name__)


class SendVerificationEmailLinkView(APIView):
    """
    API endpoint to send a verification email link.
    This allows a user to request a new verification link if they haven't validated their email.
    """
    permission_classes = [AllowAny]

    # noinspection PyMethodMayBeStatic
    def post(self, request):
        """
        Handles POST request to send email verification link.

        Request Body:
        - user_id (int): The user's ID.
        - selected_language (str, optional): The language preference.

        Response:
        - Success: Email sent confirmation.
        - Failure: Appropriate error messages.
        """

        user_id = request.data.get("user_id")
        current_language = request.data.get("selected_language") or 'fr'

        activate(current_language)

        if not user_id:
            return Response(
                {"message": _("User id is required"), "success": False},
                status=status.HTTP_400_BAD_REQUEST
            )

        # Fetch the user or return 400 error if not found
        user = get_object_or_404(User, pk=user_id)

        if user.is_user_email_validated is True:
            return Response(
                {
                    "message": _("Your email is already verified. Try to sign in."),
                    "success": False,
                },
                status=status.HTTP_401_UNAUTHORIZED
            )
        send_email_response = User.send_emails_verifications_links(email=user.email)
        # Check if email was successfully sent
        if '1 verification email are sent,' not in send_email_response:
            return Response({"message": _("Email not sent. Please contact the technical team to resolve your issue."), "success": False}, status=status.HTTP_400_BAD_REQUEST)
        return Response({
            "message": _("A new verification link has been sent to your email address. Please verify your email before logging in."),
            "success": True,
        }, status=status.HTTP_200_OK)


class SignInView(APIView):
    """
    API endpoint for user authentication.
    If credentials are valid, returns JWT tokens (access & refresh).
    """
    permission_classes = [AllowAny]

    # noinspection PyMethodMayBeStatic
    def post(self, request):
        """
        Handles user login authentication.

        Request Body:
        - email_or_username (str): User's email or username.
        - password (str): User's password.
        - selected_language (str, optional): Language preference.

        Response:
        - Success: JWT tokens and user data.
        - Failure: Error messages with proper status codes.
        """
        email_or_username = request.data.get("email_or_username")
        current_language = request.data.get("selected_language") or 'fr'
        password = request.data.get("password")

        activate(current_language)

        if not email_or_username or not password:
            return Response(
                {"message": _("Email/Username and password are required"), "success": False},
                status=status.HTTP_400_BAD_REQUEST
            )
        if "@" in email_or_username:
            user = User.objects.filter(email=email_or_username, is_active=True).first() or User.objects.filter(email=email_or_username).first()
        else:
            user = User.objects.filter(username=email_or_username).first()

        if user is not None:
            # Generate JWT tokens
            if user.is_user_deleted is True:
                return Response(
                    {
                        "message": _("Your account is deleted. Please contact the technical team to resolve your issue."),
                        "success": False,
                    },
                    status=status.HTTP_401_UNAUTHORIZED
                )
            if user.is_active is False:
                return Response(
                    {
                        "message": _("Your account is inactive. Please contact the technical team to resolve your issue."),
                        "success": False,
                    },
                    status=status.HTTP_401_UNAUTHORIZED
                )
            if user.is_user_email_validated is False:
                return Response(
                    {
                        "message": _("Your email is not yet verified. Please verify your email address before sign in."),
                        "success": False,
                        "user_id": user.id,
                    },
                    status=status.HTTP_401_UNAUTHORIZED
                )

            user = authenticate(request, username=user.username, password=password)
            if user is not None:
                if user.current_language != current_language:
                    activate(user.current_language)
                refresh = RefreshToken.for_user(user)
                user_data = user.to_login_dict()
                return Response({
                    "access_token": str(refresh.access_token),
                    "refresh_token": str(refresh),
                    "success": True,
                    "user": user_data,
                }, status=status.HTTP_200_OK)
            else:
                return Response({"message": _("Invalid credentials"), "success": False}, status=status.HTTP_400_BAD_REQUEST)
        else:
            return Response({"message": _("Invalid credentials"), "success": False}, status=status.HTTP_400_BAD_REQUEST)


class SignInThirdPartyView(APIView):
    """
    API endpoint for user authentication using third party.
    If credentials are valid, returns JWT tokens (access & refresh).
    """
    permission_classes = [AllowAny]

    # noinspection PyMethodMayBeStatic
    def post(self, request, user=None):
        """
        Handles user login authentication.

        Request Body:
        - email (str): User's email.
        - selected_language (str, optional): Language preference.
        - type_third_party (str): Type third party (Apple, facebook, google, ...).

        Returns:
        - 200 OK: If authentication is successful (JWT tokens and user data).
        - 400 Bad Request: If required fields are missing or credentials are invalid.
        - 401 Unauthorized: If the user is deleted or inactive.
        """
        email = request.data.get("email")
        current_language = request.data.get("selected_language") or 'fr'
        token_value = request.data.get("id_token")
        type_third_party = request.data.get("type_third_party")
        from_platform = request.data.get("from_platform") or 'web'
        
        activate(current_language)
        if user is None:
            if not email or not type_third_party or not token_value:
                return Response(
                    {"message": _("Email, Id token and Third party type are required"), "success": False},
                    status=status.HTTP_400_BAD_REQUEST
                )
            try:
                # For Google OAuth, validate the token using Google OAuth verification
                if type_third_party == "google":
                    try:
                        # The token you receive is a Google OAuth ID token, not a Firebase token
                        # Use Google OAuth verification instead of Firebase
                        request_adapter = requests.Request()
                        
                        # Your Google OAuth client ID (the audience in the token)
                        GOOGLE_CLIENT_ID = getattr(settings, 'GOOGLE_SIGN_IN_WEB_CLIENT_ID', None)
                        
                        # Verify the Google OAuth ID token
                        idinfo = id_token.verify_oauth2_token(token_value, request_adapter, GOOGLE_CLIENT_ID)
                        
                        # Check if the token is valid and email matches
                        verified_email = idinfo.get('email')
                        email_verified = idinfo.get('email_verified', False)
                        
                        if verified_email == email and email_verified:
                            email = verified_email
                            logger.info(f"Successfully verified Google OAuth token for email: {email}")
                        else:
                            logger.warning(f"Email mismatch or not verified: provided={email}, token={verified_email}, verified={email_verified}")
                            email = None
                            
                    except Exception as google_error:
                        logger.error(f"Google OAuth token verification failed: {str(google_error)}")
                        email = None
                else:
                    # For other third-party providers, implement similar verification
                    logger.warning(f"Third-party provider '{type_third_party}' not implemented yet")
                    email = None
            except Exception as e:
                logger.error(f"Unexpected error during token verification: {str(e)}")
                email = None
            user = User.objects.filter(email=email).first()

        if user is not None:
            if user.is_user_deleted is True:
                return Response(
                    {
                        "message": _("Your account is deleted. Please contact the technical team to resolve your issue."),
                        "success": False,
                    },
                    status=status.HTTP_401_UNAUTHORIZED
                )
            if user.is_active is False:
                return Response(
                    {
                        "message": _("Your account is inactive. Please contact the technical team to resolve your issue."),
                        "success": False,
                    },
                    status=status.HTTP_401_UNAUTHORIZED
                )

            if user.is_user_email_validated is False:
                user.is_user_email_validated = True
                user.save()
            if user.current_language != current_language:
                activate(user.current_language)
            # Generate JWT tokens
            refresh = RefreshToken.for_user(user)
            user_data = user.to_login_dict()
            return Response({
                "access_token": str(refresh.access_token),
                "refresh_token": str(refresh),
                "success": True,
                "user": user_data,
            }, status=status.HTTP_200_OK)
        else:
            return Response({"message": _("Invalid credentials"), "success": False}, status=status.HTTP_400_BAD_REQUEST)


class ForgotPasswordView(APIView):
    """
    API endpoint for requesting password reset.
    Sends a password reset email to the user if the email exists.
    """
    permission_classes = [AllowAny]

    # noinspection PyMethodMayBeStatic
    def post(self, request):
        """
        Handles password reset request.

        Request Body:
        - email_or_username (str): User's email address or username.
        - selected_language (str, optional): Language preference.

        Response:
        - Success: Confirmation message (always success for security).
        - Note: For security, always returns success even if email/username doesn't exist.
        """
        email_or_username = request.data.get("email_or_username")
        current_language = request.data.get("selected_language") or 'fr'

        activate(current_language)

        if not email_or_username:
            return Response(
                {"message": _("Email or username is required"), "success": False},
                status=status.HTTP_400_BAD_REQUEST
            )

        # Always return success message for security (don't reveal if email/username exists)
        success_message = _("If an account with this email or username exists, you will receive a password reset link shortly.")
        
        try:
            # Check if user exists with this email or username
            user = None
            if "@" in email_or_username:
                # It's likely an email
                user = User.objects.filter(email=email_or_username, is_active=True, is_user_deleted=False).first()
            else:
                # It's likely a username, find user by username and get their email
                user = User.objects.filter(username=email_or_username, is_active=True, is_user_deleted=False).first()


            if user:
                # Set user's language for email
                if user.current_language != current_language:
                    user.current_language = current_language
                    user.save()
                
                # Send password reset email
                send_password_reset_email(user)
                
        except Exception as e:
            # Log the error but don't expose it to the user
            logger.error(f"Error sending password reset email: {str(e)}")

        return Response({
            "message": success_message,
            "success": True,
        }, status=status.HTTP_200_OK)


class ResetPasswordView(APIView):
    """
    API endpoint for resetting password using the token from email.
    """
    permission_classes = [AllowAny]

    # noinspection PyMethodMayBeStatic
    def post(self, request):
        """
        Handles password reset with token.

        Request Body:
        - uid (str): Base64 encoded user ID.
        - token (str): Password reset token.
        - new_password (str): New password.
        - selected_language (str, optional): Language preference.

        Response:
        - Success: Confirmation of password reset.
        - Failure: Error messages with proper status codes.
        """
        uid = request.data.get("uid")
        token = request.data.get("token")
        new_password = request.data.get("new_password")
        current_language = request.data.get("selected_language") or 'fr'

        activate(current_language)

        if not uid or not token or not new_password:
            return Response(
                {"message": _("All fields are required"), "success": False},
                status=status.HTTP_400_BAD_REQUEST
            )

        # Validate the token and get user
        is_valid, user, error_message = validate_password_reset_token(uid, token)
        
        if not is_valid:
            return Response({
                "message": _(error_message) if error_message else _("Invalid or expired reset token. Please request a new password reset."),
                "success": False,
            }, status=status.HTTP_400_BAD_REQUEST)

        try:
            # Activate user's language
            activate(user.current_language)
            
            # Reset password
            user.set_password(new_password)
            user.save()
            
            return Response({
                "message": _("Password has been reset successfully. You can now log in with your new password."),
                "success": True,
            }, status=status.HTTP_200_OK)
            
        except Exception as e:
            logger.error(f"Error resetting password: {str(e)}")
            return Response({
                "message": _("An error occurred while resetting your password. Please try again."),
                "success": False,
            }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


class SignUpView(APIView):
    permission_classes = [AllowAny]

    def post(self, request, *args, **kwargs):
        """
        Handles user registration.
        Accepts both 'selected_language' and 'current_language' for localization.
        Normalizes user input and creates a new user if data is valid.
        Sends email verification if enabled in settings.
        """
        data = request.data.copy()

        # Accept both 'selected_language' and 'current_language' from frontend
        current_language = data.get('selected_language') or data.get('current_language') or 'fr'
        activate(current_language)

        # Normalize first and last name: remove extra spaces
        def normalize_name(name):
            return ' '.join(name.split()) if name else ''

        data['first_name'] = normalize_name(data.get('first_name'))
        data['last_name'] = normalize_name(data.get('last_name'))
        data['username'] = data.get('username', '').strip()
        data['email'] = data.get('email', '').strip()
        data['password'] = data.get('password', '')

        # Profile image upload is currently disabled; enable if needed
        # profile_image = request.FILES.get('profile_image')
        # image_url = None
        # if profile_image:
        #     file_path = os.path.join('profile_images', f'profile_{profile_image.name}')
        #     saved_path = default_storage.save(file_path, ContentFile(profile_image.read()))
        #     image_url = f"{request.build_absolute_uri(settings.MEDIA_URL)}{saved_path}"
        #     logger.info(f"file_path: {file_path}")
        # if image_url:
        #     data['image_url'] = image_url

        serializer = UserSerializer(data=data)
        user = None
        if serializer.is_valid():
            user = serializer.save()
            # Set password securely after user is created
            user.set_password(data['password'])
            user.save()
            message = _('Your account is created successfully. Log in with your username and password.')
            # Send verification email if enabled and user is not validated
            if getattr(settings, 'ENABLE_EMAIL_VERIFICATION', False) and not getattr(user, 'is_user_email_validated', False):
                send_verification_email(user)
                message = _('Your account has been successfully created. You can log in once you validate your email via the link sent to your email address.')
            return Response({
                'message': message,
                'success': True,
                'username': user.username
            }, status=status.HTTP_201_CREATED)

        # Log serializer errors for debugging
        logger.error("User registration failed: %s", serializer.errors)
        message = _("We cannot create your account due to the following errors. Please correct them and try again.")
        return Response(
            {'message': message, 'errors': serializer.errors, 'success': False},
            status=status.HTTP_409_CONFLICT
        )


class SignUpThirdPartyView(APIView):
    """
    API endpoint for user registration using third party.
    If credentials are valid, returns JWT tokens (access & refresh).
    """
    permission_classes = [AllowAny]

    # noinspection PyMethodMayBeStatic
    def post(self, request):
        """
        Handles user registration via third-party providers (Google, etc).
        Validates the third-party token, normalizes input, and creates a new user if needed.
        Returns JWT tokens and user data on success.
        """
        current_language = request.data.get("selected_language") or 'fr'
        email = request.data.get("email")
        first_name = request.data.get("first_name")
        from_platform = request.data.get("from_platform") or 'web'
        last_name = request.data.get("last_name")
        token_value = request.data.get("id_token")
        type_third_party = request.data.get("type_third_party")
        user_image_url = request.data.get("user_image_url") or ""

        activate(current_language)

        # Validate required fields
        if not email or not type_third_party or not token_value:
            return Response(
                {"message": _("Email, Id token and Third party type are required"), "success": False},
                status=status.HTTP_400_BAD_REQUEST
            )
        email_verified = False
        try:
            # Google OAuth token validation
            if type_third_party == "google":
                try:
                    request_adapter = requests.Request()
                    GOOGLE_CLIENT_ID = getattr(settings, 'GOOGLE_SIGN_IN_WEB_CLIENT_ID', None)
                    idinfo = id_token.verify_oauth2_token(token_value, request_adapter, GOOGLE_CLIENT_ID)
                    verified_email = idinfo.get('email')
                    email_verified = idinfo.get('email_verified', False)
                    if verified_email == email and email_verified:
                        email = verified_email
                        logger.info(f"Successfully verified Google OAuth token for email: {email}")
                    else:
                        logger.warning(f"Email mismatch or not verified: provided={email}, token={verified_email}, verified={email_verified}")
                        email = None
                except Exception as google_error:
                    logger.error(f"Google OAuth token verification failed: {str(google_error)}")
                    email = None
            else:
                # Placeholder for other providers
                logger.warning(f"Third-party provider '{type_third_party}' not implemented yet")
                email = None
        except Exception as e:
            logger.error(f"Unexpected error during token verification: {str(e)}")
            email = None

        if not email_verified:
            return Response({
                "message": _("Unable to verify your account with the provided third-party credentials. Please check your information or try a different sign-up method."),
                "success": False
            }, status=status.HTTP_400_BAD_REQUEST)

        user = User.objects.filter(email=email).first()

        if user is not None:
            # If user exists, delegate to sign-in logic
            return SignInThirdPartyView().post(request, user=user)
        else:
            # Create new user with normalized names and generated username
            def normalize_name(name):
                return ' '.join(name.split()) if name else ''
            username = UserService.generate_unique_username(email=email, first_name=first_name, last_name=last_name)
            data = {
                'first_name': normalize_name(first_name),
                'last_name': normalize_name(last_name),
                'username': username,
                'email': email,
                'user_image_url': user_image_url or "",
                'is_user_email_validated': True,
            }
            serializer = UserSerializer(data=data)
            if serializer.is_valid():
                user = serializer.save()
                refresh = RefreshToken.for_user(user)
                user_data = user.to_login_dict()
                return Response({
                    "access_token": str(refresh.access_token),
                    "refresh_token": str(refresh),
                    "success": True,
                    "user": user_data,
                    "is_new_user": True,
                }, status=status.HTTP_200_OK)
            # Log serializer errors for debugging
            logger.error("Third-party signup failed: %s", serializer.errors)
            return Response({
                "message": _("Unable to create or authenticate your account with the provided third-party credentials. Please check your information or try a different sign-up method."),
                "success": False
            }, status=status.HTTP_400_BAD_REQUEST)


class UpdateProfileView(APIView):
    """
    A view to handle updating the user's profile information, including personal data
    and optional image and password updates.

    This view:
    - Requires the user to be authenticated.
    - Allows updating of basic profile information such as name, gender, and birthday.
    - Handles the optional upload of a profile image.
    - Optionally, allows the user to update their password if the correct current password is provided.

    Methods:
        put: Handles the PUT request to update the user profile.
    """
    permission_classes = [IsAuthenticated]
    parser_classes = (MultiPartParser, FormParser)

    # noinspection PyMethodMayBeStatic
    def put(self, request, *args, **kwargs):
        """
        Handles the logic for updating the user's profile.
        This includes updating their basic profile fields, profile image (if provided),
        and optionally updating the password.

        Args:
            request (Request): The request object containing the user's data and files.

        Returns:
            Response: The response containing the updated user data, any relevant tokens, and success/failure message.
        """
        user = request.user
        data = QueryDict('', mutable=True)
        data.update(request.data)

        # Get selected language or default to French
        current_language = data.get('current_language') or 'fr'
        activate(current_language)

        # Generate a unique prefix to avoid email/username uniqueness validation errors
        random_prefix = generate_random_code()
        data['email'] = random_prefix + data.get('email', '')
        data['username'] = random_prefix + data.get('username', '')
        user_phone_number = data.get('user_phone_number')
        formatted_user_phone_number = format_phone_number(user_phone_number)
        if user.user_phone_number and user.user_phone_number == formatted_user_phone_number:
            data['user_phone_number'] = ""

        # Create a dummy serializer for validation purposes only
        serializer = UserSerializer(data=data)
        if not serializer.is_valid():
            message = _("Your profile could not be updated due to the errors listed above. Please correct them and try again.")
            return Response(
                {'message': message, 'errors': serializer.errors, 'success': False},
                status=status.HTTP_409_CONFLICT
            )

        # Retrieve additional profile data
        profile_image = request.FILES.get('profile_image')
        current_password = data.get('current_password')
        first_name = data.get('first_name')
        image_updated = data.get('image_updated') in [True, 'true']
        last_name = data.get('last_name')
        new_password = data.get('new_password')
        update_password = data.get('update_password') in [True, 'true']
        user_birthday = data.get('user_birthday')
        user_gender = data.get('user_gender')
        user_image_url = user.user_image_url
        user_initials_bg_color = data.get('user_initials_bg_color')

        # Handle profile image update
        if image_updated:
            user_image_url = None
            if profile_image:
                try:
                    user_image_url, file_path = upload_file(request, profile_image, 'profile_images', prefix="profile_")
                    logger.info(f"file_path: {file_path}")
                except Exception as e:
                    logger.error(f"Image upload failed: {str(e)}")
                    return Response({'message': _("Image upload failed."), 'success': False}, status=500)

            if user.user_image_url:
                remove_file(request, user.user_image_url)

        # Update user fields
        user.current_language = current_language
        user.first_name = first_name
        user.last_name = last_name
        user.user_birthday = user_birthday
        user.user_gender = user_gender
        user.user_image_url = user_image_url
        user.user_initials_bg_color = user_initials_bg_color
        user.user_phone_number = user_phone_number

        user.save()

        # Handle password update
        wrong_password = False
        access_token = None
        refresh_token = None
        if update_password:
            authenticated_user = authenticate(request, username=user.username, password=current_password)
            if authenticated_user is not None:
                user.set_password(new_password)
                user.save()
                refresh = RefreshToken.for_user(user)
                access_token = str(refresh.access_token)
                refresh_token = str(refresh)
            else:
                wrong_password = True

        # Prepare response
        user_data = user.to_login_dict()
        message = _('Your profile has been updated successfully.')
        # Get device ID from request headers or data to exclude from WebSocket updates
        device_id = request.headers.get('X-Device-ID')
        # Notify all connected clients (via WebSocket) that the user's profile has changed
        notify_profile_update(user.id, user_data, password_updated=access_token is not None, device_id=device_id)
        return Response({
                'message': message,
                "access_token": access_token,
                "refresh_token": refresh_token,
                "success": True,
                "user": user_data,
                "wrong_password": wrong_password,
            }, status=status.HTTP_200_OK,
        )


def verify_phone_number(request):
    """
    Handles the phone number verification endpoint.

    Args:
        request (HttpRequest): The HTTP request object.

    Returns:
        JsonResponse: A response indicating the result of the verification.
    """
    uid = request.GET.get('uid')
    verification_code = request.GET.get('verification_code')
    # If uid or verification_code aren't exists in the request, return an error message
    if not uid or not verification_code:
        return JsonResponse({"message": _("Missing required parameters.")}, status=400)

    resend_verification_phone_number_code = request.GET.get('resend_verification_phone_number_code') in [True, "true"]

    uid_ = urlsafe_base64_decode(uid).decode()
    user = User.objects.get(pk=uid_)
    # Activate user's current language for translations
    activate(user.current_language)
    if not user.is_user_phone_number_validated and not user.user_phone_number_to_verify:
        return JsonResponse({
            "message": _(f"You should add a phone number before validate it!")
        }, status=400)
    if not user.is_user_phone_number_validated and user.user_phone_number_to_verify and User.objects.filter(
        is_user_phone_number_validated=True, user_phone_number=user.user_phone_number_to_verify
    ).exists():
        return JsonResponse({
            "message": _("This phone number already verified for another user. Please contact the technical service at {technical_service_email} to resolve your problem.").format(technical_service_email=settings.TECHNICAL_SERVICE_EMAIL)
        }, status=400)
    try:
        verified, already_verified, expired_code, quota_exceeded = verify_user_phone_number(uid, verification_code, resend_verification_phone_number_code=resend_verification_phone_number_code)
    except (TypeError, ValueError, OverflowError, User.DoesNotExist) as e:
        # Save error in the log
        logger.error("Error while verifying phone number: %s", str(e), exc_info=True)
        return JsonResponse({"message": _("Invalid verification code.")}, status=400)
    if verified:
        if already_verified:
            return JsonResponse({"message": _("Phone number already verified.")})
        else:
            return JsonResponse({"message": _("Phone number verified successfully.")})
    else:
        if expired_code:
            if resend_verification_phone_number_code:
                return JsonResponse({
                    "message": _("A new verification code will be sent to your phone number.")
                }, status=400)
            return JsonResponse({
                "message": _("Expired verification code.")
            }, status=400)
        elif quota_exceeded:
            return JsonResponse({
                "message": _("Your sms verification code quota has been exceeded. Please contact the technical service at {technical_service_email} to resolve your problem.").format(technical_service_email=settings.TECHNICAL_SERVICE_EMAIL)
            }, status=400)
        else:
            return JsonResponse({"message": _("Invalid code.")}, status=400)


def verify_user_phone_number(uid, verification_code_, resend_verification_phone_number_code=False):
    """
    Verifies the phone number code for a user.

    Args:
        uid (str): Base64 encoded user ID.
        verification_code_ (str): Code for user_phone_number verification.
        resend_verification_phone_number_code (bool): resend the phone number verification code for the user if True.

    Returns:
        tuple: (
            (True if verification is successful, False otherwise),
            (True if already verified, False otherwise),
            (True if not verified and expired, False otherwise),
            (True if phone number verification code sms quota exceeded, False otherwise),
        ).
    """
    # Decode the user's coded id
    uid = urlsafe_base64_decode(uid).decode()
    user = User.objects.get(pk=uid)

    # The email is already validated
    if user.is_user_phone_number_validated:
        return True, True, False, False
    # the verification_code is expired (not the same day)
    elif user.user_phone_number_verification_code_generated_at and (user.user_phone_number_verification_code_generated_at + datetime.timedelta(minutes=settings.NUMBER_MINUTES_BEFORE_PHONE_NUMBER_VERIFICATION_CODE_EXPIRATION)) < now():
        return False, False, True, False
    # The resend_verification_phone_number_code is True
    elif resend_verification_phone_number_code:
        if user.nbr_phone_number_verification_code_used >= settings.PHONE_NUMBER_VERIFICATION_CODE_QUOTA:
            return False, False, False, True
        send_phone_number_verification_code(user)
    # If the token is valid, the email address will be validated
    if user.user_phone_number_verification_code == verification_code_:
        user.is_user_phone_number_validated = True
        user.user_phone_number = user.user_phone_number_to_verify
        user.save()
        return True, False, False, False
    # If the token is not valid, the email address will not be validated
    else:
        return False, False, False, False


def verify_user_email(uid, token_, resend_verification_email=False):
    """
    Verifies the email token for a user.

    Args:
        uid (str): Base64 encoded user ID.
        token_ (str): Token for email verification.
        resend_verification_email (bool): resend the verification email for the user if True.

    Returns:
        tuple: (
            (True if verification is successful, False otherwise),
            (True if already verified, False otherwise),
            (True if not verified and expired, False otherwise),
        ).
    """
    # Get user's token and timestamp str from the token in request
    token_date = token_.split("_*_")
    token = token_date[0]
    # Convert timestamp str to float if exists
    timestamp = len(token_date) == 2 and float(token_date[1])
    # Get date of token creation
    date_token = timestamp and datetime.datetime.fromtimestamp(timestamp)
    # Decode the user's coded id
    uid = urlsafe_base64_decode(uid).decode()
    user = User.objects.get(pk=uid)

    # The email is already validated
    if user.is_user_email_validated:
        return True, True, False
    # The resend_verification_email is True or the token is expired (not the same day)
    elif resend_verification_email or date_token and date_token.strftime("%Y-%m-%d") != now().strftime("%Y-%m-%d"):
        send_verification_email(user)
        return False, False, True
    # If the token is valid, the email address will be validated
    if default_token_generator.check_token(user, token):
        user.is_user_email_validated = True
        user.save()
        return True, False, False
    # If the token is not valid, the email address will not be validated
    else:
        return False, False, False


def verify_email(request):
    """
    Handles the email verification endpoint.

    Args:
        request (HttpRequest): The HTTP request object.

    Returns:
        JsonResponse: A response indicating the result of the verification.
    """
    uid = request.GET.get('uid')
    token = request.GET.get('token')
    # If uid or token aren't exists in the request, return an error message
    if not uid or not token:
        return JsonResponse({"message": _("Missing required parameters.")}, status=400)

    resend_verification_email = request.GET.get('resend_verification_email') in [True, "true"]

    uid_ = urlsafe_base64_decode(uid).decode()
    user = User.objects.get(pk=uid_)
    # Activate user's current language for translations
    activate(user.current_language)
    try:
        verified, already_verified, expired_token = verify_user_email(uid, token, resend_verification_email=resend_verification_email)
    except (TypeError, ValueError, OverflowError, User.DoesNotExist) as e:
        # Save error in the log
        logger.error("Error while verifying email: %s", str(e), exc_info=True)
        return JsonResponse({"message": _("Invalid verification link.")}, status=400)

    if verified:
        if already_verified:
            return JsonResponse({"message": _("Email already verified.")})
        else:
            return JsonResponse({"message": _("Email verified successfully.")})
    else:
        if expired_token:
            return JsonResponse({
                "message": _("Expired token. A new verification email will be sent to your email address.")
            }, status=400)
        else:
            return JsonResponse({"message": _("Invalid token.")}, status=400)



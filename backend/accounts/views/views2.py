"""Accounts related views"""
import datetime
import logging

from django.conf import settings
from django.contrib.auth.tokens import default_token_generator
from django.http import JsonResponse
from django.utils.http import urlsafe_base64_decode
from django.utils.timezone import now
from django.utils.translation import activate
from django.utils.translation import gettext_lazy as _
from leaguer.ws_utils import (notify_profile_password_reset,
                              notify_profile_update)
from rest_framework import status
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework.views import APIView
from rest_framework_simplejwt.token_blacklist.models import (BlacklistedToken,
                                                             OutstandingToken)

from accounts.models import User
from accounts.tokens import RefreshToken
from accounts.utils import (send_phone_number_verification_code,
                    send_verification_email)

# Get a logger instance
logger = logging.getLogger(__name__)


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
    resend_verification_phone_number_code = request.GET.get(
        'resend_verification_phone_number_code') in [True, "true"]
    uid_ = urlsafe_base64_decode(uid).decode()
    user = User.objects.get(pk=uid_)
    # Activate user's current language for translations
    activate(user.current_language)
    if not user.is_user_phone_number_validated and not user.user_phone_number_to_verify:
        return JsonResponse({
            "message": _(f"You should add a phone number before validate it!")
        }, status=400)
    if not user.is_user_phone_number_validated and user.user_phone_number_to_verify and \
            User.objects.filter(is_user_phone_number_validated=True,
                                user_phone_number=user.user_phone_number_to_verify
    ).exists():
        return JsonResponse({
            "message": _("This phone number already verified for another user. "
                "Please contact the technical service at {technical_service_email} "
                "to resolve your problem.").format(
                    technical_service_email=settings.TECHNICAL_SERVICE_EMAIL)
        }, status=400)
    try:
        (
            verified, already_verified, expired_code, quota_exceeded
        ) = verify_user_phone_number(uid, verification_code,
            resend_verification_phone_number_code=resend_verification_phone_number_code)
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
                    "message": _("A new verification code will be sent to your phone "
                                 "number.")
                }, status=400)
            return JsonResponse({
                "message": _("Expired verification code.")
            }, status=400)
        elif quota_exceeded:
            return JsonResponse({
                "message": _("Your sms verification code quota has been exceeded. "
                    "Please contact the technical service at {technical_service_email} "
                    "to resolve your problem.").format(
                        technical_service_email=settings.TECHNICAL_SERVICE_EMAIL)
            }, status=400)
        else:
            return JsonResponse({"message": _("Invalid code.")}, status=400)


def verify_user_phone_number(uid, verification_code_,
                             resend_verification_phone_number_code=False):
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
    elif user.user_phone_number_verification_code_generated_at and (
            user.user_phone_number_verification_code_generated_at + datetime.timedelta(
        minutes=settings.NUMBER_MINUTES_BEFORE_PHONE_NUMBER_VERIFICATION_CODE_EXPIRATION)) < now():
        return False, False, True, False
    # The resend_verification_phone_number_code is True
    elif resend_verification_phone_number_code:
        if user.nbr_phone_number_verification_code_used >= settings.PHONE_NUMBER_VERIFICATION_CODE_QUOTA:   # pylint: disable=line-too-long
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
        resend_verification_email (bool): resend the verification email for the user 
            if True.

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
    resend_verification_email = request.GET.get('resend_verification_email') in [True,
                                                                                 "true"]
    uid_ = urlsafe_base64_decode(uid).decode()
    user = User.objects.get(pk=uid_)
    # Activate user's current language for translations
    activate(user.current_language)
    try:
        verified, already_verified, expired_token = verify_user_email(uid, token,
                            resend_verification_email=resend_verification_email)
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
                "message": _("Expired token. A new verification email will be sent to "
                             "your email address.")
            }, status=400)
        else:
            return JsonResponse({"message": _("Invalid token.")}, status=400)


class LogoutView(APIView):
    """
    API endpoint for user logout.
    Blacklists the user's refresh token to prevent further use.
    """
    permission_classes = [IsAuthenticated]
    def post(self, request):
        """
        Logout user by blacklisting their tokens.
        
        Request Body:
        - refresh_token (str): The refresh token to blacklist
        - selected_language (str, optional): Language preference
        
        Response:
        - Success: Confirmation of logout
        - Failure: Error messages with proper status codes
        """
        try:
            current_language = request.data.get("selected_language") or 'en'
            activate(current_language)
            
            # Optional: Blacklist all tokens for this user (more secure but logs out 
            # all devices)
            # You can enable this if you want to logout from all devices
            logout_all_devices = request.data.get("logout_all_devices", False)
            refresh_token = request.data.get("refresh_token")
            if not refresh_token:
                return Response({
                    "message": _("Refresh token is required"),
                    "success": False
                }, status=status.HTTP_400_BAD_REQUEST)
            try:
                # Parse the refresh token to get the JTI
                token = RefreshToken(refresh_token)
                jti = token.get('jti')
                if jti:
                    # Find the outstanding token and blacklist it
                    try:
                        outstanding_token = OutstandingToken.objects.get(jti=jti)
                        # Check if already blacklisted
                        if not BlacklistedToken.objects.filter(
                            token=outstanding_token).exists():
                            BlacklistedToken.objects.create(token=outstanding_token)
                            logger.info(f"Successfully blacklisted token for user {request.user.username}")
                        else:
                            logger.info(f"Token already blacklisted for user {request.user.username}")
                    except OutstandingToken.DoesNotExist:
                        logger.warning(f"Outstanding token not found for JTI {jti}")
                        # Token might already be expired or invalid, but that's okay for 
                        # logout
                else:
                    logger.warning("No JTI found in refresh token")
            except Exception as token_error:
                logger.warning(f"Error processing refresh token: {str(token_error)}")
                # Continue with logout even if token processing fails
                if not logout_all_devices:
                    return Response({
                        "message": _("Invalid refresh token"),
                        "success": False
                    }, status=status.HTTP_400_BAD_REQUEST)
            if logout_all_devices:
                try:
                    # Get all outstanding tokens for this user
                    outstanding_tokens = OutstandingToken.objects.filter(user=request.user)
                    tokens_blacklisted = 0
                    for outstanding_token in outstanding_tokens:
                        if not BlacklistedToken.objects.filter(
                            token=outstanding_token).exists():
                            BlacklistedToken.objects.create(token=outstanding_token)
                            tokens_blacklisted += 1
                    logger.info(f"Blacklisted {tokens_blacklisted} tokens for user {request.user.username} (all devices)")
                    
                except Exception as e:
                    logger.error(f"Error blacklisting all tokens for user {request.user.username}: {str(e)}")
            # Get device ID for WebSocket notification
            device_id = request.headers.get('X-Device-ID')
            
            # Notify all connected devices about logout (except the current device)
            # This will trigger automatic logout on other devices if logout_all_devices 
            # is True
            if logout_all_devices:
                notify_profile_password_reset(request.user.id, device_id=device_id)
            return Response({
                "message": _("Successfully logged out"),
                "success": True
            }, status=status.HTTP_200_OK)
        except Exception as e:
            logger.error(f"Error during logout for user {request.user.id if request.user else 'unknown'}: {str(e)}")
            return Response({
                "message": _("An error occurred during logout"),
                "success": False
            }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


class UpdateSettingsView(APIView):
    """
    API endpoint for updating user settings (language, timezone, theme).
    """
    permission_classes = [IsAuthenticated]

    def put(self, request):
        """
        Update user settings including language, timezone, and theme.
        
        Request Body:
        - current_language (str, optional): User's preferred language
        - user_timezone (str, optional): User's timezone
        - user_theme (str, optional): User's preferred theme (light, dark, auto)
        - selected_language (str, optional): Language for response messages
        
        Response:
        - Success: Updated user data
        - Failure: Error messages with proper status codes
        """
        try:
            current_language = request.data.get("selected_language") or \
            request.user.current_language or 'en'
            activate(current_language)
            user = request.user
            updated_fields = []
            # Update current language
            new_language = request.data.get("current_language")
            if new_language and new_language != user.current_language:
                if new_language in [lang[0] for lang in settings.LANGUAGES]:
                    user.current_language = new_language
                    updated_fields.append("current_language")
                else:
                    return Response({
                        "message": _("Invalid language selection"),
                        "success": False
                    }, status=status.HTTP_400_BAD_REQUEST)
            # Update timezone
            new_timezone = request.data.get("user_timezone")
            if new_timezone and new_timezone != user.user_timezone:
                # Validate timezone
                from leaguer.utils import get_all_timezones
                valid_timezones = [tz[0] for tz in get_all_timezones()]
                if new_timezone in valid_timezones:
                    user.user_timezone = new_timezone
                    updated_fields.append("user_timezone")
                else:
                    return Response({
                        "message": _("Invalid timezone selection"),
                        "success": False
                    }, status=status.HTTP_400_BAD_REQUEST)
            # Update theme
            new_theme = request.data.get("user_theme")
            if new_theme and new_theme != user.user_theme:
                from accounts.models import THEME_CHOICES
                valid_themes = [theme[0] for theme in THEME_CHOICES]
                if new_theme in valid_themes:
                    user.user_theme = new_theme
                    updated_fields.append("user_theme")
                else:
                    return Response({
                        "message": _("Invalid theme selection"),
                        "success": False
                    }, status=status.HTTP_400_BAD_REQUEST)
            if not updated_fields:
                return Response({
                    "message": _("No changes detected"),
                    "success": False
                }, status=status.HTTP_400_BAD_REQUEST)
            # Save the user
            user.save(update_fields=updated_fields)
            # Get device ID for WebSocket notification
            device_id = request.headers.get('X-Device-ID')
            # Notify other devices about settings update
            user_data = user.to_login_dict()
            notify_profile_update(user.id, user_data, device_id=device_id)
            logger.info(f"Settings updated for user {user.username}: {', '.join(updated_fields)}")
            return Response({
                "message": _("Settings updated successfully"),
                "success": True,
                "user": user_data
            }, status=status.HTTP_200_OK)
        except Exception as e:
            logger.error(f"Error updating settings for user {request.user.id if request.user else 'unknown'}: {str(e)}")
            return Response({
                "message": _("An error occurred while updating settings"),
                "success": False
            }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


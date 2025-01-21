from .models import User
from .utils import send_verification_email, send_phone_number_verification_code
from django.contrib.auth.tokens import default_token_generator
from django.conf import settings
from django.http import JsonResponse
from django.utils.http import urlsafe_base64_encode, urlsafe_base64_decode
from django.utils.timezone import now
from django.utils.translation import activate, gettext_lazy as _
import datetime
import logging

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

    resend_verification_phone_number_code = request.GET.get('resend_verification_phone_number_code') in [True, "true"]

    uid_ = urlsafe_base64_decode(uid).decode()
    user = User.objects.get(pk=uid_)
    # Activate user's current language for translations
    activate(user.current_language)
    if not user.is_phone_number_validated and not user.phone_number_to_verify:
        return JsonResponse({
            "message": _(f"You should add a phone number before validate it!")
        }, status=400)
    if not user.is_phone_number_validated and user.phone_number_to_verify and User.objects.filter(
        is_phone_number_validated=True, phone_number=user.phone_number_to_verify
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
        verification_code_ (str): Code for phone_number verification.
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
    if user.is_phone_number_validated:
        return True, True, False, False
    # the verification_code is expired (not the same day)
    elif user.phone_number_verification_code_generated_at and (user.phone_number_verification_code_generated_at + datetime.timedelta(minutes=settings.NUMBER_MINUTES_BEFORE_PHONE_NUMBER_VERIFICATION_CODE_EXPIRATION)) < now():
        return False, False, True, False
    # The resend_verification_phone_number_code is True
    elif resend_verification_phone_number_code:
        if user.nbr_phone_number_verification_code_used >= settings.PHONE_NUMBER_VERIFICATION_CODE_QUOTA:
            return False, False, False, True
        send_phone_number_verification_code(user)
    # If the token is valid, the email address will be validated
    if user.phone_number_verification_code == verification_code_:
        user.is_phone_number_validated = True
        user.phone_number = user.phone_number_to_verify
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
    if user.is_email_validated:
        return True, True, False
    # The resend_verification_email is True or the token is expired (not the same day)
    elif resend_verification_email or date_token and date_token.strftime("%Y-%m-%d") != now().strftime("%Y-%m-%d"):
        send_verification_email(user)
        return False, False, True
    # If the token is valid, the email address will be validated
    if default_token_generator.check_token(user, token):
        user.is_email_validated = True
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



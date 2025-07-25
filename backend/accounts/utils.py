from django.conf import settings
from django.contrib.auth.tokens import default_token_generator
from django.core.mail import EmailMultiAlternatives
from django.template.loader import render_to_string
from django.utils.encoding import force_bytes
from django.utils.http import urlsafe_base64_encode, urlsafe_base64_decode
from django.utils.timezone import now
from django.utils.translation import activate, gettext_lazy as _
from leaguer.utils import generate_random_code, get_email_base_context, send_phone_message
from smtplib import SMTPException, SMTPAuthenticationError, SMTPSenderRefused, SMTPRecipientsRefused, SMTPDataError
import datetime
import logging
import phonenumbers

# Get a logger instance
logger = logging.getLogger(__name__)

GENDERS_CHOICES = [("", _("Select")), ("female", _("Female")), ("male", _("Male"))]


def format_phone_number(user_phone_number):
    """
        Convert user_phone_number to a standard format

        Args:
            user_phone_number (String): the phone number.

        Returns:
            user_phone_number: formatted phone number.
    """
    try:
        parsed_number = phonenumbers.parse(user_phone_number, settings.DEFAULT_PHONE_NUMBER_COUNTRY_CODE)
        user_phone_number = phonenumbers.format_number(
            parsed_number, phonenumbers.PhoneNumberFormat.E164
        )
    except phonenumbers.NumberParseException:
        pass
    return user_phone_number


def send_verification_email(user, handle_send_email_error=False, do_not_mock_api=False):
    """
    Sends a verification email to the user.

    Args:
        user (User): The user object to send the email to.
        handle_send_email_error (bool): Flag to simulate an intentional error for testing.
        do_not_mock_api (bool): Flag to run api even if it is for testing.

    Returns:
        tuple: A tuple containing the status code (int) and token data (tuple).
    """
    # Generate user's token
    token_ = default_token_generator.make_token(user)
    # Get current timestamp as str
    timestamp_str = str(now().timestamp())
    # Generate final token that contains timestamp for expiration validation
    token = token_ + "_*_" + timestamp_str
    # Encode user's id
    uid = urlsafe_base64_encode(force_bytes(user.pk))

    # Build the verification URL
    # This url is for frontend and it not the backend url: accounts/verify-email
    verification_url = f"{settings.FRONTEND_ENDPOINT}/verify-email?uid={uid}&token={token}"

    # Render the email content
    subject = _("Verify Your Email Address")
    # Get emails common context
    context = get_email_base_context()
    # Add custom context to verification's email
    context.update({
        "email_title": _("Verify Your Email Address"), "user": user, "verification_url": verification_url,
    })
    # context['logo_url'] = "https://kkmediafilesprod.s3.amazonaws.com/assets/thumbs/mohamed2_1699526271550_16995262403696774211444867641754.jpg"
    text_content = render_to_string("email_verification.txt", context)  # Plain text fallback
    html_content = render_to_string("email_verification.html", context)  # HTML content

    # Send the email
    try:
        if settings.DEBUG or settings.TEST:
            print("html_content")
            print(html_content)
        # This is for testing send email's error from third party
        if handle_send_email_error:
            err = int("text")
        if settings.TEST and do_not_mock_api is False:
            return 200, (uid, token)
        email = EmailMultiAlternatives(subject, text_content, context.get('from_email'), [user.email])
        email.attach_alternative(html_content, "text/html")
        email.send()
    except (
        SMTPAuthenticationError, SMTPSenderRefused, SMTPRecipientsRefused, SMTPDataError,
        SMTPException, UnicodeEncodeError, TypeError, ValueError, OverflowError, Exception
    ) as e:
        # Save the error in the log
        logger.error("Error while sending verification email: %s", str(e), exc_info=True)
        return 500, (uid, token)

    return 200, (uid, token)


def send_phone_number_verification_code(user, handle_send_phone_number_verification_sms_error=False, do_not_mock_api=False):
    """
    Sends a phone number verification code to the user.

    Args:
        user (User): The user object to send the email to.
        handle_send_phone_number_verification_sms_error (bool): Flag to simulate an intentional error for testing.
        do_not_mock_api (bool): Flag to api even if it is for testing.

    Returns:
        tuple: A tuple containing the status code (int) and code verification data (tuple).
    """
    # Generate user's verification code (6-digit)
    verification_code = generate_random_code()
    # Encode user's id
    uid = urlsafe_base64_encode(force_bytes(user.pk))

    # Build the sms content
    context = {'verification_code': verification_code}
    message_content = render_to_string("sms_verification.txt", context)  # Plain text fallback

    # Send the email
    try:
        if settings.DEBUG:
            print("message_content")
            print(message_content)
        # This is for testing send sms error from third party
        if handle_send_phone_number_verification_sms_error:
            err = int("text")
        receivers_numbers = [user.user_phone_number_to_verify]
        response = send_phone_message(message_content, receivers_numbers, do_not_mock_api=do_not_mock_api)
        if not response.get('all_verification_codes_sent'):
            return 500, (uid, verification_code)
    except (
        UnicodeEncodeError, TypeError, ValueError, OverflowError, Exception
    ) as e:
        # Save the error in the log
        logger.error("Error while sending phone number verification code: %s", str(e), exc_info=True)
        return 500, (uid, verification_code)

    # Save verification code && generation date to user
    user.user_phone_number_verification_code = verification_code
    user.user_phone_number_verification_code_generated_at = now()
    # If whatsapp message sent, we're updating nbr_phone_number_verification_code_used values of users with the receiver_number's number
    user.nbr_phone_number_verification_code_used += 1
    user.save()
    return 200, (uid, verification_code)


def send_password_reset_email(user, handle_send_email_error=False, do_not_mock_api=False):
    """
    Sends a password reset email to the user.

    Args:
        user (User): The user object to send the email to.
        handle_send_email_error (bool): Flag to simulate an intentional error for testing.
        do_not_mock_api (bool): Flag to api even if it is for testing.

    Returns:
        tuple: A tuple containing the status code (int) and token data (tuple).
    """
    # Generate user's token
    token_ = default_token_generator.make_token(user)
    # Get current timestamp as str
    timestamp_str = str(now().timestamp())
    # Generate final token that contains timestamp for expiration validation
    token = token_ + "_*_" + timestamp_str
    # Encode user's id
    uid = urlsafe_base64_encode(force_bytes(user.pk))

    # Build the password reset URL
    # This url is for frontend and it not the backend url: accounts/reset-password
    reset_url = f"{settings.FRONTEND_ENDPOINT}/auth/reset-password?uid={uid}&token={token}"

    # Render the email content
    subject = _("Password Reset Request")
    # Get emails common context
    context = get_email_base_context()
    # Add custom context to password reset email
    context.update({
        "email_title": _("Password Reset Request"), "user": user, "reset_url": reset_url,
    })
    text_content = render_to_string("password_reset.txt", context)  # Plain text fallback
    html_content = render_to_string("password_reset.html", context)  # HTML content

    # Send the email
    try:

        if settings.DEBUG or settings.TEST:
            print("html_content")
            print(html_content)
        # This is for testing send email's error from third party
        if handle_send_email_error:
            err = int("text")
        if settings.TEST and do_not_mock_api is False:
            return 200, (uid, token)
        email = EmailMultiAlternatives(subject, text_content, context.get('from_email'), [user.email])
        email.attach_alternative(html_content, "text/html")
        email.send()
    except (
        SMTPAuthenticationError, SMTPSenderRefused, SMTPRecipientsRefused, SMTPDataError,
        SMTPException, UnicodeEncodeError, TypeError, ValueError, OverflowError, Exception
    ) as e:
        # Save the error in the log
        logger.error("Error while sending password reset email: %s", str(e), exc_info=True)
        return 500, (uid, token)

    return 200, (uid, token)


def validate_password_reset_token(uid, token):
    """
    Validates a password reset token.

    Args:
        uid (str): The base64 encoded user ID.
        token (str): The password reset token.

    Returns:
        tuple: (is_valid, user, error_message)
    """
    from django.contrib.auth import get_user_model
    User = get_user_model()
    
    try:
        # Decode user id
        user_id = urlsafe_base64_decode(uid).decode()
        user = User.objects.get(pk=user_id)
    except (TypeError, ValueError, OverflowError, UnicodeDecodeError, User.DoesNotExist):
        return False, None, "Invalid user"

    # Check if user is active
    if not user.is_active:
        return False, None, "User account is disabled"

    # Split token to get the actual token and timestamp
    try:
        token_parts = token.split("_*_")
        if len(token_parts) != 2:
            return False, None, "Invalid token format"
        
        actual_token, timestamp_str = token_parts
        timestamp = float(timestamp_str)
    except (ValueError, IndexError):
        return False, None, "Invalid token format"

    # Check if token is expired (24 hours)
    current_timestamp = now().timestamp()
    token_age_hours = (current_timestamp - timestamp) / 3600
    
    if token_age_hours > 24:  # 24 hours expiration
        return False, None, "Token has expired"

    # Verify the token
    if not default_token_generator.check_token(user, actual_token):
        return False, None, "Invalid token"

    return True, user, None


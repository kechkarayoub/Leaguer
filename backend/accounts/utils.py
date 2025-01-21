from django.conf import settings
from django.contrib.auth.tokens import default_token_generator
from django.core.mail import EmailMultiAlternatives
from django.template.loader import render_to_string
from django.utils.encoding import force_bytes
from django.utils.http import urlsafe_base64_encode, urlsafe_base64_decode
from django.utils.timezone import now
from django.utils.translation import activate, gettext_lazy as _
from leaguer.utils import generate_random_code, get_email_base_context, send_sms, send_whatsapp
from smtplib import SMTPException, SMTPAuthenticationError, SMTPSenderRefused, SMTPRecipientsRefused, SMTPDataError
import datetime
import logging
import phonenumbers

# Get a logger instance
logger = logging.getLogger(__name__)

GENDERS_CHOICES = [("", _("Select")), ("female", _("Female")), ("male", _("Male"))]


def format_phone_number(phone_number):
    """
        Convert phone_number to a standard format

        Args:
            phone_number (String): the phone number.

        Returns:
            phone_number: formatted phone number.
    """
    try:
        parsed_number = phonenumbers.parse(phone_number, settings.DEFAULT_PHONE_NUMBER_COUNTRY_CODE)
        phone_number = phonenumbers.format_number(
            parsed_number, phonenumbers.PhoneNumberFormat.E164
        )
    except phonenumbers.NumberParseException:
        pass
    return phone_number


def send_verification_email(user, handle_send_email_error=False):
    """
    Sends a verification email to the user.

    Args:
        user (User): The user object to send the email to.
        handle_send_email_error (bool): Flag to simulate an intentional error for testing.

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
    text_content = render_to_string("email_verification.txt", context)  # Plain text fallback
    html_content = render_to_string("email_verification.html", context)  # HTML content

    # Send the email
    try:
        if settings.DEBUG:
            print("html_content")
            print(html_content)
        # This is for testing send email's error from third party
        if handle_send_email_error:
            err = int("text")
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


def send_phone_number_verification_code(user, handle_send_phone_number_verification_sms_error=False, mock_api=False):
    """
    Sends a phone number verification code to the user.

    Args:
        user (User): The user object to send the email to.
        handle_send_phone_number_verification_sms_error (bool): Flag to simulate an intentional error for testing.
        mock_api (bool): Flag to mock api for testing.

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
        receivers_numbers = [user.phone_number_to_verify]
        if mock_api:
            response = {'all_verification_codes_sent': True}
        else:
            response = send_whatsapp(message_content, receivers_numbers)
        if not response.get('all_verification_codes_sent'):
            return 500, (uid, verification_code)
    except (
        UnicodeEncodeError, TypeError, ValueError, OverflowError, Exception
    ) as e:
        # Save the error in the log
        logger.error("Error while sending phone number verification code: %s", str(e), exc_info=True)
        return 500, (uid, verification_code)

    # Save verification code && generation date to user
    user.phone_number_verification_code = verification_code
    user.phone_number_verification_code_generated_at = now()
    # If whatsapp message sent, we're updating nbr_phone_number_verification_code_used values of users with the receiver_number's number
    user.nbr_phone_number_verification_code_used += 1
    user.save()
    return 200, (uid, verification_code)


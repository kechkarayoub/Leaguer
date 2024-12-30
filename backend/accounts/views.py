from .models import User
from django.conf import settings
from django.contrib.auth.tokens import default_token_generator
from django.core.mail import EmailMultiAlternatives
from django.http import JsonResponse
from django.template.loader import render_to_string
from django.utils.encoding import force_bytes
from django.utils.http import urlsafe_base64_encode, urlsafe_base64_decode
from django.utils.translation import activate, gettext_lazy as _
from leaguer.utils import get_email_base_context
from smtplib import SMTPException, SMTPAuthenticationError, SMTPSenderRefused, SMTPRecipientsRefused, SMTPDataError
import datetime


def send_verification_email(user, handle_end_email_error=False):
    """
    Sends a verification email to the user.

    Args:
        user (User): The user object to send the email to.
        handle_end_email_error (bool): Flag to simulate an intentional error for testing.

    Returns:
        tuple: A tuple containing the status code (int) and token data (tuple).
    """
    token_ = default_token_generator.make_token(user)
    timestamp_str = str(datetime.datetime.now().timestamp())
    token = token_ + "_*_" + timestamp_str
    uid = urlsafe_base64_encode(force_bytes(user.pk))

    # Build the verification URL
    verification_url = f"{settings.FRONTEND_ENDPOINT}/verify-email?uid={uid}&token={token}"

    # Render the email content
    subject = _("Verify Your Email Address")
    from_email = settings.DEFAULT_FROM_EMAIL
    context = get_email_base_context()
    context.update({
        "email_title": _("Verify Your Email Address"), "user": user, "verification_url": verification_url,
    })
    text_content = render_to_string("email_verification.txt", context)  # Plain text fallback
    html_content = render_to_string("email_verification.html", context)  # HTML content

    # Send the email
    try:
        print("html_content")
        print(html_content)
        if handle_end_email_error:
            err = int("text")
        email = EmailMultiAlternatives(subject, text_content, from_email, [user.email])
        email.attach_alternative(html_content, "text/html")
        email.send()
    except (
        SMTPAuthenticationError, SMTPSenderRefused, SMTPRecipientsRefused, SMTPDataError,
        SMTPException, UnicodeEncodeError, TypeError, ValueError, OverflowError, Exception
    ):
        return 500, (uid, token)

    return 200, (uid, token)


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
    token_date = token_.split("_*_")
    token = token_date[0]
    timestamp = len(token_date) == 2 and float(token_date[1])
    date_token = timestamp and datetime.datetime.fromtimestamp(timestamp)
    uid = urlsafe_base64_decode(uid).decode()
    user = User.objects.get(pk=uid)

    if user.is_email_validated:
        return True, True, False
    elif resend_verification_email or date_token and date_token.strftime("%Y-%m-%d") != datetime.datetime.now().strftime("%Y-%m-%d"):
        send_verification_email(user)
        return False, False, True
    if default_token_generator.check_token(user, token):
        user.is_email_validated = True
        user.save()
        return True, False, False
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
    resend_verification_email = request.GET.get('resend_verification_email') in [True, "true"]

    uid_ = urlsafe_base64_decode(uid).decode()
    user = User.objects.get(pk=uid_)
    activate(user.current_language)
    try:
        verified, already_verified, expired_token = verify_user_email(uid, token, resend_verification_email=resend_verification_email)
    except (TypeError, ValueError, OverflowError, User.DoesNotExist):
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



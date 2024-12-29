from .models import User
from django.conf import settings
from django.contrib.auth.tokens import default_token_generator
from django.core.mail import EmailMultiAlternatives
from django.http import JsonResponse
from django.template.loader import render_to_string
from django.utils.encoding import force_bytes
from django.utils.http import urlsafe_base64_encode, urlsafe_base64_decode
from django.utils.translation import gettext_lazy as _
from leaguer.utils import get_email_base_context
from smtplib import SMTPException, SMTPAuthenticationError, SMTPSenderRefused, SMTPRecipientsRefused, SMTPDataError


def send_verification_email(user, handle_end_email_error=False):
    """
    Sends a verification email to the user.

    Args:
        user (User): The user object to send the email to.
        handle_end_email_error (bool): Flag to simulate an intentional error for testing.

    Returns:
        tuple: A tuple containing the status code (int) and token data (tuple).
    """
    token = default_token_generator.make_token(user)
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


def verify_user_email(uid, token):
    """
    Verifies the email token for a user.

    Args:
        uid (str): Base64 encoded user ID.
        token (str): Token for email verification.

    Returns:
        tuple: ((True if verification is successful, False otherwise), (True if already verified, False otherwise)).
    """
    uid = urlsafe_base64_decode(uid).decode()
    user = User.objects.get(pk=uid)

    if user.is_email_validated:
        return True, True
    if default_token_generator.check_token(user, token):
        user.is_email_validated = True
        user.save()
        return True, False
    else:
        return False, False


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

    try:
        verified, already_verified = verify_user_email(uid, token)
    except (TypeError, ValueError, OverflowError, User.DoesNotExist):
        return JsonResponse({"message": _("Invalid verification link.")}, status=400)

    if verified:
        if already_verified:
            return JsonResponse({"message": _("Email already verified.")})
        else:
            return JsonResponse({"message": _("Email verified successfully.")})
    else:
        return JsonResponse({"message": _("Invalid or expired token.")}, status=400)



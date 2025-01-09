from django.conf import settings
from django.utils.translation import gettext_lazy as _
import datetime


def get_email_base_context(selected_language="fr"):
    """
    Generate common email's context dictionary.
    Args:
        selected_language (str): The current language to handle direction in email.

    Returns:
        Dict: A dictionary that contains common params used in emails.
    """
    context = {
        'address': settings.ADDRESS,
        'app_name': settings.APPLICATION_NAME,
        'current_year': datetime.datetime.now().year,
        'direction': "rtl" if selected_language == "ar" else "ltr",
        'from_email': settings.DEFAULT_FROM_EMAIL,
    }
    return context


PHONE_NUMBER_VERIFICATION_METHOD = [
    ("", _("Select")), ("apple", _("Apple")), ("facebook", _("Facebook")), ("google", _("Google")),
    ("sms", _("Sms")), ("yahoo", _("Yahoo")), ("whatsapp", _("Whatsapp")), ("x", _("X")),
]

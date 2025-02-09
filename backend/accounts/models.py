from .utils import GENDERS_CHOICES, send_verification_email
from django.conf import settings
from django.contrib.auth.models import AbstractUser
from django.db import models
from django.utils.translation import gettext_lazy as _
from leaguer.utils import get_all_timezones, PHONE_NUMBER_VERIFICATION_METHOD


class User(AbstractUser):

    """
    Represents a custom user model extending Django's default AbstractUser.

    Fields:
        current_language (CharField): Required. Stores the user's language.
        email (EmailField): Required. Stores the user's email (unique).
        first_name (CharField): Required. Stores the user's first name.
        is_active (BooleanField): Indicates whether the user account is active.
        is_user_deleted (BooleanField): Indicates whether the user account is marked as deleted.
        is_user_email_validated (BooleanField): Indicates whether the email is validated.
        is_user_phone_number_validated (BooleanField): Indicates whether the phone number is validated.
        last_name (CharField): Required. Stores the user's last name.
        nbr_phone_number_verification_code_used (IntegerField): Optional. Stores the user's number of phone number verification code used.
        user_address (TextField): Optional. Stores the user's address.
        user_birthday (DateField): Optional. Stores the user's date of birth.
        user_cin (CharField): Optional. Stores the user's CIN (unique national ID).
        user_country (CharField): Optional. Stores the user's country.
        user_gender (CharField): Optional. Stores the user's gender using predefined choices.
        user_image_url (URLField): Optional. Stores the URL of the user's profile image.
        user_phone_number (CharField): Optional. Stores the user's phone number (unique).
        user_phone_number_verification_code (CharField): Optional. Stores the user's phone number verification code.
        user_phone_number_verification_code_generated_at (DateTimeField): Optional. Stores the user's phone number verification code's dqte creation.
        user_phone_number_to_verify (CharField): Optional. Stores the user's phone number to verify.
        user_phone_number_verified_by (CharField): Optional. Stores the user's phone number verification method (google, facebook, sms, whatsapp, ...).
        user_timezone (CharField): Required. Stores the user's timezone.
    """

    class Meta(object):
        db_table = "leaguer_user"  # Specifies the database table name.
        ordering = ['last_name', 'first_name']  # Default ordering
        verbose_name = _("User")
        verbose_name_plural = _("Users")

    current_language = models.CharField(choices=settings.LANGUAGES, default=settings.LANGUAGE_CODE, max_length=10, verbose_name=_("Current language"))
    email = models.EmailField(db_index=True, verbose_name=_("Email"), unique=True)
    first_name = models.CharField(db_index=True, max_length=150, verbose_name=_("First name"))
    is_active = models.BooleanField(db_index=True, default=True, verbose_name=_("Is active"))
    is_user_email_validated = models.BooleanField(db_index=True, default=False, verbose_name=_("Is email validated"))
    is_user_deleted = models.BooleanField(db_index=True, default=False, verbose_name=_("Is deleted"))
    is_user_phone_number_validated = models.BooleanField(db_index=True, default=False, verbose_name=_("Is phone number validated"))
    last_name = models.CharField(db_index=True, max_length=150, verbose_name=_("Last name"))
    nbr_phone_number_verification_code_used = models.IntegerField(default=0, verbose_name=_("Number of phone number's verification code used"))
    user_address = models.TextField(blank=True, null=True, verbose_name=_("Address"))
    user_birthday = models.DateField(blank=True, null=True, verbose_name=_("Birthday"))
    user_cin = models.CharField(blank=True, db_index=True, max_length=150, null=True, verbose_name=_("CIN"), unique=True)
    user_country = models.CharField(blank=True, max_length=100, null=True, verbose_name=_("Country"))
    user_gender = models.CharField(blank=True, choices=GENDERS_CHOICES, db_index=True, default="", max_length=10, verbose_name=_("GENDER"))
    user_image_url = models.URLField(blank=True, max_length=500, null=True, verbose_name=_("Image url"))
    user_phone_number = models.CharField(db_index=True, blank=True, max_length=15, null=True, verbose_name=_("Phone number"), unique=True)
    user_phone_number_verification_code = models.CharField(blank=True, max_length=6, null=True, verbose_name=_("Phone number's verification code"))
    user_phone_number_verification_code_generated_at = models.DateTimeField(blank=True, null=True, verbose_name=_("Phone number's verification code generation date"))
    user_phone_number_to_verify = models.CharField(db_index=True, blank=True, max_length=15, null=True, verbose_name=_("Phone number to verify"))
    user_phone_number_verified_by = models.CharField(blank=True, choices=PHONE_NUMBER_VERIFICATION_METHOD, default="", max_length=10, verbose_name=_("Phone number verified by"))
    user_timezone = models.CharField(choices=get_all_timezones(), default=settings.TIME_ZONE, max_length=100, verbose_name=_("Time zone"),)

    def __str__(self):
        """
        Returns:
            str: The username of the user as the string representation.
        """
        return self.username

    # noinspection PyMethodMayBeStatic
    def get_user_timezone(self):
        return getattr(self, 'user_timezone', settings.TIME_ZONE)

    # noinspection PyMethodMayBeStatic
    def to_login_dict(self):
        """
        Returns:
            dict: The data that represent logged user.
        """
        return {
            "current_language": self.current_language,
            "email": self.email,
            "first_name": self.first_name,
            "id": self.id,
            "is_user_phone_number_validated": self.is_user_phone_number_validated,
            "last_name": self.last_name,
            "user_address": self.user_address,
            "user_birthday": self.user_birthday,
            "user_cin": self.user_cin,
            "user_country": self.user_country,
            "user_gender": self.user_gender,
            "user_image_url": self.user_image_url,
            "user_phone_number": self.user_phone_number,
            "user_phone_number_to_verify": self.user_phone_number_to_verify,
            "user_timezone": self.user_timezone,
        }

    @classmethod
    def send_emails_verifications_links(cls, email=None):
        """
        This function send emails verification links to unverified users emails
        :param email: Not required, but used if you need to send email to a specific user
        :return: A message describe what happen in the functions
        """
        if settings.ENABLE_EMAIL_VERIFICATION is False:
            return f'ENABLE_EMAIL_VERIFICATION is False!!.'
        kwargs = {'is_active': True, 'is_user_email_validated': False, }
        if email:
            kwargs['email'] = email
        nbr_verifications_emails_links_sent = 0
        nbr_verifications_emails_links_not_sent = 0
        for user in cls.objects.filter(**kwargs):
            status, items = send_verification_email(user)
            if status == 200:
                nbr_verifications_emails_links_sent += 1
                print(f'Verification email sent to: {user.email}.')
            else:
                nbr_verifications_emails_links_not_sent += 1
                print(f'An error has occurred, the verification email isn\'t sent to: {user.email}!')
        if email and nbr_verifications_emails_links_sent == 0 and nbr_verifications_emails_links_not_sent == 0:
            return f'There is any user with this email: {email}, or it is already verified!'
        elif nbr_verifications_emails_links_sent == 0 and nbr_verifications_emails_links_not_sent == 0:
            return f'There is no user with not email verified yet!'
        else:
            return f'{nbr_verifications_emails_links_sent} verification email are sent, {nbr_verifications_emails_links_not_sent} are not.'

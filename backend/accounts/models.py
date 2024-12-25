from .utils import GENDERS_CHOICES
from django.contrib.auth.models import AbstractUser
from django.db import models


class User(AbstractUser):

    """
    Represents a custom user model extending Django's default AbstractUser.

    Fields:
        address (TextField): Optional. Stores the user's address.
        birthday (DateField): Optional. Stores the user's date of birth.
        cin (CharField): Optional. Stores the user's CIN (unique national ID).
        country (CharField): Optional. Stores the user's country.
        email (EmailField): Required. Stores the user's email (unique).
        first_name (CharField): Required. Stores the user's first name.
        gender (CharField): Optional. Stores the user's gender using predefined choices.
        image_url (URLField): Optional. Stores the URL of the user's profile image.
        is_active (BooleanField): Indicates whether the user account is active.
        is_deleted (BooleanField): Indicates whether the user account is marked as deleted.
        last_name (CharField): Required. Stores the user's last name.
        phone_number (CharField): Optional. Stores the user's phone number (unique).
    """

    class Meta(object):
        db_table = "leaguer_user"  # Specifies the database table name.
        ordering = ['last_name', 'first_name']  # Default ordering
        verbose_name = "User"
        verbose_name_plural = "Users"

    address = models.TextField(blank=True, null=True, verbose_name="Address")
    birthday = models.DateField(blank=True, null=True, verbose_name="Birthday")
    cin = models.CharField(blank=True, db_index=True, max_length=150, null=True, verbose_name="CIN", unique=True)
    country = models.CharField(blank=True, max_length=100, null=True, verbose_name="Country")
    email = models.EmailField(db_index=True, verbose_name="Email", unique=True)
    first_name = models.CharField(db_index=True, max_length=150, verbose_name="First name")
    gender = models.CharField(blank=True, choices=GENDERS_CHOICES, db_index=True, default="", max_length=10, verbose_name="GENDER")
    image_url = models.URLField(blank=True, max_length=500, null=True, verbose_name="Image url")
    is_active = models.BooleanField(db_index=True, default=True, verbose_name="Is active")
    is_deleted = models.BooleanField(db_index=True, default=False, verbose_name="Is deleted")
    last_name = models.CharField(db_index=True, max_length=150, verbose_name="Last name")
    phone_number = models.CharField(db_index=True, blank=True, max_length=15, null=True, verbose_name="Phone number", unique=True)

    def __str__(self):
        """
        Returns:
            str: The username of the user as the string representation.
        """
        return self.username


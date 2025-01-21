
from .models import User
from datetime import date
from django.conf import settings
from django.utils.translation import gettext_lazy as _
from rest_framework import serializers
import phonenumbers
import re


class UserSerializer(serializers.ModelSerializer):
    class Meta:
        model = User
        fields = [
            "address", "birthday", "cin", "country", "current_language", "date_joined", "email",
            "first_name", "gender", "phone_number_verification_code", "phone_number_verification_code_generated_at",
            "id", "image_url", "is_active", "is_email_validated", "is_deleted", "is_phone_number_validated",
            "last_name", "phone_number", "phone_number_to_verify", "phone_number_verified_by",
            "username", "nbr_phone_number_verification_code_used",
        ]
        read_only_fields = ["id", "date_joined"]

    # noinspection PyMethodMayBeStatic
    def validate_phone_number(self, value):
        """Validate phone number starts with +, country code, and contains only digits."""
        if value is None or value == "":
            return value
        try:
            # Parse and format the phone number
            parsed_number = phonenumbers.parse(value, settings.DEFAULT_PHONE_NUMBER_COUNTRY_CODE)
            if phonenumbers.is_valid_number(parsed_number):
                return phonenumbers.format_number(parsed_number, phonenumbers.PhoneNumberFormat.E164)
            else:
                raise serializers.ValidationError(
                    _("Invalid phone number.")
                )
        except phonenumbers.NumberParseException:
            raise serializers.ValidationError(
                _("Phone number must start with a '+' followed by the country code and the phone number.")
            )

    # noinspection PyMethodMayBeStatic
    def validate_phone_number_to_verify(self, value):
        """Validate phone number to verify starts with +, country code, and contains only digits."""
        if value is None or value == "":
            return value
        try:
            # Parse and format the phone number
            parsed_number = phonenumbers.parse(value, settings.DEFAULT_PHONE_NUMBER_COUNTRY_CODE)
            if phonenumbers.is_valid_number(parsed_number):
                return phonenumbers.format_number(parsed_number, phonenumbers.PhoneNumberFormat.E164)
            else:
                raise serializers.ValidationError(
                    _("Invalid phone number.")
                )
        except phonenumbers.NumberParseException:
            raise serializers.ValidationError(
                _("Phone number must start with a '+' followed by the country code and the phone number.")
            )

    # noinspection PyMethodMayBeStatic
    def validate_birthday(self, value):
        """Validate birthday is at least MINIMUM_AGE_ALLOWED_FOR_USERS years before today."""
        if value is None:
            return None
        today = date.today()
        min_date = date(today.year - settings.MINIMUM_AGE_ALLOWED_FOR_USERS, today.month, today.day)
        if value >= min_date:
            raise serializers.ValidationError(
                _("The minimum age allowed for users is: ") + str(settings.MINIMUM_AGE_ALLOWED_FOR_USERS)
            )
        return value

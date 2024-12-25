
from .models import User
from datetime import date
from django.conf import settings
from django.utils.translation import gettext_lazy as _
from rest_framework import serializers
import re


class UserSerializer(serializers.ModelSerializer):
    class Meta:
        model = User
        fields = [
            "address", "birthday", "cin", "country", "current_language", "date_joined", "email",
            "first_name", "gender",
            "id", "image_url", "is_active", "is_deleted", "last_name", "phone_number",
            "username",
        ]
        read_only_fields = ["id", "date_joined"]

    # noinspection PyMethodMayBeStatic
    def validate_phone_number(self, value):
        """Validate phone number starts with +, country code, and contains only digits."""
        if value is None or value == "":
            return value
        if not re.match(r'^\+\d{10,15}$', value):
            raise serializers.ValidationError(
                _("Phone number must start with a '+' followed by the country code and the phone number.")
            )
        return value

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

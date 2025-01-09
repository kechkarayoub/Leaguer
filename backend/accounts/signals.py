from django.db.models.signals import pre_save
from django.dispatch import receiver
from .models import User
import phonenumbers


@receiver(pre_save, sender=User)
def format_phone_numbers(sender, instance, **kwargs):
    if instance.phone_number:
        try:
            parsed_number = phonenumbers.parse(instance.phone_number, "MA")  # Replace with your default country code
            instance.phone_number = phonenumbers.format_number(
                parsed_number, phonenumbers.PhoneNumberFormat.E164
            )
        except phonenumbers.NumberParseException:
            instance.phone_number = None
    if instance.phone_number_to_verify:
        try:
            parsed_number = phonenumbers.parse(instance.phone_number_to_verify, "MA")  # Replace with your default country code
            instance.phone_number_to_verify = phonenumbers.format_number(
                parsed_number, phonenumbers.PhoneNumberFormat.E164
            )
        except phonenumbers.NumberParseException:
            instance.phone_number_to_verify = None

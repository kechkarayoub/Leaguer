
from django.conf import settings
from django.db import connection
from django.utils.timezone import now
from django.utils.translation import gettext_lazy as _
import datetime
import json
import logging
import random
import requests


# Get a logger instance
logger = logging.getLogger(__name__)


def execute_native_query(query, query_name="query", is_get=True):
    """
    Execute a native query.
    :param query: (str) The query to execute.
    :param query_name: (str) The query description.
    :param is_get: (bool) True if query will get data else False.
    :return: None if is_get is False else the rows result.
    """
    with connection.cursor() as cursor:
        # Remove return lines and double spaces from query.
        query = query.replace("\n", " ").replace("    ", " ").replace("    ", " ").replace("   ", " ").replace("   ", " ").replace("  ", " ").replace("  ", " ")
        # Log the query
        logger.info(query_name)
        logger.info(query)
        # Execute the query
        cursor.execute(query)
        # if is_get query: return rows result. Else return None
        if is_get:
            rows = cursor.fetchall()
            return rows
        return None


def generate_random_code(nbr_digit=6):
    """
    Generate a nbr_digit code code.
    :param nbr_digit:
    :return: generated code
    """
    if nbr_digit <= 0:
        return ""
    min_number = 10 ** (nbr_digit - 1)
    max_number = 10 ** nbr_digit - 1
    return f"{random.randint(min_number, max_number)}"


def get_email_base_context(selected_language="fr"):
    """
    Generate common email's context dictionary.
    Args:
        selected_language (str): The current language to handle direction in email.

    Returns:
        Dict: A dictionary that contains common params used in emails.
    """
    context = {
        'company_address': settings.COMPANY_ADDRESS,
        'app_name': settings.APPLICATION_NAME,
        'current_year': now().year,
        'direction': "rtl" if selected_language == "ar" else "ltr",
        'from_email': settings.DEFAULT_FROM_EMAIL,
    }
    return context


PHONE_NUMBER_VERIFICATION_METHOD = [
    ("", _("Select")), ("apple", _("Apple")), ("facebook", _("Facebook")), ("google", _("Google")),
    ("sms", _("Sms")), ("yahoo", _("Yahoo")), ("whatsapp", _("Whatsapp")), ("x", _("X")),
]


def send_phone_message(content, receivers_numbers, as_sms=False, handle_error=False, mock_api=False):
    """
    Send content to receivers_numbers.
    :param content: (str) text content.
    :param receivers_numbers: (list) List of phone numbers receivers.
    :param as_sms: (bool) By default we sent content by whatsapp, if as_sms is true, we sent it as sms.
    :param handle_error: (bool) To handle error for testing purpose.
    :param mock_api: (bool) Flag to mock api for testing.
    :return: function execution
    """
    if as_sms:
        return send_sms(sms_content=content, receivers_numbers=receivers_numbers, mock_api=mock_api)
    return send_whatsapp(whatsapp_content=content, receivers_numbers=receivers_numbers, handle_error=handle_error, mock_api=mock_api)


def send_sms(sms_content, receivers_numbers, mock_api=False):
    """
    Send sms_content to receivers_numbers.
    :param sms_content: (str) SMS text content.
    :param receivers_numbers: (list) List of phone numbers receivers.
    :param mock_api: (bool) Flag to mock api for testing.
    :return:
    """
    if settings.ENVIRONMENT == "development":
        logger.info("sms_content: " + sms_content)
        logger.info("receivers_numbers: ")
        logger.info(receivers_numbers)
    else:
        pass


def send_whatsapp(whatsapp_content, receivers_numbers, handle_error=False, mock_api=False):
    """
    Send sms_content to receivers_numbers.
    :param whatsapp_content: (str) SMS text content.
    :param receivers_numbers: (list) List of phone numbers receivers.
    :param handle_error: (bool) To handle error for testing purpose.
    :return: response_data: (dict) A dictionary that contains nbr_verification_codes_sent and all_verification_codes_sent
    :param mock_api: (bool) Flag to mock api for testing.
    """
    if settings.ENVIRONMENT == "development":
        logger.info("whatsapp_content: " + whatsapp_content)
        logger.info("receivers_numbers: ")
        logger.info(receivers_numbers)
    else:
        pass

    response_data = {
        'nbr_verification_codes_sent': 0,
    }

    if mock_api:
        response_data = {
            'nbr_verification_codes_sent': len(receivers_numbers),
            'all_verification_codes_sent': True,
        }
        if handle_error:
            response_data = {
                'nbr_verification_codes_sent': 0,
                'all_verification_codes_sent': False,
            }
        return response_data

    url = settings.WHATSAPP_INSTANCE_URL
    for receiver_number in receivers_numbers:
        headers = {
            "accept": "application/json",
            'content-type': 'application/json',
            "authorization": f"Bearer {settings.WHATSAPP_INSTANCE_TOKEN}"
        }
        data = {"chatId": f"{receiver_number.replace('+', '')}@c.us", "message": whatsapp_content}
        if handle_error:
            data = {}
        response = requests.request("POST", url, json=data, headers=headers)
        if response.status_code == 200:
            json_content = json.loads(response.content)
            if json_content.get('status') == 'success':
                response_data['nbr_verification_codes_sent'] += 1
            else:
                logger.error(response.text)
        else:
            logger.error(response.text)
    # Checking if all receivers_numbers receive the whatsapp content
    response_data['all_verification_codes_sent'] = response_data['nbr_verification_codes_sent'] == len(receivers_numbers)
    return response_data

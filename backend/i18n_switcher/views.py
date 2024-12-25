# -*- coding: utf-8 -*-

from django.conf import settings
from django.utils.translation import gettext_lazy as _


def switch_lang_code(path, language):
    """
        :param path: the current path
        :param language: the new language
        :return: the full path with the new language if available
    """

    # Get the supported language codes
    lang_codes = [c for (c, name) in settings.LANGUAGES]

    # Validate the inputs
    if path == '':
        raise Exception(_('URL path for language switch is empty'))
    elif path[0] != '/':
        raise Exception(_('URL path for language switch does not start with "/"'))
    elif language not in lang_codes:
        raise Exception(_('%s is not a supported language code' % language))

    # Split the parts of the path
    parts = path.split('/')

    # Add or substitute the new language prefix
    if parts[1] in lang_codes:
        parts[1] = language
    else:
        parts[0] = "/" + language

    # Return the full new path
    return '/'.join(parts)

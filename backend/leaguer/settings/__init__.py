import os
from decouple import config
from .production import *


def get_secret(secret_id, backup=None):
    return config(secret_id) or backup


if get_secret("PIPLINE") == "development":
    from .local import *
    if TEST is False:
        LOGGING['handlers']['file']['level'] = 'INFO'
        LOGGING['loggers']['django']['handlers'] = ['console', 'file']
        LOGGING['loggers']['leaguer']['handlers'] = ['console', 'file']

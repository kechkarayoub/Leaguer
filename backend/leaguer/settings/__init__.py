import os
from decouple import config
from .common import *


def get_secret(secret_id, backup=None):
    return config(secret_id) or backup


if get_secret("PIPLINE") == "development":
    from .local import *
    LOGGING['handlers']['file']['level'] = 'INFO'
    LOGGING['loggers']['django']['handlers'] = ['console', 'file']
    LOGGING['loggers']['leaguer']['handlers'] = ['console', 'file']
else:
    from .production import *

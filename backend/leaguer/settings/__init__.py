"""
Django settings module initialization.
Automatically loads the appropriate settings based on the environment.
"""

import os
from decouple import config


def get_secret(secret_id, backup=None):
    """
    Get secret from environment variables with fallback.
    
    Args:
        secret_id (str): The environment variable name
        backup: Default value if environment variable is not set
        
    Returns:
        The environment variable value or backup
    """
    return config(secret_id, default=backup)


# Import base settings
from .base import *

# Load environment-specific settings
pipeline = get_secret("PIPLINE", "development")

if pipeline == "production":
    from .production import *
    
else:
    # Default to development settings
    from .local import *
    # Adjust logging for development
    if not TEST:
        LOGGING['handlers']['file']['level'] = 'INFO'
        LOGGING['loggers']['django']['handlers'] = ['console', 'file']
        LOGGING['loggers']['leaguer']['handlers'] = ['console', 'file']

"""
Django settings for leaguer project.

Generated by 'django-admin startproject' using Django 5.1.3.

For more information on this file, see
https://docs.djangoproject.com/en/5.1/topics/settings/

For the full list of settings and their values, see
https://docs.djangoproject.com/en/5.1/ref/settings/
"""
from . import get_secret
from pathlib import Path
import os

# Build paths inside the project like this: BASE_DIR / 'subdir'.
BASE_DIR = Path(__file__).resolve().parent.parent
PARENT_DIR = Path(__file__).resolve().parent.parent.parent


# Quick-start development settings - unsuitable for production
# See https://docs.djangoproject.com/en/5.1/howto/deployment/checklist/


# SECURITY WARNING: don't run with debug turned on in production!
DEBUG = False

ALLOWED_HOSTS = ['*']


# Database
# https://docs.djangoproject.com/en/5.1/ref/settings/#databases

DB_NAME = get_secret("DB_NAME")
DB_USER_NM = get_secret("DB_USER_NM")
DB_USER_PW = get_secret("DB_USER_PW")
DB_IP = get_secret("DB_IP")
DB_PORT = get_secret("DB_CONTAINER_INTERNAL_PORT")
DATABASES = {
    'default': {
        'ENGINE': 'django.db.backends.postgresql',
        'NAME': DB_NAME,
        'USER': DB_USER_NM,
        'PASSWORD': DB_USER_PW,
        'HOST': DB_IP,
        'PORT': DB_PORT,
        'OPTIONS': {
            'connect_timeout': 10,
        },
    }
}


# EMAIL
EMAIL_BACKEND = "django.core.mail.backends.smtp.EmailBackend"
EMAIL_HOST = get_secret("EMAIL_HOST")
EMAIL_PORT = get_secret("EMAIL_PORT")
EMAIL_USE_TLS = get_secret("EMAIL_USE_TLS") == "true"
EMAIL_HOST_USER = get_secret("EMAIL_HOST_USER")
EMAIL_HOST_PASSWORD = get_secret("EMAIL_HOST_PASSWORD")  # Use an App Password
DEFAULT_FROM_EMAIL = get_secret("DEFAULT_FROM_EMAIL")

# Environment
ENVIRONMENT = "production"

# Whatsapp config
WHATSAPP_INSTANCE_ID = get_secret("WHATSAPP_INSTANCE_ID")
WHATSAPP_INSTANCE_TOKEN = get_secret("WHATSAPP_INSTANCE_TOKEN")
WHATSAPP_INSTANCE_URL = get_secret("WHATSAPP_INSTANCE_URL")

# Allowed origins
CORS_ALLOW_ALL_ORIGINS = False

# Media configuration
MEDIA_ROOT = os.path.join(PARENT_DIR, 'media')

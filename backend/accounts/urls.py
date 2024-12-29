
from .views import verify_email
from django.urls import path

urlpatterns = [
    path('verify-email/', verify_email, name='verify_email'),
]


from .views import verify_email, verify_phone_number
from django.urls import path

urlpatterns = [
    # path('sign-up/', SignUpView.as_view(), name='sign-up'),
    path('verify-email/', verify_email, name='verify_email'),
    path('verify-phone-number/', verify_phone_number, name='verify_phone_number'),
]

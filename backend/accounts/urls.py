
from .views import SendVerificationEmailLinkView, SignInView, verify_email, verify_phone_number
from django.urls import path

urlpatterns = [
    path('send-verification-email-link/', SendVerificationEmailLinkView.as_view(), name='send-verification-email-link'),
    path('sign-in/', SignInView.as_view(), name='sign-in'),
    # path('sign-up/', SignUpView.as_view(), name='sign-up'),
    path('verify-email/', verify_email, name='verify_email'),
    path('verify-phone-number/', verify_phone_number, name='verify_phone_number'),
]

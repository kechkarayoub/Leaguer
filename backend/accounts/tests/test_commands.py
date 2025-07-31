from ..models import User
from django.conf import settings
from django.core.management import call_command
from django.test import TestCase
from io import StringIO


class SendEmailVerificationsLinksCommandTests(TestCase):
    def setUp(self):
        self.user = User.objects.create_user(username='testuser', email='test@example.com', password='password123')
        self.user2 = User.objects.create_user(username='testuser2', email='test2@example.com', password='password123', current_language='ar')

    def test_command_without_arguments(self):
        out = StringIO()
        call_command('send_emails_verifications_links', stdout=out)
        if settings.ENABLE_EMAIL_VERIFICATION is False:
            self.assertIn('ENABLE_EMAIL_VERIFICATION is False!!.', out.getvalue())
            return
        self.assertIn('2 verification email are sent, 0 are not.', out.getvalue())

    def test_command_without_arguments_with_all_email_verified(self):
        out = StringIO()
        self.user.is_user_email_validated = True
        self.user.save()
        self.user2.is_user_email_validated = True
        self.user2.save()
        call_command('send_emails_verifications_links', stdout=out)
        if settings.ENABLE_EMAIL_VERIFICATION is False:
            self.assertIn('ENABLE_EMAIL_VERIFICATION is False!!.', out.getvalue())
            return
        self.assertIn('There is no user with not email verified yet!', out.getvalue())

    def test_command_without_no_valid_email_argument(self):
        out = StringIO()
        call_command('send_emails_verifications_links', '--email', 'novalidemail', stdout=out)
        self.assertIn('Command not executed due to invalid email parameter: novalidemail.', out.getvalue())

    def test_command_without_no_exists_email_argument(self):
        out = StringIO()
        call_command('send_emails_verifications_links', '--email', 'noexistsmail@yopmail.com', stdout=out)
        if settings.ENABLE_EMAIL_VERIFICATION is False:
            self.assertIn('ENABLE_EMAIL_VERIFICATION is False!!.', out.getvalue())
            return
        self.assertIn('There is any user with this email: noexistsmail@yopmail.com, or it is already verified!', out.getvalue())

    def test_command_with_exists_email_argument(self):
        out = StringIO()
        call_command('send_emails_verifications_links', '--email', 'test2@example.com', stdout=out)
        if settings.ENABLE_EMAIL_VERIFICATION is False:
            self.assertIn('ENABLE_EMAIL_VERIFICATION is False!!.', out.getvalue())
            return
        self.assertIn('1 verification email are sent, 0 are not.', out.getvalue())

    def test_command_with_exists_email_but_already_verified_argument(self):
        out = StringIO()
        self.user2.is_user_email_validated = True
        self.user2.save()
        call_command('send_emails_verifications_links', '--email', 'test2@example.com', stdout=out)
        if settings.ENABLE_EMAIL_VERIFICATION is False:
            self.assertIn('ENABLE_EMAIL_VERIFICATION is False!!.', out.getvalue())
            return
        self.assertIn('There is any user with this email: test2@example.com, or it is already verified!', out.getvalue())

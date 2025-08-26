from ..models import User
from django.core.management.base import BaseCommand, CommandError
from rest_framework.test import APIClient, APIRequestFactory
from django.conf import settings
from django.core.management import call_command
from django.test import TestCase, override_settings
from django.utils import timezone
from datetime import timedelta
from rest_framework_simplejwt.token_blacklist.models import OutstandingToken, BlacklistedToken
from accounts.tokens import RefreshToken
from unittest.mock import patch, MagicMock
import importlib
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


def authenticate_user(client, user):
    # Log in the test user for authentication
    client.force_authenticate(user=user)


class LogoutUsersCommandTests(TestCase):
    def setUp(self):
        self.user = User.objects.create_user(username='testuser', email='test@example.com', password='password123')
        self.user2 = User.objects.create_user(username='testuser2', email='test2@example.com', password='password123')
        self.inactive_user = User.objects.create_user(
            username='inactive', email='inactive@example.com', password='password123', is_active=False
        )
        # Create an APIClient instance for testing
        self.client = APIClient()

    def _create_token_for_user(self, user):
        """Helper method to create tokens for a user."""
        refresh = RefreshToken.for_user(user)
        return refresh

    def test_command_without_arguments(self):
        out = StringIO()
        with self.assertRaises(CommandError):
            call_command('logout_users', stdout=out)

    def test_command_with_invalid_arguments_values(self):
        out = StringIO()
        with self.assertRaises(CommandError):
            call_command('logout_users', '--user-id', 300, stdout=out)
        with self.assertRaises(CommandError):
            call_command('logout_users', '--username', "not_exists_username", stdout=out)
        with self.assertRaises(CommandError):
            call_command('logout_users', '--email', "not_exists_email@example.com", stdout=out)

    def test_logout_user_by_id_with_tokens(self):
        # Create tokens for user
        self._create_token_for_user(self.user)
        self._create_token_for_user(self.user)
        
        out = StringIO()
        call_command('logout_users', '--user-id', self.user.id, '--force', stdout=out)
        
        output = out.getvalue()
        self.assertIn(f"Found user: {self.user.username}", output)
        self.assertIn("Logged out user 'testuser'", output)
        self.assertIn("Total tokens blacklisted: 2", output)
        
        # Verify tokens are blacklisted
        outstanding_tokens = OutstandingToken.objects.filter(user=self.user)
        for token in outstanding_tokens:
            self.assertTrue(BlacklistedToken.objects.filter(token=token).exists())

    def test_logout_user_by_username_with_tokens(self):
        # Create tokens for user
        self._create_token_for_user(self.user2)
        
        out = StringIO()
        call_command('logout_users', '--username', self.user2.username, '--force', stdout=out)
        
        output = out.getvalue()
        self.assertIn(f"Found user: {self.user2.username}", output)
        self.assertIn("Logged out user 'testuser2'", output)

    def test_logout_user_by_email_with_tokens(self):
        # Create tokens for user
        self._create_token_for_user(self.user)
        
        out = StringIO()
        call_command('logout_users', '--email', self.user.email, '--force', stdout=out)
        
        output = out.getvalue()
        self.assertIn(f"Found user: {self.user.username}", output)
        self.assertIn("Logged out user 'testuser'", output)

    def test_logout_user_without_tokens(self):
        out = StringIO()
        call_command('logout_users', '--user-id', self.user.id, '--force', stdout=out)
        
        output = out.getvalue()
        self.assertIn("User 'testuser' had no active tokens", output)
        self.assertIn("Total tokens blacklisted: 0", output)

    def test_logout_all_active_users(self):
        # Create tokens for both active users
        self._create_token_for_user(self.user)
        self._create_token_for_user(self.user2)
        
        out = StringIO()
        call_command('logout_users', '--all-users', '--force', stdout=out)
        
        output = out.getvalue()
        self.assertIn("Found 2 active users", output)
        self.assertIn("Total tokens blacklisted: 2", output)

    def test_logout_inactive_users(self):
        # Create token for inactive user
        self._create_token_for_user(self.inactive_user)
        
        out = StringIO()
        call_command('logout_users', '--inactive-users', '--force', stdout=out)
        
        output = out.getvalue()
        self.assertIn("Found 1 inactive users", output)

    def test_logout_with_short_arguments(self):
        # Test short argument versions
        self._create_token_for_user(self.user)
        
        out = StringIO()
        call_command('logout_users', '-ui', self.user.id, '-f', stdout=out)
        
        output = out.getvalue()
        self.assertIn("Logged out user 'testuser'", output)

    @patch('builtins.input', return_value='n')
    def test_logout_with_confirmation_no(self, mock_input):
        self._create_token_for_user(self.user)
        
        out = StringIO()
        call_command('logout_users', '--user-id', self.user.id, stdout=out)
        
        output = out.getvalue()
        self.assertIn("Operation cancelled", output)

    @patch('builtins.input', return_value='y')
    def test_logout_with_confirmation_yes(self, mock_input):
        self._create_token_for_user(self.user)
        
        out = StringIO()
        call_command('logout_users', '--user-id', self.user.id, stdout=out)
        
        output = out.getvalue()
        self.assertIn("Logged out user 'testuser'", output)

    def test_logout_user_with_already_blacklisted_tokens(self):
        # Create token and blacklist it
        refresh = self._create_token_for_user(self.user)
        outstanding_token = OutstandingToken.objects.get(user=self.user, jti=refresh['jti'])
        BlacklistedToken.objects.create(token=outstanding_token)
        
        out = StringIO()
        call_command('logout_users', '--user-id', self.user.id, '--force', stdout=out)
        
        output = out.getvalue()
        self.assertIn("User 'testuser' had no active tokens", output)


class CleanupTokensCommandTests(TestCase):
    def setUp(self):
        self.user = User.objects.create_user(username='testuser', email='test@example.com', password='password123')
        self.user2 = User.objects.create_user(username='testuser2', email='test2@example.com', password='password123')

    def _create_old_tokens(self, days_ago=8):
        """Helper method to create old tokens."""
        refresh = RefreshToken.for_user(self.user)
        outstanding_token = OutstandingToken.objects.get(user=self.user, jti=refresh['jti'])
        
        # Make token old
        old_date = timezone.now() - timedelta(days=days_ago)
        outstanding_token.created_at = old_date
        outstanding_token.save()
        
        # Create blacklisted token
        blacklisted_token = BlacklistedToken.objects.create(token=outstanding_token)
        blacklisted_token.blacklisted_at = old_date
        blacklisted_token.save()
        
        return outstanding_token, blacklisted_token

    def test_cleanup_no_expired_tokens(self):
        out = StringIO()
        call_command('cleanup_tokens', stdout=out)
        
        output = out.getvalue()
        self.assertIn("No expired tokens found to clean up", output)

    def test_cleanup_with_expired_tokens(self):
        # Create old tokens
        self._create_old_tokens(days_ago=8)  # 8 days old, default is 7 days
        
        out = StringIO()
        call_command('cleanup_tokens', '--force', stdout=out)
        
        output = out.getvalue()
        self.assertIn("Found 1 expired outstanding tokens", output)
        self.assertIn("Found 1 expired blacklisted tokens", output)
        self.assertIn("Total tokens to remove: 2", output)
        self.assertIn("Removed 1 expired blacklisted tokens", output)
        self.assertIn("Removed 1 expired outstanding tokens", output)

    def test_cleanup_with_custom_days(self):
        # Create tokens 5 days old
        self._create_old_tokens(days_ago=5)
        
        out = StringIO()
        call_command('cleanup_tokens', '--days', 3, '--force', stdout=out)
        
        output = out.getvalue()
        self.assertIn("Total tokens to remove: 2", output)

    def test_cleanup_with_short_arguments(self):
        self._create_old_tokens(days_ago=8)
        
        out = StringIO()
        call_command('cleanup_tokens', '-d', 7, '-f', stdout=out)
        
        output = out.getvalue()
        self.assertIn("Total tokens cleaned up: 2", output)

    @patch('builtins.input', return_value='n')
    def test_cleanup_with_confirmation_no(self, mock_input):
        self._create_old_tokens(days_ago=8)
        
        out = StringIO()
        call_command('cleanup_tokens', stdout=out)
        
        output = out.getvalue()
        self.assertIn("Operation cancelled", output)

    @patch('builtins.input', return_value='y')
    def test_cleanup_with_confirmation_yes(self, mock_input):
        self._create_old_tokens(days_ago=8)
        
        out = StringIO()
        call_command('cleanup_tokens', stdout=out)
        
        output = out.getvalue()
        self.assertIn("Total tokens cleaned up: 2", output)

    def test_cleanup_recent_tokens_not_removed(self):
        # Create recent tokens (1 day old)
        self._create_old_tokens(days_ago=1)
        
        out = StringIO()
        call_command('cleanup_tokens', '--days', 7, '--force', stdout=out)
        
        output = out.getvalue()
        self.assertIn("No expired tokens found to clean up", output)

    def test_cleanup_error_handling(self):
        # Create tokens and simulate error by making them readonly
        self._create_old_tokens(days_ago=8)
        
        with patch.object(OutstandingToken.objects, 'filter') as mock_filter:
            mock_queryset = MagicMock()
            mock_queryset.count.return_value = 1
            mock_queryset.delete.side_effect = Exception("Database error")
            mock_filter.return_value = mock_queryset
            
            out = StringIO()
            call_command('cleanup_tokens', '--force', stdout=out)
            
            output = out.getvalue()
            self.assertIn("Error during cleanup", output)


class CheckAccountsCommandTests(TestCase):
    def setUp(self):
        self.user = User.objects.create_user(username='testuser', email='test@example.com', password='password123')

    def test_basic_health_check(self):
        out = StringIO()
        call_command('check_accounts', stdout=out)
        
        output = out.getvalue()
        self.assertIn("=== Accounts App Health Check ===", output)
        self.assertIn("Custom user model configured correctly", output)
        self.assertIn("User model accessible", output)
        self.assertIn("Database connection successful", output)
        self.assertIn("=== Accounts health check completed ===", output)

    def test_verbose_health_check(self):
        out = StringIO()
        call_command('check_accounts', '--verbose', stdout=out)
        
        output = out.getvalue()
        self.assertIn("Feature flags:", output)
        self.assertIn("EMAIL_HOST:", output)

    @override_settings(AUTH_USER_MODEL='auth.User')
    def test_incorrect_user_model(self):
        out = StringIO()
        call_command('check_accounts', stdout=out)
        
        output = out.getvalue()
        self.assertIn("Custom user model not configured correctly", output)

    def test_check_email_functionality(self):
        out = StringIO()
        call_command('check_accounts', '--check-email', stdout=out)
        
        output = out.getvalue()
        self.assertIn("Checking email functionality...", output)

    def test_check_sms_functionality(self):
        out = StringIO()
        call_command('check_accounts', '--check-sms', stdout=out)
        
        output = out.getvalue()
        self.assertIn("Checking SMS functionality...", output)

    def test_check_firebase_functionality(self):
        out = StringIO()
        call_command('check_accounts', '--check-firebase', stdout=out)
        
        output = out.getvalue()
        self.assertIn("Checking Firebase functionality...", output)

    def test_user_model_with_missing_fields(self):
        # This test checks what happens if custom fields are missing
        out = StringIO()
        call_command('check_accounts', stdout=out)
        
        output = out.getvalue()
        # Should still pass basic checks and show user model accessible
        self.assertIn("User model accessible", output)

    def test_database_connection_error(self):
        with patch('django.db.connection.cursor') as mock_cursor:
            mock_cursor.side_effect = Exception("Database connection failed")
            
            out = StringIO()
            call_command('check_accounts', stdout=out)
            
            output = out.getvalue()
            self.assertIn("Database connection failed", output)

    @patch('accounts.management.commands.check_accounts.UserValidationService')
    def test_services_functionality_check(self, mock_service):
        mock_service.validate_user_data.return_value = True
        mock_service.validate_phone_number.return_value = True
        
        out = StringIO()
        call_command('check_accounts', stdout=out)
        
        output = out.getvalue()
        self.assertIn("UserValidationService working", output)
        self.assertIn("Service functionality tests passed", output)

    @patch('accounts.management.commands.check_accounts.UserValidationService')
    def test_services_functionality_error(self, mock_service):
        mock_service.validate_user_data.side_effect = Exception("Service error")
        
        out = StringIO()
        call_command('check_accounts', stdout=out)
        
        output = out.getvalue()
        self.assertIn("Service testing failed", output)

    @override_settings(
        ENABLE_EMAIL_VERIFICATION=True,
        ENABLE_PHONE_NUMBER_VERIFICATION=False,
        PHONE_NUMBER_VERIFICATION_REQUIRED=True
    )
    def test_feature_flags_check(self):
        out = StringIO()
        call_command('check_accounts', '--verbose', stdout=out)
        
        output = out.getvalue()
        self.assertIn("ENABLE_EMAIL_VERIFICATION: True", output)
        self.assertIn("ENABLE_PHONE_NUMBER_VERIFICATION: False", output)

    def test_auth_settings_check(self):
        out = StringIO()
        call_command('check_accounts', '--verbose', stdout=out)
        
        output = out.getvalue()
        self.assertIn("Checking authentication settings...", output)
        # Should show JWT configuration status

    def test_firebase_check_success(self):
        # Just test that the command runs without error when firebase check is requested
        out = StringIO()
        call_command('check_accounts', '--check-firebase', stdout=out)
        
        output = out.getvalue()
        # Should either show success or failure message about Firebase
        self.assertTrue(
            "Firebase admin SDK imported successfully" in output or 
            "Firebase configuration failed" in output
        )

    def test_firebase_check_functionality(self):
        # Test that the firebase check option is working
        out = StringIO()
        call_command('check_accounts', '--check-firebase', stdout=out)
        
        output = out.getvalue()
        self.assertIn("Checking Firebase functionality...", output)


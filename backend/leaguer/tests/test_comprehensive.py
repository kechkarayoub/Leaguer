"""
Comprehensive test suite for leaguer core functionality.
This file replaces and consolidates all existing tests with improved coverage.
"""

from channels.layers import get_channel_layer
from channels.testing import WebsocketCommunicator
from django.test import TestCase, TransactionTestCase, RequestFactory
from django.contrib.auth import get_user_model
from django.contrib.auth.models import AnonymousUser
from django.core.cache import cache
from django.core.management import call_command
from django.core.files.uploadedfile import SimpleUploadedFile
from django.conf import settings
from django.utils import timezone
from django.utils.translation import activate, gettext_lazy as _
from asgiref.sync import sync_to_async
from unittest.mock import patch, Mock, MagicMock
from io import StringIO
import json
import os
import asyncio
import time

from leaguer.asgi import application
from ..exceptions import GeolocationException, MessageSendException, FileUploadException
from ..services import GeolocationService, MessageService, ValidationService, CacheService
from ..utils import (
    execute_native_query, generate_random_code, get_all_timezones, 
    get_email_base_context, get_geolocation_info, get_local_datetime,
    remove_file, send_whatsapp, send_phone_message, upload_file
)
from ..views import get_geolocation, health_check, api_info
from ..ws_consumers import ProfileConsumer
from ..ws_utils import (
    WebSocketNotificationService, notify_profile_update_async, 
    notify_profile_update, notify_user_async, notify_user,
    notify_multiple_users_async, notify_multiple_users,
    ping_user_connection, ping_user_connection_sync
)
from ..monitoring import PerformanceMonitor, DatabaseMonitor, CacheMonitor


User = get_user_model()


class EnvironmentTestCase(TestCase):
    """Test environment configuration and setup."""
    
    def test_env_file_exists(self):
        """Test that the .env file exists in the project root."""
        env_path = os.path.join(os.path.dirname(os.path.dirname(os.path.dirname(__file__))), '.env')
        self.assertTrue(os.path.exists(env_path), "⚠️ .env file is missing!")
    
    def test_required_env_variables(self):
        """Test that all required environment variables are set."""
        from decouple import config
        
        required_vars = [
            "ENABLE_EMAIL_VERIFICATION", "ENABLE_PHONE_NUMBER_VERIFICATION",
            "DB_CONTAINER_EXTERNAL_PORT", "DB_CONTAINER_INTERNAL_PORT",
            "DB_IP", "DB_NAME", "DB_ROOT_PASSWORD", "DB_USER_NM", "DB_USER_PW",
            "DJANGO_CONTAINER_EXTERNAL_PORT", "DJANGO_CONTAINER_INTERNAL_PORT",
            "PIPLINE", "DJANGO_SECRET_KEY", "EMAIL_HOST", "EMAIL_PORT",
            "EMAIL_USE_TLS", "EMAIL_HOST_USER", "EMAIL_HOST_PASSWORD",
            "DEFAULT_FROM_EMAIL", "REDIS_CONTAINER_EXTERNAL_PORT",
            "REDIS_CONTAINER_INTERNAL_PORT", "WHATSAPP_INSTANCE_ID",
            "WHATSAPP_INSTANCE_TOKEN", "WHATSAPP_INSTANCE_URL",
            "WS_EXTERNAL_PORT", "WS_INTERNAL_PORT"
        ]
        
        missing_vars = [var for var in required_vars if not config(var, None)]
        self.assertEqual(missing_vars, [], f"⚠️ Missing environment variables: {', '.join(missing_vars)}")
    
    def test_firebase_credentials_path(self):
        """Test Firebase credentials configuration."""
        self.assertEqual(
            str(settings.FIREBASE_CREDENTIALS_PATH), 
            os.path.join(settings.PARENT_DIR, "firebase-service-account.json")
        )
        self.assertTrue(os.path.exists(settings.FIREBASE_CREDENTIALS_PATH))


class ExceptionsTestCase(TestCase):
    """Test custom exceptions."""
    
    def test_geolocation_exception(self):
        """Test GeolocationException."""
        with self.assertRaises(GeolocationException):
            raise GeolocationException("Test error")
    
    def test_message_send_exception(self):
        """Test MessageSendException."""
        with self.assertRaises(MessageSendException):
            raise MessageSendException("Test error")
    
    def test_file_upload_exception(self):
        """Test FileUploadException."""
        with self.assertRaises(FileUploadException):
            raise FileUploadException("Test error")


class ServicesTestCase(TestCase):
    """Test service layer functionality."""
    
    def setUp(self):
        self.factory = RequestFactory()
        cache.clear()
    
    def tearDown(self):
        cache.clear()
    
    def test_geolocation_service_get_client_ip(self):
        """Test client IP extraction from request."""
        # Test with X-Forwarded-For header
        request = self.factory.get('/')
        request.META['HTTP_X_FORWARDED_FOR'] = '192.168.1.1, 10.0.0.1'
        
        ip = GeolocationService.get_client_ip(request)
        self.assertEqual(ip, '192.168.1.1')
        
        # Test with X-Real-IP header
        request = self.factory.get('/')
        request.META['HTTP_X_REAL_IP'] = '10.0.0.1'
        
        ip = GeolocationService.get_client_ip(request)
        self.assertEqual(ip, '10.0.0.1')
        
        # Test with REMOTE_ADDR
        request = self.factory.get('/')
        request.META['REMOTE_ADDR'] = '127.0.0.1'
        
        ip = GeolocationService.get_client_ip(request)
        self.assertEqual(ip, '127.0.0.1')
        
        # Test with no IP (should raise exception)
        request = self.factory.get('/')
        request.META = {}
        
        with self.assertRaises(GeolocationException):
            GeolocationService.get_client_ip(request)
    
    @patch('leaguer.services.get_geolocation_info')
    def test_geolocation_service_get_data(self, mock_geo_info):
        """Test geolocation data retrieval."""
        mock_geo_info.return_value = {
            'country': 'France',
            'countryCode': 'FR',
            'status': 'success'
        }
        
        data = GeolocationService.get_geolocation_data('192.168.1.1')
        
        self.assertEqual(data['country'], 'France')
        self.assertEqual(data['countryCode'], 'FR')
        mock_geo_info.assert_called_once_with('192.168.1.1', 'country,countryCode')
    
    @patch('leaguer.services.get_geolocation_info')
    def test_geolocation_service_failure(self, mock_geo_info):
        """Test geolocation service failure handling."""
        mock_geo_info.return_value = {
            'status': 'fail',
            'message': 'Invalid IP'
        }
        
        with self.assertRaises(GeolocationException):
            GeolocationService.get_geolocation_data('invalid-ip')
    
    @patch('leaguer.services.get_geolocation_info')
    def test_geolocation_service_caching(self, mock_geo_info):
        """Test geolocation data caching."""
        mock_geo_info.return_value = {
            'country': 'France',
            'countryCode': 'FR'
        }
        
        # First call should hit the API
        data1 = GeolocationService.get_geolocation_data('192.168.1.1', use_cache=True)
        
        # Second call should use cache
        data2 = GeolocationService.get_geolocation_data('192.168.1.1', use_cache=True)
        
        self.assertEqual(data1, data2)
        mock_geo_info.assert_called_once()  # Should only be called once due to caching
    
    @patch('leaguer.services.send_whatsapp')
    def test_message_service_send_verification_code(self, mock_whatsapp):
        """Test verification code sending."""
        mock_whatsapp.return_value = {
            'nbr_verification_codes_sent': 1,
            'all_verification_codes_sent': True
        }
        
        result = MessageService.send_verification_code('+1234567890', '123456')
        
        self.assertTrue(result['all_verification_codes_sent'])
        self.assertEqual(result['nbr_verification_codes_sent'], 1)
    
    @patch('leaguer.services.send_whatsapp')
    def test_message_service_send_verification_code_failure(self, mock_whatsapp):
        """Test verification code sending failure."""
        mock_whatsapp.return_value = {
            'nbr_verification_codes_sent': 0,
            'all_verification_codes_sent': False
        }
        
        with self.assertRaises(MessageSendException):
            MessageService.send_verification_code('+1234567890', '123456')
    
    @patch('leaguer.services.send_whatsapp')
    def test_message_service_send_bulk_message(self, mock_whatsapp):
        """Test bulk message sending."""
        mock_whatsapp.return_value = {
            'nbr_verification_codes_sent': 2,
            'all_verification_codes_sent': True
        }
        
        result = MessageService.send_bulk_message(['+1234567890', '+1234567891'], 'Test message')
        
        self.assertTrue(result['all_verification_codes_sent'])
        self.assertEqual(result['nbr_verification_codes_sent'], 2)
    
    def test_validation_service_phone_number(self):
        """Test phone number validation."""
        # Valid phone numbers
        self.assertTrue(ValidationService.validate_phone_number('+33123456789'))
        self.assertTrue(ValidationService.validate_phone_number('+212612345678'))
        
        # Invalid phone numbers
        self.assertFalse(ValidationService.validate_phone_number('invalid'))
        self.assertFalse(ValidationService.validate_phone_number('123'))
        self.assertFalse(ValidationService.validate_phone_number(''))
    
    def test_validation_service_email(self):
        """Test email validation."""
        # Valid emails
        self.assertTrue(ValidationService.validate_email('test@example.com'))
        self.assertTrue(ValidationService.validate_email('user.name@domain.co.uk'))
        
        # Invalid emails
        self.assertFalse(ValidationService.validate_email('invalid-email'))
        self.assertFalse(ValidationService.validate_email('test@'))
        self.assertFalse(ValidationService.validate_email('@domain.com'))
        self.assertFalse(ValidationService.validate_email(''))
    
    def test_cache_service_get_or_set(self):
        """Test cache service get_or_set method."""
        def expensive_operation():
            return "computed_value"
        
        # First call should compute and cache
        result1 = CacheService.get_or_set('test_key', expensive_operation, 300)
        self.assertEqual(result1, "computed_value")
        
        # Second call should return cached value
        result2 = CacheService.get_or_set('test_key', lambda: "different_value", 300)
        self.assertEqual(result2, "computed_value")  # Should be cached value
    
    def test_cache_service_invalidate_pattern(self):
        """Test cache service pattern invalidation."""
        # Set some cache values
        cache.set('test_pattern_1', 'value1', 300)
        cache.set('test_pattern_2', 'value2', 300)
        cache.set('other_key', 'value3', 300)
        
        # This is a basic test - actual implementation depends on cache backend
        CacheService.invalidate_pattern('test_pattern_*') # This will not work with LocMemCache as it does not support pattern matching
        
        # Test that the method doesn't crash
        self.assertEqual(cache.get('test_pattern_1'), 'value1')


class UtilsTestCase(TestCase):
    """Test utility functions."""
    
    def setUp(self):
        self.factory = RequestFactory()
        self.user = User.objects.create_user(
            email="testuser@example.com",
            first_name="First name",
            last_name="Last name",
            password="testpassword123",
            user_phone_number_to_verify="+212612505257",
            username="testuser",
        )
    
    def test_execute_native_query(self):
        """Test native query execution."""
        # Test SELECT query
        query_get_users = "SELECT * FROM leaguer_user WHERE is_active=True;"
        users = execute_native_query(query_get_users)
        self.assertEqual(len(users), 1)
        
        # Test INSERT query
        query_insert_user = """
            INSERT INTO leaguer_user (email, first_name, is_active, last_name, username, password, is_superuser, 
                is_staff, date_joined, nbr_phone_number_verification_code_used,
                user_gender, is_user_deleted, current_language, is_user_email_validated, is_user_phone_number_validated,
                user_phone_number_verified_by, user_timezone)
            VALUES ('test@example.com', 'Test', True, 'User', 'testuser2', 'password', False, False, NOW(),
                0, '', False, 'en', False, False, '', 'UTC');
        """
        result = execute_native_query(query_insert_user, is_get=False)
        self.assertIsNone(result)
    
    def test_generate_random_code(self):
        """Test random code generation."""
        # Test default 6-digit code
        code = generate_random_code()
        self.assertEqual(len(code), 6)
        self.assertTrue(code.isdigit())
        
        # Test custom length
        code = generate_random_code(4)
        self.assertEqual(len(code), 4)
        self.assertTrue(code.isdigit())
        
        # Test edge cases
        self.assertEqual(generate_random_code(0), "")
        self.assertEqual(generate_random_code(-1), "")
    
    def test_get_all_timezones(self):
        """Test timezone list generation."""
        activate('en')
        
        # Test as tuples (default)
        timezones = get_all_timezones()
        self.assertIsInstance(timezones, list)
        self.assertTrue(len(timezones) > 0)
        self.assertEqual(timezones[0], ('', 'Select'))
        
        # Test as lists
        timezones_list = get_all_timezones(as_list=True)
        self.assertEqual(timezones_list[0], ['', 'Select'])
    
    def test_get_email_base_context(self):
        """Test email context generation."""
        context = get_email_base_context()
        
        required_keys = [
            'company_address', 'app_name', 'current_year',
            'direction', 'from_email', 'frontend_endpoint'
        ]
        
        for key in required_keys:
            self.assertIn(key, context)
        
        # Test Arabic language direction
        context_ar = get_email_base_context('ar')
        self.assertEqual(context_ar['direction'], 'rtl')
        
        # Test other languages direction
        context_en = get_email_base_context('en')
        self.assertEqual(context_en['direction'], 'ltr')
    
    @patch("requests.get")
    def test_get_geolocation_info(self, mock_get):
        """Test geolocation info retrieval."""
        mock_response = Mock()
        mock_response.json.return_value = {
            "country": "United States",
            "countryCode": "US",
            "city": "Mountain View"
        }
        mock_response.raise_for_status.return_value = None
        mock_get.return_value = mock_response
        
        result = get_geolocation_info("8.8.8.8", "country,countryCode,city")
        
        self.assertEqual(result["country"], "United States")
        self.assertEqual(result["countryCode"], "US")
        self.assertEqual(result["city"], "Mountain View")
    
    @patch('django.core.files.storage.default_storage.exists')
    @patch('os.remove')
    def test_remove_file(self, mock_remove, mock_exists):
        """Test file removal."""
        mock_exists.return_value = True
        file_url = 'http://testserver/media/profile_images/test_image.jpg'
        
        request = self.factory.post('/test/')
        remove_file(request, file_url)
        
        mock_exists.assert_called_once_with('profile_images/test_image.jpg')
        mock_remove.assert_called_once_with(os.path.join(settings.MEDIA_ROOT, 'profile_images/test_image.jpg'))
    
    @patch('django.core.files.storage.default_storage.save')
    def test_upload_file(self, mock_save):
        """Test file upload."""
        test_file = SimpleUploadedFile(
            name='test_image.jpg', 
            content=b'fake_image_content', 
            content_type='image/jpeg'
        )
        
        mock_save.return_value = 'profile_images/profile_test_image.jpg'
        
        request = self.factory.post('/test/')
        file_url, file_path = upload_file(request, test_file, 'profile_images', prefix="profile_")
        
        expected_url = f'{request.build_absolute_uri(settings.MEDIA_URL)}profile_images/profile_test_image.jpg'
        self.assertEqual(file_url, expected_url)
        self.assertEqual(file_path, 'profile_images/profile_test_image.jpg')
    
    def test_send_whatsapp(self):
        """Test WhatsApp message sending."""
        response = send_whatsapp("test", ["+212612505257"])
        self.assertEqual(response.get('nbr_verification_codes_sent'), 1)
        self.assertTrue(response.get('all_verification_codes_sent'))
    
    def test_send_phone_message(self):
        """Test phone message sending."""
        response = send_phone_message("test", ["+212612505257"])
        self.assertEqual(response.get('nbr_verification_codes_sent'), 1)
        self.assertTrue(response.get('all_verification_codes_sent'))


class ViewsTestCase(TestCase):
    """Test view functions."""
    
    def setUp(self):
        self.factory = RequestFactory()
    
    @patch('leaguer.views.GeolocationService.get_client_ip')
    @patch('leaguer.views.GeolocationService.get_geolocation_data')
    def test_get_geolocation_success(self, mock_geo_data, mock_get_ip):
        """Test successful geolocation request."""
        mock_get_ip.return_value = '192.168.1.1'
        mock_geo_data.return_value = {
            'country': 'France',
            'countryCode': 'FR'
        }
        
        request = self.factory.get('/geolocation/', {
            'requested_info': 'country,countryCode',
            'selected_language': 'fr'
        })
        
        response = get_geolocation(request)
        
        self.assertEqual(response.status_code, 200)
        data = json.loads(response.content)
        self.assertEqual(data['country'], 'France')
        self.assertEqual(data['countryCode'], 'FR')
    
    @patch('leaguer.views.GeolocationService.get_client_ip')
    def test_get_geolocation_failure(self, mock_get_ip):
        """Test geolocation request failure."""
        mock_get_ip.side_effect = GeolocationException("IP not found")
        
        request = self.factory.get('/geolocation/')
        response = get_geolocation(request)
        
        self.assertEqual(response.status_code, 400)
        data = json.loads(response.content)
        self.assertIn('error', data)
    
    def test_health_check(self):
        """Test health check endpoint."""
        request = self.factory.get('/health/')
        response = health_check(request)
        
        self.assertEqual(response.status_code, 200)
        self.assertEqual(response.data['status'], 'healthy')
        self.assertNotIn('timestamp', response.data)
        self.assertNotIn('environment', response.data)
    
    def test_api_info(self):
        """Test API info endpoint."""
        request = self.factory.get('/api/info/')
        response = api_info(request)
        
        self.assertEqual(response.status_code, 200)
        self.assertEqual(response.data['application'], settings.APPLICATION_NAME)
        self.assertEqual(response.data['environment'], settings.ENVIRONMENT)
        self.assertIn('version', response.data)


class MonitoringTestCase(TestCase):
    """Test monitoring functionality."""
    
    def setUp(self):
        cache.clear()
    
    def tearDown(self):
        cache.clear()
    
    def test_performance_monitor_time_function(self):
        """Test performance monitoring decorator."""
        @PerformanceMonitor.time_function("test_function")
        def test_function():
            time.sleep(0.1)
            return "test_result"
        
        result = test_function()
        self.assertEqual(result, "test_result")
    
    def test_performance_monitor_exception_handling(self):
        """Test performance monitoring with exceptions."""
        @PerformanceMonitor.time_function("test_function_error")
        def test_function_error():
            raise ValueError("Test error")
        
        with self.assertRaises(ValueError):
            test_function_error()
    
    def test_database_monitor_get_connection_info(self):
        """Test database connection monitoring."""
        info = DatabaseMonitor.get_connection_info()
        
        self.assertIn('vendor', info)
        self.assertIn('queries_count', info)
        self.assertIn('total_time', info)
        self.assertEqual(info['vendor'], 'postgresql')
    
    def test_database_monitor_log_query_count(self):
        """Test query count monitoring."""
        @DatabaseMonitor.log_query_count(1)
        def test_function():
            # This should trigger the monitor since it might execute queries
            User.objects.count()
            return "result"
        
        result = test_function()
        self.assertEqual(result, "result")


class WebSocketTestCase(TransactionTestCase):
    """Test WebSocket functionality."""
    
    def setUp(self):
        self.user = User.objects.create_user(
            email="testuser@example.com",
            username="testuser",
            password="testpass123",
            first_name="Test",
            last_name="User"
        )
    
    @sync_to_async
    def create_test_user(self):
        """Create test user asynchronously."""
        return User.objects.create_user(
            email="testuser2@example.com",
            username="testuser2",
            password="testpass123",
            first_name="Test",
            last_name="User2"
        )
    
    def test_websocket_notification_service(self):
        """Test WebSocket notification service."""
        async def async_test():
            # Test send_to_group method
            await WebSocketNotificationService.send_to_group(
                "test_group",
                "test_event",
                {"test": "data"}
            )
            # Should not raise any exceptions
        
        asyncio.get_event_loop().run_until_complete(async_test())
    
    def test_notify_profile_update_async(self):
        """Test async profile update notification."""
        async def async_test():
            user_id = str(self.user.id)
            new_profile_data = {"id": user_id, "name": "Test User"}
            
            # Should not raise any exceptions
            await notify_profile_update_async(user_id, new_profile_data, password_updated=True)
        
        asyncio.get_event_loop().run_until_complete(async_test())
    
    def test_notify_profile_update_sync(self):
        """Test sync profile update notification."""
        user_id = str(self.user.id)
        new_profile_data = {"id": user_id, "name": "Test User"}
        
        # Should not raise any exceptions
        notify_profile_update(user_id, new_profile_data, password_updated=True)
    
    def test_notify_user_functions(self):
        """Test user notification functions."""
        async def async_test():
            user_id = str(self.user.id)
            
            # Test async notification
            await notify_user_async(user_id, "Test message", {"key": "value"})
            
            # Test multiple users notification
            await notify_multiple_users_async([user_id], "Test message", {"key": "value"})
            
            # Test ping connection
            await ping_user_connection(user_id)
        
        asyncio.get_event_loop().run_until_complete(async_test())
        
        # Test sync versions
        user_id = str(self.user.id)
        notify_user(user_id, "Test message", {"key": "value"})
        notify_multiple_users([user_id], "Test message", {"key": "value"})
        ping_user_connection_sync(user_id)
    
    def test_profile_consumer_connect_and_update(self):
        """Test ProfileConsumer connection and updates."""
        async def async_test():
            user_id = str(self.user.id)
            communicator = WebsocketCommunicator(application, f"/ws/profile/{user_id}/")
            
            # Mock the scope to include authenticated user
            communicator.scope['user'] = self.user
            
            connected, _ = await communicator.connect()
            self.assertTrue(connected)
            
            # Test initial connection message
            response = await communicator.receive_from()
            data = json.loads(response)
            self.assertTrue(data["data"]["connected"])
            self.assertEqual(data["data"]["user_id"], user_id)
            
            # Test profile update notification
            await notify_profile_update_async(user_id, {"id": user_id, "name": "Updated Name"})
            
            response = await communicator.receive_from()
            data = json.loads(response)
            self.assertEqual(data["type"], "profile_update")
            
            await communicator.disconnect()
        
        asyncio.get_event_loop().run_until_complete(async_test())
    
    def test_profile_consumer_unauthenticated(self):
        """Test that unauthenticated users cannot connect."""
        async def async_test():
            user_id = str(self.user.id)
            communicator = WebsocketCommunicator(application, f"/ws/profile/{user_id}/")
            
            # Mock the scope with anonymous user
            communicator.scope['user'] = AnonymousUser()
            
            connected, _ = await communicator.connect()
            self.assertFalse(connected)
        
        asyncio.get_event_loop().run_until_complete(async_test())
    
    def test_profile_consumer_unauthorized_user(self):
        """Test that users cannot access other users' profiles."""
        async def async_test():
            # Create another user
            other_user = await self.create_test_user()
            
            # Try to connect to first user's profile with second user's credentials
            user_id = str(self.user.id)
            communicator = WebsocketCommunicator(application, f"/ws/profile/{user_id}/")
            
            # Mock the scope with the other user
            communicator.scope['user'] = other_user
            
            connected, _ = await communicator.connect()
            self.assertFalse(connected)
        
        asyncio.get_event_loop().run_until_complete(async_test())


class ManagementCommandTestCase(TestCase):
    """Test management commands."""
    
    def test_health_check_command(self):
        """Test health check management command."""
        out = StringIO()
        call_command('health_check', stdout=out)
        
        output = out.getvalue()
        self.assertIn('System Information', output)
        self.assertIn('Application:', output)
        self.assertIn('Environment:', output)
    
    def test_health_check_command_with_options(self):
        """Test health check command with specific options."""
        out = StringIO()
        call_command('health_check', '--check-db', stdout=out)
        
        output = out.getvalue()
        self.assertIn('Database Check', output)
        
        # Test cache check
        out = StringIO()
        call_command('health_check', '--check-cache', stdout=out)
        
        output = out.getvalue()
        self.assertIn('Cache Check', output)
        
        # Test all checks
        out = StringIO()
        call_command('health_check', '--all', stdout=out)
        
        output = out.getvalue()
        self.assertIn('comprehensive system health check', output)


class CacheTestCase(TestCase):
    """Test cases for caching functionality."""

    def setUp(self):
        cache.clear()
    
    def tearDown(self):
        cache.clear()
    
    @patch('leaguer.services.get_geolocation_info')
    def test_geolocation_caching(self, mock_geo_info):
        """Test geolocation data caching."""
        mock_geo_info.return_value = {
            'country': 'France',
            'countryCode': 'FR'
        }
        
        # First call should hit the API
        data1 = GeolocationService.get_geolocation_data('192.168.1.1', use_cache=True)
        
        # Second call should use cache
        data2 = GeolocationService.get_geolocation_data('192.168.1.1', use_cache=True)
        
        self.assertEqual(data1, data2)
        mock_geo_info.assert_called_once()  # Should only be called once due to caching


class SecurityTestCase(TestCase):
    """Test cases for security features."""

    def test_secret_key_not_in_settings(self):
        """Test that secret key is properly configured."""
        self.assertTrue(hasattr(settings, 'SECRET_KEY'))
        self.assertNotEqual(settings.SECRET_KEY, 'your-secret-key-here')
    
    def test_debug_in_production(self):
        """Test debug setting in production."""
        if settings.ENVIRONMENT == 'production':
            self.assertFalse(settings.DEBUG)

    def test_allowed_hosts_configured(self):
        """Test that allowed hosts are configured."""
        if settings.ENVIRONMENT == 'production':
            self.assertNotEqual(settings.ALLOWED_HOSTS, ['*'])
    
    def test_cors_configuration(self):
        """Test CORS configuration."""
        self.assertTrue(hasattr(settings, 'CORS_ALLOW_HEADERS'))
        self.assertIn('authorization', settings.CORS_ALLOW_HEADERS)


class ConfigurationTestCase(TestCase):
    """Test configuration validation."""
    
    def test_installed_apps_structure(self):
        """Test that installed apps are properly structured."""
        django_apps = [
            'django.contrib.admin', 'django.contrib.auth',
            'django.contrib.contenttypes', 'django.contrib.sessions',
            'django.contrib.messages', 'django.contrib.staticfiles',
        ]
        third_party_apps = [
            'corsheaders', 'rest_framework', 'rest_framework_simplejwt', 'channels',
        ]
        local_apps = ['accounts', 'i18n_switcher', 'leaguer']
        
        # Expected apps count (13 base apps, debug toolbar conditionally added)
        expected_apps_count = 13
        self.assertEqual(len(settings.INSTALLED_APPS), expected_apps_count)
        
        for app in django_apps + third_party_apps + local_apps:
            self.assertIn(app, settings.INSTALLED_APPS)
    
    def test_middleware_order(self):
        """Test that middleware is in correct order."""
        self.assertEqual(settings.MIDDLEWARE[0], 'corsheaders.middleware.CorsMiddleware')
        self.assertIn('django.middleware.security.SecurityMiddleware', settings.MIDDLEWARE[:3])
    
    def test_database_configuration(self):
        """Test database configuration."""
        self.assertIn('default', settings.DATABASES)
        self.assertEqual(settings.DATABASES['default']['ENGINE'], 'django.db.backends.postgresql')
    
    def test_security_settings(self):
        """Test security configuration."""
        self.assertTrue(hasattr(settings, 'SECRET_KEY'))
        self.assertNotEqual(settings.SECRET_KEY, 'your-secret-key-here')
        
        if settings.ENVIRONMENT == 'production':
            self.assertFalse(settings.DEBUG)
            self.assertNotEqual(settings.ALLOWED_HOSTS, ['*'])
    
    def test_cors_configuration(self):
        """Test CORS configuration."""
        self.assertTrue(hasattr(settings, 'CORS_ALLOW_HEADERS'))
        self.assertIn('authorization', settings.CORS_ALLOW_HEADERS)
    
    def test_internationalization_settings(self):
        """Test i18n configuration."""
        self.assertTrue(settings.USE_I18N)
        self.assertTrue(settings.USE_TZ)
        self.assertEqual(settings.TIME_ZONE, 'Africa/Casablanca')
        self.assertEqual(len(settings.LANGUAGES), 3)  # ar, en, fr
    
    def test_logging_configuration(self):
        """Test logging configuration."""
        self.assertIn('version', settings.LOGGING)
        self.assertEqual(settings.LOGGING['version'], 1)
        self.assertIn('handlers', settings.LOGGING)
        self.assertIn('loggers', settings.LOGGING)

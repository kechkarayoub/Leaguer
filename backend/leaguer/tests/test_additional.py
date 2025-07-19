"""
Additional test cases for uncovered functionality.
"""

from django.test import TestCase, RequestFactory
from django.conf import settings
from django.contrib.auth import get_user_model
from django.core.cache import cache
from django.utils import timezone
from unittest.mock import patch, Mock
import json
import asyncio
from datetime import datetime, timedelta

from ..services import CacheService
from ..monitoring import PerformanceMonitor, DatabaseMonitor, CacheMonitor
from ..ws_utils import WebSocketNotificationService


User = get_user_model()


class CacheServiceTestCase(TestCase):
    """Test cache service functionality."""
    
    def setUp(self):
        cache.clear()
    
    def tearDown(self):
        cache.clear()
    
    def test_cache_service_get_or_set_with_callable(self):
        """Test cache service with callable function."""
        call_count = 0
        
        def expensive_operation():
            nonlocal call_count
            call_count += 1
            return f"result_{call_count}"
        
        # First call should execute the function
        result1 = CacheService.get_or_set('test_key', expensive_operation, 300)
        self.assertEqual(result1, "result_1")
        self.assertEqual(call_count, 1)
        
        # Second call should return cached value
        result2 = CacheService.get_or_set('test_key', expensive_operation, 300)
        self.assertEqual(result2, "result_1")  # Should be cached
        self.assertEqual(call_count, 1)  # Function should not be called again
    
    def test_cache_service_get_or_set_with_none_result(self):
        """Test cache service when callable returns None."""
        def return_none():
            return None
        
        result = CacheService.get_or_set('test_key', return_none, 300)
        self.assertIsNone(result)
        
        # Should cache Value
        result2 = CacheService.get_or_set('test_key', lambda: "different", 300)
        self.assertEqual(result2, "different")
        # Should return cached Value
        result2 = CacheService.get_or_set('test_key', return_none, 300)
        self.assertEqual(result2, "different")

    def test_cache_service_invalidate_pattern_with_error(self):
        """Test cache service pattern invalidation with error handling."""
        # This tests the error handling in invalidate_pattern
        with patch('leaguer.services.cache.delete_many') as mock_delete:
            mock_delete.side_effect = Exception("Cache error")
            
            # Should not raise an exception
            CacheService.invalidate_pattern('test_*')
            mock_delete.assert_not_called() # cache.keys(pattern) will raise error in LocMemCache used in local


class PerformanceMonitoringTestCase(TestCase):
    """Test performance monitoring functionality."""
    
    def setUp(self):
        cache.clear()
    
    def tearDown(self):
        cache.clear()
    
    def test_performance_monitor_with_custom_name(self):
        """Test performance monitor with custom function name."""
        @PerformanceMonitor.time_function("custom_function_name")
        def test_function():
            return "success"
        
        result = test_function()
        self.assertEqual(result, "success")
        
        # Check if metric was stored (if performance monitoring is enabled)
        if hasattr(settings, 'PERFORMANCE_MONITORING') and settings.PERFORMANCE_MONITORING:
            metrics = PerformanceMonitor.get_performance_metrics("custom_function_name")
            if metrics:  # Only check if metrics were stored
                self.assertIn('execution_time', metrics)
                self.assertIn('success', metrics)
                self.assertTrue(metrics['success'])
    
    def test_performance_monitor_with_exception(self):
        """Test performance monitor exception handling."""
        @PerformanceMonitor.time_function("error_function")
        def error_function():
            raise ValueError("Test error")
        
        with self.assertRaises(ValueError):
            error_function()
        
        # Check if error metric was stored
        if hasattr(settings, 'PERFORMANCE_MONITORING') and settings.PERFORMANCE_MONITORING:
            metrics = PerformanceMonitor.get_performance_metrics("error_function")
            if metrics:
                self.assertIn('execution_time', metrics)
                self.assertIn('success', metrics)
                self.assertFalse(metrics['success'])
                self.assertIn('error', metrics)
    
    def test_performance_monitor_get_metrics(self):
        """Test getting performance metrics."""
        # Test getting metrics for non-existent function
        metrics = PerformanceMonitor.get_performance_metrics("non_existent")
        self.assertIsNone(metrics)
        
        # Test getting all metrics
        all_metrics = PerformanceMonitor.get_performance_metrics()
        self.assertIsInstance(all_metrics, dict)
    
    def test_database_monitor_log_slow_queries(self):
        """Test database slow query monitoring."""
        @PerformanceMonitor.log_slow_queries(0.001)  # Very low threshold
        def slow_query_function():
            # This should trigger slow query warning
            User.objects.count()
            return "result"
        
        result = slow_query_function()
        self.assertEqual(result, "result")
    
    def test_database_monitor_query_count(self):
        """Test database query count monitoring."""
        @DatabaseMonitor.log_query_count(0)  # Zero threshold to trigger warning
        def high_query_function():
            User.objects.count()
            return "result"
        
        result = high_query_function()
        self.assertEqual(result, "result")
    
    def test_cache_monitor_log_cache_misses(self):
        """Test cache miss monitoring."""
        @CacheMonitor.log_cache_misses("test_prefix")
        def cache_miss_function():
            return "cache_miss_result"
        
        result = cache_miss_function()
        self.assertEqual(result, "cache_miss_result")


class AdditionalWebSocketTestCase(TestCase):
    """Additional WebSocket tests for edge cases."""
    
    def test_websocket_notification_service_no_channel_layer(self):
        """Test WebSocket service when channel layer is not available."""
        async def async_test():
            with patch('leaguer.ws_utils.get_channel_layer') as mock_get_layer:
                mock_get_layer.return_value = None
                
                # Should not raise an exception
                await WebSocketNotificationService.send_to_group(
                    "test_group", "test_event", {"data": "test"}
                )
        
        asyncio.get_event_loop().run_until_complete(async_test())
    
    def test_websocket_notification_service_channel_layer_error(self):
        """Test WebSocket service when channel layer raises an error."""
        async def async_test():
            with patch('leaguer.ws_utils.get_channel_layer') as mock_get_layer:
                mock_channel_layer = Mock()
                mock_channel_layer.group_send.side_effect = Exception("Channel layer error")
                mock_get_layer.return_value = mock_channel_layer
                
                # Should not raise an exception
                await WebSocketNotificationService.send_to_group(
                    "test_group", "test_event", {"data": "test"}
                )
        
        asyncio.get_event_loop().run_until_complete(async_test())


class ServiceIntegrationTestCase(TestCase):
    """Integration tests for service interactions."""
    
    def setUp(self):
        self.factory = RequestFactory()
        self.user = User.objects.create_user(
            email="integration@example.com",
            username="integration_user",
            password="testpass123"
        )
        cache.clear()
    
    def tearDown(self):
        cache.clear()
    
    @patch('leaguer.services.send_sms')
    def test_message_service_sms_method(self, mock_send_sms):
        """Test message service with SMS method."""
        mock_send_sms.return_value = {
            'nbr_verification_codes_sent': 1,
            'all_verification_codes_sent': True
        }
        
        from ..services import MessageService
        
        result = MessageService.send_verification_code(
            '+1234567890', '123456', method='sms'
        )
        
        self.assertTrue(result['all_verification_codes_sent'])
        mock_send_sms.assert_called_once()
    
    @patch('leaguer.services.send_sms')
    def test_message_service_bulk_sms(self, mock_send_sms):
        """Test bulk SMS sending."""
        mock_send_sms.return_value = {
            'nbr_verification_codes_sent': 2,
            'all_verification_codes_sent': True
        }
        
        from ..services import MessageService
        
        result = MessageService.send_bulk_message(
            ['+1234567890', '+1234567891'], 'Test message', method='sms'
        )
        
        self.assertTrue(result['all_verification_codes_sent'])
        mock_send_sms.assert_called_once()
    
    def test_geolocation_service_without_cache(self):
        """Test geolocation service without caching."""
        with patch('leaguer.services.get_geolocation_info') as mock_geo:
            mock_geo.return_value = {
                'country': 'France',
                'countryCode': 'FR'
            }
            
            from ..services import GeolocationService
            
            data = GeolocationService.get_geolocation_data(
                '192.168.1.1', use_cache=False
            )
            
            self.assertEqual(data['country'], 'France')
            # Should not interact with cache
            self.assertIsNone(cache.get('geolocation:192.168.1.1:country,countryCode'))
    
    def test_validation_service_edge_cases(self):
        """Test validation service edge cases."""
        from ..services import ValidationService
        
        # Test phone number validation edge cases
        self.assertFalse(ValidationService.validate_phone_number(None))
        self.assertFalse(ValidationService.validate_phone_number(''))
        self.assertFalse(ValidationService.validate_phone_number('abc'))
        self.assertFalse(ValidationService.validate_phone_number('123'))
        
        # Test email validation edge cases
        self.assertFalse(ValidationService.validate_email(None))
        self.assertFalse(ValidationService.validate_email(''))
        self.assertFalse(ValidationService.validate_email('not-an-email'))
        self.assertFalse(ValidationService.validate_email('test@'))
        self.assertFalse(ValidationService.validate_email('@test.com'))


class ErrorHandlingTestCase(TestCase):
    """Test error handling across services."""
    
    def test_geolocation_service_exception_handling(self):
        """Test geolocation service exception handling."""
        with patch('leaguer.services.get_geolocation_info') as mock_geo:
            mock_geo.side_effect = Exception("Network error")
            
            from ..services import GeolocationService
            from ..exceptions import GeolocationException
            
            with self.assertRaises(GeolocationException):
                GeolocationService.get_geolocation_data('192.168.1.1')
    
    def test_message_service_exception_handling(self):
        """Test message service exception handling."""
        with patch('leaguer.services.send_whatsapp') as mock_whatsapp:
            mock_whatsapp.side_effect = Exception("WhatsApp API error")
            
            from ..services import MessageService
            from ..exceptions import MessageSendException
            
            with self.assertRaises(MessageSendException):
                MessageService.send_verification_code('+1234567890', '123456')
    
    def test_message_service_bulk_exception_handling(self):
        """Test bulk message service exception handling."""
        with patch('leaguer.services.send_whatsapp') as mock_whatsapp:
            mock_whatsapp.side_effect = Exception("WhatsApp API error")
            
            from ..services import MessageService
            from ..exceptions import MessageSendException
            
            with self.assertRaises(MessageSendException):
                MessageService.send_bulk_message(['+1234567890'], 'Test message')


class LocalizationTestCase(TestCase):
    """Test localization functionality."""
    
    def test_timezone_handling(self):
        """Test timezone handling in utilities."""
        from ..utils import get_local_datetime
        from datetime import timezone
        from zoneinfo import ZoneInfo
        
        utc_time = datetime.now(timezone.utc)
        
        # Test with valid timezone
        localized_time = get_local_datetime(utc_time, "Europe/Paris")
        self.assertEqual(localized_time.tzinfo, ZoneInfo("Europe/Paris"))
        
        # Test with UTC timezone
        utc_localized = get_local_datetime(utc_time, "UTC")
        self.assertEqual(utc_localized.tzinfo, ZoneInfo("UTC"))
        
        # Test with invalid timezone should raise KeyError
        with self.assertRaises(KeyError):
            get_local_datetime(utc_time, "Invalid/Timezone")
    
    def test_email_context_languages(self):
        """Test email context for different languages."""
        from ..utils import get_email_base_context
        
        # Test RTL languages
        context_ar = get_email_base_context('ar')
        self.assertEqual(context_ar['direction'], 'rtl')
        
        # Test LTR languages
        context_en = get_email_base_context('en')
        self.assertEqual(context_en['direction'], 'ltr')
        
        context_fr = get_email_base_context('fr')
        self.assertEqual(context_fr['direction'], 'ltr')
        
        # Test default language
        context_default = get_email_base_context()
        self.assertEqual(context_default['direction'], 'ltr')

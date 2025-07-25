"""
Test suite for the leaguer core application.

This test suite provides comprehensive coverage for:
- Model functionality (ContactMessage model)
- Serializer functionality (ContactMessage serializers)
- Service layer functionality (GeolocationService, MessageService, ValidationService)
- Utility functions (utils.py)
- View endpoints (views.py)
- WebSocket consumers (ws_consumers.py)
- WebSocket utilities (ws_utils.py)
- Performance monitoring (monitoring.py)
- Custom exceptions (exceptions.py)
- Management commands (health_check)
- Configuration validation
- Security settings
- Environment configuration

Test Structure:
- test_models.py: Comprehensive tests for ContactMessage model and serializers
- test_comprehensive.py: Main test suite with all core functionality
- test_additional.py: Additional tests for edge cases and uncovered code
- test_functionalities.py: Functionality-specific tests
- test_ws_consumers.py: WebSocket-specific tests requiring TransactionTestCase

Total test count: Approximately 150+ tests covering all major functionality
"""

# Import all test classes to make them discoverable
from .test_models import *
from .test_comprehensive import *
from .test_additional import *
from .test_functionalities import *
from .test_ws_consumers import *
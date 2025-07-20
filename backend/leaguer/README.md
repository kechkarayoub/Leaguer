# Leaguer Backend Core Module Documentation

## Overview

The `leaguer` core module is the main Django application that provides the foundational functionality for the Leaguer project. It includes configuration management, utilities, WebSocket support, and core services.

## Architecture

### Settings Structure

The settings are organized into multiple files for better maintainability:

- `settings/base.py` - Common settings for all environments
- `settings/production.py` - Production-specific settings
- `settings/local.py` - Development-specific settings
- `settings/__init__.py` - Automatic environment detection

### Key Components

1. **Services Layer** (`services.py`)
   - `GeolocationService` - Handles IP geolocation
   - `MessageService` - Manages SMS/WhatsApp messaging
   - `CacheService` - Cache operations
   - `ValidationService` - Input validation

2. **Utilities** (`utils.py`)
   - Database operations
   - File handling
   - Email utilities
   - Phone number operations

3. **WebSocket Support**
   - `ws_consumers.py` - WebSocket consumers
   - `ws_routing.py` - WebSocket URL routing
   - `ws_utils.py` - WebSocket utilities

4. **Exception Handling** (`exceptions.py`)
   - Custom exception classes
   - Structured error handling

5. **Performance Monitoring** (`monitoring.py`)
   - Function execution timing
   - Database query monitoring
   - Cache performance tracking

## Features

### Multi-language Support
- Arabic (RTL)
- English (LTR)
- French (LTR)

### Real-time Features
- WebSocket connections for live updates
- Profile update notifications
- General user notifications

### Security
- JWT authentication
- CORS configuration
- Input validation
- Rate limiting support

### Monitoring
- Health checks
- Performance monitoring
- Error tracking
- Cache monitoring

## API Endpoints

### Core Endpoints

- `GET /api/health/` - Health check endpoint
- `GET /api/info/` - API information
- `GET /api/geolocation/` - Geolocation service

### Legacy Endpoints

- `GET /geolocation/` - Legacy geolocation endpoint

## Configuration

### Environment Variables

Required environment variables:

```bash
# Django
DJANGO_SECRET_KEY=your-secret-key
PIPLINE=development|production

# Database
DB_NAME=leaguer
DB_USER_NM=postgres
DB_USER_PW=password
DB_IP=localhost
DB_CONTAINER_INTERNAL_PORT=5432

# Redis
REDIS_URL=redis://localhost:6379

# Email
EMAIL_HOST=smtp.gmail.com
EMAIL_PORT=587
EMAIL_USE_TLS=true
EMAIL_HOST_USER=your-email@gmail.com
EMAIL_HOST_PASSWORD=your-password
DEFAULT_FROM_EMAIL=your-email@gmail.com

# WhatsApp
WHATSAPP_INSTANCE_ID=your-instance-id
WHATSAPP_INSTANCE_TOKEN=your-token
WHATSAPP_INSTANCE_URL=https://api.whatsapp.com

# Feature Flags
ENABLE_EMAIL_VERIFICATION=true
ENABLE_PHONE_NUMBER_VERIFICATION=true
```

### Optional Variables

```bash
# CORS
CORS_ALLOWED_ORIGIN_1=http://localhost:3000
CORS_ALLOWED_ORIGIN_2=http://localhost:8082

# Endpoints
BACKEND_ENDPOINT=http://localhost:8080
FRONTEND_ENDPOINT=http://localhost:3000

# Debug
USE_DEBUG_TOOLBAR=true
PERFORMANCE_MONITORING=true
```

## Usage Examples

### Using Services

```python
from leaguer.services import GeolocationService, MessageService

# Get geolocation data
try:
    ip = GeolocationService.get_client_ip(request)
    geo_data = GeolocationService.get_geolocation_data(ip)
    print(f"User location: {geo_data['country']}")
except GeolocationException as e:
    print(f"Geolocation failed: {e}")

# Send verification code
try:
    result = MessageService.send_verification_code(
        phone_number='+1234567890',
        code='123456',
        method='whatsapp'
    )
    print(f"Message sent: {result['all_verification_codes_sent']}")
except MessageSendException as e:
    print(f"Message sending failed: {e}")
```

### Using WebSocket Notifications

```python
from leaguer.ws_utils import notify_profile_update, notify_user

# Notify profile update
notify_profile_update(
    user_id=1,
    new_profile_data={'name': 'John Doe'},
    password_updated=False
)

# Send general notification
notify_user(
    user_id=1,
    message="Your profile has been updated",
    data={'type': 'profile_update'}
)
```

### Using Performance Monitoring

```python
from leaguer.monitoring import performance_monitor, slow_query_monitor

@performance_monitor
@slow_query_monitor
def my_view_function(request):
    # Your view logic here
    pass
```

## Management Commands

### Health Check

```bash
# Basic health check
python manage.py health_check

# Comprehensive check
python manage.py health_check --all

# Specific checks
python manage.py health_check --check-db --check-cache --check-files

# Verbose output
python manage.py health_check --all --verbose
```

## Testing

### Running Tests

```bash
# Run all tests
python manage.py test leaguer

# Run specific test file
python manage.py test leaguer.tests.test_improved

# Run with coverage
coverage run --source='.' manage.py test leaguer
coverage report
```

### Test Categories

1. **Services Tests** - Test service layer functionality
2. **Views Tests** - Test API endpoints
3. **Utils Tests** - Test utility functions
4. **Security Tests** - Test security configurations
5. **Configuration Tests** - Test settings validation

## Deployment

### Production Checklist

1. Set `PIPLINE=production`
2. Configure `SECRET_KEY`
3. Set `DEBUG=False`
4. Configure `ALLOWED_HOSTS`
5. Set up SSL/TLS certificates
6. Configure Redis for caching
7. Set up proper logging
8. Configure monitoring

### Docker Support

The application is designed to work with Docker containers:

- PostgreSQL database container
- Redis container for caching and WebSocket
- Application container

## Security Considerations

### Authentication
- JWT tokens with expiration
- Refresh token rotation
- Device-specific tokens

### Input Validation
- Phone number validation
- Email validation
- File upload validation
- Input sanitization

### Rate Limiting
- API endpoint rate limiting
- WebSocket connection limits
- Message sending limits

## Performance Optimization

### Caching Strategy
- Database query caching
- API response caching
- Template caching
- Static file caching

### Database Optimization
- Connection pooling
- Query optimization
- Index usage
- Lazy loading

### WebSocket Optimization
- Connection pooling
- Message batching
- Automatic reconnection

## Logging and Monitoring

### Log Levels
- `DEBUG` - Development debugging
- `INFO` - General information
- `WARNING` - Warning messages
- `ERROR` - Error conditions
- `CRITICAL` - Critical errors

### Log Files
- `logs/application.log` - General application logs
- `logs/errors.log` - Error-specific logs

### Monitoring Metrics
- Response times
- Error rates
- Cache hit rates
- Database query counts
- WebSocket connections

## Troubleshooting

### Common Issues

1. **Database Connection Issues**
   - Check environment variables
   - Verify database is running
   - Check network connectivity

2. **Cache Issues**
   - Verify Redis is running
   - Check Redis configuration
   - Clear cache if needed

3. **WebSocket Issues**
   - Check Redis connection
   - Verify WebSocket routing
   - Check authentication

4. **Performance Issues**
   - Enable performance monitoring
   - Check database queries
   - Monitor cache usage

### Debug Mode

Enable debug mode for development:

```python
# In local.py
DEBUG = True
USE_DEBUG_TOOLBAR = True
```

## Contributing

### Code Style
- Follow PEP 8
- Use type hints where appropriate
- Add docstrings to functions
- Write comprehensive tests

### Pull Request Process
1. Create feature branch
2. Write tests
3. Update documentation
4. Submit pull request
5. Code review

## License

This project is licensed under the MIT License.

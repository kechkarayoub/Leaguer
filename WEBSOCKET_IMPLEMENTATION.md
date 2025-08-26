# WebSocket Real-time Updates Implementation

## Overview

This implementation provides real-time updates for user profile changes, password updates, and password resets across multiple devices using WebSocket connections. The system ensures that when a user updates their profile or changes their password on one device, all other connected devices are notified and can respond appropriately.

## Backend Changes

### 1. Enhanced WebSocket Authentication Middleware

**File: `backend/leaguer/middleware/channels_jwt_middleware.py`**

- Added specific error handling for different authentication failures
- Now returns detailed error reasons (token_expired, invalid_token, user_not_found, no_token)
- Allows frontend to distinguish between different authentication issues

### 2. Updated WebSocket Consumer

**File: `backend/leaguer/ws_consumers.py`**

- Enhanced connection handling with specific close codes for different auth errors:
  - `4001`: Token expired
  - `4002`: Invalid token  
  - `4003`: User not found / Access denied
  - `4004`: No token provided
  - `4005`: General auth error
- Added support for different action types in messages:
  - `profile_updated`: For profile data changes
  - `password_changed`: For password changes from settings
  - `logout_required`: For password resets from email

### 3. New WebSocket Utility Functions

**File: `backend/leaguer/ws_utils.py`**

- Added `notify_profile_password_reset()` function for password reset notifications
- Enhanced existing functions to include action types

### 4. Custom JWT Authentication with Blacklist Support

**File**: `backend/accounts/authentication.py`

A custom JWT authentication class that extends SimpleJWT's default authentication to check token blacklist status on every API request.

**Key Features**:
- Extends `rest_framework_simplejwt.authentication.JWTAuthentication`
- Verifies token blacklist status before allowing access to protected resources
- Provides immediate token invalidation after logout
- Handles edge cases gracefully (missing JTI, database errors)
- Comprehensive logging for security monitoring

**Configuration**: Updated in `backend/leaguer/settings/base.py`:
```python
REST_FRAMEWORK = {
    'DEFAULT_AUTHENTICATION_CLASSES': (
        'accounts.authentication.JWTAuthentication',  # Custom authentication
    ),
    # ... other settings
}
```

**Security Flow**:
1. User makes API request with JWT token
2. Custom authentication validates token signature and expiration
3. Checks if token's JTI exists in blacklist
4. Rejects request if token is blacklisted
5. Allows request if token is valid and not blacklisted

### 5. Updated Views

**File: `backend/accounts/views.py`**

- Added WebSocket notification for password reset in `ResetPasswordView`
- Enhanced profile update and password change notifications with action types

## Frontend Changes

### 1. Enhanced WebSocket Service

**File: `frontend/web/src/services/WebSocketService.ts`**

#### New Features:
- **Token Refresh Logic**: Automatically detects token expiration and refreshes tokens using `AuthenticatedApiService`
- **Retry Mechanism**: Implements exponential backoff for connection retries (max 3 attempts)
- **Token Refresh Attempts**: Tracks and limits token refresh attempts (max 2 attempts)
- **Proper Error Handling**: Distinguishes between different WebSocket close codes
- **Automatic Logout**: Handles authentication failures and redirects to login
- **Consistent Token Management**: Reuses `AuthenticatedApiService` for all token operations
- **Integration with API Service**: Listens for token refresh events from other parts of the application

#### Error Handling:

**Problem**: Browsers often convert custom WebSocket close codes (4001-4005) to generic code 1006 (abnormal closure).

**Solution**: Backend sends `auth_error` message before closing connection:
```python
await self.send(text_data=json.dumps({
    "type": "auth_error",
    "error": "token_expired", 
    "message": "Token has expired"
}))
await self.close(code=4001, reason="token_expired")
```

**Frontend Handling**:
- **auth_error message + error='token_expired'**: Attempts to refresh token and reconnect
- **auth_error message + error='token_blacklisted'**: Token has been blacklisted (logged out), force logout
- **auth_error message + other errors**: Authentication errors that trigger immediate logout  
- **Code 1006 without auth_error**: Connection errors with retry logic and exponential backoff
- **Codes 4001-4005**: Fallback handling if close codes are preserved

**Security Features**:
- **Token Blacklist Checking**: All WebSocket connections verify that JWT tokens are not blacklisted
- **REST API Blacklist Verification**: Custom JWT authentication checks token blacklist status on every API request
- **Automatic Logout**: When a user logs out from one device, all other connected devices are automatically disconnected
- **Password Change Protection**: When a user changes their password, all existing tokens are blacklisted and devices are logged out
- **Password Reset Protection**: When a user resets their password, all existing tokens are blacklisted
- **Mandatory Token Blacklisting**: Logout endpoint properly blacklists tokens on the server to prevent reuse
- **Cross-Device Security**: WebSocket notifications ensure immediate logout across all connected devices when security-critical actions occur
- **Real-time Token Validation**: Both WebSocket and REST API requests verify token validity and blacklist status in real-time

### New Logout Endpoint

**Endpoint**: `POST /accounts/logout/`

**Purpose**: Properly logout users by blacklisting their tokens on the server

**Request Body**:
```json
{
  "refresh_token": "string",
  "logout_all_devices": false,
  "selected_language": "en"
}
```

**Features**:
- Blacklists the provided refresh token to prevent reuse
- Optional `logout_all_devices` parameter to logout from all devices
- Sends WebSocket notifications to other devices when `logout_all_devices` is true
- Always performs local cleanup even if API call fails (fail-safe design)

#### Message Handling:
- **profile_update + action='profile_updated'**: Updates local storage with new profile data
- **profile_password_update + action='password_changed'**: Logs out user if from different device
- **profile_password_reset + action='logout_required'**: Immediately logs out user

#### Logout Handling:
- **React Integration**: Uses callback pattern to properly integrate with React Router and useAuth hook
- **Fallback**: If no React context available, falls back to `window.location.href`
- **Consistent Logout**: Uses the same `logout()` function as the rest of the application

### 2. New React Hook

**File: `frontend/web/src/hooks/useWebSocket.tsx`**

#### Features:
- `useWebSocket()`: General WebSocket hook with connection management
- `useProfileWebSocket()`: Specialized hook for profile-related messages
- Automatic toast notifications for different events
- Proper lifecycle management for React components

### 3. Updated Profile Page

**File: `frontend/web/src/pages/profile/ProfilePage.tsx`**

- Integrated `useProfileWebSocket()` hook
- Automatic handling of real-time profile updates from other devices

## Usage Examples

### Backend - Sending Notifications

```python
# Profile update notification
from leaguer.ws_utils import notify_profile_update
notify_profile_update(user.id, user_data, password_updated=False, device_id=device_id)

# Password change notification  
from leaguer.ws_utils import notify_profile_password_update
notify_profile_password_update(user.id, device_id=device_id)

# Password reset notification
from leaguer.ws_utils import notify_profile_password_reset
notify_profile_password_reset(user.id)
```

### Frontend - Using WebSocket Hook

```tsx
import { useProfileWebSocket } from '../hooks/useWebSocket';

const MyComponent = () => {
  const { isConnected, connectionState } = useProfileWebSocket();
  
  // WebSocket automatically handles:
  // - Profile updates from other devices
  // - Password changes requiring logout
  // - Token expiration and refresh
  // - Connection retries
  // - Proper React-based logout (useAuth + navigate)
  
  return (
    <div>
      Connection Status: {isConnected ? 'Connected' : 'Disconnected'}
    </div>
  );
};
```

### React Integration for Logout

The WebSocket service now properly integrates with React components:

```tsx
// In useWebSocket hook
const { logout } = useAuth();
const navigate = useNavigate();

const handleLogout = async () => {
  try {
    await logout(); // Proper React logout function
    navigate('/auth/login'); // React Router navigation
  } catch (error) {
    console.error('Logout error:', error);
    navigate('/auth/login'); // Fallback navigation
  }
};

webSocketService.setLogoutHandler(handleLogout);
```

## Flow Diagrams

## Benefits of Using AuthenticatedApiService

Instead of duplicating token refresh logic, the WebSocket service now leverages the existing `AuthenticatedApiService` which provides:

1. **Consistent Token Management**: All token operations (get, refresh, clear) use the same logic
2. **Robust Error Handling**: The API service already handles various token refresh scenarios
3. **Storage Logic**: Automatically determines whether to use session or local storage
4. **Token Refresh Throttling**: Prevents multiple simultaneous refresh requests
5. **Integration**: WebSocket service is notified when tokens are refreshed by API calls
6. **Code Reuse**: Reduces duplication and maintenance burden

### Token Refresh Flow
```
1. WebSocket connection fails with token_expired (4001)
2. WebSocket service calls ApiService.publicRefreshTokens()
3. ApiService handles refresh logic (same as API calls)
4. New tokens are stored using existing logic
5. WebSocket reconnects with fresh token
6. Both API and WebSocket now use the same refreshed tokens
```
```
1. WebSocket connection fails with code 4001 (token_expired)
2. Frontend detects token expiration
3. Attempts to refresh token using refresh token
4. If refresh succeeds:
   - Stores new tokens
   - Reconnects to WebSocket with new token
   - Resets retry counters
5. If refresh fails or max attempts reached:
   - Clears all tokens
   - Redirects to login page
```

### Profile Update Flow
```
1. User updates profile on Device A
2. Backend processes update and sends WebSocket notification
3. All connected devices (except Device A) receive notification
4. Frontend automatically updates local storage with new profile data
5. User sees toast notification about remote update
```

### Password Change Flow
```
1. User changes password on Device A
2. Backend sends "password_changed" notification to all devices
3. All other devices receive notification and automatically logout
4. Users on other devices see toast notification and are redirected to login
```

### Password Reset Flow
```
1. User resets password via email link
2. Backend processes reset and sends "logout_required" notification
3. All connected devices receive notification and immediately logout
4. All users are redirected to login page
```

## Configuration

### Environment Variables

No additional environment variables are required. The system uses existing WebSocket and authentication configurations.

### WebSocket Connection Parameters

The WebSocket connection includes:
- `token`: JWT access token for authentication
- `deviceId`: Unique device identifier to prevent self-notifications

### Error Codes Reference

| Code | Reason | Frontend Action |
|------|---------|----------------|
| 4001 | token_expired | Refresh token and retry |
| 4002 | invalid_token | Immediate logout |
| 4003 | user_not_found / access_denied | Immediate logout |
| 4004 | no_token | Immediate logout |
| 4005 | general_auth_error | Immediate logout |
| 1006 | General connection error | Retry with backoff |

## Testing

### Backend Tests
The existing WebSocket consumer tests in `backend/leaguer/tests/test_ws_consumers.py` can be extended to test the new authentication error handling.

### Frontend Testing
- Test token expiration scenarios
- Test connection retry logic
- Test message handling for different action types
- Test automatic logout functionality

## Security Considerations

1. **Token Refresh Limits**: Limited to 2 attempts to prevent infinite loops
2. **Connection Retry Limits**: Limited to 3 attempts to prevent excessive server load
3. **Device ID Filtering**: Prevents users from receiving their own notifications
4. **Immediate Logout**: Ensures security for password-related events

## Performance Considerations

1. **Exponential Backoff**: Prevents overwhelming the server during connection issues
2. **Local Storage Updates**: Minimizes API calls by updating profile data locally
3. **Connection Pooling**: Single WebSocket connection per user session
4. **Automatic Cleanup**: Proper disconnection and cleanup on logout

## Future Enhancements

1. **Notification Preferences**: Allow users to configure which notifications they receive
2. **Message Queuing**: Store messages for offline users
3. **Push Notifications**: Integrate with browser push notifications
4. **Activity Logging**: Track WebSocket events for debugging
5. **Load Balancing**: Support for multiple WebSocket servers

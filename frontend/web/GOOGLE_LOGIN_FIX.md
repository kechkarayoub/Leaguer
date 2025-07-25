# Google Login Integration Fix

## Issue Identified
The frontend web application was not properly integrated with the backend's Google login endpoint. The social login was trying to use the regular login endpoint instead of the dedicated social authentication endpoint.

## Backend Google Login Endpoint
The backend has a dedicated endpoint for third-party authentication:
- **Endpoint**: `POST /accounts/sign-in-third-party/`
- **Purpose**: Handles authentication via Google, Facebook, Apple, etc.
- **Required Fields**:
  - `email` (string): User's email from social provider
  - `id_token` (string): JWT token from social provider
  - `type_third_party` (string): Provider type ("google", "facebook", "apple")
  - `selected_language` (string, optional): User's language preference

## Backend Implementation Details
- Uses Firebase Admin SDK to verify Google ID tokens
- Validates the token and extracts user email
- Looks up existing user by email
- Returns JWT access and refresh tokens if user exists
- Handles account validation (active, email verified, etc.)

## Frontend Changes Made

### 1. Added Social Login Support to useAuth Hook
- **New Interface**: `SocialLoginCredentials` for social login data structure
- **New Mutation**: `socialLoginMutation` that calls `/accounts/sign-in-third-party/`
- **New Function**: `socialLogin()` exposed in hook API
- **Loading State**: `isSocialLoggingIn` for UI feedback

### 2. Updated LoginPage Component
- **Import**: Added `SocialLoginCredentials` type and `i18n` for language detection
- **Hook Usage**: Added `socialLogin` and `isSocialLoggingIn` from useAuth
- **Handler Update**: `handleSocialLoginSuccess` now uses proper social login endpoint
- **Data Mapping**: Correctly maps Google response to backend expected format:
  ```typescript
  {
    email: result.user.email,
    id_token: result.accessToken, // Google JWT token
    type_third_party: 'google',
    selected_language: i18n.language
  }
  ```
- **UI Update**: Button loading state includes social login loading

### 3. Social Login Flow
1. User clicks Google login button
2. `SocialLoginButton` triggers Google Sign-In
3. Google returns JWT credential
4. `handleSocialLoginSuccess` receives the Google response
5. Data is formatted for backend API
6. `socialLogin()` calls `/accounts/sign-in-third-party/`
7. Backend verifies Google token with Firebase
8. If valid, backend returns access/refresh tokens
9. Frontend stores tokens and updates auth state
10. User is redirected to dashboard

## Flutter App Comparison
The Flutter app already correctly uses the `/accounts/sign-in-third-party/` endpoint, so the web frontend now matches this implementation.

## Testing Required
1. **Google Login Flow**: Verify complete Google authentication works
2. **Token Storage**: Ensure tokens are properly stored and used
3. **User Data**: Confirm user profile data is correctly retrieved
4. **Error Handling**: Test invalid tokens and network errors
5. **Language Support**: Verify language preference is sent correctly

## Environment Requirements
- `REACT_APP_GOOGLE_SIGN_IN_WEB_CLIENT_ID` must be set
- `REACT_APP_ENABLE_GOOGLE_LOGIN=true` to enable Google login
- Firebase project must be configured with Google Sign-In
- Backend Firebase service account must be properly configured

## Security Notes
- Google ID tokens are verified server-side using Firebase Admin SDK
- No sensitive credentials are stored in frontend
- JWT tokens from backend are used for subsequent API calls
- Token refresh mechanism works with social login users

## Files Modified
1. `frontend/web/src/hooks/useAuth.tsx` - Added social login functionality
2. `frontend/web/src/pages/auth/LoginPage.tsx` - Updated to use social login endpoint

The Google login integration now properly uses the backend's dedicated social authentication endpoint, matching the implementation in the Flutter app.

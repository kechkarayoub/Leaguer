# API Endpoint Fixes Summary

## Changes Made

### 1. Fixed Authentication Endpoints in useAuth.tsx

**Before:** Frontend was calling non-existent `/auth/*` endpoints
**After:** Updated to use correct `/accounts/*` endpoints that exist in backend

#### Specific Changes:
- ✅ **Login**: Already correct at `/accounts/sign-in/`
- ✅ **User Profile**: Changed from GET `/auth/profile` to use stored user data (since backend only has PUT for profile updates)
- ❌ **Registration**: Backend SignUpView is commented out, frontend now shows error message
- ✅ **Logout**: Removed backend call (JWT is stateless, logout is client-side only)
- ✅ **Update Profile**: Changed from PUT `/auth/profile` to PUT `/accounts/update-profile/`
- ✅ **Change Password**: Now uses PUT `/accounts/update-profile/` with password parameters
- ❌ **Forgot Password**: Not implemented in backend, frontend now shows error message

### 2. Fixed Token Refresh Endpoint in AuthenticatedApiService.ts

**Before:** `/auth/refresh/`
**After:** `/accounts/api/token/refresh/`

### 3. Updated Response Handling

**Before:** Expected `accessToken` and `refreshToken` properties
**After:** Updated to match backend response with `access_token` and `refresh_token`

### 4. Implemented User Data Storage

Since backend doesn't have a GET endpoint for user profile, implemented client-side storage:
- User data stored in secure storage after login/registration
- Profile queries now use stored data instead of API calls
- Data updated when profile is modified
- Data cleared on logout

## Backend Endpoints Available

✅ **Available and Working:**
- POST `/accounts/sign-in/` - User login
- POST `/accounts/sign-in-third-party/` - Social login
- PUT `/accounts/update-profile/` - Update user profile & change password
- POST `/accounts/send-verification-email-link/` - Send email verification
- GET `/accounts/verify-email/` - Verify email
- GET `/accounts/verify-phone-number/` - Verify phone number
- POST `/accounts/api/token/` - Get JWT token
- POST `/accounts/api/token/refresh/` - Refresh JWT token

❌ **Missing/Commented Out:**
- POST `/accounts/sign-up/` - User registration (SignUpView is commented out)
- Any password reset endpoints
- GET endpoint for user profile data

## Recommendations for Backend

1. **Enable Registration**: Uncomment SignUpView and its URL pattern
2. **Add Profile GET Endpoint**: Add GET method to UpdateProfileView or create separate ProfileView
3. **Implement Password Reset**: Add forgot password and reset password endpoints
4. **Add Logout Endpoint**: Optional, for token blacklisting if needed

## Testing Status

- ✅ Login endpoint alignment completed
- ✅ Profile update endpoint alignment completed
- ✅ Token refresh endpoint alignment completed
- ⚠️ Registration disabled (backend not available)
- ⚠️ Forgot password disabled (backend not available)
- ✅ User data storage/retrieval implemented

## Next Steps

1. Test login functionality with backend
2. Test profile updates with backend
3. Verify token refresh works properly
4. Consider enabling backend registration if needed
5. Consider implementing password reset if needed

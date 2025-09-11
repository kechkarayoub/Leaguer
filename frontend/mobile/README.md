# Leaguer Mobile App

A React Native mobile application that mirrors the functionality of the Leaguer web app, providing a native mobile experience for both iOS and Android platforms.

## Features

- **Authentication System**: Login, registration, password reset with validation
- **Theme Support**: Light/dark mode with automatic system detection
- **Navigation**: Stack and tab-based navigation using React Navigation
- **Form Validation**: React Hook Form with Yup schema validation
- **State Management**: TanStack Query for server state and caching
- **Secure Storage**: Token and sensitive data storage using Keychain/EncryptedSharedPreferences
- **TypeScript**: Full TypeScript support with strict typing
- **Error Handling**: Comprehensive error handling and user feedback

## Tech Stack

- **React Native**: 0.80.1
- **TypeScript**: Full TypeScript support
- **React Navigation**: v7 for navigation
- **TanStack Query**: Server state management
- **React Hook Form**: Form handling and validation
- **Yup**: Schema validation
- **React Native Keychain**: Secure storage
- **React Native Config**: Environment variables
- **React Native Device Info**: Device identification
- **React Native Toast Message**: User notifications

## Project Structure

```
src/
├── components/          # Reusable UI components
│   ├── form/           # Form-specific components
│   │   ├── CustomButton.tsx
│   │   └── CustomTextInput.tsx
│   └── LoadingSpinner.tsx
├── config/             # App configuration
│   └── config.ts
├── contexts/           # React contexts
│   └── ThemeContext.tsx
├── hooks/              # Custom hooks
│   └── useAuth.ts
├── navigation/         # Navigation configuration
│   └── AppNavigation.tsx
├── screens/            # Screen components
│   ├── auth/          # Authentication screens
│   │   ├── ForgotPasswordScreen.tsx
│   │   ├── LoginScreen.tsx
│   │   └── RegisterScreen.tsx
│   └── main/          # Main app screens
│       ├── HomeScreen.tsx
│       ├── ProfileScreen.tsx
│       └── SettingsScreen.tsx
├── services/           # API and storage services
│   ├── AuthenticatedApiService.ts
│   └── SecureStorageService.ts
└── types/              # TypeScript type definitions
    └── auth.types.ts
```

## Setup Instructions

### Prerequisites

- Node.js (v16 or higher)
- React Native CLI
- Android Studio (for Android development)
- Xcode (for iOS development, macOS only)
- Java JDK 17

### Installation

1. **Navigate to the mobile directory:**
   ```bash
   cd frontend/mobile
   ```

2. **Install dependencies:**
   ```bash
   yarn install
   ```

3. **Configure environment variables:**
   Update `.env` file with your actual values:
   ```env
   REACT_APP_BACKEND_ENDPOINT=http://localhost:8000
   REACT_APP_FACEBOOK_SIGN_IN_WEB_CLIENT_ID=your-facebook-app-id
   ```

4. **Install additional dependencies for iOS (macOS only):**
   ```bash
   cd ios
   pod install
   cd ..
   ```

### Running the App

#### Android
```bash
# Start Metro bundler
yarn start

# In another terminal, run Android app
yarn android
```

#### iOS (macOS only)
```bash
# Start Metro bundler
yarn start

# In another terminal, run iOS app
yarn ios
```

## Key Components

### Authentication Flow
- **LoginScreen**: User login with email/username and password
- **RegisterScreen**: User registration with validation
- **ForgotPasswordScreen**: Password reset functionality
- **useAuth Hook**: Manages authentication state and API calls

### Navigation
- **AuthStack**: Authentication-related screens
- **MainTabs**: Main app navigation with bottom tabs
- **AppNavigation**: Root navigator with conditional rendering

### State Management
- **TanStack Query**: Handles API calls, caching, and synchronization
- **ThemeContext**: Manages app theme and dark/light mode
- **SecureStorage**: Handles token storage and session management

### API Integration
- **AuthenticatedApiService**: HTTP client with automatic token refresh
- **Device ID Integration**: Unique device identification
- **Error Handling**: Comprehensive error handling and user feedback

## Configuration

### Backend Integration
The mobile app is configured to work with the Django backend:
- Development: `http://10.0.2.2:8000` (Android emulator)
- Production: Update `BACKEND_URL` in config

### Environment Variables
Use `.env` file for configuration:
- `REACT_APP_BACKEND_ENDPOINT`: Backend API URL
- `GOOGLE_*_CLIENT_ID`: Google OAuth credentials
- `REACT_APP_FACEBOOK_SIGN_IN_WEB_CLIENT_ID`: Facebook app ID

## Development Guidelines

### Code Style
- Use TypeScript for all components and services
- Follow React Native best practices
- Use functional components with hooks
- Implement proper error boundaries
- Use StyleSheet for styling (avoid inline styles)

### State Management
- Use TanStack Query for server state
- Use React Context for app-wide state (theme, auth)
- Avoid excessive prop drilling

### Navigation
- Use type-safe navigation with TypeScript
- Implement proper screen options and headers
- Handle deep linking when needed

## Testing

```bash
# Run tests
yarn test

# Type checking
npx tsc --noEmit
```

## Building for Production

### Android
```bash
# Generate APK
cd android
./gradlew assembleRelease

# Generate AAB (for Play Store)
./gradlew bundleRelease
```

### iOS
1. Open `ios/Leaguer.xcworkspace` in Xcode
2. Select "Generic iOS Device" or your device
3. Product → Archive
4. Distribute to App Store or save for local distribution

## Common Issues and Solutions

### Metro bundler issues
```bash
yarn start --reset-cache
```

### Android build issues
```bash
cd android
./gradlew clean
cd ..
yarn android
```

### iOS build issues
```bash
cd ios
pod install --repo-update
cd ..
yarn ios
```

## Contributing

1. Follow the existing code structure and conventions
2. Write TypeScript types for all components and services
3. Add tests for new functionality
4. Update documentation when adding new features
5. Use conventional commit messages

## License

This project is part of the Leaguer application suite.

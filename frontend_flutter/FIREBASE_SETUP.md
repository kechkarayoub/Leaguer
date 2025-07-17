# Firebase Setup Instructions

## Prerequisites
1. Create a Firebase project at https://console.firebase.google.com/
2. Enable the required Firebase services (Auth, Firestore, etc.)

## Android Setup
1. Download `google-services.json` from your Firebase project settings
2. Place it in `android/app/google-services.json`
3. Copy `android/values.xml.template` to `android/app/src/main/res/values/values.xml`
4. Replace the placeholder values in `values.xml` with your actual Firebase configuration values from `google-services.json`

## iOS Setup
1. Download `GoogleService-Info.plist` from your Firebase project settings
2. Place it in `ios/Runner/GoogleService-Info.plist`

## Security Note
The `values.xml`, `google-services.json`, and `GoogleService-Info.plist` files contain sensitive configuration data and should not be committed to version control. They are included in `.gitignore`.

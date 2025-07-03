import 'dart:io';
import 'package:test/test.dart';

void main() {
  // List of required keys
  final requiredKeys = [
    'APP_NAME',
    'BACKEND_URL',
    'DEFAULT_COUNTRY_CODE',
    'DISABLE_LOG_MESSAGE',
    'ENABLE_USERS_REGISTRATION',
    'ENABLE_LOG_IN_WITH_GOOGLE',
    'FIREBASE_WEB_API_KEY',
    'FIREBASE_WEB_APP_ID',
    'FIREBASE_WEB_AUTH_DOMAIN',
    'FIREBASE_WEB_MESSAGING_SENDER_ID',
    'FIREBASE_WEB_MEASUREMENT_ID',
    'FIREBASE_WEB_PROJECT_ID',
    'FIREBASE_WEB_STORAGE_BUCKET',
    'GOOGLE_SIGN_IN_ANDROID_CLIENT_ID',
    'GOOGLE_SIGN_IN_IOS_CLIENT_ID',
    'GOOGLE_SIGN_IN_WEB_CLIENT_ID',
    'IS_TEST',
    'PIPLINE',
    'WS_BACKEND_HOST',
    'WS_BACKEND_PORT',
  ];

  test('Validate .env file contains all required keys', () {
    // Load the .env file
    final file = File('.env');
    expect(file.existsSync(), isTrue, reason: '.env file not found!');

    final lines = file.readAsLinesSync();

    // Parse the .env file
    final variables = <String, String>{};
    for (var line in lines) {
      line = line.trim();
      if (line.isEmpty || line.startsWith('#')) continue;
      final parts = line.split('=');
      if (parts.length >= 2) {
        final key = parts[0].trim();
        final value = parts.sublist(1).join('=').trim();
        variables[key] = value;
      }
    }

    // Check for missing keys
    for (var key in requiredKeys) {
      expect(variables.containsKey(key), isTrue, reason: 'Missing key: $key');
    }
  });
}

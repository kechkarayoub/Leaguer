import 'dart:io';
import 'package:test/test.dart';

void main() {
  // List of required keys
  final requiredKeys = [
    'APP_NAME',
    'BACKEND_URL',
    'PIPLINE',
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

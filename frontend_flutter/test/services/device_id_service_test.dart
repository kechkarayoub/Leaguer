import 'package:flutter_test/flutter_test.dart';
import 'package:frontend_flutter/services/device_id_service.dart';

void main() {
  setUp(() {
    // Each test gets a fresh environment
    TestWidgetsFlutterBinding.ensureInitialized();
    // Reset singleton state for each test
    DeviceIdService.resetForTesting();
  });

  group('Singleton Pattern', () {
    test('Should return the same instance on multiple calls', () {
      final instance1 = DeviceIdService.instance;
      final instance2 = DeviceIdService.instance;
      
      expect(instance1, same(instance2));
    });

    test('Should maintain singleton across different access patterns', () {
      final instance1 = DeviceIdService.instance;
      final instance2 = DeviceIdService.instance;
      final instance3 = DeviceIdService.instance;
      
      expect(instance1, same(instance2));
      expect(instance2, same(instance3));
      expect(instance1, same(instance3));
    });
  });

  group('Device ID Generation', () {
    test('Should generate device ID with correct format', () async {
      // Act
      final deviceId = await DeviceIdService.instance.getDeviceId();

      // Assert
      expect(deviceId, isNotNull);
      expect(deviceId, isNotEmpty);
      expect(deviceId, startsWith('device_'));
      
      // Check format: device_<timestamp>_<6_digits>
      final parts = deviceId.split('_');
      expect(parts.length, equals(3));
      expect(parts[0], equals('device'));
      expect(parts[1], matches(RegExp(r'^\d+$'))); // timestamp
      expect(parts[2], matches(RegExp(r'^\d{6}$'))); // 6-digit random
    });

    test('Should generate device ID with recent timestamp', () async {
      // Arrange
      final beforeTimestamp = DateTime.now().millisecondsSinceEpoch;

      // Act
      final deviceId = await DeviceIdService.instance.getDeviceId();

      // Assert
      final afterTimestamp = DateTime.now().millisecondsSinceEpoch;
      final parts = deviceId.split('_');
      final deviceTimestamp = int.parse(parts[1]);

      expect(deviceTimestamp, greaterThanOrEqualTo(beforeTimestamp));
      expect(deviceTimestamp, lessThanOrEqualTo(afterTimestamp));
    });

    test('Should return consistent device ID across multiple calls', () async {
      // Act - Make multiple calls
      final deviceId1 = await DeviceIdService.instance.getDeviceId();
      final deviceId2 = await DeviceIdService.instance.getDeviceId();
      final deviceId3 = await DeviceIdService.instance.getDeviceId();

      // Assert - All should be the same (cached)
      expect(deviceId1, equals(deviceId2));
      expect(deviceId2, equals(deviceId3));
    });
  
  });

  group('Device ID Format Validation', () {
    test('Should generate device ID matching expected pattern', () async {
      // Act
      final deviceId = await DeviceIdService.instance.getDeviceId();

      // Assert - Comprehensive format validation
      final regex = RegExp(r'^device_\d{13}_\d{6}$');
      expect(deviceId, matches(regex));
      
      // Additional checks
      expect(deviceId.length, greaterThanOrEqualTo(20)); // Minimum expected length
      expect(deviceId.length, lessThanOrEqualTo(30)); // Maximum reasonable length
    });

    test('Should generate random suffix within expected range', () async {
      // Act
      final deviceId = await DeviceIdService.instance.getDeviceId();

      // Assert - Check that random suffix is within valid range
      final parts = deviceId.split('_');
      final randomSuffix = int.parse(parts[2]);
      expect(randomSuffix, greaterThanOrEqualTo(0));
      expect(randomSuffix, lessThanOrEqualTo(999999));
    });

    test('Should contain valid timestamp component', () async {
      // Act
      final deviceId = await DeviceIdService.instance.getDeviceId();

      // Assert
      final parts = deviceId.split('_');
      final timestamp = int.parse(parts[1]);
      
      // Should be a reasonable timestamp (after year 2020)
      final year2020 = DateTime(2020).millisecondsSinceEpoch;
      expect(timestamp, greaterThan(year2020));
      
      // Should be before a future date (year 2030)
      final year2030 = DateTime(2030).millisecondsSinceEpoch;
      expect(timestamp, lessThan(year2030));
    });

    test('Should have proper string properties', () async {
      // Act
      final deviceId = await DeviceIdService.instance.getDeviceId();

      // Assert
      expect(deviceId.trim(), equals(deviceId)); // No leading/trailing whitespace
      expect(deviceId.contains(' '), isFalse); // No spaces
      expect(deviceId.toLowerCase(), equals(deviceId)); // Should be lowercase
    });
  });

  group('Performance and Reliability', () {
    test('Should return device ID quickly on subsequent calls', () async {
      // First call (might be slower due to storage)
      await DeviceIdService.instance.getDeviceId();

      // Measure subsequent calls
      final stopwatch = Stopwatch()..start();
      await DeviceIdService.instance.getDeviceId();
      stopwatch.stop();

      // Should be very fast (less than 10ms) due to caching
      expect(stopwatch.elapsedMilliseconds, lessThan(10));
    });

    test('Should not throw exceptions under normal conditions', () async {
      // Act & Assert - Should not throw
      expect(() async => await DeviceIdService.instance.getDeviceId(), returnsNormally);
    });

  });

  group('Edge Cases', () {
    test('Should work in test environment without storage', () async {
      // Act - This test runs in a test environment where storage might fail
      final deviceId = await DeviceIdService.instance.getDeviceId();

      // Assert - Should still work
      expect(deviceId, isNotNull);
      expect(deviceId, isNotEmpty);
      expect(deviceId, startsWith('device_'));
    });

    test('Should generate valid IDs even when called immediately after instantiation', () async {
      // Act - Call immediately
      final deviceId = await DeviceIdService.instance.getDeviceId();

      // Assert
      expect(deviceId, isNotNull);
      expect(deviceId, matches(RegExp(r'^device_\d{13}_\d{6}$')));
    });

    test('Should maintain consistency across test runs', () async {
      // This test verifies that within the same test run,
      // the device ID remains consistent
      
      final deviceId1 = await DeviceIdService.instance.getDeviceId();
      
      // Simulate some delay
      await Future.delayed(Duration(milliseconds: 50));
      
      final deviceId2 = await DeviceIdService.instance.getDeviceId();
      
      expect(deviceId1, equals(deviceId2));
    });
  });

  group('Integration Tests', () {
    test('Should work with realistic usage patterns', () async {
      // Simulate realistic app usage
      final service = DeviceIdService.instance;
      
      // First access (like app startup)
      final deviceId1 = await service.getDeviceId();
      
      // Multiple API calls (like during user session)
      final deviceId2 = await service.getDeviceId();
      final deviceId3 = await service.getDeviceId();
      
      // More calls after some delay (like user actions)
      await Future.delayed(Duration(milliseconds: 10));
      final deviceId4 = await service.getDeviceId();
      
      // All should be the same
      expect(deviceId1, equals(deviceId2));
      expect(deviceId2, equals(deviceId3));
      expect(deviceId3, equals(deviceId4));
      
      // Should have valid format
      expect(deviceId1, matches(RegExp(r'^device_\d{13}_\d{6}$')));
    });

    test('Should work correctly when accessed from multiple contexts', () async {
      // Simulate accessing from different parts of the app
      final context1DeviceId = await DeviceIdService.instance.getDeviceId();
      final context2DeviceId = await DeviceIdService.instance.getDeviceId();
      final context3DeviceId = await DeviceIdService.instance.getDeviceId();
      
      // All contexts should get the same device ID
      expect(context1DeviceId, equals(context2DeviceId));
      expect(context2DeviceId, equals(context3DeviceId));
    });
  });

}

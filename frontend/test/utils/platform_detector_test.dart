import 'package:flutter_test/flutter_test.dart';
import 'package:flutter/foundation.dart' show kIsWeb, debugDefaultTargetPlatformOverride;
import 'package:flutter/material.dart' show TargetPlatform;
import 'package:platform/platform.dart';

import 'package:frontend/utils/platform_detector.dart';
import 'package:mocktail/mocktail.dart';

class MockPlatform extends Mock implements Platform {}
void main() {
  group('GetPlatformType', () {

    setUp(() {
    });

    tearDown(() {
    });

    test('Returns web when platform is web', () {
      expect(getPlatformType(defaultPlatform: PlatformType.web, isTest: true), PlatformType.web);
      expect(getPlatformType(defaultPlatform: PlatformType.web, isTest: true, returnSpecificPlatform: true), PlatformType.web);
    });

    test('Returns mobile or android when platform is android', () {
      expect(getPlatformType(defaultPlatform: PlatformType.android, isTest: true), PlatformType.mobile);
      expect(getPlatformType(defaultPlatform: PlatformType.android, isTest: true, returnSpecificPlatform: true), PlatformType.android);
    });

    test('Returns mobile or ios when platform is ios', () {
      expect(getPlatformType(defaultPlatform: PlatformType.ios, isTest: true), PlatformType.mobile);
      expect(getPlatformType(defaultPlatform: PlatformType.ios, isTest: true, returnSpecificPlatform: true), PlatformType.ios);
    });

    test('Returns desktop or windows when platform is windows', () {
      expect(getPlatformType(defaultPlatform: PlatformType.windows, isTest: true), PlatformType.desktop);
      expect(getPlatformType(defaultPlatform: PlatformType.windows, isTest: true, returnSpecificPlatform: true), PlatformType.windows);
    });

    test('Returns desktop or linux when platform is linux', () {
      expect(getPlatformType(defaultPlatform: PlatformType.linux, isTest: true), PlatformType.desktop);
      expect(getPlatformType(defaultPlatform: PlatformType.linux, isTest: true, returnSpecificPlatform: true), PlatformType.linux);
    });

    test('Returns desktop or macOs when platform is macOs', () {
      expect(getPlatformType(defaultPlatform: PlatformType.macOs, isTest: true), PlatformType.desktop);
      expect(getPlatformType(defaultPlatform: PlatformType.macOs, isTest: true, returnSpecificPlatform: true), PlatformType.macOs);
    });

    test('Returns mobile when no platform detected', () {
      expect(getPlatformType(isTest: true), PlatformType.mobile);
      expect(getPlatformType(isTest: true, returnSpecificPlatform: true), PlatformType.mobile);
    });

  });
}
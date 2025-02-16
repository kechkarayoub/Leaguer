
import 'dart:io';
import 'package:flutter/foundation.dart';
import 'package:flutter_dotenv/flutter_dotenv.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:frontend/main.dart'; // Adjust the import path as needed
import 'package:mockito/mockito.dart';
import 'package:frontend/pages/sign_in_up/sign_in_page.dart';
import 'package:frontend/pages/dashboard/dashboard.dart';
import './mocks/mocks.mocks.dart';
import './mocks/test_helper.dart';
import './mocks/wakelock.mocks.dart';

void main() async{
  //await dotenv.load(fileName: ".env");
  late MockStorageService mockStorageService;
  late MockSecureStorageService mockSecureStorageService;
  late MockL10n mockL10n;
  late TargetPlatform? originalDebugTargetPlatform;
  late MockWakelockService mockWakelockService;

  group('EnablePlatformOverrideForDesktop', () {
    setUp(() async {
      // Save the original value of debugDefaultTargetPlatformOverride
      originalDebugTargetPlatform = debugDefaultTargetPlatformOverride;
    });

    tearDown(() {
      // Reset debugDefaultTargetPlatformOverride to its original value
      debugDefaultTargetPlatformOverride = originalDebugTargetPlatform;
    });
    test('Should set debugDefaultTargetPlatformOverride for desktop platforms', () {
      // Mock platform to be Windows
      debugDefaultTargetPlatformOverride = null; // Reset to default

      enablePlatformOverrideForDesktop();

      if (Platform.isWindows || Platform.isLinux) {
        expect(debugDefaultTargetPlatformOverride, TargetPlatform.fuchsia);
      } else {
        expect(debugDefaultTargetPlatformOverride, isNull);
      }
    });
  });

  group('Test APP', () {
    setUpAll(() async{
      // Initialize flutter_dotenv for tests
      await dotenv.load(fileName: ".env");
      mockStorageService = MockStorageService();
      mockSecureStorageService = MockSecureStorageService();
      mockL10n = MockL10n();
      mockWakelockService = MockWakelockService();
    });

    testWidgets('MyApp should render SignInPage when userSession is null', (WidgetTester tester) async {
      // Arrange
      when(mockStorageService.storageNotifier).thenReturn(ValueNotifier({}));

      // Act
      await tester.runAsync(() async {
        await tester.pumpWidget(
          MyApp(
            l10n: mockL10n,
            storageService: mockStorageService,
            secureStorageService: mockSecureStorageService,
            wakelockService: mockWakelockService,
          ),
        );
        await tester.pumpAndSettle();
      });

      // Assert
      expect(find.byType(SignInPage), findsOneWidget);
    });

    testWidgets('MyApp should render DashboardPage when userSession is not null', (WidgetTester tester) async {
      // Arrange
      when(mockStorageService.storageNotifier).thenReturn(ValueNotifier({'user': {'last_name': "last_name"}}));

      // Act
      await tester.runAsync(() async {
        await tester.pumpWidget(
          MyApp(
            l10n: mockL10n,
            storageService: mockStorageService,
            secureStorageService: mockSecureStorageService,
            wakelockService: mockWakelockService,
          ),
        );
        await tester.pumpAndSettle();
      });

      // Assert
      expect(find.byType(DashboardPage), findsOneWidget);
    });

  });

}
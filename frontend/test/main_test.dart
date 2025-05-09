
import 'dart:io';
import 'package:firebase_auth_mocks/firebase_auth_mocks.dart';
import 'package:flutter/foundation.dart';
import 'package:flutter_dotenv/flutter_dotenv.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:frontend/api/unauthenticated_api_service.dart';
import 'package:frontend/main.dart'; // Adjust the import path as needed
import 'package:mockito/mockito.dart';
import 'package:frontend/pages/sign_in_up/sign_in_page.dart';
import 'package:frontend/pages/dashboard/dashboard.dart';
import 'package:frontend/utils/utils.dart';
import 'package:google_sign_in_mocks/google_sign_in_mocks.dart';
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
  late ThirdPartyAuthService thirdPartyAuthService;
  late MockFirebaseAuth mockAuth;
  late MockGoogleSignIn mockGoogleSignIn;
  
  final platform = getPlatformType();

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

      enablePlatformOverrideForDesktop(platform);

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
      mockAuth = MockFirebaseAuth();
      mockGoogleSignIn = MockGoogleSignIn();
      thirdPartyAuthService = ThirdPartyAuthService(auth: mockAuth, googleSignIn: mockGoogleSignIn);
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
            thirdPartyAuthService: thirdPartyAuthService,
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
            thirdPartyAuthService: thirdPartyAuthService,
          ),
        );
        await tester.pumpAndSettle();
      });

      // Assert
      expect(find.byType(DashboardPage), findsOneWidget);
    });

  });

}
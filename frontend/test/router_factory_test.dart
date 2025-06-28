
import 'mocks/test_helper.dart';
import 'package:flutter_dotenv/flutter_dotenv.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:firebase_auth_mocks/firebase_auth_mocks.dart';
import 'package:frontend/pages/dashboard/dashboard.dart';
import 'package:frontend/pages/sign_in_up/sign_in_page.dart';
import 'package:frontend/components/app_splash_screen.dart';
import 'package:frontend/api/unauthenticated_api_service.dart';
import 'package:frontend/main.dart';
import 'package:frontend/storage/storage.dart';
import 'package:mockito/mockito.dart';
import 'package:google_sign_in_mocks/google_sign_in_mocks.dart';
import 'package:flutter/material.dart';

class MockStorageService extends Mock implements StorageService {}
class MockSecureStorageService extends Mock implements SecureStorageService {}

void main() {
  
  setUpAll(() async{
    // Initialize flutter_dotenv for tests
    await dotenv.load(fileName: ".env");
  });
  group('Router creation functions', () {
    late MockL10n mockL10n;
    late MockStorageService mockStorageService;
    late MockSecureStorageService mockSecureStorageService;
    late ThirdPartyAuthService thirdPartyAuthService;
    late MockFirebaseAuth mockAuth;
    late MockGoogleSignIn mockGoogleSignIn;

    setUp(() {
      mockL10n = MockL10n();
      mockStorageService = MockStorageService();
      mockSecureStorageService = MockSecureStorageService();
      mockAuth = MockFirebaseAuth();
      mockGoogleSignIn = MockGoogleSignIn();
      thirdPartyAuthService = ThirdPartyAuthService(auth: mockAuth, googleSignIn: mockGoogleSignIn);
    });

    testWidgets('CreateAuthenticatedRouter navigates to DashboardPage', (WidgetTester tester) async {
      final storage = {'user': {'id': 1}};
      final router = createAuthenticatedRouter(
        mockL10n, storage, mockStorageService, mockSecureStorageService, thirdPartyAuthService,
      );
      await tester.pumpWidget(MaterialApp.router(routerConfig: router));
      await tester.pumpAndSettle();
      expect(find.byType(DashboardPage), findsOneWidget);
    });

    testWidgets('CreateUnautenticatedRouter navigates to SignInPage', (WidgetTester tester) async {
      final storage = {};
      final router = createUnautenticatedRouter(
        mockL10n, storage, mockStorageService, mockSecureStorageService, thirdPartyAuthService,
      );
      await tester.pumpWidget(MaterialApp.router(routerConfig: router));
      await tester.pumpAndSettle();
      expect(find.byType(SignInPage), findsOneWidget);
    });

    testWidgets('CreateLoadingRouter shows AppSplashScreen', (WidgetTester tester) async {
      final router = createLoadingRouter('TestApp');
      await tester.pumpWidget(MaterialApp.router(routerConfig: router));
      await tester.pump();
      expect(find.byType(AppSplashScreen), findsOneWidget);
    });
  
  });
}

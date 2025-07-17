import 'mocks/test_helper.dart';
import 'package:flutter_dotenv/flutter_dotenv.dart';
import 'package:flutter/material.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:firebase_auth_mocks/firebase_auth_mocks.dart';
import 'package:frontend_flutter/api/unauthenticated_api_service.dart';
import 'package:frontend_flutter/components/app_splash_screen.dart';
import 'package:frontend_flutter/main.dart';
import 'package:frontend_flutter/pages/dashboard/dashboard.dart';
import 'package:frontend_flutter/pages/profile/profile.dart';
import 'package:frontend_flutter/pages/sign_in_up/sign_in_page.dart';
import 'package:frontend_flutter/storage/storage.dart';
import 'package:frontend_flutter/utils/utils.dart';
import 'package:google_sign_in_mocks/google_sign_in_mocks.dart';
import 'package:mockito/mockito.dart';
import 'package:web_socket_channel/web_socket_channel.dart';

class MockStorageService extends Mock implements StorageService {}
class MockSecureStorageService extends Mock implements SecureStorageService {}


class MockWebSocketChannel extends Mock implements WebSocketChannel {}

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
    late WebSocketChannel? profileChannel;

    const mockUserSession = {
      "first_name": "John",
      "last_name": "Doe",
      "email": "john@example.com",
      "username": "johndoe",
      "user_birthday": "1990-01-01",
      "user_gender": "male",
      "user_image_url": "http://example.com/image.jpg",
      "user_initials_bg_color": "#FF0000",
      "user_phone_number": "+212612505257",
    };

    setUp(() {
      mockL10n = MockL10n();
      mockStorageService = MockStorageService();
      mockSecureStorageService = MockSecureStorageService();
      mockAuth = MockFirebaseAuth();
      mockGoogleSignIn = MockGoogleSignIn();
      thirdPartyAuthService = ThirdPartyAuthService(auth: mockAuth, googleSignIn: mockGoogleSignIn);
      profileChannel = null;
    });

    testWidgets('CreateAuthenticatedRouter navigates to DashboardPage', (WidgetTester tester) async {
      final storage = {'user': {'id': 1}};
      final router = createAuthenticatedRouter(
        mockL10n, storage, mockStorageService, mockSecureStorageService, thirdPartyAuthService,
        profileChannel: profileChannel,
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
  
    testWidgets('ProfilePage receives profileChannel when authenticated', (WidgetTester tester) async {
      final storage = {'user': mockUserSession};
      final mockProfileChannel = MockWebSocketChannel();
      final router = createAuthenticatedRouter(
        mockL10n, storage, mockStorageService, mockSecureStorageService, thirdPartyAuthService,
        profileChannel: mockProfileChannel,
      );
      await tester.pumpWidget(MaterialApp.router(routerConfig: router));
      await tester.pumpAndSettle();
      router.go(routeProfile);
      await tester.pumpAndSettle();
      final profilePage = tester.widget<ProfilePage>(find.byType(ProfilePage));
      expect(profilePage.profileChannel, mockProfileChannel);
    });

  });
  
}

import 'dart:async';
import 'dart:io';
import 'package:firebase_auth_mocks/firebase_auth_mocks.dart';
import 'package:flutter/foundation.dart';
import 'package:flutter/material.dart';
import 'package:flutter_dotenv/flutter_dotenv.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:frontend/api/unauthenticated_api_service.dart';
import 'package:frontend/components/app_splash_screen.dart';
import 'package:frontend/components/message_banner.dart';
import 'package:frontend/main.dart'; // Adjust the import path as needed
import 'package:frontend/pages/sign_in_up/sign_in_page.dart';
import 'package:frontend/pages/dashboard/dashboard.dart';
import 'package:frontend/services/device_id_service.dart'; // Device ID service for multi-device sync
import 'package:frontend/utils/platform_detector.dart';
import 'package:frontend/utils/utils.dart';
import 'package:google_sign_in_mocks/google_sign_in_mocks.dart';
import 'package:mockito/annotations.dart';
import 'package:mockito/mockito.dart';
import 'package:web_socket_channel/web_socket_channel.dart';
import './main_test.mocks.dart';
import './mocks/mocks.mocks.dart';
import './mocks/test_helper.dart';
import './mocks/wakelock.mocks.dart';


@GenerateMocks([WebSocketChannel, WebSocketSink])


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
  late MockWebSocketChannel mockProfileChannel;
  late StreamController<String> mockProfileController;
  late bool useWebsockets;

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
      // --- WebSocketChannel Mock Setup ---
      final mockSink = MockWebSocketSink();
      mockProfileChannel = MockWebSocketChannel();
      mockProfileController = StreamController<String>.broadcast();
      when(mockProfileChannel.stream).thenAnswer((_) => mockProfileController.stream);
      when(mockProfileChannel.sink).thenReturn(mockSink);
      when(mockSink.done).thenAnswer((_) async {});
      when(mockSink.close(any, any)).thenAnswer((_) async {});
    });
    tearDownAll(() async {
      await mockProfileController.close();
    });

    testWidgets('MyApp should render SignInPage when userSession is null', (WidgetTester tester) async {
      // Arrange
      final notifier = ValueNotifier(<String, dynamic>{});
      when(mockStorageService.storageNotifier).thenReturn(notifier);

      // Act
      await tester.runAsync(() async {
        await tester.pumpWidget(
          MyApp(
            l10n: mockL10n,
            storageService: mockStorageService,
            secureStorageService: mockSecureStorageService,
            wakelockService: mockWakelockService,
            thirdPartyAuthService: thirdPartyAuthService,
            profileChannel: mockProfileChannel,
            isTest: true, // Use the mock profile channel for testing
          ),
        );
      });

      // Assert
      expect(find.byType(AppSplashScreen), findsOneWidget);
          
      notifier.value = {'user': null};
      // Allow navigation and rebuilds to complete
      await tester.pump(); // process the notifier change
      await tester.pump(const Duration(milliseconds: 1000)); // let router animate
      await tester.pump(const Duration(seconds: 3)); // let splash/navigate finish

      expect(find.byType(SignInPage), findsOneWidget);
      // Clean up: dispose the widget tree to cancel timers
      await tester.pumpWidget(Container());
      await tester.pump(); // let disposals complete
      await tester.pump(const Duration(seconds: 6)); // let any pending timers fire and be cancelled
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
            profileChannel: mockProfileChannel,
            isTest: true, // Use the mock profile channel for testing
          ),
        );
        await tester.pumpAndSettle();
      });

      // Assert
      expect(find.byType(DashboardPage), findsOneWidget);
    });
  });

  group('WebSocket integration', () {
    setUp(() async{
      // Initialize flutter_dotenv for tests
      await dotenv.load(fileName: ".env");
      useWebsockets = dotenv.env['USE_WEBSOCKETS']?.toLowerCase() == 'true';
      mockStorageService = MockStorageService();
      mockSecureStorageService = MockSecureStorageService();
      mockL10n = MockL10n();
      mockWakelockService = MockWakelockService();
      mockAuth = MockFirebaseAuth();
      mockGoogleSignIn = MockGoogleSignIn();
      thirdPartyAuthService = ThirdPartyAuthService(auth: mockAuth, googleSignIn: mockGoogleSignIn);
      // --- WebSocketChannel Mock Setup ---
      final mockSink = MockWebSocketSink();
      mockProfileChannel = MockWebSocketChannel();
      mockProfileController = StreamController<String>.broadcast();
      when(mockProfileChannel.stream).thenAnswer((_) => mockProfileController.stream);
      when(mockProfileChannel.sink).thenReturn(mockSink);
      when(mockSink.done).thenAnswer((_) async {});
      when(mockSink.close(any, any)).thenAnswer((_) async {});
    });
    tearDown(() async {
      await mockProfileController.close();
    });
    testWidgets('WebSocket channel is closed on logout and recreated on login', (WidgetTester tester) async {
      // Arrange
      final notifier = ValueNotifier(<String, dynamic>{});
      notifier.value = {'user': mockUserSession};
      when(mockStorageService.storageNotifier).thenReturn(notifier);

      await tester.runAsync(() async {
        await tester.pumpWidget(
          MyApp(
            l10n: mockL10n,
            storageService: mockStorageService,
            secureStorageService: mockSecureStorageService,
            wakelockService: mockWakelockService,
            thirdPartyAuthService: thirdPartyAuthService,
            profileChannel: mockProfileChannel,
            isTest: true, // Use the mock profile channel for testing
          ),
        );
      });
      expect(find.byType(DashboardPage), findsOneWidget);

      // Simulate logout
      notifier.value = {'user': null};
      // Allow navigation and rebuilds to complete
      await tester.pump(); // process the notifier change
      await tester.pump(const Duration(milliseconds: 1000)); // let router animate
      await tester.pump(const Duration(seconds: 3)); 
      expect(find.byType(SignInPage), findsOneWidget);
      // Simulate login again
      notifier.value = {'user': mockUserSession};
      await tester.pumpAndSettle();
      expect(find.byType(DashboardPage), findsOneWidget);
    });

    testWidgets('Handles profile_update message and updates storage when device id not sent', (WidgetTester tester) async {
      final notifier = ValueNotifier({'user': mockUserSession});
      when(mockStorageService.storageNotifier).thenReturn(notifier);

      await tester.runAsync(() async {
        await tester.pumpWidget(
          MyApp(
            l10n: mockL10n,
            storageService: mockStorageService,
            secureStorageService: mockSecureStorageService,
            wakelockService: mockWakelockService,
            thirdPartyAuthService: thirdPartyAuthService,
            profileChannel: mockProfileChannel,
            isTest: true, // Use the mock profile channel for testing
          ),
        );
        // Simulate incoming profile_update message
        final message = '{"type": "profile_update", "new_profile_data": {"last_name": "new_last_name"}}';
        mockProfileController.add(message);
        await tester.pump(); // process the notifier change
        await tester.pump(const Duration(milliseconds: 1000)); // let router animate
        await tester.pumpAndSettle();
        await Future.delayed(Duration(seconds: 2));
        if(useWebsockets){
          verify(mockStorageService.set(key:"user", obj: {"last_name": "new_last_name"}, updateNotifier: true, notifierToUpdate: "storage")).called(1);
        }
        else{
          verifyNever(mockStorageService.set(key:"user", obj: {"last_name": "new_last_name"}, updateNotifier: true, notifierToUpdate: "storage"));
        }
      });
    });

    testWidgets('Handles profile_update message and updates storage when device id is sent and it is different to the sender device id', (WidgetTester tester) async {
      final notifier = ValueNotifier({'user': mockUserSession});
      when(mockStorageService.storageNotifier).thenReturn(notifier);

      await tester.runAsync(() async {
        await tester.pumpWidget(
          MyApp(
            l10n: mockL10n,
            storageService: mockStorageService,
            secureStorageService: mockSecureStorageService,
            wakelockService: mockWakelockService,
            thirdPartyAuthService: thirdPartyAuthService,
            profileChannel: mockProfileChannel,
            isTest: true, // Use the mock profile channel for testing
          ),
        );
        // Simulate incoming profile_update message
        final message = '{"type": "profile_update", "new_profile_data": {"last_name": "new_last_name"}, "device_id": "other_device_id"}';
        mockProfileController.add(message);
        await tester.pump(); // process the notifier change
        await tester.pump(const Duration(milliseconds: 1000)); // let router animate
        await tester.pumpAndSettle();
        await Future.delayed(Duration(seconds: 2));
        if(useWebsockets){
          verify(mockStorageService.set(key:"user", obj: {"last_name": "new_last_name"}, updateNotifier: true, notifierToUpdate: "storage")).called(1);
        }
        else{
          verifyNever(mockStorageService.set(key:"user", obj: {"last_name": "new_last_name"}, updateNotifier: true, notifierToUpdate: "storage"));
        }
      });
    });

    testWidgets('Handles profile_update message and updates storage when device id is sent and it is equal to the sender device id', (WidgetTester tester) async {
      final notifier = ValueNotifier({'user': mockUserSession});
      when(mockStorageService.storageNotifier).thenReturn(notifier);

      await tester.runAsync(() async {
        await tester.pumpWidget(
          MyApp(
            l10n: mockL10n,
            storageService: mockStorageService,
            secureStorageService: mockSecureStorageService,
            wakelockService: mockWakelockService,
            thirdPartyAuthService: thirdPartyAuthService,
            profileChannel: mockProfileChannel,
            isTest: true, // Use the mock profile channel for testing
          ),
        );
        // Simulate sender device id
        final senderDeviceId = await DeviceIdService.instance.getDeviceId();
        
        // Simulate incoming profile_update message
        final message = '{"type": "profile_update", "new_profile_data": {"last_name": "new_last_name"}, "device_id": "$senderDeviceId"}';

        mockProfileController.add(message);
        await tester.pump(); // process the notifier change
        await tester.pump(const Duration(milliseconds: 1000)); // let router animate
        await tester.pumpAndSettle();
        await Future.delayed(Duration(seconds: 2));
        if(useWebsockets){
          verifyNever(mockStorageService.set(key:"user", obj: {"last_name": "new_last_name"}, updateNotifier: true, notifierToUpdate: "storage"));
        }
        else{
          verifyNever(mockStorageService.set(key:"user", obj: {"last_name": "new_last_name"}, updateNotifier: true, notifierToUpdate: "storage"));
        }
      });
    });

    testWidgets('Shows error banner on WebSocket connection failure', (WidgetTester tester) async {
      final notifier = ValueNotifier({'user': {'last_name': "last_name"}});
      when(mockStorageService.storageNotifier).thenReturn(notifier);

      await tester.runAsync(() async {
        await tester.pumpWidget(
          MyApp(
            l10n: mockL10n,
            storageService: mockStorageService,
            secureStorageService: mockSecureStorageService,
            wakelockService: mockWakelockService,
            thirdPartyAuthService: thirdPartyAuthService,
            profileChannel: null, // triggers error banner
            isTest: true,
          ),
        );
        await tester.pump(); // let the widget build
        await tester.pump(const Duration(milliseconds: 100)); // let the banner appear
        if(useWebsockets){
          expect(find.byType(MessageBanner), findsOne);
          expect(find.textContaining('Profile WebSocket connection failed'), findsOne);
        }
        else{
          expect(find.byType(MessageBanner), findsNothing);
          expect(find.textContaining('Profile WebSocket connection failed'), findsNothing);
        }
        await tester.pump(); // let the widget build
        // If you want to test auto-dismiss after 5 seconds:
        await tester.pump(const Duration(seconds: 15));
        await Future.delayed(Duration(seconds: bannerMessageDefaultDuration + 1));
        await tester.pump(); // allow timer callback to run
        expect(find.byType(MessageBanner), findsNothing);
      });
    });
  
  });

}
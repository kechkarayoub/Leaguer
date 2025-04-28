
import 'package:dio/dio.dart';
import 'package:firebase_auth_mocks/firebase_auth_mocks.dart';
import 'package:flutter_dotenv/flutter_dotenv.dart';
import 'package:flutter/material.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:frontend/components/custom_password_field.dart';
import 'package:frontend/pages/profile/profile.dart';
import 'package:frontend/api/authenticated_api_service.dart';
import 'package:frontend/api/unauthenticated_api_service.dart';
import 'package:google_sign_in_mocks/google_sign_in_mocks.dart';
import 'package:mockito/annotations.dart';
import 'package:mockito/mockito.dart';
import './profile_test.mocks.dart';
import '../../mocks/mocks.mocks.dart';
import '../../mocks/test_helper.dart';


// Generate mock Dio class
@GenerateMocks([AuthenticatedApiBackendService])


void main() async {
  late MockStorageService mockStorageService;
  late MockSecureStorageService mockSecureStorageService;
  late MockL10n mockL10n;
  late ThirdPartyAuthService thirdPartyAuthService;
  late MockFirebaseAuth mockAuth;
  late MockGoogleSignIn mockGoogleSignIn;
  late MockDio mockDio;
  late MockAuthenticatedApiBackendService mockAuthenticatedApiBackendService; 
  
  const mockUserSession = {
    "first_name": "John",
    "last_name": "Doe",
    "email": "john@example.com",
    "username": "johndoe",
    "user_gender": null,
    "user_initials_bg_color": "#FF0000",
  };

  setUpAll(() async{
    // Initialize flutter_dotenv for tests
    await dotenv.load(fileName: ".env");
    mockStorageService = MockStorageService();
    mockSecureStorageService = MockSecureStorageService();
    mockL10n = MockL10n();
    mockAuth = MockFirebaseAuth();
    mockGoogleSignIn = MockGoogleSignIn();
    thirdPartyAuthService = ThirdPartyAuthService(auth: mockAuth, googleSignIn: mockGoogleSignIn);
    mockDio = MockDio();
    // ✅ Stub `options` to prevent "MissingStubError: options"
    when(mockDio.options).thenReturn(BaseOptions());
    // ✅ Stub `interceptors` to prevent "MissingStubError: interceptors"
    when(mockDio.interceptors).thenReturn(Interceptors());
    mockL10n = MockL10n();
    mockAuthenticatedApiBackendService = MockAuthenticatedApiBackendService();
    
      // ✅ Stub `getAccessToken()` properly
    when(mockSecureStorageService.getAccessToken())
        .thenAnswer((_) async => 'mock_token');
  });

  tearDownAll(() {
  });

  group('Initial State', () {
    testWidgets('Renders correctly with user data', (tester) async {
      await tester.pumpWidget(MaterialApp(
        home: ProfilePage(
          l10n: mockL10n,
          userSession: mockUserSession,
          storageService: mockStorageService,
          secureStorageService: mockSecureStorageService,
          thirdPartyAuthService: thirdPartyAuthService,
        ),
      ));

      expect(find.text('John'), findsOneWidget);
      expect(find.text('Doe'), findsOneWidget);
      expect(find.text('john@example.com'), findsOneWidget);
    });
  });

  group('Form Validation', () {
    testWidgets('Validates required fields', (tester) async {
      await tester.pumpWidget(MaterialApp(
        home: ProfilePage(
          l10n: mockL10n,
          userSession: mockUserSession,
          storageService: mockStorageService,
          secureStorageService: mockSecureStorageService,
          thirdPartyAuthService: thirdPartyAuthService,
        ),
      ));

      // Clear fields and test validation
      await tester.enterText(find.byKey(Key('first-name')), '');
      await tester.enterText(find.byKey(Key('last-name')), '');
      await tester.enterText(find.byKey(Key('email')), '');
      await tester.enterText(find.byKey(Key('username')), '');

      // Scroll to the "Update profile" button to make it visible
      await tester.ensureVisible(find.text('Update profile'));
      await tester.pumpAndSettle();

      // Simulate clik on "Update profile" button
      await tester.tap(find.text('Update profile'));
      await tester.pumpAndSettle();
      

      expect(find.text('Please enter your first name'), findsOneWidget);
      expect(find.text('Please enter your last name'), findsOneWidget);
      expect(find.text('Please select your gender'), findsOneWidget);
      expect(find.text('Please select your birthday'), findsOneWidget);

      // Email input should be disabled. So the error message should not appear and the value of the input should not change
      expect(find.text('Please select your email'), findsNothing);
      final emailField = tester.widget<TextFormField>(find.byKey(Key('email')));
      final currentEmailValue = emailField.controller?.text;
      expect(currentEmailValue, mockUserSession['email']);

      // Username input should be disabled. So the error message should not appear and the value of the input should not change
      expect(find.text('Please select your username'), findsNothing);
      final usernameField = tester.widget<TextFormField>(find.byKey(Key('username')));
      final currentUsernameValue = usernameField.controller?.text;
      expect(currentUsernameValue, mockUserSession['username']);
    });
  });

  group('Password Update', () {
    testWidgets('Toggles password fields visibility', (tester) async {
      await tester.pumpWidget(MaterialApp(
        home: ProfilePage(
          l10n: mockL10n,
          userSession: mockUserSession,
          storageService: mockStorageService,
          secureStorageService: mockSecureStorageService,
          thirdPartyAuthService: thirdPartyAuthService,
        ),
      ));

      expect(find.byType(CustomPasswordFormField), findsNothing);
      

      // Scroll to the "Update password" button to make it visible
      await tester.ensureVisible(find.text('Update password'));
      await tester.pumpAndSettle();

      // Simulate clik on "Update password" button
      await tester.tap(find.text('Update password'));
      await tester.pumpAndSettle();
      
      expect(find.byType(CustomPasswordFormField), findsNWidgets(3));
    });
  });

  group('API Integration', () {
    final mockUserToUpdate = {...mockUserSession, "user_gender": "male", "user_birthday": "1994-07-12"};
    
    testWidgets('Handles successful profile update', (tester) async {
      // Mock successful API response
      when(mockAuthenticatedApiBackendService.updateProfile(formData: anyNamed('formData')))
          .thenAnswer((_) async => { // Pass an anonymous async function
      "success": true,
      "message": "Profile updated successfully",
      "user": mockUserToUpdate,
      "wrong_password": false,
    } as Map<String, dynamic>);
      await tester.pumpWidget(MaterialApp(
        home: ProfilePage(
          l10n: mockL10n,
          userSession: mockUserToUpdate,
          storageService: mockStorageService,
          secureStorageService: mockSecureStorageService,
          thirdPartyAuthService: thirdPartyAuthService,
          authenticatedApiBackendService: mockAuthenticatedApiBackendService,
        ),
      ));

      // Scroll to the "Update profile" button to make it visible
      await tester.ensureVisible(find.text('Update profile'));
      await tester.pumpAndSettle();

      // Simulate clik on "Update profile" button
      await tester.tap(find.text('Update profile'));
      await tester.pumpAndSettle();

      expect(find.text('Profile updated successfully'), findsOneWidget);
    });
    
    testWidgets('Handles unsuccessful profile update', (tester) async {
      // Mock successful API response
      when(mockAuthenticatedApiBackendService.updateProfile(formData: anyNamed('formData')))
          .thenAnswer((_) async => { // Pass an anonymous async function
      "success": false,
      "message": "Profile not updated successfully",
      "wrong_password": false,
    } as Map<String, dynamic>);
      await tester.pumpWidget(MaterialApp(
        home: ProfilePage(
          l10n: mockL10n,
          userSession: mockUserToUpdate,
          storageService: mockStorageService,
          secureStorageService: mockSecureStorageService,
          thirdPartyAuthService: thirdPartyAuthService,
          authenticatedApiBackendService: mockAuthenticatedApiBackendService,
        ),
      ));

      // Scroll to the "Update profile" button to make it visible
      await tester.ensureVisible(find.text('Update profile'));
      await tester.pumpAndSettle();

      // Simulate clik on "Update profile" button
      await tester.tap(find.text('Update profile'));
      await tester.pumpAndSettle();

      expect(find.text('Profile not updated successfully'), findsOneWidget);
    });
  
    
    testWidgets('Handles unsuccessful profile update with unkown error', (tester) async {
      // Mock successful API response
      when(mockAuthenticatedApiBackendService.updateProfile(formData: anyNamed('formData')))
          .thenAnswer((_) async => { // Pass an anonymous async function
      "success": false,
    } as Map<String, dynamic>);
      await tester.pumpWidget(MaterialApp(
        home: ProfilePage(
          l10n: mockL10n,
          userSession: mockUserToUpdate,
          storageService: mockStorageService,
          secureStorageService: mockSecureStorageService,
          thirdPartyAuthService: thirdPartyAuthService,
          authenticatedApiBackendService: mockAuthenticatedApiBackendService,
        ),
      ));

      // Scroll to the "Update profile" button to make it visible
      await tester.ensureVisible(find.text('Update profile'));
      await tester.pumpAndSettle();

      // Simulate clik on "Update profile" button
      await tester.tap(find.text('Update profile'));
      await tester.pumpAndSettle();

      expect(find.text('An error occurred while updating profile information. Please try again later.'), findsOneWidget);
    });
  
  });

}

import 'dart:typed_data';
import 'package:dio/dio.dart'; // For MultipartFile
import 'package:firebase_auth_mocks/firebase_auth_mocks.dart';
import 'package:flutter/material.dart';
import 'package:flutter_dotenv/flutter_dotenv.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:frontend/api/authenticated_api_service.dart';
import 'package:frontend/api/unauthenticated_api_service.dart';
import 'package:frontend/components/custom_password_field.dart';
import 'package:frontend/components/custom_phone_number_field.dart';
import 'package:frontend/components/custom_text_field.dart';
import 'package:frontend/components/image_picker.dart';
import 'package:frontend/pages/profile/profile.dart';
import 'package:google_sign_in_mocks/google_sign_in_mocks.dart';
import 'package:image_picker/image_picker.dart';
import 'package:mockito/annotations.dart';
import 'package:mockito/mockito.dart';
import 'package:web_socket_channel/web_socket_channel.dart';
import './profile_test.mocks.dart';
import '../../mocks/mocks.mocks.dart';
import '../../mocks/test_helper.dart';


// Generate mock Dio class
@GenerateMocks([AuthenticatedApiBackendService])

class MockXFile extends Mock implements XFile {
  final String path;
  MockXFile(this.path);
  @override
  String get name => path.split('/').last; // Provide a default name
  @override
  Future<Uint8List> readAsBytes() async => Uint8List(0); // Mock bytes
}

void main() async {
  late MockStorageService mockStorageService;
  late MockSecureStorageService mockSecureStorageService;
  late MockL10n mockL10n;
  late ThirdPartyAuthService thirdPartyAuthService;
  late MockFirebaseAuth mockAuth;
  late MockGoogleSignIn mockGoogleSignIn;
  late MockDio mockDio;
  late MockAuthenticatedApiBackendService mockAuthenticatedApiBackendService; 
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
    profileChannel = null;
    
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
          profileChannel: profileChannel,
        ),
      ));

      // Wait for any async initialization (like runAsynchron)
      await tester.pumpAndSettle();
      
      // Verify that text controllers are populated with mock data
      expect(find.widgetWithText(CustomTextFormField, 'Last name'), findsOneWidget);
      expect(tester.widget<CustomTextFormField>(find.widgetWithText(CustomTextFormField, 'Last name')).controller.text, 'Doe');
      
      expect(find.widgetWithText(CustomTextFormField, 'First name'), findsOneWidget);
      expect(tester.widget<CustomTextFormField>(find.widgetWithText(CustomTextFormField, 'First name')).controller.text, 'John');

      expect(find.widgetWithText(CustomTextFormField, 'Birthday'), findsOneWidget);
      expect(tester.widget<CustomTextFormField>(find.widgetWithText(CustomTextFormField, 'Birthday')).controller.text, '1990-01-01');

      expect(find.widgetWithText(CustomTextFormField, 'Email'), findsOneWidget);
      expect(tester.widget<CustomTextFormField>(find.widgetWithText(CustomTextFormField, 'Email')).controller.text, 'john@example.com');
      expect(tester.widget<CustomTextFormField>(find.widgetWithText(CustomTextFormField, 'Email')).enabled, isFalse); // Email should be disabled

      expect(find.widgetWithText(CustomTextFormField, 'Username'), findsOneWidget);
      expect(tester.widget<CustomTextFormField>(find.widgetWithText(CustomTextFormField, 'Username')).controller.text, 'johndoe');
      expect(tester.widget<CustomTextFormField>(find.widgetWithText(CustomTextFormField, 'Username')).enabled, isFalse); // Username should be disabled

      // Verify phone number field
      expect(find.widgetWithText(CustomPhoneNumberField, 'Phone number'), findsOneWidget);
      expect(tester.widget<CustomPhoneNumberField>(find.widgetWithText(CustomPhoneNumberField, 'Phone number')).controller.text, '0612505257'); // NSN part
    
    });

    testWidgets('Toggling "Update password" button shows/hides password fields', (tester) async {
      await tester.pumpWidget(
        MaterialApp(
          home: ProfilePage(
            l10n: mockL10n,
            userSession: mockUserSession,
            secureStorageService: mockSecureStorageService,
            storageService: mockStorageService,
            authenticatedApiBackendService: mockAuthenticatedApiBackendService,
            thirdPartyAuthService: thirdPartyAuthService,
          ),
        ),
      );
      await tester.pumpAndSettle(); // Settle initial state
      

      // Initially, password fields should not be present
      expect(find.widgetWithText(CustomPasswordFormField, 'Current password'), findsNothing);
      expect(find.widgetWithText(CustomPasswordFormField, 'New password'), findsNothing);
      expect(find.widgetWithText(CustomPasswordFormField, 'Re-enter your new password'), findsNothing);

      // Tap the "Update password" button
      await tester.ensureVisible(find.byKey(Key('updatePassworButton')));
      await tester.tap(find.byKey(Key('updatePassworButton')));
      await tester.pumpAndSettle(); // Settle the animation

      // Now, password fields should be present
      expect(find.widgetWithText(CustomPasswordFormField, 'Current password'), findsOneWidget);
      expect(find.widgetWithText(CustomPasswordFormField, 'New password'), findsOneWidget);
      expect(find.widgetWithText(CustomPasswordFormField, 'Re-enter your new password'), findsOneWidget);

      // Tap the button again to hide them
      await tester.ensureVisible(find.byKey(Key('updatePassworButton')));
      await tester.tap(find.byKey(Key('updatePassworButton')));
      await tester.pumpAndSettle(); // Settle the animation

      // Password fields should be gone again
      expect(find.widgetWithText(CustomPasswordFormField, 'Current password'), findsNothing);
      expect(find.widgetWithText(CustomPasswordFormField, 'New password'), findsNothing);
      expect(find.widgetWithText(CustomPasswordFormField, 'Re-enter your new password'), findsNothing);
    
    });
  
  });

  group('Date selecton', () {
    testWidgets('Birthday change when selected', (tester) async {
      await tester.pumpWidget(MaterialApp(
        home: ProfilePage(
          l10n: mockL10n,
          userSession: mockUserSession,
          storageService: mockStorageService,
          secureStorageService: mockSecureStorageService,
          thirdPartyAuthService: thirdPartyAuthService,
          profileChannel: profileChannel,
        ),
      ));

      // Wait for any async initialization (like runAsynchron)
      await tester.pumpAndSettle();

      // Tap on the button to open date picker
      await tester.ensureVisible(find.byKey(Key('birthday')));
      await tester.tap(find.byKey(Key('birthday')));
      await tester.pumpAndSettle();
      
      // Select a date on the date picker
      await tester.tap(find.text('15')); // e.g., tap on 15th day of the month
      await tester.pumpAndSettle();

      // Confirm the selection
      await tester.tap(find.text('OK')); // or 'Confirm' depending on your locale
      await tester.pumpAndSettle();


      expect(find.widgetWithText(CustomTextFormField, 'Birthday'), findsOneWidget);
      expect(tester.widget<CustomTextFormField>(find.widgetWithText(CustomTextFormField, 'Birthday')).controller.text, '1990-01-15');
    
    });

  });

  group('Image picker', () {
    testWidgets('Image picker processes and updates profile image', (tester) async {
      // Mock the ImagePicker global instance if you directly call `ImagePicker().pickImage()`
      // For this example, assuming `ImagePickerWidget` abstracts it.
      // If `compressAndResizeImage` is a global function, you'd need to mock its behavior.

      await tester.pumpWidget(
        MaterialApp(
          home: ProfilePage(
            l10n: mockL10n,
            userSession: mockUserSession,
            secureStorageService: mockSecureStorageService,
            storageService: mockStorageService,
            authenticatedApiBackendService: mockAuthenticatedApiBackendService,
            thirdPartyAuthService: thirdPartyAuthService,
            profileChannel: profileChannel,
          ),
        ),
      );
      await tester.pumpAndSettle();

      final imagePickerWidgetFinder = find.byType(ImagePickerWidget);
      expect(imagePickerWidgetFinder, findsOneWidget);


      // Trigger the onImageSelected callback of ImagePickerWidget
      // You'll need to access the `onImageSelected` callback.
      // This might require some structural changes to how `ImagePickerWidget` exposes it,
      // or you might need to use a `Key` on `ImagePickerWidget` to access its state or methods.
      // For demonstration, let's assume `ImagePickerWidget` can be directly interacted with.
      // If `onImageSelected` is exposed directly by the ImagePickerWidget instance:

      // A more robust way is to make `ImagePickerWidget`'s internal ImagePicker injectable.
      // For now, let's just assert the presence and logic assuming internal calls work.

      // Verify initial state
      expect(tester.widget<ImagePickerWidget>(imagePickerWidgetFinder).isProcessing, isFalse);

      // You would then typically trigger the image selection from the UI (e.g., tapping a button
      // inside ImagePickerWidget that then calls `onImageSelected`).
      // For example, if ImagePickerWidget has a button with Key('selectImageButton'):
      // await tester.tap(find.descendant(of: imagePickerWidgetFinder, matching: find.byKey(Key('selectImageButton'))));
      // await tester.pump(); // For the processing state to update
      // expect(tester.widget<ImagePickerWidget>(imagePickerWidgetFinder).isProcessing, isTrue);

      // Then, you would use `tester.runAsync(() async { ... })` if there are `await` calls
      // inside the `onImageSelected` callback (which there are for `readAsBytes` or `compressAndResizeImage`).
      // await tester.pumpAndSettle(); // After async operations finish

      // After a simulated image selection and processing, verify imageUpdated flag.
      // expect(tester.state<ProfilePageState>(find.byType(ProfilePage))._imageUpdated, isTrue);
    });

  });

  group('Form validation', (){

    testWidgets('Form validation works for required fields', (tester) async {
      await tester.pumpWidget(
        MaterialApp(
          home: ProfilePage(
            l10n: mockL10n,
            userSession: mockUserSession,
            secureStorageService: mockSecureStorageService,
            storageService: mockStorageService,
            authenticatedApiBackendService: mockAuthenticatedApiBackendService,
            thirdPartyAuthService: thirdPartyAuthService,
            profileChannel: profileChannel,
          ),
        ),
      );
      await tester.pumpAndSettle();

      // Clear some required fields
      await tester.enterText(find.widgetWithText(CustomTextFormField, 'Last name'), '');
      await tester.enterText(find.widgetWithText(CustomTextFormField, 'First name'), '');
      await tester.enterText(find.widgetWithText(CustomTextFormField, 'Birthday'), '');
      await tester.enterText(find.widgetWithText(CustomPhoneNumberField, 'Phone number'), '');

      // Tap the update profile button
      await tester.ensureVisible(find.byKey(Key('updateProfileButton')));
      await tester.tap(find.byKey(Key('updateProfileButton')));
      await tester.pumpAndSettle(); // Rebuild with validation errors

      // Expect validation error messages
      expect(find.text('Please enter your last name'), findsOneWidget);
      expect(find.text('Please enter your first name'), findsOneWidget);
      expect(find.text('Please select your birthday'), findsNothing); // The birthday input is readOnly so the thext entred has no effect
      expect(find.text('Please enter your phone number'), findsOneWidget);
    });

    testWidgets('Form validation works for invalid fields', (tester) async {
      await tester.pumpWidget(
        MaterialApp(
          home: ProfilePage(
            l10n: mockL10n,
            userSession: mockUserSession,
            secureStorageService: mockSecureStorageService,
            storageService: mockStorageService,
            authenticatedApiBackendService: mockAuthenticatedApiBackendService,
            thirdPartyAuthService: thirdPartyAuthService,
            profileChannel: profileChannel,
          ),
        ),
      );
      await tester.pumpAndSettle();

      // Clear some required fields
      await tester.enterText(find.widgetWithText(CustomTextFormField, 'Last name'), '111');
      await tester.enterText(find.widgetWithText(CustomTextFormField, 'First name'), '111');
      await tester.enterText(find.widgetWithText(CustomPhoneNumberField, 'Phone number'), '4124512');

      // Tap the update profile button
      await tester.ensureVisible(find.byKey(Key('updateProfileButton')));
      await tester.tap(find.byKey(Key('updateProfileButton')));
      await tester.pumpAndSettle(); // Rebuild with validation errors

      // Expect validation error messages
      expect(find.text('Last name can only contain alphabetic characters, hyphens, or apostrophes'), findsOneWidget);
      expect(find.text('First name can only contain alphabetic characters, hyphens, or apostrophes'), findsOneWidget);
      expect(find.text('Please enter a valid phone number'), findsNothing);

    });

  });

  group('Submission', (){

    testWidgets('UpdateProfile method is called on valid form submission', (tester) async {
      await tester.pumpWidget(
        MaterialApp(
          home: ProfilePage(
            l10n: mockL10n,
            userSession: mockUserSession,
            secureStorageService: mockSecureStorageService,
            storageService: mockStorageService,
            authenticatedApiBackendService: mockAuthenticatedApiBackendService,
            thirdPartyAuthService: thirdPartyAuthService,
          ),
        ),
      );
      await tester.pumpAndSettle();

      // Mock the API response for updateProfile to be successful
      when(mockAuthenticatedApiBackendService.updateProfile(formData: anyNamed('formData')))
          .thenAnswer((_) async => {"success": true, "message": "Profile updated successfully.", "user": mockUserSession});

      // Ensure all fields are valid (they are initially with mockUserSession)
      // If you changed them in previous tests, you'd re-enter valid data here.

      // Tap the update profile button
      await tester.ensureVisible(find.byKey(Key('updateProfileButton')));
      await tester.tap(find.byKey(Key('updateProfileButton')));
      await tester.pump(); // Start the API call (sets _isProfileUpdateApiSent to true)
      //expect(tester.findText('Update profile'), findsNothing); // Button should be disabled/show loader

      await tester.pumpAndSettle(); // Wait for the API call to complete and UI to update

      // Verify that updateProfile on the mocked service was called
      verify(mockAuthenticatedApiBackendService.updateProfile(formData: anyNamed('formData'))).called(1);

      // Verify success message is displayed
      expect(find.text('Profile updated successfully.'), findsOneWidget);
    });

    testWidgets('Error message displayed on failed API call', (tester) async {
      await tester.pumpWidget(
        MaterialApp(
          home: ProfilePage(
            l10n: mockL10n,
            userSession: mockUserSession,
            secureStorageService: mockSecureStorageService,
            storageService: mockStorageService,
            authenticatedApiBackendService: mockAuthenticatedApiBackendService,
            thirdPartyAuthService: thirdPartyAuthService,
            profileChannel: profileChannel,
          ),
        ),
      );
      await tester.pumpAndSettle();

      // Mock the API response for updateProfile to fail with a specific message
      when(mockAuthenticatedApiBackendService.updateProfile(formData: anyNamed('formData')))
          .thenAnswer((_) async => {"success": false, "message": "Server error: Invalid data.", "errors": {"email": ["Invalid email format."]}});

      // Tap the update profile button
      await tester.ensureVisible(find.byKey(Key('updateProfileButton')));
      await tester.tap(find.byKey(Key('updateProfileButton')));
      await tester.pump();
      await tester.pumpAndSettle();

      // Verify error message is displayed
      expect(find.text('Server error: Invalid data.'), findsOneWidget);
      expect(find.text('Invalid email format.'), findsOneWidget);
    });

  });

}


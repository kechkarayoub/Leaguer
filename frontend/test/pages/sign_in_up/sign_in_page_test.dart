
import 'package:firebase_auth_mocks/firebase_auth_mocks.dart';
import 'package:flutter/material.dart';
import 'package:flutter_dotenv/flutter_dotenv.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:frontend/api/unauthenticated_api_service.dart';
import 'package:frontend/pages/sign_in_up/sign_in_page.dart';
import 'package:google_sign_in_mocks/google_sign_in_mocks.dart';

import '../../mocks/mocks.mocks.dart';
import '../../mocks/test_helper.dart';


void main() async{
  late MockStorageService mockStorageService;
  late MockSecureStorageService mockSecureStorageService;
  late MockL10n mockL10n;
  late ThirdPartyAuthService thirdPartyAuthService;
  late MockFirebaseAuth mockAuth;
  late MockGoogleSignIn mockGoogleSignIn;

  setUpAll(() async{
    // Initialize flutter_dotenv for tests
    await dotenv.load(fileName: ".env");
    mockStorageService = MockStorageService();
    mockSecureStorageService = MockSecureStorageService();
    mockL10n = MockL10n();
    mockAuth = MockFirebaseAuth();
    mockGoogleSignIn = MockGoogleSignIn();
    thirdPartyAuthService = ThirdPartyAuthService(auth: mockAuth, googleSignIn: mockGoogleSignIn);
  });
  testWidgets('Sign-in page displays form fields and sign-in button', (WidgetTester tester) async {

    await tester.pumpWidget(MaterialApp(
      home: SignInPage(
        l10n: mockL10n,
        storageService: mockStorageService,
        secureStorageService: mockSecureStorageService,
        thirdPartyAuthService: thirdPartyAuthService, 
      ),
    ));

    // Verify the presence of text fields
    expect(find.byType(TextFormField), findsNWidgets(2));

    // Verify the presence of sign-in button
    expect(find.byKey(Key('signInButton')), findsOneWidget);

    // Verify the presence of google sign-in button if enabled
    if((dotenv.env['ENABLE_LOG_IN_WITH_GOOGLE'] ?? 'false') == "true"){
      expect(find.byKey(Key('googleSignInButton')), findsOneWidget);
    }
    else{
      expect(find.byKey(Key('googleSignInButton')), findsNothing);
    }
  });

  testWidgets('Show error message when submitting empty form', (WidgetTester tester) async {


    await tester.pumpWidget(MaterialApp(
      home: SignInPage(
        l10n: mockL10n,
        storageService: mockStorageService,
        secureStorageService: mockSecureStorageService,
        thirdPartyAuthService: thirdPartyAuthService, 
      ),
    ));

    await tester.tap(find.byKey(Key('signInButton')));
    await tester.pump();

    // Expect validation errors to show up
    expect(find.text("Please enter your password"), findsOneWidget);
    expect(find.text("Please enter your email or username"), findsOneWidget);
  });


  testWidgets('Show error message when submitting invalid email', (WidgetTester tester) async {


    await tester.pumpWidget(MaterialApp(
      home: SignInPage(
        l10n: mockL10n,
        storageService: mockStorageService,
        secureStorageService: mockSecureStorageService,
        thirdPartyAuthService: thirdPartyAuthService, 
      ),
    ));

    // Find text fields
    final emailOrUsernameField = find.byType(TextFormField).first; // Assuming last TextFormField is the password field

    // Simulate entering a wrong
    await tester.enterText(emailOrUsernameField, 'fake@email');

    await tester.tap(find.byKey(Key('signInButton')));
    await tester.pump();

    // Expect validation errors to show up
    expect(find.text("Please enter your password"), findsOneWidget);
    expect(find.text("Please enter a valid email address"), findsOneWidget);
  });

}

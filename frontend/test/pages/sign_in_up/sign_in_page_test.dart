import 'package:flutter/material.dart';
import 'package:flutter_dotenv/flutter_dotenv.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:frontend/pages/sign_in_up/sign_in_page.dart';

import '../../mocks/mocks.mocks.dart';
import '../../mocks/test_helper.dart';


void main() async{
  late MockStorageService mockStorageService;
  late MockSecureStorageService mockSecureStorageService;
  late MockL10n mockL10n;
  setUpAll(() async{
    // Initialize flutter_dotenv for tests
    await dotenv.load(fileName: ".env");
    mockStorageService = MockStorageService();
    mockSecureStorageService = MockSecureStorageService();
    mockL10n = MockL10n();
  });
  testWidgets('Sign-in page displays form fields and sign-in button', (WidgetTester tester) async {

    await tester.pumpWidget(MaterialApp(
      home: SignInPage(
        l10n: mockL10n,
        storageService: mockStorageService,
        secureStorageService: mockSecureStorageService,
      ),
    ));

    // Verify the presence of text fields
    expect(find.byType(TextFormField), findsNWidgets(2));

    // Verify the presence of sign-in button
    expect(find.byKey(Key('signInButton')), findsOneWidget);
  });

  testWidgets('Show error message when submitting empty form', (WidgetTester tester) async {


    await tester.pumpWidget(MaterialApp(
      home: SignInPage(
        l10n: mockL10n,
        storageService: mockStorageService,
        secureStorageService: mockSecureStorageService,
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

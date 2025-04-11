
import 'package:firebase_auth_mocks/firebase_auth_mocks.dart';
import 'package:flutter/material.dart';
import 'package:flutter_dotenv/flutter_dotenv.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:mockito/mockito.dart';
import 'package:frontend/api/unauthenticated_api_service.dart';
import 'package:frontend/l10n/language_picker.dart';
import 'package:frontend/utils/components.dart';
import 'package:frontend/utils/utils.dart';
import 'package:google_sign_in_mocks/google_sign_in_mocks.dart';
import '../mocks/mocks.mocks.dart';
import '../mocks/test_helper.dart';

//import 'package:frontend/storage/storage.dart';

// class MockL10n extends Mock implements L10n {
//   @override
//   String translate(String key, [String? locale]) {
//     return key;
//   }
// }
//class MockStorageService extends Mock implements StorageService {}

void main() {
  late MockL10n mockL10n;
  late MockStorageService mockStorageService;
  late MockSecureStorageService mockSecureStorageService;
  late ThirdPartyAuthService thirdPartyAuthService;
  late MockFirebaseAuth mockAuth;
  late MockGoogleSignIn mockGoogleSignIn;

  setUp(() async{
    mockL10n = MockL10n();
    mockStorageService = MockStorageService();
    mockSecureStorageService = MockSecureStorageService();
    mockAuth = MockFirebaseAuth();
    mockGoogleSignIn = MockGoogleSignIn();
    thirdPartyAuthService = ThirdPartyAuthService(auth: mockAuth, googleSignIn: mockGoogleSignIn);
    // Initialize flutter_dotenv for tests
    await dotenv.load(fileName: ".env");

    // when(mockL10n.translate("Menu", any)).thenReturn("Menu");
    // when(mockL10n.translate("Logout", any)).thenReturn("Logout");
  });

  testWidgets('Drawer menu displays Menu, Profile and Logout options', (WidgetTester tester) async {
    await tester.pumpWidget(
      MaterialApp(
        home: Scaffold(
          appBar: AppBar(title: Text("Test App")),
          drawer: Builder(
            builder: (BuildContext context) {
              return renderDrawerMenu(mockL10n, mockStorageService, mockSecureStorageService, context);
            },
          ),
        ),
      ),
    );


    // Open the drawer using Scaffold's openDrawer()
    await tester.tap(find.byIcon(Icons.menu));
    await tester.pumpAndSettle();

    // Verify Drawer is present
    expect(find.byType(Drawer), findsOneWidget);

    // Verify "Menu" and "Logout" texts appear
    expect(find.text("Menu"), findsOneWidget);
    expect(find.text("Profile"), findsOneWidget);
    expect(find.text("Logout"), findsOneWidget);

  });

  testWidgets('Tapping Logout calls logout function', (WidgetTester tester) async {
    late BuildContext capturedContext; // Capture the context
    await tester.pumpWidget(
      MaterialApp(
        routes: {
          '/sign-in': (context) => Scaffold(body: Container()), // Mock sign-in page
        },  
        home: Builder(builder: (context) {
          capturedContext = context;
          return Scaffold(
            appBar: AppBar(title: Text("Test App")),
            drawer: renderDrawerMenu(
              mockL10n,
              mockStorageService,
              mockSecureStorageService,
              capturedContext, // pass the context directly here
            ),
            body: Container(),
          );
        }),
      ),
    );
    

    // Open the drawer using Scaffold's openDrawer()
    await tester.tap(find.byIcon(Icons.menu));
    await tester.pumpAndSettle();

    // Tap Logout button
    await tester.tap(find.text("Logout"));
    await tester.pumpAndSettle();

    // Verify logout is called with captured context
    verify(logout(mockStorageService, mockSecureStorageService, capturedContext, thirdPartyAuthService)).called(1);
  });


  testWidgets('Should show LanguagePickerDialog when IconButton is tapped', (WidgetTester tester) async {
    // Arrange: Create a testable widget
    await tester.pumpWidget(
      MaterialApp(
        home: Scaffold(
          appBar: AppBar(title: Text("Test App")),
          body: Builder( // Use Builder to get the correct context
            builder: (BuildContext context) {
              return renderLanguagesIcon(mockL10n, mockStorageService, context);
            },
          ),
        ),
      ),
    );

    // Act: Tap the IconButton
    await tester.tap(find.byIcon(Icons.language));
    await tester.pumpAndSettle(); // Wait for animations/dialog

    // Assert: Verify the dialog appears
    expect(find.byType(LanguagePickerDialog), findsOneWidget);
    // Verify the dialog title appears
    expect(find.text("Select Language"), findsOneWidget);

    // Verify all supported languages appear
    expect(find.text("English"), findsOneWidget);
    expect(find.text("French"), findsOneWidget);
    expect(find.text("Arabic"), findsOneWidget);
    await tester.tap(find.text("French"));
    await tester.pumpAndSettle();
    // Verify storage was updated
    verify(mockStorageService.set(
      key: "current_language",
      obj: "fr",
      updateNotifier: true,
    )).called(1);
    expect(find.byType(LanguagePickerDialog), findsNothing);
  });


}

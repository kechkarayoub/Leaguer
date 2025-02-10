import 'package:flutter/material.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:mockito/mockito.dart';
import 'package:frontend/l10n/language_picker.dart';
import 'package:frontend/utils/components.dart';
import 'package:frontend/utils/utils.dart';
import '../mocks.mocks.dart';
import '../test_helper.dart';
import '../storage/storage_test.mocks.dart';

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

  setUp(() {
    mockL10n = MockL10n();
    mockStorageService = MockStorageService();
    mockSecureStorageService = MockSecureStorageService();

    // when(mockL10n.translate("Menu", any)).thenReturn("Menu");
    // when(mockL10n.translate("Logout", any)).thenReturn("Logout");
  });

  testWidgets('Drawer menu displays Menu and Logout options', (WidgetTester tester) async {
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
    expect(find.text("Logout"), findsOneWidget);

  });

  testWidgets('Tapping Logout calls logout function', (WidgetTester tester) async {
    late BuildContext capturedContext; // Capture the context
    await tester.pumpWidget(
      MaterialApp(
        home: Scaffold(
          appBar: AppBar(title: Text("Test App")),
          drawer: Builder(
            builder: (BuildContext context) {
              capturedContext = context; // Capture BuildContext
              
              when(logout(mockStorageService, mockSecureStorageService, capturedContext)).thenAnswer((_) async => Future<void>.value()); // Fix: Return Future<void>
              when(mockStorageService.clear()).thenAnswer((_) async => Future<void>.value()); // Fix: Return Future<void>
              return renderDrawerMenu(mockL10n, mockStorageService, mockSecureStorageService, context);
            },
          ),
        ),
      ),
    );
    

    // Open the drawer using Scaffold's openDrawer()
    await tester.tap(find.byIcon(Icons.menu));
    await tester.pumpAndSettle();

    // Tap Logout button
    await tester.tap(find.text("Logout"));
    await tester.pumpAndSettle();

    // Verify logout is called with captured context
    verify(logout(mockStorageService, mockSecureStorageService, capturedContext)).called(1);
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

import 'package:flutter/material.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:frontend/l10n/language_picker.dart';
import 'package:mockito/mockito.dart';
import '../mocks.mocks.dart'; // Import generated mocks
import '../test_helper.dart';


void main() {
  
  group('LanguagePickerDialog', () {
    late MockStorageService mockStorageService;
    late MockL10n mockL10n;
    late VoidCallback onLanguageSelected;

    setUp(() {
      mockStorageService = MockStorageService();
      mockL10n = MockL10n();
      onLanguageSelected = () {}; // Dummy callback for testing
    });

    testWidgets('Renders correctly with supported languages', (WidgetTester tester) async {
      await tester.pumpWidget(
        MaterialApp(
          home: Scaffold(
            body: LanguagePickerDialog(
              l10n: mockL10n,
              storageService: mockStorageService,
            ),
          ),
        ),
      );

      // Verify the dialog title appears
      expect(find.text("Select Language"), findsOneWidget);

      // Verify all supported languages appear
      expect(find.text("English"), findsOneWidget);
      expect(find.text("French"), findsOneWidget);
      expect(find.text("Arabic"), findsOneWidget);
    });

    testWidgets('Saves selected language and closes dialog', (WidgetTester tester) async {
      // Stub storage service
      when(mockStorageService.set(
        key: "current_language",
        obj: "fr",
        updateNotifier: true,
      )).thenAnswer((_) async => Future<void>.value()); // Fix: Return Future<void>
      await tester.pumpWidget(
        MaterialApp(
          home: Scaffold(
            body: LanguagePickerDialog(
              l10n: mockL10n,
              storageService: mockStorageService,
              onLanguageSelected: onLanguageSelected,
            ),
          ),
        ),
      );

      // Tap on "French"
      await tester.tap(find.text("French"));
      await tester.pumpAndSettle();
      // Verify storage was updated
      verify(mockStorageService.set(
        key: "current_language",
        obj: "fr",
        updateNotifier: true,
      )).called(1);
    });
  
  });
}

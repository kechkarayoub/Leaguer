import 'package:flutter/material.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:frontend/l10n/l10n.dart'; 
import 'package:frontend/components/gender_dropdown.dart';

class MockL10n extends L10n {
  @override
  String translate(String key, String languageCode) {
    final translations = {
      "Gender": {
        "ar": "الجنس",
        "en": "Gender",
        "fr": "Genre"
      },
      "f_gender": {
        "ar": "أنثى",
        "en": "Female",
        "fr": "Femelle"
      },
      "m_gender": {
        "ar": "ذكر",
        "en": "Male",
        "fr": "Mâle"
      },
      "Please select your gender": {
        "ar": "المرجو تحديد جنسك",
        "en": "Please select your gender",
        "fr": "Veuillez sélectionner votre genre"
      },
    };
    // Check if the language map exists, otherwise return the key.
    final languageMap = translations[key];
    if (languageMap == null) {
      return key; // Fallback to the key if no translation exists.
    }

    // Safely access the translation for the languageCode.
    return languageMap[languageCode] ?? key;
  }
}

void main() {
  group('GenderDropdown', () {
    late MockL10n mockL10n;

    setUp(() {
      mockL10n = MockL10n();
      // Stub the translate method
      // when\(mockL10n.translate(any??'', any??'')).thenReturn('mocked translation');
    });

    testWidgets('Renders correctly with initial value', (WidgetTester tester) async {
      // Arrange
      
      // Act
      await tester.pumpWidget(
        MaterialApp(
          home: Scaffold(
            body: GenderDropdown(
              l10n: mockL10n,
              onChanged: (String? gender) {
              },
              initialGender: 'm',
            ),
          ),
        ),
      );

      // Assert
      expect(find.text('Gender'), findsOneWidget); // Verify label
      expect(find.text('Male'), findsOneWidget); // Verify initial value
      expect(find.byType(DropdownButtonFormField<String>), findsOneWidget);
    });

    testWidgets('Invokes onChanged when a gender is selected', (WidgetTester tester) async {
      // Arrange
      String? selectedValue;

      await tester.pumpWidget(
        MaterialApp(
          home: Scaffold(
            body: GenderDropdown(
              l10n: mockL10n,
              onChanged: (String? gender) {
                selectedValue = gender;
              },
              initialGender: null,
            ),
          ),
        ),
      );

      // Act
      await tester.tap(find.byType(DropdownButtonFormField<String>));
      await tester.pumpAndSettle();
      await tester.tap(find.text('Male').last); // Select 'Male'
      await tester.pumpAndSettle();

      // Assert
      expect(selectedValue, equals('m')); // Verify callback was triggered with 'm'
    });

    testWidgets('Shows validation error when no gender is selected', (WidgetTester tester) async {
      // Arrange
      final formKey = GlobalKey<FormState>();

      await tester.pumpWidget(
        MaterialApp(
          home: Scaffold(
            body: Form(
              key: formKey,
              child: GenderDropdown(
                l10n: mockL10n,
                onChanged: (_) {},
                initialGender: null,
              ),
            ),
          ),
        ),
      );

      // Act
      formKey.currentState?.validate(); // Trigger validation
      await tester.pump();

      // Assert
      expect(formKey.currentState?.validate(), isFalse);
      expect(find.text('Please select your gender'), findsOneWidget);
    });
  
  });
}

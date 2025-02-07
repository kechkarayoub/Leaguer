import 'package:flutter/material.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:frontend/components/gender_dropdown.dart';
import '../test_helper.dart';

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
              onChanged: (String? userGender) {
              },
              initialGender: 'male',
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
              onChanged: (String? userGender) {
                selectedValue = userGender;
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
      expect(selectedValue, equals('male')); // Verify callback was triggered with 'male'
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

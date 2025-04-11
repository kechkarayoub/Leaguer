import 'package:flutter/material.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:frontend/components/custom_password_field.dart';
import '../mocks/test_helper.dart';

void main() {
  late TextEditingController controller;
  late MockL10n mockL10n;

  setUp(() {
    controller = TextEditingController();
    mockL10n = MockL10n();
  });

  tearDown(() {
    controller.dispose();
  });

  testWidgets('Renders with default properties', (WidgetTester tester) async {
    await tester.pumpWidget(
      MaterialApp(
        home: Scaffold(
          body: CustomPasswordFormField(
            controller: controller,
            labelKey: 'password',
            l10n: mockL10n,
          ),
        ),
      ),
    );

    expect(find.byType(CustomPasswordFormField), findsOneWidget);
    expect(find.byType(TextField), findsOneWidget);
    expect(find.byIcon(Icons.visibility), findsOneWidget);
  });

  testWidgets('Toggles password visibility when eye icon is pressed', (WidgetTester tester) async {
    await tester.pumpWidget(
      MaterialApp(
        home: Scaffold(
          body: CustomPasswordFormField(
            controller: controller,
            labelKey: 'password',
            l10n: mockL10n,
          ),
        ),
      ),
    );

    // Initially obscured
    final textField = tester.widget<TextField>(find.byType(TextField));
    expect(textField.obscureText, isTrue);
    expect(find.byIcon(Icons.visibility), findsOneWidget);

    // Tap the visibility toggle
    await tester.tap(find.byType(IconButton));
    await tester.pump();

    // Now visible
    final updatedTextField = tester.widget<TextField>(find.byType(TextField));
    expect(updatedTextField.obscureText, isFalse);
    expect(find.byIcon(Icons.visibility_off), findsOneWidget);
  });

  testWidgets('Passes through properties to CustomTextFormField', (WidgetTester tester) async {
    const testErrorText = 'Invalid password';
    const testHintText = 'Enter password';
    var onChangedCalled = false;
    var onTapCalled = false;

    await tester.pumpWidget(
      MaterialApp(
        home: Scaffold(
          body: CustomPasswordFormField(
            controller: controller,
            labelKey: 'password',
            l10n: mockL10n,
            errorText: testErrorText,
            hintText: testHintText,
            onChanged: (value) => onChangedCalled = true,
            onTap: () => onTapCalled = true,
            enabled: true,
            readOnly: false,
          ),
        ),
      ),
    );

    // Verify properties are passed through
    final textField = tester.widget<TextField>(find.byType(TextField));
    expect(textField.enabled, isTrue);
    expect(textField.readOnly, isFalse);
    expect(textField.decoration!.errorText, testErrorText);
    expect(textField.decoration!.hintText, testHintText);

    // Test onChanged
    await tester.enterText(find.byType(TextField), 'test');
    expect(onChangedCalled, isTrue);

    // Test onTap
    await tester.tap(find.byType(TextField));
    expect(onTapCalled, isTrue);
  });

  testWidgets('Uses custom validator when provided', (WidgetTester tester) async {
    const errorText = 'Custom validation error';
    
    String? validator(String? value) {
      if (value == null || value.isEmpty) {
        return errorText;
      }
      return null;
    }

    await tester.pumpWidget(
      MaterialApp(
        home: Scaffold(
          body: CustomPasswordFormField(
            controller: controller,
            labelKey: 'password',
            l10n: mockL10n,
            validator: validator,
          ),
        ),
      ),
    );

    // Trigger validation with empty text
    final formField = tester.widget<FormField<String>>(find.byType(TextFormField));
    final validationResult = formField.validator?.call('');
    expect(validationResult, errorText);
  });

  testWidgets('Shows errorText when provided', (WidgetTester tester) async {
    const errorText = 'Password is required';

    await tester.pumpWidget(
      MaterialApp(
        home: Scaffold(
          body: CustomPasswordFormField(
            controller: controller,
            labelKey: 'password',
            l10n: mockL10n,
            errorText: errorText,
          ),
        ),
      ),
    );

    expect(find.text(errorText), findsOneWidget);
  });

}
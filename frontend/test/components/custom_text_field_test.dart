import 'package:flutter/material.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:frontend/components/custom_text_field.dart';
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
          body: CustomTextFormField(
            controller: controller,
            labelKey: 'test_label',
            l10n: mockL10n,
            obscureText: false,
          ),
        ),
      ),
    );

    expect(find.byType(TextFormField), findsOneWidget);
    final textField = tester.widget<CustomTextFormField>(find.byType(CustomTextFormField));
    expect(textField.obscureText, isFalse);
    expect(textField.enabled, isTrue);
    expect(textField.readOnly, isFalse);
    expect(find.text('test_label'), findsOneWidget);
  });

  testWidgets('Displays label and hint text', 
      (WidgetTester tester) async {
    await tester.pumpWidget(
      MaterialApp(
        home: Scaffold(
          body: CustomTextFormField(
            controller: controller,
            labelKey: 'username',
            l10n: mockL10n,
            hintText: 'hint_username',
          ),
        ),
      ),
    );

    expect(find.text('username'), findsOneWidget);
    expect(find.text('hint_username'), findsOneWidget);
  });

  testWidgets('Shows error text when provided', (WidgetTester tester) async {
    const errorText = 'Invalid input';

    await tester.pumpWidget(
      MaterialApp(
        home: Scaffold(
          body: CustomTextFormField(
            controller: controller,
            labelKey: 'test_label',
            l10n: mockL10n,
            errorText: errorText,
          ),
        ),
      ),
    );

    expect(find.text(errorText), findsOneWidget);
  });

  testWidgets('Handles onChanged callback', (WidgetTester tester) async {
    var callbackCalled = false;
    String? callbackValue;

    await tester.pumpWidget(
      MaterialApp(
        home: Scaffold(
          body: CustomTextFormField(
            controller: controller,
            labelKey: 'test_label',
            l10n: mockL10n,
            onChanged: (value) {
              callbackCalled = true;
              callbackValue = value;
            },
          ),
        ),
      ),
    );

    await tester.enterText(find.byType(TextFormField), 'test input');
    expect(callbackCalled, isTrue);
    expect(callbackValue, 'test input');
  });

  testWidgets('Handles onTap callback', (WidgetTester tester) async {
    var callbackCalled = false;

    await tester.pumpWidget(
      MaterialApp(
        home: Scaffold(
          body: CustomTextFormField(
            controller: controller,
            labelKey: 'test_label',
            l10n: mockL10n,
            onTap: () {
              callbackCalled = true;
            },
          ),
        ),
      ),
    );

    await tester.tap(find.byType(TextFormField));
    expect(callbackCalled, isTrue);
  });

  testWidgets('Respects enabled and readOnly properties', (WidgetTester tester) async {
    await tester.pumpWidget(
      MaterialApp(
        home: Scaffold(
          body: Column(
            children: [
              CustomTextFormField(
                controller: controller,
                labelKey: 'disabled_field',
                l10n: mockL10n,
                enabled: false,
              ),
              CustomTextFormField(
                controller: controller,
                labelKey: 'readonly_field',
                l10n: mockL10n,
                readOnly: true,
              ),
            ],
          ),
        ),
      ),
    );

    final textFields = tester.widgetList<CustomTextFormField>(find.byType(CustomTextFormField));
    expect(textFields.first.enabled, isFalse);
    expect(textFields.last.readOnly, isTrue);
  });

  testWidgets('Uses custom validator when provided', 
      (WidgetTester tester) async {
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
          body: CustomTextFormField(
            controller: controller,
            labelKey: 'test_label',
            l10n: mockL10n,
            validator: validator,
          ),
        ),
      ),
    );

    final formField = tester.widget<TextFormField>(find.byType(TextFormField));
    final validationResult = formField.validator?.call('');
    expect(validationResult, errorText);
  });

  testWidgets('Displays suffix icon when provided', 
      (WidgetTester tester) async {
    const testIcon = Icons.search;

    await tester.pumpWidget(
      MaterialApp(
        home: Scaffold(
          body: CustomTextFormField(
            controller: controller,
            labelKey: 'test_label',
            l10n: mockL10n,
            suffixIcon: const Icon(testIcon),
          ),
        ),
      ),
    );

    expect(find.byIcon(testIcon), findsOneWidget);
  });

  testWidgets('Handles obscureText property', (WidgetTester tester) async {
    await tester.pumpWidget(
      MaterialApp(
        home: Scaffold(
          body: CustomTextFormField(
            controller: controller,
            labelKey: 'password',
            l10n: mockL10n,
            obscureText: true,
          ),
        ),
      ),
    );

    final textField = tester.widget<CustomTextFormField>(find.byType(CustomTextFormField));
    expect(textField.obscureText, isTrue);
  });

}
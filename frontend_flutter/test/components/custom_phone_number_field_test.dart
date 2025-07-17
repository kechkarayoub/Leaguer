import 'package:flutter/material.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:frontend_flutter/components/custom_phone_number_field.dart';
import 'package:intl_phone_number_input/intl_phone_number_input.dart';
import '../mocks/test_helper.dart';

void main() {
  late TextEditingController controller;
  late MockL10n mockL10n;
  PhoneNumber initialNumber = PhoneNumber(isoCode: 'US', phoneNumber: '+1234567890');
  PhoneNumber initialNumberMa = PhoneNumber(isoCode: 'MA', phoneNumber: '+212612505257');

  setUp(() {
    controller = TextEditingController();
    mockL10n = MockL10n();
  });

  tearDown(() {
    controller.dispose();
  });

  testWidgets('Renders correctly with initial value', (WidgetTester tester) async {
    await tester.pumpWidget(
      MaterialApp(
        home: Scaffold(
          body: CustomPhoneNumberField(
            controller: controller,
            l10n: mockL10n,
            labelKey: 'phone_number',
            initialValue: initialNumber,
          ),
        ),
      ),
    );


    // Wait for the widget to fully initialize
    await tester.pumpAndSettle();

    // Verify the label is shown
    expect(find.text('phone_number'), findsOneWidget);
    expect(find.text('234567890'), findsOneWidget);

    // Verify the phone number is displayed (format might vary by platform)
    final phoneNumberField = tester.widget<TextField>(find.byType(TextField));
    expect(phoneNumberField.controller?.text, isNotEmpty);
    
    // Alternative verification for formatted text
    expect(find.byType(InternationalPhoneNumberInput), findsOneWidget);

  });
  
  testWidgets('Renders correctly with initial value (Leading 0)', (WidgetTester tester) async {
    await tester.pumpWidget(
      MaterialApp(
        home: Scaffold(
          body: CustomPhoneNumberField(
            controller: controller,
            l10n: mockL10n,
            labelKey: 'phone_number',
            initialValue: initialNumberMa,
          ),
        ),
      ),
    );


    // Wait for the widget to fully initialize
    await tester.pumpAndSettle();

    // Verify the label is shown
    expect(find.text('phone_number'), findsOneWidget);
    expect(find.text('0612505257'), findsOneWidget);

    // Verify the phone number is displayed (format might vary by platform)
    final phoneNumberField = tester.widget<TextField>(find.byType(TextField));
    expect(phoneNumberField.controller?.text, isNotEmpty);
    
    // Alternative verification for formatted text
    expect(find.byType(InternationalPhoneNumberInput), findsOneWidget);

  });
  
  testWidgets('Calls onChanged when number is modified', (tester) async {
    PhoneNumber? changedNumber;
    int callbackCount = 0;

    // Create a GlobalKey to access the widget state
    final globalKey = GlobalKey();

    await tester.pumpWidget(
      MaterialApp(
        home: Scaffold(
          body: CustomPhoneNumberField(
            key: globalKey,
            controller: controller,
            l10n: mockL10n,
            labelKey: 'phone_number',
            initialValue: initialNumber,  // This is where +1234567890 comes from
            onChanged: (text, number) {
              callbackCount++;
              changedNumber = number;
            },
          ),
        ),
      ),
    );

    await tester.pump();

    // Reset our tracking variables
    changedNumber = null;

    // Get the InternationalPhoneNumberInput instance
    final phoneInput = tester.widget<InternationalPhoneNumberInput>(
      find.byType(InternationalPhoneNumberInput)
    );

    // Manually trigger the callback with our test number
    final testNumber = PhoneNumber(
      isoCode: 'US',
      phoneNumber: '+14155552671'
    );
    
    phoneInput.onInputChanged?.call(testNumber);
    await tester.pump();

    // Verify only our manual trigger was captured
    expect(callbackCount, 1);
    expect(changedNumber, isNotNull, reason: 'onChanged should be called');
    expect(changedNumber?.phoneNumber, '+14155552671');

  });
  
  testWidgets('Displays error text when provided', (tester) async {
    await tester.pumpWidget(
      MaterialApp(
        home: Scaffold(
          body: CustomPhoneNumberField(
            controller: controller,
            l10n: MockL10n(),
            labelKey: 'phone_number',
            initialValue: initialNumber,
            errorText: 'Invalid phone number',
          ),
        ),
      ),
    );

    expect(find.text('Invalid phone number'), findsOneWidget);

  });

  testWidgets('respects enabled property', (tester) async {
    await tester.pumpWidget(
      MaterialApp(
        home: Scaffold(
          body: CustomPhoneNumberField(
            controller: controller,
            l10n: mockL10n,
            labelKey: 'phone_number',
            initialValue: initialNumber,
            enabled: false,
          ),
        ),
      ),
    );

    final textField = tester.widget<TextField>(find.byType(TextField));
    expect(textField.enabled, isFalse);

  });

  testWidgets('Parses controller text on initialization', (tester) async {
    controller.text = '+447123456789';
    
    await tester.pumpWidget(
      MaterialApp(
        home: Scaffold(
          body: CustomPhoneNumberField(
            controller: controller,
            l10n: mockL10n,
            labelKey: 'phone_number',
            initialValue: PhoneNumber(isoCode: 'US'),
          ),
        ),
      ),
    );

    // Wait for initialization to complete
    await tester.pumpAndSettle();

    // Verify the UK number was parsed and displayed
    expect(find.text('07123456789'), findsOneWidget);

  });
  
}
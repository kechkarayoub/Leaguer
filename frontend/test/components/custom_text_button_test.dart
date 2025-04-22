import 'package:flutter/material.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:frontend/components/custom_text_button.dart';

void main() {

  setUp(() {
  });

  tearDown(() {
  });

  testWidgets('CustomTextButton renders with basic properties', (tester) async {
    await tester.pumpWidget(
      MaterialApp(
        home: Scaffold(
          body: CustomTextButton(
            text: 'Test Button',
            onPressed: () {},
          ),
        ),
      ),
    );

    expect(find.text('Test Button'), findsOneWidget);
    expect(find.byType(TextButton), findsOneWidget);
  });

  testWidgets('Button is disabled when showLoader is true', (tester) async {
    await tester.pumpWidget(
      MaterialApp(
        home: Scaffold(
          body: CustomTextButton(
            text: 'Loading',
            onPressed: () {},
            showLoader: true,
          ),
        ),
      ),
    );

    final button = tester.widget<TextButton>(find.byType(TextButton));
    expect(button.enabled, isFalse);
    expect(find.byType(CircularProgressIndicator), findsOneWidget);
  });

  testWidgets('Button shows icon when provided', (tester) async {
    await tester.pumpWidget(
      MaterialApp(
        home: Scaffold(
          body: CustomTextButton(
            text: 'With Icon',
            onPressed: () {},
            icon: const Icon(Icons.add),
          ),
        ),
      ),
    );

    expect(find.byIcon(Icons.add), findsOneWidget);
  });

  testWidgets('Button applies custom margin', (tester) async {
    const margin = EdgeInsets.all(20);
    
    await tester.pumpWidget(
      MaterialApp(
        home: Scaffold(
          body: CustomTextButton(
            text: 'Margin Test',
            onPressed: () {},
            margin: margin,
          ),
        ),
      ),
    );

    final container = tester.widget<Container>(find.byType(Container).first);
    expect(container.margin, margin);
  });

  testWidgets('Button uses default margin when none provided', (tester) async {
    await tester.pumpWidget(
      MaterialApp(
        home: Scaffold(
          body: CustomTextButton(
            text: 'Default Margin',
            onPressed: () {},
          ),
        ),
      ),
    );

    final container = tester.widget<Container>(find.byType(Container).first);
    expect(container.margin, const EdgeInsets.only(bottom: 10));
  });

  testWidgets('Button propagates key correctly', (tester) async {
    const testKey = Key('testKey');
    
    await tester.pumpWidget(
      MaterialApp(
        home: Scaffold(
          body: CustomTextButton(
            text: 'Key Test',
            onPressed: () {},
            keyWidget: testKey,
          ),
        ),
      ),
    );

    expect(find.byKey(testKey), findsOneWidget);
  });

  testWidgets('Button triggers onPressed when tapped', (tester) async {
    bool wasPressed = false;
    
    await tester.pumpWidget(
      MaterialApp(
        home: Scaffold(
          body: CustomTextButton(
            text: 'Press Me',
            onPressed: () => wasPressed = true,
          ),
        ),
      ),
    );

    await tester.tap(find.byType(TextButton));
    expect(wasPressed, isTrue);
  });

  testWidgets('Button does not trigger when disabled', (tester) async {
    bool wasPressed = false;
    
    await tester.pumpWidget(
      MaterialApp(
        home: Scaffold(
          body: CustomTextButton(
            text: 'Disabled',
            onPressed: () => wasPressed = true,
            showLoader: true, // Disables button
          ),
        ),
      ),
    );

    await tester.tap(find.byType(TextButton), warnIfMissed: false);
    expect(wasPressed, isFalse);
  });


}
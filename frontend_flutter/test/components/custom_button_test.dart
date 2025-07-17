import 'package:flutter/material.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:frontend_flutter/components/custom_button.dart';

void main() {

  setUp(() {
  });

  tearDown(() {
  });

  testWidgets('CustomButton renders correctly with basic properties', (WidgetTester tester) async {
    await tester.pumpWidget(
      MaterialApp(
        home: Scaffold(
          body: CustomButton(
            text: 'Test Button',
            onPressed: () {},
          ),
        ),
      ),
    );

    expect(find.text('Test Button'), findsOneWidget);
    expect(find.byType(ElevatedButton), findsOneWidget);
  });

  testWidgets('CustomButton is disabled when isEnabled is false', (WidgetTester tester) async {
    await tester.pumpWidget(
      MaterialApp(
        home: Scaffold(
          body: CustomButton(
            text: 'Disabled Button',
            onPressed: () {},
            isEnabled: false,
          ),
        ),
      ),
    );

    final button = tester.widget<ElevatedButton>(find.byType(ElevatedButton));
    expect(button.enabled, isFalse);
  });

  testWidgets('CustomButton shows loader when showLoader is true', (WidgetTester tester) async {
    await tester.pumpWidget(
      MaterialApp(
        home: Scaffold(
          body: CustomButton(
            text: 'Loading Button',
            onPressed: () {},
            showLoader: true,
          ),
        ),
      ),
    );

    expect(find.byType(CircularProgressIndicator), findsOneWidget);
    expect(find.text('Loading Button'), findsOneWidget);
  });

  testWidgets('CustomButton shows icon when provided', (WidgetTester tester) async {
    const icon = Icon(Icons.add);
    
    await tester.pumpWidget(
      MaterialApp(
        home: Scaffold(
          body: CustomButton(
            text: 'Button with Icon',
            onPressed: () {},
            icon: icon,
          ),
        ),
      ),
    );

    expect(find.byIcon(Icons.add), findsOneWidget);
    expect(find.text('Button with Icon'), findsOneWidget);
  });

  testWidgets('CustomButton applies margin correctly', (WidgetTester tester) async {
    const margin = EdgeInsets.all(20);
    
    await tester.pumpWidget(
      MaterialApp(
        home: Scaffold(
          body: CustomButton(
            text: 'Button with Margin',
            onPressed: () {},
            margin: margin,
          ),
        ),
      ),
    );

    final container = tester.widget<Container>(find.byType(Container).first);
    expect(container.margin, margin);
  });

  testWidgets('CustomButton uses default margin when not provided', (WidgetTester tester) async {
    await tester.pumpWidget(
      MaterialApp(
        home: Scaffold(
          body: CustomButton(
            text: 'Button with Default Margin',
            onPressed: () {},
          ),
        ),
      ),
    );

    final container = tester.widget<Container>(find.byType(Container).first);
    expect(container.margin, const EdgeInsets.only(bottom: 10));
  });

  testWidgets('CustomButton propagates key correctly', (WidgetTester tester) async {
    const key = Key('test_key');
    
    await tester.pumpWidget(
      MaterialApp(
        home: Scaffold(
          body: CustomButton(
            keyWidget: key,
            text: 'Button with Key',
            onPressed: () {},
          ),
        ),
      ),
    );

    expect(find.byKey(key), findsOneWidget);
  });

  testWidgets('CustomButton triggers onPressed callback when tapped', (WidgetTester tester) async {
    bool wasPressed = false;
    
    await tester.pumpWidget(
      MaterialApp(
        home: Scaffold(
          body: CustomButton(
            text: 'Clickable Button',
            onPressed: () => wasPressed = true,
          ),
        ),
      ),
    );

    await tester.tap(find.byType(ElevatedButton));
    expect(wasPressed, isTrue);
  });

  testWidgets('CustomButton does not trigger onPressed when disabled', (WidgetTester tester) async {
    bool wasPressed = false;
    
    await tester.pumpWidget(
      MaterialApp(
        home: Scaffold(
          body: CustomButton(
            text: 'Disabled Button',
            onPressed: () => wasPressed = true,
            isEnabled: false,
          ),
        ),
      ),
    );

    await tester.tap(find.byType(ElevatedButton), warnIfMissed: false);
    expect(wasPressed, isFalse);
  });

}